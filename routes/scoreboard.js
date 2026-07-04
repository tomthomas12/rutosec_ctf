const express = require('express');
const { query } = require('../db/database');
const router = express.Router();

router.get('/', (req, res) => {
  const scores = query(`
    SELECT u.username, s.points,
      (SELECT COUNT(*) FROM flag_submissions fs WHERE fs.user_id = u.id AND fs.correct = 1) as solved
    FROM scores s JOIN users u ON s.user_id = u.id
    WHERE s.points > 0
    ORDER BY s.points DESC, solved DESC
  `);
  res.render('scoreboard', { scores, user: req.session.user });
});

module.exports = router;
