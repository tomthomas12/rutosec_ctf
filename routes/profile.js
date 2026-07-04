const express = require('express');
const { get, run, query } = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.get('/:username', (req, res) => {
  const profile = get('SELECT id, username, bio, website, role, created_at FROM users WHERE username = ?', [req.params.username]);
  if (!profile) return res.status(404).send('User not found');
  const posts = query(
    `SELECT p.id, p.title, p.created_at FROM posts p WHERE p.author_id = ? ORDER BY p.created_at DESC`,
    [profile.id]
  );
  res.render('profile', { user: req.session.user, profile, posts });
});

router.get('/:username/edit', requireLogin, (req, res) => {
  if (req.session.user.username !== req.params.username) return res.redirect('/');
  const profile = get('SELECT id, username, bio, website FROM users WHERE username = ?', [req.params.username]);
  res.render('edit_profile', { user: req.session.user, profile, error: null });
});

router.post('/:username/edit', requireLogin, (req, res) => {
  if (req.session.user.username !== req.params.username) return res.redirect('/');
  const { bio, website, email } = req.body;
  // INTENTIONALLY VULNERABLE: email can be changed via CSRF — no token check
  run('UPDATE users SET bio = ?, website = ?, email = ? WHERE id = ?',
    [bio, website, email, req.session.user.id]);
  res.redirect('/profile/' + req.params.username);
});

module.exports = router;
