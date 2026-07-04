const { getDb, run, get, save } = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  await getDb();

  const users = [
    { username: 'tom',   email: 'tom@rutosec.io',      password: 'rutosec123', role: 'admin' },
    { username: 'ruben', email: 'ruben@rutosec.io',     password: 'rutosec123', role: 'admin' },
    { username: 'alice', email: 'alice@student.io',     password: 'student123', role: 'student' },
    { username: 'bob',   email: 'bob@student.io',       password: 'student123', role: 'student' },
  ];

  for (const u of users) {
    const exists = get('SELECT id FROM users WHERE username = ?', [u.username]);
    if (!exists) {
      const hash = bcrypt.hashSync(u.password, 10);
      run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [u.username, u.email, hash, u.role]);
      const user = get('SELECT id FROM users WHERE username = ?', [u.username]);
      run('INSERT OR IGNORE INTO scores (user_id, points) VALUES (?, 0)', [user.id]);
    }
  }

  const tom   = get('SELECT id FROM users WHERE username = ?', ['tom']);
  const ruben = get('SELECT id FROM users WHERE username = ?', ['ruben']);
  const alice = get('SELECT id FROM users WHERE username = ?', ['alice']);

  // ── Seed posts ──
  const posts = [
    {
      title: 'Understanding Cross-Site Scripting: From Theory to Exploit',
      body: `<p>Cross-Site Scripting (XSS) remains one of the most prevalent vulnerabilities in the OWASP Top 10. Despite decades of awareness, improper output encoding continues to haunt production applications at scale.</p>
<h3>Reflected XSS</h3>
<p>Reflected XSS occurs when user-supplied input is echoed back by the server without sanitisation. The payload travels in the URL and fires when the victim opens the crafted link.</p>
<h3>Stored XSS</h3>
<p>Stored XSS is persisted in a database and rendered for every subsequent visitor — making it the most impactful variant for session hijacking and credential theft.</p>
<h3>DOM-Based XSS</h3>
<p>DOM XSS never touches the server. Client-side JavaScript reads from a tainted source and writes to a dangerous sink such as <code>innerHTML</code> or <code>eval()</code>.</p>
<h3>Remediation</h3>
<p>Context-aware output encoding is the primary defence. Pair it with a strict Content Security Policy and HttpOnly cookie flags.</p>`,
      embed: '',
      author_id: tom.id
    },
    {
      title: 'OAuth 2.0 Token Leakage via Referrer Headers',
      body: `<p>OAuth 2.0 is the standard for delegated authorisation, but subtle misconfigurations continue to leak access tokens through browser-native mechanisms.</p>
<h3>The Implicit Flow Problem</h3>
<p>In the deprecated implicit flow, access tokens were placed directly in URL fragments. Single-page-app routing libraries have historically forwarded these to third-party analytics endpoints.</p>
<h3>Open Redirect Chains</h3>
<p>When an authorisation server permits wildcard redirect_uri values, attackers can intercept auth codes before the legitimate client receives them. Always pin redirect_uri to an exact string match.</p>`,
      embed: '',
      author_id: ruben.id
    },
    {
      title: 'Recon Methodology for Web Application Assessments',
      body: `<p>Effective recon is the foundation of every successful web application pentest. Before touching a single input field, a thorough reconnaissance phase dramatically increases coverage.</p>
<h3>Passive Recon</h3>
<p>Subdomain enumeration via Certificate Transparency logs, Shodan queries, and Google dorks reveal attack surface without sending a packet to the target.</p>
<h3>Active Recon</h3>
<p>Directory and file brute-forcing with tools like Gobuster, ffuf, and dirsearch uncovers hidden endpoints not linked from the application UI but still accessible on the server.</p>
<h3>Technology Fingerprinting</h3>
<p>Identify the stack early — server headers, cookie names, error pages, and file extensions all leak technology choices that inform your payload selection.</p>`,
      embed: '',
      author_id: alice.id
    },
  ];

  for (const p of posts) {
    const exists = get('SELECT id FROM posts WHERE title = ?', [p.title]);
    if (!exists) {
      run('INSERT INTO posts (title, body, embed, author_id) VALUES (?, ?, ?, ?)',
        [p.title, p.body, p.embed, p.author_id]);
    }
  }

  // ── Seed comments ──
  const post1 = get('SELECT id FROM posts WHERE title LIKE ?', ['%Cross-Site%']);
  if (post1) {
    const hasComments = get('SELECT id FROM comments WHERE post_id = ?', [post1.id]);
    if (!hasComments) {
      run('INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)',
        [post1.id, alice.id, 'Great breakdown — the DOM sink section is particularly useful for triage during engagements.']);
      run('INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)',
        [post1.id, ruben.id, 'Would love to see a follow-up covering mutation XSS and DOMPurify bypasses.']);
    }
  }

  // ── Seed announcement ──
  const hasAnn = get('SELECT id FROM announcements LIMIT 1');
  if (!hasAnn) {
    run('INSERT INTO announcements (body, author_id) VALUES (?, ?)',
      ['Welcome to the <strong>Rutosec CTF Blog</strong>! Complete all challenges to top the scoreboard. Good luck.', tom.id]);
  }

  // ── Seed sample link ──
  const hasLink = get('SELECT id FROM lab_links LIMIT 1');
  if (!hasLink) {
    run('INSERT INTO lab_links (label, url, author_id) VALUES (?, ?, ?)',
      ['OWASP XSS Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', tom.id]);
    run('INSERT INTO lab_links (label, url, author_id) VALUES (?, ?, ?)',
      ['PortSwigger XSS Labs', 'https://portswigger.net/web-security/cross-site-scripting', ruben.id]);
  }

  // ── Seed sample embed ──
  const hasEmbed = get('SELECT id FROM lab_embeds LIMIT 1');
  if (!hasEmbed) {
    run('INSERT INTO lab_embeds (title, embed, author_id) VALUES (?, ?, ?)',
      ['Rutosec Introduction Video',
       '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>',
       ruben.id]);
  }

  // ── Seed CSRF transfers ──
  const hasTransfer = get('SELECT id FROM csrf_transfers LIMIT 1');
  if (!hasTransfer) {
    run('INSERT INTO csrf_transfers (from_user, to_user, amount) VALUES (?, ?, ?)',
      ['tom', 'alice', 50]);
    run('INSERT INTO csrf_transfers (from_user, to_user, amount) VALUES (?, ?, ?)',
      ['alice', 'bob', 25]);
    run('INSERT INTO csrf_transfers (from_user, to_user, amount) VALUES (?, ?, ?)',
      ['ruben', 'alice', 100]);
  }

  // ── Seed CSRF messages ──
  const hasMsg = get('SELECT id FROM csrf_messages LIMIT 1');
  if (!hasMsg) {
    run('INSERT INTO csrf_messages (sender, content) VALUES (?, ?)',
      ['tom', 'Welcome to the public messaging service. No CSRF protection here!']);
    run('INSERT INTO csrf_messages (sender, content) VALUES (?, ?)',
      ['ruben', 'This endpoint accepts AJAX requests from any origin with credentials.']);
  }

  console.log('✅  Database seeded successfully.');
}

seed().catch(console.error);
