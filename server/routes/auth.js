const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET = 'mysecretkey123';

// register
router.post('/register', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  // check if email is taken
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ error: 'email already registered' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase(),
    password: hash,
    name: name || ''
  });

  const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '7d' });

  res.status(201).json({
    token: token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      split: user.split
    }
  });
});

// login
router.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '7d' });

  res.json({
    token: token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      split: user.split
    }
  });
});

module.exports = router;
