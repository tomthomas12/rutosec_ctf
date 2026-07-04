const express = require('express');
const { get, run, query } = require('../db/database');
const router = express.Router();

const CHALLENGES = [
  {
    id: 'reflected',
    name: 'Reflected XSS',
    points: 100,
    flag: 'FLAG{r3fl3ct3d_x55_url_p4r4m_pwn3d}',
    description: 'Identify and exploit a reflected cross-site scripting vulnerability on the platform.'
  },
  {
    id: 'stored',
    name: 'Stored XSS',
    points: 150,
    flag: 'FLAG{st0r3d_x55_p3rs1st3nc3_ftw}',
    description: 'Find and exploit a persistent XSS vulnerability that executes for every visitor.'
  },
  {
    id: 'dom',
    name: 'DOM-Based XSS',
    points: 100,
    flag: 'FLAG{d0m_x55_cl13nt_s1nk_expl01t3d}',
    description: 'Exploit a client-side XSS vulnerability that never touches the server.'
  },
  {
    id: 'defacement',
    name: 'Site Defacement',
    points: 150,
    flag: 'FLAG{d3f4c3m3nt_y0u_0wn3d_th3_p4g3}',
    description: 'Inject a payload that visually defaces the page for all visitors.'
  },
  {
    id: 'link',
    name: 'Link Injection',
    points: 100,
    flag: 'FLAG{l1nk_1nj3ct10n_hr3f_p01s0n3d}',
    description: 'Inject a malicious URI into a hyperlink rendered on the page.'
  },
  {
    id: 'iframe',
    name: 'iFrame Injection',
    points: 125,
    flag: 'FLAG{1fr4m3_1nj3ct10n_3mb3dd3d_c0nt3nt}',
    description: 'Inject an iframe that embeds external or arbitrary content into the application.'
  },
  {
    id: 'phpinfo',
    name: 'Info Disclosure — Server Config',
    points: 75,
    flag: 'FLAG{php1nf0_3xp053d_s3ns1t1v3_d4t4}',
    description: 'Locate and retrieve sensitive server configuration data not meant to be public.'
  },
  {
    id: 'robots',
    name: 'Info Disclosure — Crawl Policy',
    points: 75,
    flag: 'FLAG{r0b0ts_txt_1nf0_d1scl0sur3_pwn3d}',
    description: 'Find hidden paths disclosed through a publicly accessible crawler policy file.'
  },
  {
    id: 'csrf_simple',
    name: 'CSRF — Simple Form Attack',
    points: 125,
    flag: 'FLAG{csrf_s1mpl3_f0rm_p0st3d_n0_t0k3n}',
    description: 'Craft a cross-site request forgery that modifies a user\'s profile without their knowledge.'
  },
  {
    id: 'csrf_ajax',
    name: 'CSRF — AJAX Request Attack',
    points: 150,
    flag: 'FLAG{csrf_4j4x_r3qu3st_f0rg3ry_pwn3d}',
    description: 'Exploit CSRF protection bypass via XMLHttpRequest with cross-origin credentials.'
  },
  {
    id: 'csrf_beginner',
    name: 'CSRF — Beginner Challenge',
    points: 100,
    flag: 'FLAG{csrf_b3g1nn3r_f0rm_st3p1}',
    description: 'Simple one-click CSRF attack on a change-password form for learning purposes.'
  },
  {
    id: 'cors',
    name: 'CORS Misconfiguration',
    points: 125,
    flag: 'FLAG{c0rs_4ll0w_4ny_0r1g1n_0p3n3d}',
    description: 'Exploit misconfigured CORS headers to extract sensitive user data from a protected API endpoint.'
  },
  {
    id: 'formula',
    name: 'Formula Injection',
    points: 140,
    flag: 'FLAG{f0rmul4_1nj3ct10n_c4lc_1nt3rpr3t3d}',
    description: 'Inject a formula into exported spreadsheet data that executes when opened in Excel or Sheets.'
  },
  {
    id: 'csrf_email',
    name: 'CSRF — Email Change Attack',
    points: 135,
    flag: 'FLAG{csrf_3m41l_ch4ng3_t4k30v3r}',
    description: 'Forge a request to change a user\'s email address without their knowledge or consent.'
  },
];

function getChallenges(userId) {
  const submissions = userId
    ? query('SELECT challenge FROM flag_submissions WHERE user_id = ? AND correct = 1', [userId])
    : [];
  const solved = submissions.map(s => s.challenge);
  return {
    challenges: CHALLENGES.map(c => ({ ...c, solved: solved.includes(c.id) })),
    solved
  };
}

router.get('/', (req, res) => {
  const user = req.session.user;
  const { challenges } = getChallenges(user?.id);
  const sc = user ? get('SELECT points FROM scores WHERE user_id = ?', [user.id]) : null;
  res.render('flags', { user, challenges, userScore: sc?.points || 0, msg: null, msgType: null });
});

router.post('/submit', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');
  const { challenge, flag } = req.body;
  const ch = CHALLENGES.find(c => c.id === challenge);
  if (!ch) return res.redirect('/flags');

  const { challenges } = getChallenges(user.id);
  const sc = get('SELECT points FROM scores WHERE user_id = ?', [user.id]);
  let userScore = sc?.points || 0;

  const already = get(
    'SELECT id FROM flag_submissions WHERE user_id = ? AND challenge = ? AND correct = 1',
    [user.id, challenge]
  );
  if (already) {
    return res.render('flags', { user, challenges, userScore, msg: `${ch.name} is already solved!`, msgType: 'error' });
  }

  const correct = flag.trim() === ch.flag ? 1 : 0;
  run('INSERT INTO flag_submissions (user_id, challenge, flag, correct) VALUES (?, ?, ?, ?)',
    [user.id, challenge, flag, correct]);

  if (correct) {
    run('INSERT INTO scores (user_id, points) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET points = points + ?',
      [user.id, ch.points, ch.points]);
    const { challenges: updated } = getChallenges(user.id);
    const updatedSc = get('SELECT points FROM scores WHERE user_id = ?', [user.id]);
    return res.render('flags', {
      user, challenges: updated, userScore: updatedSc.points,
      msg: `🚩 Correct! +${ch.points} points awarded for "${ch.name}".`, msgType: 'success'
    });
  }

  return res.render('flags', { user, challenges, userScore, msg: 'Incorrect flag. Keep looking.', msgType: 'error' });
});

module.exports = { router, CHALLENGES };
