/*
 * detect.js runs in the MAIN world so it can patch the Web Audio API that Google
 * Meet uses. A bookmarklet cannot do this: Meet's CSP (script-src with nonce and
 * strict-dynamic) blocks javascript: URLs. An extension content script is exempt.
 *
 * It intercepts Meet's join, leave, and raise-hand sounds, suppresses them, and
 * dispatches a mos-play event. ui.js (isolated world) plays the chosen sound.
 *
 * Shared state via localStorage (same origin, both worlds):
 *   mos_enabled    '0' means off (default on)
 *   mos_raiseDur   learned duration of Meet's raise-hand sound
 *   mos_learnUntil timestamp; while now is below it, the next short sound is learned as raise
 */
(function () {
  if (window.__mosDetect) return; window.__mosDetect = true;
  var KNOWN_JOIN = 'https://www.gstatic.com/meet/sounds/join_call_c2a45b945ae2203b769bccea0e77d971.ogg';
  var s = { joinDur: null, leaveDur: null, raiseDur: parseFloat(localStorage.getItem('mos_raiseDur')) || null, lastCount: null, expecting: null };

  function enabled() { try { return localStorage.getItem('mos_enabled') !== '0'; } catch (e) { return true; } }
  function learnUntil() { try { return parseFloat(localStorage.getItem('mos_learnUntil')) || 0; } catch (e) { return 0; } }
  function fire(type) { try { window.dispatchEvent(new CustomEvent('mos-play', { detail: { type: type } })); } catch (e) {} }

  try { var a = new Audio(); a.preload = 'metadata'; a.src = KNOWN_JOIN;
    a.addEventListener('loadedmetadata', function () { s.joinDur = a.duration; }); } catch (e) {}

  function pc() {
    var t = document.querySelectorAll('[data-participant-id]'); if (!t.length) return null;
    var ids = {}; for (var i = 0; i < t.length; i++) ids[t[i].getAttribute('data-participant-id')] = 1; return Object.keys(ids).length;
  }
  setInterval(function () {
    var c = pc(); if (c == null) return;
    if (s.lastCount != null && c !== s.lastCount) s.expecting = { type: c > s.lastCount ? 'join' : 'leave', until: performance.now() + 2500 };
    s.lastCount = c;
  }, 800);

  var proto = window.AudioBufferSourceNode && window.AudioBufferSourceNode.prototype;
  if (proto && !proto.__mosPatched) {
    var orig = proto.start;
    proto.start = function () {
      try {
        if (enabled() && this.buffer) {
          var dur = this.buffer.duration;
          if (dur > 0.1 && dur < 3.5) {
            if (Date.now() < learnUntil()) { s.raiseDur = dur; try { localStorage.setItem('mos_raiseDur', String(dur)); localStorage.removeItem('mos_learnUntil'); } catch (e) {} fire('raise'); return; }
            if (s.raiseDur && Math.abs(dur - s.raiseDur) < 0.06) { fire('raise'); return; }
            if (s.joinDur && Math.abs(dur - s.joinDur) < 0.06) { fire('join'); return; }
            if (s.leaveDur && Math.abs(dur - s.leaveDur) < 0.06) { fire('leave'); return; }
            var e = s.expecting;
            if (e && performance.now() < e.until) { if (e.type === 'join') s.joinDur = dur; else s.leaveDur = dur; s.expecting = null; fire(e.type); return; }
          }
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    proto.__mosPatched = true;
  }
})();
