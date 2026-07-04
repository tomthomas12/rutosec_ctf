const express = require('express');
const { query, run } = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const announcements = query(
    `SELECT a.id, a.body, a.created_at, u.username as author
     FROM announcements a JOIN users u ON a.author_id = u.id
     ORDER BY a.created_at DESC`
  );
  res.render('announcements', { user: req.session.user, announcements });
});

router.post('/', requireLogin, (req, res) => {
  const user = req.session.user;
  if (user.role !== 'admin') return res.redirect('/announcements');
  const { body } = req.body;
  if (!body || !body.trim()) return res.redirect('/announcements');
  // INTENTIONALLY VULNERABLE: body stored and rendered as raw HTML (Site Defacement)
  run('INSERT INTO announcements (body, author_id) VALUES (?, ?)', [body, user.id]);
  res.redirect('/announcements');
});

module.exports = router;
