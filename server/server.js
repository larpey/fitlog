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
  console.log('=== FitLog server starting ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT env:', process.env.PORT);
  console.log('MONGO_URI present:', !!process.env.MONGO_URI);
  console.log('MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 0);
  if (process.env.MONGO_URI) {
    console.log('MONGO_URI prefix:', process.env.MONGO_URI.substring(0, 25));
  }

  let uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.error('FATAL: MONGO_URI not set on Railway. Refusing to fall back to in-memory.');
      process.exit(1);
    }
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
