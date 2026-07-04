const express = require('express');
const router = express.Router();

// Hidden: only discoverable via directory brute-forcing (gobuster/ffuf/dirsearch)
// Not linked anywhere in the application UI

router.get('/phpinfo.php', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>phpinfo()</title>
<style>
body{background:#fff;color:#000;font-family:sans-serif;font-size:13px;margin:0}
.h{background:#8892be;color:#fff;padding:1rem 1.5rem;text-align:center}
.h h1{font-size:1.6rem;margin-bottom:.25rem}
.h p{font-size:.8rem;opacity:.85}
table{width:100%;border-collapse:collapse}
th{background:#3b6597;color:#fff;text-align:left;padding:.4rem .75rem;font-size:.85rem}
td{padding:.35rem .75rem;border-bottom:1px solid #ddd;vertical-align:top;font-size:.82rem}
tr:nth-child(even) td{background:#f0f4ff}
td:first-child{font-weight:600;width:40%;color:#333}
.sec{background:#3b6597;color:#fff;padding:.35rem .75rem;font-weight:700;font-size:.85rem;letter-spacing:.05em}
.flag{color:#c00;font-family:monospace;font-weight:bold}
</style></head><body>
<div class="h"><h1>PHP Version 8.1.12</h1>
<p>System: Linux rutosec-prod-web01 5.15.0-91-generic #101-Ubuntu SMP x86_64</p></div>
<table>
<tr><td colspan="2" class="sec">PHP Core</td></tr>
<tr><td>PHP Version</td><td>8.1.12</td></tr>
<tr><td>Build Date</td><td>Nov 17 2022 15:32:00</td></tr>
<tr><td>Server API</td><td>Apache 2.0 Handler</td></tr>
<tr><td>Configuration File (php.ini) Path</td><td>/etc/php/8.1/apache2</td></tr>
<tr><td>display_errors</td><td>On</td></tr>
<tr><td>display_startup_errors</td><td>On</td></tr>
<tr><td>error_log</td><td>/var/log/apache2/php_errors.log</td></tr>
<tr><td>expose_php</td><td>On</td></tr>
<tr><td>allow_url_include</td><td>On</td></tr>
<tr><td>disable_functions</td><td><i>no value</i></td></tr>
<tr><td colspan="2" class="sec">Apache Environment</td></tr>
<tr><td>DOCUMENT_ROOT</td><td>/var/www/html/rutosec</td></tr>
<tr><td>SERVER_ADDR</td><td>10.0.1.44</td></tr>
<tr><td>SERVER_NAME</td><td>rutosec.blog</td></tr>
<tr><td>SERVER_SOFTWARE</td><td>Apache/2.4.54 (Ubuntu)</td></tr>
<tr><td>SERVER_PORT</td><td>443</td></tr>
<tr><td>REMOTE_ADDR</td><td>172.16.0.5</td></tr>
<tr><td colspan="2" class="sec">Environment Variables</td></tr>
<tr><td>DB_HOST</td><td>mysql-prod.rutosec.internal</td></tr>
<tr><td>DB_NAME</td><td>rutosec_blog</td></tr>
<tr><td>DB_USER</td><td>blog_app</td></tr>
<tr><td>DB_PASS</td><td>Rut0s3c@Mysql#2024!</td></tr>
<tr><td>APP_ENV</td><td>production</td></tr>
<tr><td>APP_DEBUG</td><td>true</td></tr>
<tr><td>APP_SECRET_KEY</td><td>sk_prod_f8a2c91e3d4b7f6a0e5c2d1b8a9f3e7c</td></tr>
<tr><td>SMTP_HOST</td><td>smtp.mailgun.org</td></tr>
<tr><td>SMTP_PASS</td><td>MG.k9p2wQr7Tz!</td></tr>
<tr><td class="flag">CTF_FLAG</td><td class="flag">FLAG{php1nf0_3xp053d_s3ns1t1v3_d4t4}</td></tr>
<tr><td colspan="2" class="sec">Session</td></tr>
<tr><td>session.cookie_httponly</td><td>Off</td></tr>
<tr><td>session.cookie_secure</td><td>Off</td></tr>
<tr><td>session.use_strict_mode</td><td>Off</td></tr>
<tr><td>session.save_path</td><td>/var/lib/php/sessions</td></tr>
<tr><td colspan="2" class="sec">Loaded Extensions</td></tr>
<tr><td>Extensions</td><td>bcmath, curl, dom, exif, fileinfo, gd, hash, json, mbstring, mysqli, mysqlnd, openssl, pcntl, pcre, PDO, pdo_mysql, Phar, posix, session, sockets, sodium, SPL, xml, zip, zlib, Zend OPcache</td></tr>
</table></body></html>`);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`# robots.txt for rutosec.blog
# Generated automatically

User-agent: *
Disallow: /admin/
Disallow: /admin/login
Disallow: /admin/dashboard
Disallow: /backup/
Disallow: /backup/db_dump_2024-11-03.sql.gz
Disallow: /internal/
Disallow: /internal/staff-only
Disallow: /phpinfo.php
Disallow: /config/settings.php
Disallow: /.env
Disallow: /secret-staging/FLAG{r0b0ts_txt_1nf0_d1scl0sur3_pwn3d}
Disallow: /wp-admin/
Disallow: /cgi-bin/

Sitemap: https://rutosec.blog/sitemap.xml`);
});

// 404 for probed admin/backup paths — realistic but empty
router.get('/admin', (req, res) => res.status(403).send('403 Forbidden'));
router.get('/admin/*', (req, res) => res.status(403).send('403 Forbidden'));
router.get('/backup/*', (req, res) => res.status(404).send('404 Not Found'));
router.get('/.env', (req, res) => res.status(403).send('403 Forbidden'));

module.exports = router;
