const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);

// start the server
async function start() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    console.log('using in-memory mongo');
  }
  await mongoose.connect(uri);
  console.log('mongo connected');

  app.listen(PORT, () => {
    console.log('server running on port ' + PORT);
  });
}

start();
