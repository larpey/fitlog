const express = require('express');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  // get start of this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthCount = await Workout.countDocuments({
    userId: req.userId,
    date: { $gte: startOfMonth }
  });

  const recent = await Workout.find({ userId: req.userId })
    .sort({ date: -1 })
    .limit(5);

  res.json({
    monthlyWorkoutCount: monthCount,
    recent: recent
  });
});

module.exports = router;
