const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db/database');
const { requireGuest } = require('../middleware/auth');
const router = express.Router();

router.get('/login', requireGuest, (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', requireGuest, async (req, res) => {
  const { username, password } = req.body;
  const user = get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', { error: 'Invalid username or password.' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect('/');
});

router.get('/signup', requireGuest, (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', requireGuest, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.render('signup', { error: 'All fields are required.' });
  if (password.length < 6)
    return res.render('signup', { error: 'Password must be at least 6 characters.' });
  const exists = get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (exists) return res.render('signup', { error: 'Username or email already taken.' });
  const hash = bcrypt.hashSync(password, 10);
  run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash]);
  const user = get('SELECT id FROM users WHERE username = ?', [username]);
  run('INSERT OR IGNORE INTO scores (user_id, points) VALUES (?, 0)', [user.id]);
  req.session.user = { id: user.id, username: user.username, role: 'student' };
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
