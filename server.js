const express = require('express');
const session = require('express-session');
const path = require('path');
const { getDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'rutosec_ctf_session_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ── HIDDEN (not linked — must be discovered via dirbusting) ──
app.use('/', require('./routes/hidden'));

// ── AUTH ──
app.use('/', require('./routes/auth'));

// ── ANNOUNCEMENTS (Site Defacement sink) ──
app.use('/announcements', require('./routes/announcements'));

// ── LABS (Link Injection + iFrame Injection) ──
app.use('/labs', require('./routes/labs'));

// ── CSRF LABS (Simple Form + AJAX + Beginner) ──
app.use('/csrf', require('./routes/csrf'));
app.use('/cors', require('./routes/cors'));
app.use('/scoreboard', require('./routes/scoreboard'));

// ── FLAGS ──
const { router: flagsRouter } = require('./routes/flags');
app.use('/flags', flagsRouter);

// ── POSTS (Stored XSS + iFrame Injection via embed) ──
app.use('/posts', require('./routes/posts'));

// ── PROFILE (Link Injection via website field) ──
app.use('/profile', require('./routes/profile'));

// ── HOME ──
app.get('/', (req, res) => {
  const { query } = require('./db/database');
  const posts = query(`
    SELECT p.id, p.title, p.body, p.created_at, u.username as author
    FROM posts p JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC LIMIT 5
  `);
  const enriched = posts.map(p => ({
    ...p,
    excerpt: p.body.replace(/<[^>]+>/g, '').slice(0, 160) + '…'
  }));
  res.render('home', {
    posts: enriched,
    user: req.session.user,
    reflected: false,
    reflectedOutput: '',
    encodedQ: ''
  });
});

// ── SEARCH (Reflected XSS sink) ──
app.get('/search', (req, res) => {
  const { query } = require('./db/database');
  const q = req.query.query || '';
  const posts = query(`
    SELECT p.id, p.title, p.body, p.created_at, u.username as author
    FROM posts p JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC LIMIT 5
  `);
  const enriched = posts.map(p => ({
    ...p,
    excerpt: p.body.replace(/<[^>]+>/g, '').slice(0, 160) + '…'
  }));
  // INTENTIONALLY VULNERABLE: q reflected into template without sanitisation (Reflected XSS)
  res.render('home', {
    posts: enriched,
    user: req.session.user,
    reflected: true,
    reflectedOutput: 'No results found for: ' + q,
    encodedQ: encodeURIComponent(q)
  });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).send(`<!DOCTYPE html><html><head><title>404</title>
    <style>body{background:#0d0f14;color:#6b7694;font-family:monospace;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:1rem;}
    h1{color:#00ff88;font-size:3rem;margin:0}a{color:#00c8ff;}</style></head>
    <body><h1>404</h1><p>Page not found.</p><a href="/">← Return home</a></body></html>`);
});

// ── START ──
(async () => {
  await getDb();
  const { get } = require('./db/database');
  const hasUsers = get('SELECT id FROM users LIMIT 1');
  if (!hasUsers) {
    console.log('First run — seeding database…');
    require('./db/seed');
  }
  app.listen(PORT, () => {
    console.log(`\n🚀  Rutosec CTF Blog → http://localhost:${PORT}`);
    console.log(`    Hidden: /robots.txt  /phpinfo.php  (find via dirbusting)\n`);
  });
})();
