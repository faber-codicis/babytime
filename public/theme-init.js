// Applies the saved design before the first paint, so neither the splash nor the app flashes
// light. Loaded as a normal script in <head> (CSP: script-src 'self').
// Key, values and night hours (20:00–07:00) as in src/data/theme.ts – keep both in sync.
try {
  var mode = localStorage.getItem('babytime-theme');
  var hour = new Date().getHours();
  if (mode === 'dark' || (mode === 'night' && (hour >= 20 || hour < 7))) {
    document.documentElement.dataset.theme = 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#150D10');
  }
} catch {
  // Storage blocked: stay light.
}
