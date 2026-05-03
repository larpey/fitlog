const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

// build a test app (same setup as server.js but without listen)
const authRoutes = require('../routes/auth');
const workoutRoutes = require('../routes/workouts');
const statsRoutes = require('../routes/stats');

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);

let mem;

before(async function () {
  this.timeout(60000);
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
});

after(async function () {
  await mongoose.disconnect();
  if (mem) await mem.stop();
});

// clear collections between tests
afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const k in cols) {
    await cols[k].deleteMany({});
  }
});

describe('Auth tests', function () {
  it('should register a new user', async function () {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test' });

    if (res.status !== 201) throw new Error('expected 201, got ' + res.status);
    if (!res.body.token) throw new Error('no token returned');
    if (res.body.user.email !== 'test@test.com') throw new Error('wrong email');
  });

  it('should fail without email', async function () {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });
    if (res.status !== 400) throw new Error('expected 400');
  });

  it('should fail with short password', async function () {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: '123' });
    if (res.status !== 400) throw new Error('expected 400');
  });

  it('should not allow duplicate emails', async function () {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123' });
    if (res.status !== 400) throw new Error('should have failed');
  });

  it('should login with correct credentials', async function () {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });
    if (res.status !== 200) throw new Error('expected 200');
    if (!res.body.token) throw new Error('no token');
  });

  it('should reject wrong password', async function () {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login2@test.com', password: 'password123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login2@test.com', password: 'wrongpw' });
    if (res.status !== 401) throw new Error('expected 401');
  });
});

describe('Workout tests', function () {
  let token;

  beforeEach(async function () {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'wtest@test.com', password: 'password123' });
    token = res.body.token;
  });

  it('should require auth', async function () {
    const res = await request(app).get('/api/workouts');
    if (res.status !== 401) throw new Error('expected 401');
  });

  it('should return empty list initially', async function () {
    const res = await request(app)
      .get('/api/workouts')
      .set('Authorization', 'Bearer ' + token);
    if (res.status !== 200) throw new Error('expected 200');
    if (res.body.length !== 0) throw new Error('should be empty');
  });

  it('should create a workout', async function () {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', 'Bearer ' + token)
      .send({
        name: 'Push Day',
        durationMinutes: 60,
        exercises: [
          { name: 'Bench', sets: [{ weight: 225, reps: 5 }, { weight: 225, reps: 5 }] }
        ]
      });
    if (res.status !== 201) throw new Error('expected 201, got ' + res.status);
    if (res.body.name !== 'Push Day') throw new Error('wrong name');
  });

  it('should reject workout without name', async function () {
    const res = await request(app)
      .post('/api/workouts')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: '', exercises: [] });
    if (res.status !== 400) throw new Error('expected 400');
  });

  it('should get a workout by id', async function () {
    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Test', exercises: [] });
    const res = await request(app)
      .get('/api/workouts/' + created.body._id)
      .set('Authorization', 'Bearer ' + token);
    if (res.status !== 200) throw new Error('expected 200');
  });

  it('should update a workout', async function () {
    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Old name', exercises: [] });
    const res = await request(app)
      .put('/api/workouts/' + created.body._id)
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'New name', exercises: [] });
    if (res.status !== 200) throw new Error('expected 200');
    if (res.body.name !== 'New name') throw new Error('not updated');
  });

  it('should delete a workout', async function () {
    const created = await request(app)
      .post('/api/workouts')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Delete me', exercises: [] });
    const del = await request(app)
      .delete('/api/workouts/' + created.body._id)
      .set('Authorization', 'Bearer ' + token);
    if (del.status !== 200) throw new Error('expected 200');
  });
});

describe('Stats tests', function () {
  it('should return stats summary', async function () {
    const auth = await request(app)
      .post('/api/auth/register')
      .send({ email: 'stats@test.com', password: 'password123' });

    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', 'Bearer ' + auth.body.token);
    if (res.status !== 200) throw new Error('expected 200');
    if (typeof res.body.monthlyWorkoutCount !== 'number') throw new Error('bad response');
  });
});

describe('Health check', function () {
  it('should return ok', async function () {
    const res = await request(app).get('/api/health');
    if (res.status !== 200) throw new Error('expected 200');
    if (res.body.status !== 'ok') throw new Error('bad status');
  });
});
