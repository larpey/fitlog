const express = require('express');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// get all workouts for current user
router.get('/', async (req, res) => {
  const workouts = await Workout.find({ userId: req.userId }).sort({ date: -1 });

  // add total volume to each one
  const result = workouts.map(w => {
    let total = 0;
    for (let i = 0; i < w.exercises.length; i++) {
      for (let j = 0; j < w.exercises[i].sets.length; j++) {
        total += w.exercises[i].sets[j].weight * w.exercises[i].sets[j].reps;
      }
    }
    const obj = w.toObject();
    obj.totalVolume = total;
    return obj;
  });

  res.json(result);
});

// get one workout
router.get('/:id', async (req, res) => {
  // make sure id is valid
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'bad id' });
  }

  const workout = await Workout.findOne({ _id: req.params.id, userId: req.userId });
  if (!workout) {
    return res.status(404).json({ error: 'not found' });
  }

  // calculate total volume
  let total = 0;
  for (let i = 0; i < workout.exercises.length; i++) {
    for (let j = 0; j < workout.exercises[i].sets.length; j++) {
      total += workout.exercises[i].sets[j].weight * workout.exercises[i].sets[j].reps;
    }
  }

  const obj = workout.toObject();
  obj.totalVolume = total;
  res.json(obj);
});

// create new workout
router.post('/', async (req, res) => {
  if (!req.body.name || req.body.name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  // validate exercises if present
  if (req.body.exercises) {
    for (let i = 0; i < req.body.exercises.length; i++) {
      const ex = req.body.exercises[i];
      if (!ex.name) {
        return res.status(400).json({ error: 'exercise name required' });
      }
      for (let j = 0; j < ex.sets.length; j++) {
        if (typeof ex.sets[j].weight !== 'number') {
          return res.status(400).json({ error: 'invalid weight' });
        }
        if (typeof ex.sets[j].reps !== 'number') {
          return res.status(400).json({ error: 'invalid reps' });
        }
      }
    }
  }

  const workout = await Workout.create({
    userId: req.userId,
    name: req.body.name.trim(),
    date: req.body.date || new Date(),
    durationMinutes: req.body.durationMinutes || 0,
    notes: req.body.notes || '',
    exercises: req.body.exercises || []
  });

  res.status(201).json(workout);
});

// update workout
router.put('/:id', async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'bad id' });
  }

  if (!req.body.name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const update = {
    name: req.body.name,
    durationMinutes: req.body.durationMinutes || 0,
    notes: req.body.notes || '',
    exercises: req.body.exercises || []
  };

  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    update,
    { new: true }
  );

  if (!workout) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json(workout);
});

// delete workout
router.delete('/:id', async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'bad id' });
  }

  const result = await Workout.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  if (!result) {
    return res.status(404).json({ error: 'not found' });
  }

  res.json({ success: true });
});

module.exports = router;
