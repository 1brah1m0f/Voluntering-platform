// Runs before styles or React load. An external file also respects script-src 'self'.
(() => {
  let saved;
  try {
    saved = localStorage.getItem('openly_theme');
  } catch {
    // Follow the device preference when storage is unavailable.
  }
  const theme = saved === 'light' || saved === 'dark'
    ? saved
    : window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0b1720' : '#1b626c';
  document.querySelector('meta[name="color-scheme"]').content = theme;
})();
