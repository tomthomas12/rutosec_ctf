const express = require('express');
const { query, run, get } = require('../db/database');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  const posts = query(`SELECT p.id, p.title, p.body, p.created_at, u.username as author
    FROM posts p JOIN users u ON p.author_id = u.id ORDER BY p.created_at DESC`);
  const enriched = posts.map(p => ({ ...p, excerpt: p.body.replace(/<[^>]+>/g, '').slice(0, 160) + '…' }));
  res.render('posts', { posts: enriched, user: req.session.user });
});

router.get('/new', requireLogin, (req, res) => {
  res.render('new_post', { user: req.session.user, error: null });
});

router.post('/', requireLogin, (req, res) => {
  const { title, body, embed } = req.body;
  if (!title || !body) return res.render('new_post', { user: req.session.user, error: 'Title and body required.' });
  // INTENTIONALLY VULNERABLE: embed stored without sanitisation (iFrame Injection)
  run('INSERT INTO posts (title, body, embed, author_id) VALUES (?, ?, ?, ?)',
    [title, body, embed || '', req.session.user.id]);
  const post = get('SELECT id FROM posts WHERE title = ? AND author_id = ? ORDER BY id DESC', [title, req.session.user.id]);
  res.redirect('/posts/' + post.id);
});

router.get('/:id', (req, res) => {
  const post = get(`SELECT p.id, p.title, p.body, p.embed, p.created_at, u.username as author
    FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?`, [req.params.id]);
  if (!post) return res.status(404).send('Post not found');
  // INTENTIONALLY VULNERABLE: comment bodies rendered as raw HTML (Stored XSS)
  const comments = query(`SELECT c.body, c.created_at, u.username as author
    FROM comments c JOIN users u ON c.author_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC`, [req.params.id]);
  res.render('post', { post, comments, user: req.session.user });
});

router.post('/:id/comment', requireLogin, (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.redirect('/posts/' + req.params.id);
  // INTENTIONALLY VULNERABLE: body stored without sanitisation (Stored XSS)
  run('INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)',
    [req.params.id, req.session.user.id, body]);
  res.redirect('/posts/' + req.params.id);
});

module.exports = router;
