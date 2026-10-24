
/* SAS-COMPAT-SHIM v1 - makes sound/JS work on old Chromium / Android 8 */
(function () {
  if (window.__sasCompat) return; window.__sasCompat = 1;
  function def(o, n, f) { try { if (!o[n]) Object.defineProperty(o, n, { value: f, writable: true, configurable: true }); } catch (e) {} }
  // ---- polyfills ----
  def(String.prototype, 'includes', function (s, i) { return this.indexOf(s, i || 0) !== -1; });
  def(String.prototype, 'startsWith', function (s, p) { p = p || 0; return this.substr(p, s.length) === s; });
  def(String.prototype, 'endsWith', function (s, l) { var t = String(this); if (l === undefined || l > t.length) l = t.length; return t.substring(l - s.length, l) === s; });
  def(String.prototype, 'repeat', function (n) { var r = '', i; for (i = 0; i < n; i++) r += this; return r; });
  def(String.prototype, 'padStart', function (n, p) { var s = String(this); p = p === undefined ? ' ' : String(p); while (s.length < n && p) s = p + s; return s.length > n ? s.slice(s.length - n) : s; });
  def(String.prototype, 'padEnd', function (n, p) { var s = String(this); p = p === undefined ? ' ' : String(p); while (s.length < n && p) s = s + p; return s.slice(0, Math.max(n, 0) || s.length); });
  def(String.prototype, 'replaceAll', function (a, b) { return typeof a === 'string' ? this.split(a).join(b) : this.replace(a, b); });
  def(Array.prototype, 'includes', function (v) { var i; for (i = 0; i < this.length; i++) { if (this[i] === v || (v !== v && this[i] !== this[i])) return true; } return false; });
  def(Array.prototype, 'find', function (f, t) { var i; for (i = 0; i < this.length; i++) if (f.call(t, this[i], i, this)) return this[i]; });
  def(Array.prototype, 'findIndex', function (f, t) { var i; for (i = 0; i < this.length; i++) if (f.call(t, this[i], i, this)) return i; return -1; });
  def(Array.prototype, 'at', function (n) { n = n < 0 ? this.length + n : n; return this[n]; });
  def(Array.prototype, 'flat', function (d) { d = d === undefined ? 1 : d; var o = []; (function f(a, k) { var i; for (i = 0; i < a.length; i++) { if (Array.isArray(a[i]) && k > 0) f(a[i], k - 1); else o.push(a[i]); } })(this, d); return o; });
  def(Object, 'assign', function (t) { var i, k, s; for (i = 1; i < arguments.length; i++) { s = arguments[i]; if (s) for (k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; } return t; });
  def(Object, 'values', function (o) { return Object.keys(o).map(function (k) { return o[k]; }); });
  def(Object, 'entries', function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); });
  def(Object, 'fromEntries', function (a) { var o = {}, i; for (i = 0; i < a.length; i++) o[a[i][0]] = a[i][1]; return o; });
  if (window.Element) {
    var EP = Element.prototype;
    def(EP, 'matches', EP.webkitMatchesSelector || EP.msMatchesSelector);
    def(EP, 'closest', function (s) { var e = this; while (e && e.nodeType === 1) { if (e.matches(s)) return e; e = e.parentElement; } return null; });
  }
  if (window.NodeList) def(NodeList.prototype, 'forEach', Array.prototype.forEach);
  if (window.Promise) def(Promise.prototype, 'finally', function (f) { var P = this.constructor; return this.then(function (v) { return P.resolve(f()).then(function () { return v; }); }, function (e) { return P.resolve(f()).then(function () { throw e; }); }); });
  if (!window.requestAnimationFrame) { window.requestAnimationFrame = function (f) { return setTimeout(function () { f(Date.now()); }, 16); }; window.cancelAnimationFrame = clearTimeout; }

  // ---- audio ----
  var pending = [];
  function drop(el) { var i = pending.indexOf(el); if (i > -1) pending.splice(i, 1); }
  var MP = window.HTMLMediaElement && HTMLMediaElement.prototype;
  if (MP && !MP.__sasPlay) {
    MP.__sasPlay = 1;
    var op = MP.play, opa = MP.pause;
    MP.play = function () {
      var el = this, r;
      try { r = op.apply(el, arguments); } catch (e) { if (pending.indexOf(el) < 0) pending.push(el); return Promise.resolve(); }
      if (r && typeof r.then === 'function') {
        return r.catch(function (err) {
          if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError') && pending.indexOf(el) < 0) pending.push(el);
          throw err;
        });
      }
      return Promise.resolve();          // old browsers: play() returns undefined
    };
    MP.pause = function () { drop(this); return opa.apply(this, arguments); };
  }
  var N = window.AudioContext || window.webkitAudioContext;
  window.__sasCtxs = [];
  if (N && !N.__sasWrapped) {
    var W = function (o) { var c = (o === undefined) ? new N() : new N(o); window.__sasCtxs.push(c); return c; };
    W.prototype = N.prototype; W.__sasWrapped = 1;
    window.AudioContext = W; window.webkitAudioContext = W;
  }
  function unlock() {
    var i, c, list;
    for (i = 0; i < window.__sasCtxs.length; i++) {
      c = window.__sasCtxs[i];
      try {
        if (c.state === 'suspended' && c.resume) c.resume();
        var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
        s.buffer = b; s.connect(c.destination); (s.start || s.noteOn).call(s, 0);
      } catch (e) {}
    }
    list = pending.splice(0, pending.length);
    for (i = 0; i < list.length; i++) { try { var p = list[i].play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  }
  var ev = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'], k;
  for (k = 0; k < ev.length; k++) document.addEventListener(ev[k], unlock, true);

  // ---- ?debug shows the first JavaScript error on screen (for testing old devices) ----
  if (/[?&]debug/.test(location.search)) {
    window.addEventListener('error', function (e) {
      var d = document.getElementById('sas-dbg');
      if (!d) { d = document.createElement('div'); d.id = 'sas-dbg';
        d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#900;color:#fff;font:12px monospace;padding:6px;white-space:pre-wrap';
        (document.body || document.documentElement).appendChild(d); }
      d.textContent += (e.message || 'error') + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno + '\n';
    });
  }
})();
