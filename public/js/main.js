function toast(msg, err = false) {
  const box = document.getElementById('toast-box');
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

// DOM-Based XSS — search field writes to innerHTML unsanitised
const searchInput = document.getElementById('dom-search');
const searchResult = document.getElementById('dom-result');
if (searchInput && searchResult) {
  searchInput.addEventListener('input', function () {
    const val = this.value;
    if (!val) { searchResult.innerHTML = ''; return; }
    // INTENTIONALLY VULNERABLE SINK
    searchResult.innerHTML = 'No articles found matching: ' + val;
  });
}
