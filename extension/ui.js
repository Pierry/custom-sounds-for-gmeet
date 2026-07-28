/*
 * ui.js runs in the ISOLATED world (has chrome.runtime). It plays the chosen sound
 * in 3D (HRTF panner plus convolution reverb, with a motion path) when detect.js
 * dispatches mos-play, and shows the in-call panel and the configuration dialog.
 * Config is stored in localStorage on meet.google.com, shared with detect.js.
 *
 * Sounds are from Mixkit (https://mixkit.co), Mixkit Free License.
 */
(function () {
  if (window.__mosUI) return; window.__mosUI = true;

  var SOUNDS = [
    ['msgpop', 'Message pop'], ['bubble', 'Bubble pop'], ['drypop', 'Dry pop'], ['longpop', 'Long pop'],
    ['bell', 'Bell'], ['happybells', 'Happy bells'], ['positive', 'Positive'], ['confirm', 'Confirmation'],
    ['correct', 'Correct tone'], ['magicring', 'Magic ring'], ['hint', 'Interface hint'], ['start', 'Interface start'],
    ['back', 'Interface back'], ['doorbell', 'Doorbell']
  ];
  var SOUND_IDS = SOUNDS.map(function (x) { return x[0]; });
  var LABEL = {}; SOUNDS.forEach(function (x) { LABEL[x[0]] = x[1]; });
  var MOTIONS = [['orbit', 'Orbit'], ['flyby', 'Fly by'], ['approach', 'Approach'], ['overhead', 'Overhead'], ['static', 'Static']];
  var EVENTS = ['join', 'leave', 'raise'];
  var TITLE = { join: 'When someone joins', leave: 'When someone leaves', raise: 'When a hand is raised' };
  var DEF = { join: { s: 'doorbell', m: 'approach' }, leave: { s: 'back', m: 'flyby' }, raise: { s: 'bubble', m: 'orbit' } };

  function lg(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function ls(k, v) { try { v == null || v === '' ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function sound(ev) { return lg('mos_' + ev, DEF[ev].s); }
  function motion(ev) { return lg('mos_' + ev + '_motion', DEF[ev].m); }
  function reverb() { return parseFloat(lg('mos_reverb', '0.3')) || 0; }

  // ---------- 3D audio ----------
  var ac = null, buffers = {}, IR = null;
  function ctx() { return ac || (ac = new (window.AudioContext || window.webkitAudioContext)()); }
  function ir() { if (IR) return IR; var c = ctx(), sr = c.sampleRate, n = Math.ceil(sr * 1.8), b = c.createBuffer(2, n, sr); for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); } IR = b; return b; }
  function loadBuf(id) { if (buffers[id]) return buffers[id]; buffers[id] = fetch(chrome.runtime.getURL('sounds/' + id + '.mp3')).then(function (r) { return r.arrayBuffer(); }).then(function (ab) { return ctx().decodeAudioData(ab); }); return buffers[id]; }
  function sched(p, pts, t0) { for (var i = 0; i < pts.length; i++) { if (i) p.linearRampToValueAtTime(pts[i][1], t0 + pts[i][0]); else p.setValueAtTime(pts[i][1], t0); } }
  function path(m, D) { var x = [], y = [], z = [], N = 28, R = 2.4, k, t, a; if (m == 'orbit') { for (k = 0; k <= N; k++) { t = k / N * D; a = k / N * 6.283185; x.push([t, R * Math.sin(a)]); y.push([t, 0]); z.push([t, -R * Math.cos(a)]); } } else if (m == 'flyby') { x.push([0, -3.5], [D, 3.5]); y.push([0, 0.2], [D, 0.2]); z.push([0, 2.2], [D * 0.5, -1.6], [D, 2.2]); } else if (m == 'approach') { x.push([0, 0], [D, 0]); y.push([0, 0], [D, 0]); z.push([0, -9], [D, -0.4]); } else if (m == 'overhead') { x.push([0, -1], [D, 1]); y.push([0, 2.5], [D * 0.5, -0.2], [D, 2.5]); z.push([0, -0.3], [D, -0.3]); } else { x.push([0, 0]); y.push([0, 0]); z.push([0, -0.6]); } return { x: x, y: y, z: z }; }
  function play(id, m) {
    var c = ctx(); if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    loadBuf(id).then(function (buf) {
      var D = Math.min(buf.duration, 4.5), t0 = c.currentTime;
      var src = c.createBufferSource(); src.buffer = buf;
      var pan = c.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 1; pan.maxDistance = 25; pan.rolloffFactor = 0.8;
      var p = path(m, D);
      if (pan.positionX) { sched(pan.positionX, p.x, t0); sched(pan.positionY, p.y, t0); sched(pan.positionZ, p.z, t0); } else pan.setPosition(p.x[0][1], p.y[0][1], p.z[0][1]);
      var dry = c.createGain(); dry.gain.value = 1; var conv = c.createConvolver(); conv.buffer = ir(); var wet = c.createGain(); wet.gain.value = reverb();
      src.connect(pan); pan.connect(dry); dry.connect(c.destination); pan.connect(conv); conv.connect(wet); wet.connect(c.destination);
      src.start();
    }).catch(function () {});
  }
  function playEvent(ev) { play(sound(ev), motion(ev)); }

  // Wipe all stored config so defaults (DEF) take effect again — factory reset.
  function clearAll() {
    var keys = ['mos_reverb', 'mos_raiseDur', 'mos_learnUntil'];
    EVENTS.forEach(function (ev) { keys.push('mos_' + ev, 'mos_' + ev + '_motion'); });
    keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
    try { localStorage.setItem('mos_enabled', ''); } catch (e) {}
    buffers = {}; EVENTS.forEach(function (ev) { loadBuf(sound(ev)); });
  }

  // Reusable on/off switch bound to mos_enabled. onChange(isOn) fires after toggle.
  function makeSwitch(onChange) {
    var track = mk('div', 'position:relative;width:42px;height:24px;border-radius:12px;cursor:pointer;transition:background .15s;flex:0 0 auto');
    var knob = mk('div', 'position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.4)');
    track.appendChild(knob);
    function on() { return localStorage.getItem('mos_enabled') !== '0'; }
    function render() { var v = on(); track.style.background = v ? '#7c5cff' : '#44444f'; knob.style.left = v ? '20px' : '2px'; }
    track.addEventListener('click', function () { ls('mos_enabled', on() ? '0' : ''); render(); if (onChange) onChange(on()); });
    render();
    return { el: track, render: render };
  }

  window.addEventListener('mos-play', function (e) {
    if (localStorage.getItem('mos_enabled') === '0') return;
    if (e && e.detail && e.detail.type) playEvent(e.detail.type);
  });
  EVENTS.forEach(function (ev) { loadBuf(sound(ev)); });

  // ---------- DOM ----------
  function mk(t, c, x) { var e = document.createElement(t); if (c) e.style.cssText = c; if (x != null) e.textContent = x; return e; }

  function openDialog() {
    if (document.getElementById('mos-dialog')) return;
    var tmp = {}; EVENTS.forEach(function (ev) { tmp[ev] = { s: sound(ev), m: motion(ev) }; });
    var rev = reverb();

    var ov = mk('div', 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif');
    ov.id = 'mos-dialog';
    var card = mk('div', 'background:#15151c;color:#e8e8f0;width:520px;max-width:94vw;max-height:88vh;overflow:auto;border:1px solid #2c2c38;border-radius:18px;padding:22px');
    card.appendChild(mk('div', 'font-size:18px;font-weight:700', 'Custom Sounds for GMeet'));
    card.appendChild(mk('div', 'color:#a4a4b8;margin:2px 0 16px', 'Pick a sound and a 3D motion for each action. Best on headphones.'));

    function group(ev) {
      var wrap = mk('div', 'margin-bottom:18px');
      wrap.appendChild(mk('div', 'font-weight:600;margin-bottom:8px', TITLE[ev]));
      var grid = mk('div', 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px');
      var chips = {};
      SOUND_IDS.forEach(function (id) {
        var b = mk('button', 'text-align:left;background:#22222c;border:1px solid #33333f;color:#e8e8f0;border-radius:9px;padding:8px 9px;cursor:pointer;font-size:12.5px', LABEL[id]);
        b.addEventListener('click', function () { tmp[ev].s = id; paint(); play(id, tmp[ev].m); });
        chips[id] = b; grid.appendChild(b);
      });
      wrap.appendChild(grid);
      var mrow = mk('div', 'display:flex;gap:6px;flex-wrap:wrap;margin-top:8px');
      var mchips = {};
      MOTIONS.forEach(function (m) {
        var b = mk('button', 'background:#22222c;border:1px solid #33333f;color:#c8c8d8;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:12px', m[1]);
        b.addEventListener('click', function () { tmp[ev].m = m[0]; paint(); play(tmp[ev].s, m[0]); });
        mchips[m[0]] = b; mrow.appendChild(b);
      });
      wrap.appendChild(mrow);
      function paint() {
        SOUND_IDS.forEach(function (id) { var on = tmp[ev].s === id; chips[id].style.borderColor = on ? '#7c5cff' : '#33333f'; chips[id].style.background = on ? '#2b2547' : '#22222c'; });
        MOTIONS.forEach(function (m) { var on = tmp[ev].m === m[0]; mchips[m[0]].style.borderColor = on ? '#7c5cff' : '#33333f'; mchips[m[0]].style.background = on ? '#2b2547' : '#22222c'; });
      }
      paint();
      if (ev === 'raise') {
        var learn = mk('button', 'width:100%;margin-top:10px;background:#22222c;border:1px dashed #4a4a5a;color:#c8c8d8;border-radius:8px;padding:8px;cursor:pointer', 'Learn Meet’s raise-hand sound');
        var msg = mk('div', 'font-size:11px;opacity:.75;margin-top:5px', localStorage.getItem('mos_raiseDur') ? 'learned' : 'click, then raise your hand once');
        learn.addEventListener('click', function () { ls('mos_learnUntil', String(Date.now() + 8000)); msg.textContent = 'listening... raise your hand now'; });
        wrap.appendChild(learn); wrap.appendChild(msg);
      }
      return wrap;
    }
    EVENTS.forEach(function (ev) { card.appendChild(group(ev)); });

    var rvwrap = mk('div', 'margin:6px 0 16px');
    rvwrap.appendChild(mk('div', 'font-weight:600;margin-bottom:8px', 'Reverb'));
    var slider = mk('input', 'width:100%'); slider.type = 'range'; slider.min = '0'; slider.max = '0.7'; slider.step = '0.05'; slider.value = String(rev);
    slider.addEventListener('input', function () { rev = +slider.value; });
    rvwrap.appendChild(slider); card.appendChild(rvwrap);

    var foot = mk('div', 'display:flex;align-items:center;gap:8px');
    var reset = mk('button', 'background:transparent;border:1px solid #4a3a3a;color:#e6a0a0;border-radius:10px;padding:9px 14px;cursor:pointer', 'Reset to factory');
    var armed = false, resetTimer = null;
    reset.addEventListener('click', function () {
      if (!armed) { armed = true; reset.textContent = 'Reset — click again'; reset.style.background = '#3a2020'; resetTimer = setTimeout(function () { armed = false; reset.textContent = 'Reset to factory'; reset.style.background = 'transparent'; }, 3000); return; }
      clearTimeout(resetTimer); clearAll(); ov.remove(); openDialog();
    });
    foot.appendChild(reset);
    foot.appendChild(mk('div', 'flex:1'));
    var cancel = mk('button', 'background:#33333f;border:0;color:#e8e8f0;border-radius:10px;padding:9px 16px;cursor:pointer', 'Cancel');
    var save = mk('button', 'background:linear-gradient(135deg,#7c5cff,#5b8cff);border:0;color:#fff;font-weight:600;border-radius:10px;padding:9px 18px;cursor:pointer', 'Save');
    cancel.addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    save.addEventListener('click', function () {
      EVENTS.forEach(function (ev) { ls('mos_' + ev, tmp[ev].s); ls('mos_' + ev + '_motion', tmp[ev].m); });
      ls('mos_reverb', String(rev)); EVENTS.forEach(function (ev) { loadBuf(sound(ev)); }); ov.remove();
    });
    foot.appendChild(cancel); foot.appendChild(save); card.appendChild(foot);
    ov.appendChild(card); document.body.appendChild(ov);
  }

  function panel() {
    if (document.getElementById('mos-panel')) return;
    var B = 'flex:1;background:#33333f;border:0;color:#e6e6ee;border-radius:8px;padding:7px 4px;cursor:pointer;font:13px system-ui';
    var el = mk('div', 'position:fixed;right:16px;bottom:16px;z-index:2147483646;background:#1f1f27;color:#e6e6ee;font:13px system-ui,sans-serif;padding:12px 14px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.4);width:236px');
    el.id = 'mos-panel';
    var hd = mk('div', 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px');
    hd.appendChild(mk('div', 'font-weight:600', 'Custom Sounds for GMeet'));
    var cl = mk('button', 'background:transparent;border:0;color:#9a9aac;font-size:18px;line-height:1;cursor:pointer;padding:0 2px', '×');
    cl.addEventListener('click', function () { el.style.display = 'none'; });
    hd.appendChild(cl); el.appendChild(hd);

    var cfg = mk('button', 'width:100%;background:linear-gradient(135deg,#7c5cff,#5b8cff);border:0;color:#fff;font-weight:600;border-radius:8px;padding:8px;cursor:pointer;margin-bottom:8px', 'Configure sounds');
    cfg.addEventListener('click', openDialog); el.appendChild(cfg);

    var r1 = mk('div', 'display:flex;gap:6px;margin-bottom:10px');
    var bj = mk('button', B, 'Join'), bl = mk('button', B, 'Leave'), br = mk('button', B, 'Hand');
    bj.addEventListener('click', function () { playEvent('join'); }); bl.addEventListener('click', function () { playEvent('leave'); }); br.addEventListener('click', function () { playEvent('raise'); });
    r1.appendChild(bj); r1.appendChild(bl); r1.appendChild(br); el.appendChild(r1);

    var r2 = mk('div', 'display:flex;align-items:center;justify-content:space-between;background:#171720;border-radius:10px;padding:8px 10px');
    var lab = mk('div', 'display:flex;flex-direction:column');
    lab.appendChild(mk('div', 'font-weight:600', 'Sounds'));
    var state = mk('div', 'font-size:11px;color:#9a9aac', '');
    lab.appendChild(state);
    var sw = makeSwitch(function (on) { state.textContent = on ? 'On' : 'Off'; });
    state.textContent = localStorage.getItem('mos_enabled') === '0' ? 'Off' : 'On';
    r2.appendChild(lab); r2.appendChild(sw.el); el.appendChild(r2);
    document.body.appendChild(el);
  }

  if (document.body) panel(); else document.addEventListener('DOMContentLoaded', panel);
})();
