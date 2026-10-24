
/* SAS Credits screen (old-Chrome safe, ES5) */
(function () {
  'use strict';
  if (window.__sasCreditsLoaded) return;
  window.__sasCreditsLoaded = true;
  var MUSIC = 'audio/credits.mp3';
  var music = null;
  function startMusic() {
    try {
      if (!music) {
        music = new Audio(MUSIC); music.loop = true; music.volume = 0.6;
        music.addEventListener('error', function () { console.warn('[credits] ' + MUSIC + ' missing'); });
      }
      try { music.currentTime = 0; } catch (e) {}
      var p = music.play();
      if (p && p.catch) p.catch(function (e) { console.warn('[credits] music blocked'); });
    } catch (e) { console.warn('[credits] music error', e); }
  }
  function stopMusic() { try { if (music) { music.pause(); music.currentTime = 0; } } catch (e) {} }
  var root;
  function member(name, file) {
    var pic = file ? '<img data-src="' + file + '" alt="' + name + '"><div class="ph">&#128100;</div>'
                   : '<div class="ph" style="display:block">&#128100;</div>';
    return '<div class="member">' + pic + '<h3>' + name + '</h3></div>';
  }
  function build() {
    root = document.createElement('div'); root.id = 'sas-credits';
    root.innerHTML = '<h1>Credits</h1><div class="team">' +
      member('Eyad', 'Eyad.png') + member('Yossef', 'Yussef.png') + member('Ahmed', 'Ahmed.png') + '</div><ul>' +
      '<li>ChatGPT &mdash; AI assistance</li><li>Gemini &mdash; AI assistance</li>' +
      '<li>AI-generated voices</li><li>Audio Maker &mdash; sound effects</li>' +
      '<li>JavaScript and C++ &mdash; programming technologies</li></ul>' +
      '<div class="invite">Some help made this game possible. Do you want to join us?</div>' +
      '<button class="back" type="button">Back</button>';
    document.body.appendChild(root);
    var imgs = root.querySelectorAll('img[data-src]'), n;
    for (n = 0; n < imgs.length; n++) (function (img) {
      var base = img.getAttribute('data-src').replace(/\.[a-z]+$/i, ''), tries = [], d, e,
          dirs = ['', 'images/', 'assets/', 'img/'], exts = ['png', 'PNG', 'jpg', 'jpeg', 'webp'], i = 0;
      for (d = 0; d < dirs.length; d++) for (e = 0; e < exts.length; e++) tries.push(dirs[d] + base + '.' + exts[e]);
      img.onerror = function () { i++; if (i < tries.length) img.src = tries[i]; else { img.style.display = 'none'; img.nextSibling.style.display = 'block'; } };
      img.src = tries[0];
    })(imgs[n]);
    var back = root.querySelector('button.back');
    back.addEventListener('click', close);
    back.addEventListener('touchend', function (e) { e.preventDefault(); close(); });
  }
  function open() { if (!root) build(); root.className = 'open'; root.scrollTop = 0; startMusic(); }
  function close() { if (root) root.className = ''; stopMusic(); }
  window.SASCredits = { open: open, close: close };
  document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.keyCode === 27) && root && root.className === 'open') close(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopMusic(); });
  window.addEventListener('pagehide', stopMusic);
  function findRef() {
    var els = document.querySelectorAll('button, .btn, [role="button"], a'), i, t, best = null;
    for (i = 0; i < els.length; i++) {
      t = (els[i].textContent || '').trim().toLowerCase();
      if (/^(play|start|new game|continue|settings|options|multiplayer|two player)/.test(t)) { best = els[i]; if (/^(play|start)/.test(t)) break; }
    }
    return best;
  }
  function addButton() {
    if (document.getElementById('sas-credits-btn')) return true;
    var ref = findRef(), b = document.createElement('button');
    b.id = 'sas-credits-btn'; b.type = 'button'; b.textContent = 'Credits';
    b.addEventListener('click', function (e) { e.stopPropagation(); open(); });
    if (ref && ref.parentNode) { if (ref.className) b.className = ref.className; ref.parentNode.appendChild(b); return true; }
    return false;
  }
  function init() {
    if (addButton()) return;
    var tries = 0, iv = setInterval(function () {
      if (addButton() || ++tries > 40) {
        clearInterval(iv);
        if (!document.getElementById('sas-credits-btn')) {
          var b = document.createElement('button'); b.id = 'sas-credits-btn'; b.type = 'button'; b.textContent = 'Credits';
          b.style.cssText = 'position:fixed;right:10px;bottom:10px'; b.addEventListener('click', open); document.body.appendChild(b);
        }
      }
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
