const mongoose = require('mongoose');

// each set has weight and reps
const setSchema = new mongoose.Schema({
  weight: Number,
  reps: Number
});

const exerciseSchema = new mongoose.Schema({
  name: String,
  sets: [setSchema]
});

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  durationMinutes: { type: Number, default: 0 },
  notes: String,
  exercises: [exerciseSchema]
});

module.exports = mongoose.model('Workout', workoutSchema);
