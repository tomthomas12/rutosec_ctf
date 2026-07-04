const express = require('express');
const { query, get } = require('../db/database');
const router = express.Router();

// ── CORS INFO PAGE ──
router.get('/', (req, res) => {
  res.render('cors_info', { user: req.session.user });
});

// ── MISCONFIGURED CORS ──
// INTENTIONALLY VULNERABLE: Allow * origin on sensitive data endpoint
router.get('/api/users', (req, res) => {
  // VULNERABLE CORS CONFIG: allows any origin to access sensitive data
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  const users = query(`SELECT id, username, email, bio, website FROM users`);
  res.json(users);
});

// ── FORMULA INJECTION (CSV Download) ──
router.get('/export-users.csv', (req, res) => {
  const users = query(`SELECT id, username, email, bio, website FROM users`);
  
  let csv = 'ID,Username,Email,Bio,Website\n';
  users.forEach(u => {
    // INTENTIONALLY VULNERABLE: User input (email, website, bio) not sanitised
    // If email starts with =, @, +, -, the spreadsheet app executes it as a formula
    const row = [
      u.id,
      `"${u.username}"`,
      `"${u.email}"`,      // FORMULA INJECTION: email could be =cmd|'/c calc'!A1
      `"${u.bio}"`,
      `"${u.website}"`     // FORMULA INJECTION: website could be @SUM(1+1)*cmd|'/c calc'!A1
    ];
    csv += row.join(',') + '\n';
  });
  
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename="users.csv"');
  res.send(csv);
});

// ── POST endpoint for CORS preflight testing ──
router.post('/api/users', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ error: 'POST not implemented' });
});

router.options('/api/users', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = router;
