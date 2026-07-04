const express = require('express');
const { get, run, query } = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

// ── CORS Misconfiguration ──
// Enable CORS on sensitive API endpoint
router.use('/api', (req, res, next) => {
  // INTENTIONALLY VULNERABLE: Allow any origin
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

router.get('/api/user-data', requireLogin, (req, res) => {
  const user = get('SELECT id, username, email FROM users WHERE id = ?', [req.session.user.id]);
  // INTENTIONALLY VULNERABLE: Sensitive data exposed via open CORS endpoint
  res.json(user);
});

// ── CSRF 1: Simple Form Attack (no CSRF token) ──
router.get('/simple-form', (req, res) => {
  const transfers = query(
    `SELECT t.id, t.from_user, t.to_user, t.amount, t.created_at
     FROM csrf_transfers t ORDER BY t.created_at DESC LIMIT 10`
  );
  res.render('csrf_simple', { user: req.session.user, transfers });
});

router.post('/simple-form', requireLogin, (req, res) => {
  const { to_user, amount } = req.body;
  if (!to_user || !amount) return res.redirect('/csrf/simple-form');
  
  // INTENTIONALLY VULNERABLE: No CSRF token verification
  run('INSERT INTO csrf_transfers (from_user, to_user, amount) VALUES (?, ?, ?)',
    [req.session.user.username, to_user, amount]);
  res.redirect('/csrf/simple-form');
});

// ── CSRF 2: AJAX Request Attack (withCredentials bypass) ──
router.get('/ajax-endpoint', (req, res) => {
  const messages = query(
    `SELECT m.id, m.sender, m.content, m.created_at
     FROM csrf_messages m ORDER BY m.created_at DESC LIMIT 10`
  );
  res.render('csrf_ajax', { user: req.session.user, messages });
});

router.post('/ajax-endpoint', requireLogin, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  
  // INTENTIONALLY VULNERABLE: No CSRF token check on JSON endpoint
  run('INSERT INTO csrf_messages (sender, content) VALUES (?, ?)',
    [req.session.user.username, message]);
  res.json({ success: true, message: 'Message posted' });
});

// ── CSRF 3: Password Change (no token) ──
router.get('/password-change', requireLogin, (req, res) => {
  res.render('csrf_beginner', { user: req.session.user, msg: null });
});

router.post('/password-change', requireLogin, (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.render('csrf_beginner', { user: req.session.user, msg: 'Password must be at least 6 characters' });
  }
  
  // INTENTIONALLY VULNERABLE: No CSRF token verification
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync(new_password, 10);
  run('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.user.id]);
  res.render('csrf_beginner', { user: req.session.user, msg: '✅ Password changed successfully!' });
});

// ── CSRF 4: Profile Email Update (no CSRF token) ──
router.get('/profile-email', requireLogin, (req, res) => {
  const user = get('SELECT id, username, email FROM users WHERE id = ?', [req.session.user.id]);
  res.render('csrf_email', { user: req.session.user, profile: user, msg: null });
});

router.post('/profile-email', requireLogin, (req, res) => {
  const { new_email } = req.body;
  if (!new_email || !new_email.includes('@')) {
    return res.render('csrf_email', { 
      user: req.session.user, 
      profile: get('SELECT id, username, email FROM users WHERE id = ?', [req.session.user.id]),
      msg: 'Invalid email address' 
    });
  }
  
  // INTENTIONALLY VULNERABLE: No CSRF token verification
  // Any cross-origin POST can change the user's email
  run('UPDATE users SET email = ? WHERE id = ?', [new_email, req.session.user.id]);
  
  const updated = get('SELECT id, username, email FROM users WHERE id = ?', [req.session.user.id]);
  res.render('csrf_email', { 
    user: req.session.user, 
    profile: updated,
    msg: '✅ Email updated to: ' + new_email 
  });
});

module.exports = router;
