(function () {
  const STORAGE_KEY = 'gamified-theme';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  function currentTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const isLight = theme === 'light';
      const icon = isLight ? '🌙' : '☀️';
      const label = isLight ? 'Switch to dark mode' : 'Switch to light mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.innerHTML = `<span class="theme-icon" aria-hidden="true">${icon}</span>`;
    });
  }
  // Initialize
  setTheme(currentTheme());
  // Bind
  document.addEventListener('click', (e) => {
    const t = e.target;
    const toggle = t && typeof t.closest === 'function' ? t.closest('.theme-toggle') : null;
    if (toggle) {
      const next = currentTheme() === 'light' ? 'dark' : 'light';
      setTheme(next);
    }
  });
})();


