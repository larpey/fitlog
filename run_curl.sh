#!/bin/bash
# Captures live cURL output against every API endpoint
set -e

cd /home/claude/fitlog

# Start API server
node server/server.js > /tmp/curl_test_server.log 2>&1 &
SERVER_PID=$!

# Wait for server health
for i in {1..15}; do
  if curl -sf http://127.0.0.1:4000/api/health > /dev/null 2>&1; then break; fi
  sleep 1
done

OUT=/home/claude/fitlog/curl_output.txt
> $OUT

separator() {
  echo >> $OUT
  echo "================================================================" >> $OUT
  echo "$1" >> $OUT
  echo "================================================================" >> $OUT
}

run() {
  local desc="$1"; shift
  echo >> $OUT
  echo "# $desc" >> $OUT
  echo "$ $*" >> $OUT
  eval "$@" >> $OUT 2>&1
  echo >> $OUT
}

separator "1. Health check (no auth)"
run "GET /api/health" \
  "curl -s -i http://localhost:4000/api/health | head -10"

separator "2. Register a new user"
run "POST /api/auth/register" \
  "curl -s -X POST http://localhost:4000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"demo@fitlog.app\",\"password\":\"secret123\",\"name\":\"Demo\"}'"

# Capture token for subsequent requests
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@fitlog.app","password":"secret123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

separator "3. Login (obtain JWT)"
run "POST /api/auth/login" \
  "curl -s -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"demo@fitlog.app\",\"password\":\"secret123\"}'"

separator "4. Login with wrong password (expect 401)"
run "POST /api/auth/login -d wrong" \
  "curl -s -i -X POST http://localhost:4000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"demo@fitlog.app\",\"password\":\"wrongpass\"}' | head -10"

separator "5. List workouts (auth required, empty initially)"
run "GET /api/workouts" \
  "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:4000/api/workouts"

separator "6. List workouts without token (expect 401)"
run "GET /api/workouts (no token)" \
  "curl -s -i http://localhost:4000/api/workouts | head -10"

separator "7. Create a new workout"
WORKOUT_ID=$(curl -s -X POST http://localhost:4000/api/workouts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Push - Demo","durationMinutes":45,"exercises":[{"name":"Bench Press","sets":[{"weight":225,"reps":5},{"weight":225,"reps":5}]}]}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["_id"])')
run "POST /api/workouts" \
  "curl -s -X POST http://localhost:4000/api/workouts -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Push - Demo\",\"durationMinutes\":45,\"exercises\":[{\"name\":\"Bench Press\",\"sets\":[{\"weight\":225,\"reps\":5},{\"weight\":225,\"reps\":5}]}]}'"

separator "8. Get workout by id"
run "GET /api/workouts/:id" \
  "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:4000/api/workouts/$WORKOUT_ID"

separator "9. Update workout"
run "PUT /api/workouts/:id" \
  "curl -s -X PUT http://localhost:4000/api/workouts/$WORKOUT_ID -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Push - Updated\",\"durationMinutes\":50,\"notes\":\"felt great\",\"exercises\":[{\"name\":\"Bench Press\",\"sets\":[{\"weight\":230,\"reps\":5}]}]}'"

separator "10. Stats endpoint"
run "GET /api/stats" \
  "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:4000/api/stats"

separator "11. Delete workout"
run "DELETE /api/workouts/:id" \
  "curl -s -X DELETE http://localhost:4000/api/workouts/$WORKOUT_ID -H 'Authorization: Bearer $TOKEN'"

separator "12. Validation: workout with no name (expect 400)"
run "POST /api/workouts (invalid)" \
  "curl -s -i -X POST http://localhost:4000/api/workouts -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"\",\"exercises\":[]}' | head -10"

# Cleanup
kill $SERVER_PID 2>/dev/null || true
wait 2>/dev/null || true

echo "Captured $(wc -l < $OUT) lines to $OUT"
