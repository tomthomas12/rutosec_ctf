const express = require('express');
const { get, run, query } = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

// ── Link Injection Lab ──
// User submits a URL, it is stored and rendered as an <a href> without sanitisation
router.get('/link-injection', (req, res) => {
  const links = query(
    `SELECT l.id, l.label, l.url, l.created_at, u.username as author
     FROM lab_links l JOIN users u ON l.author_id = u.id
     ORDER BY l.created_at DESC`
  );
  res.render('lab_link', { user: req.session.user, links, msg: null });
});

router.post('/link-injection', requireLogin, (req, res) => {
  const { label, url } = req.body;
  if (!label || !url) return res.redirect('/labs/link-injection');
  // INTENTIONALLY VULNERABLE: url stored and rendered in href without sanitisation (Link Injection)
  run('INSERT INTO lab_links (label, url, author_id) VALUES (?, ?, ?)',
    [label, url, req.session.user.id]);
  res.redirect('/labs/link-injection');
});

// ── iFrame Injection Lab ──
// User submits an embed snippet, stored and rendered as raw HTML
router.get('/iframe-injection', (req, res) => {
  const embeds = query(
    `SELECT e.id, e.title, e.embed, e.created_at, u.username as author
     FROM lab_embeds e JOIN users u ON e.author_id = u.id
     ORDER BY e.created_at DESC`
  );
  res.render('lab_iframe', { user: req.session.user, embeds, msg: null });
});

router.post('/iframe-injection', requireLogin, (req, res) => {
  const { title, embed } = req.body;
  if (!title || !embed) return res.redirect('/labs/iframe-injection');
  // INTENTIONALLY VULNERABLE: embed stored and rendered as raw HTML (iFrame Injection)
  run('INSERT INTO lab_embeds (title, embed, author_id) VALUES (?, ?, ?)',
    [title, embed, req.session.user.id]);
  res.redirect('/labs/iframe-injection');
});

module.exports = router;
