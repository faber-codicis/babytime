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

// Language (0.14.0): saved choice, otherwise German for a de-* phone and English for everything else.
// Same key and rule as src/data/language.ts – keep them in sync. Sets <html lang>, which also picks the splash text.
(function () {
  var choice = null;
  try {
    choice = localStorage.getItem('babytime-lang');
  } catch {
    // Storage blocked: follow the phone.
  }
  // The browser's own locale follows the system language; navigator.languages can lag behind (0.15.2).
  var first = '';
  try {
    first = new Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    // No Intl: use the website list below.
  }
  first = first || (navigator.languages && navigator.languages[0]) || navigator.language || '';
  var lang = choice === 'de' || choice === 'en' ? choice : /^de(-|$)/i.test(first) ? 'de' : 'en';
  document.documentElement.lang = lang;
})();
