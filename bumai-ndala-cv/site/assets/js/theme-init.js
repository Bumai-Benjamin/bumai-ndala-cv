/* Runs before first paint: pick the theme and enable motion classes. */
(function () {
  var d = document.documentElement;
  d.classList.remove('no-js');
  d.classList.add('js');
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  d.setAttribute('data-theme', t);
  // Safety net: if the main script never boots, show everything.
  setTimeout(function () {
    if (!d.classList.contains('booted')) { d.classList.remove('js'); }
  }, 3000);
})();
