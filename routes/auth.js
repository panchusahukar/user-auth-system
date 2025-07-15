const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

// Middleware to protect dashboard route
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in first');
  res.redirect('/login');
}

// ✅ Home route - redirect to login
router.get('/', (req, res) => {
  res.redirect('/login');
});

// GET: Registration and Login pages
router.get('/register', (req, res) => res.render('register'));
router.get('/login', (req, res) => res.render('login'));

// GET: Dashboard (protected)
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', { user: req.user })
);

// GET: Logout
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) throw err;
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
  });
});

// POST: Register user
router.post('/register', async (req, res) => {
  const { name, email, password, password2 } = req.body;
  const errors = [];

  if (!name || !email || !password || password !== password2) {
    errors.push({ msg: 'Fill all fields correctly' });
  }

  if (errors.length > 0) {
    return res.render('register', { errors, name, email });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.push({ msg: 'Email already registered' });
      return res.render('register', { errors, name, email });
    }

    const newUser = new User({ name, email, password });
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);
    await newUser.save();

    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { errors: [{ msg: 'Server error' }], name, email });
  }
});

// POST: Login user
router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })
);

module.exports = router;
