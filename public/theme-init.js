// Applies the saved design and accent colour before the first paint, so neither the splash nor the app
// flashes light or rosé. Loaded as a normal script in <head> (CSP: script-src 'self').
// Keys, values, night hours (20:00–07:00) and bar colours as in src/data/theme.ts and src/ui/theme.ts – keep them in sync.
try {
  var bar = { green: '#2F7A55', purple: '#7353B8', blue: '#2F6AA3', orange: '#B0521F' };
  var accent = localStorage.getItem('babytime-accent');
  var meta = document.querySelector('meta[name="theme-color"]');
  if (bar[accent]) {
    document.documentElement.dataset.accent = accent;
    meta?.setAttribute('content', bar[accent]);
  }
  var mode = localStorage.getItem('babytime-theme');
  var hour = new Date().getHours();
  if (mode === 'dark' || (mode === 'night' && (hour >= 20 || hour < 7))) {
    document.documentElement.dataset.theme = 'dark';
    meta?.setAttribute('content', '#150D10');
  }
} catch {
  // Storage blocked: stay light and rosé.
}
