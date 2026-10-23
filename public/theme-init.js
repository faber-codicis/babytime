// Applies the saved dark design before the first paint, so neither the splash nor the app flashes
// light. Loaded as a normal script in <head> (CSP: script-src 'self'). Key as in src/data/theme.ts.
try {
  if (localStorage.getItem('babytime-theme') === 'dark') {
    document.documentElement.dataset.theme = 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#150D10');
  }
} catch {
  // Storage blocked: stay light.
}
