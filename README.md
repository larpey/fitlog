# FitLog

CSCI 380.61W Final Project
Luke Arpey

A workout tracking app. React frontend, Express backend, MongoDB database.

## How to run

You need Node 18+. No need to install MongoDB - it uses an in-memory db.

Start the server:
```
cd server
npm install
npm start
```
Server runs on port 4000.

In another terminal, start the client:
```
cd client
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

## Tests

Backend:
```
cd server
npm test
```

Frontend:
```
cd client
npm test
```

## API endpoints

- POST /api/auth/register - register new user
- POST /api/auth/login - login
- GET /api/workouts - list workouts (auth required)
- POST /api/workouts - create workout (auth required)
- GET /api/workouts/:id - get one workout (auth required)
- PUT /api/workouts/:id - update workout (auth required)
- DELETE /api/workouts/:id - delete workout (auth required)
- GET /api/stats - dashboard stats (auth required)

