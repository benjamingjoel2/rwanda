/* Virunga Journeys — progressive enhancement only. Loaded with `defer`. */
(function () {
  var d = document, de = d.documentElement, w = window;
  de.classList.add('js');
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header: solid after scroll, hide on scroll down */
  var hdr = d.querySelector('.hdr'), last = 0;
  function onScroll() {
    var y = w.scrollY;
    if (hdr) {
      hdr.classList.toggle('is-scrolled', y > 40);
      hdr.classList.toggle('is-hidden', y > 400 && y > last && !d.body.classList.contains('menu-open'));
    }
    last = y;
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = d.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      mnav.toggleAttribute('inert', !open);
      if (open) { var a = mnav.querySelector('a'); a && a.focus(); }
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && d.body.classList.contains('menu-open')) { burger.click(); burger.focus(); }
    });
  }

  /* mega menu: click/keyboard toggle (hover + focus-within handled in CSS) */
  d.querySelectorAll('.has-mega > button').forEach(function (b) {
    var li = b.parentNode;
    b.addEventListener('click', function () {
      var o = li.classList.toggle('open'); b.setAttribute('aria-expanded', o);
    });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { li.classList.remove('open'); b.setAttribute('aria-expanded', false); b.focus(); }
    });
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) { li.classList.remove('open'); b.setAttribute('aria-expanded', false); }
    });
  });

  /* reveal on scroll */
  var words = d.querySelectorAll('.rv-words');
  words.forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (t) { return '<span class="w">' + t + '</span>'; }).join(' ');
  });
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    d.querySelectorAll('.rv,.rv-img').forEach(function (el) { io.observe(el); });
  } else {
    d.querySelectorAll('.rv,.rv-img').forEach(function (el) { el.classList.add('in'); });
  }

  /* scroll-driven pieces: word reveal, part the mist, trek day */
  var day = d.querySelector('.day'), clear = d.querySelector('.clear');
  var steps = day ? day.querySelectorAll('.step') : [];
  var clock = day ? day.querySelector('.day__clock') : null, now = day ? day.querySelector('.day__now') : null;
  var sun = day ? day.querySelector('.day__sun') : null;
  var ticking = false;

  function frame() {
    ticking = false;
    var vh = w.innerHeight;
    words.forEach(function (el) {
      var r = el.getBoundingClientRect(), ws = el.querySelectorAll('.w');
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      var n = Math.round(p * ws.length);
      ws.forEach(function (s, i) { s.classList.toggle('on', i < n); });
    });
    if (clear && !reduce) {
      var cr = clear.getBoundingClientRect();
      var cp = Math.min(1, Math.max(0, -cr.top / (cr.height - vh)));
      clear.style.setProperty('--p', cp.toFixed(3));
    }
    if (day && steps.length) {
      var act = 0;
      steps.forEach(function (s, i) { if (s.getBoundingClientRect().top < vh * 0.55) act = i; });
      steps.forEach(function (s, i) { s.classList.toggle('on', i === act); });
      var s = steps[act];
      if (clock) clock.textContent = s.querySelector('time').textContent;
      if (now) now.textContent = s.querySelector('h3').textContent;
      if (sun) {
        var t = steps.length > 1 ? act / (steps.length - 1) : 0, a = Math.PI * (1 - t);
        sun.setAttribute('cx', (150 + 130 * Math.cos(a)).toFixed(1));
        sun.setAttribute('cy', (150 - 130 * Math.sin(a)).toFixed(1));
      }
    }
  }
  function req() { if (!ticking) { ticking = true; w.requestAnimationFrame(frame); } }
  if (words.length || day || clear) { w.addEventListener('scroll', req, { passive: true }); w.addEventListener('resize', req); frame(); }

  /* card carousel arrows */
  d.querySelectorAll('.cnav').forEach(function (nav) {
    var sec = nav.closest('section'), track = sec && sec.querySelector('[data-carousel]');
    if (!track) return;
    nav.querySelectorAll('.cbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = track.firstElementChild, step = card ? card.getBoundingClientRect().width + 24 : 300;
        track.scrollBy({ left: step * +b.dataset.dir, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  });

  /* ambient sound (Tarn-style toggle). Generated in the browser with the Web Audio API:
     wind and leaves from filtered noise, plus occasional bird calls. Nothing loads until pressed. */
  var sbtns = d.querySelectorAll('.sound'), actx = null, master = null, birdTimer = null, on = false;
  function noiseBuffer(ctx, secs, brown) {
    var len = ctx.sampleRate * secs, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var data = buf.getChannelData(c), last = 0;
      for (var i = 0; i < len; i++) {
        var white = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; } else data[i] = white * 0.5;
      }
    }
    return buf;
  }
  function loop(ctx, buf, filterType, freq, q, gain) {
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; src.loop = true; f.type = filterType; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master); src.start();
    return { f: f, g: g };
  }
  function lfo(ctx, param, rate, depth) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(param); o.start();
  }
  function bird() {
    if (!on || !actx) return;
    var t = actx.currentTime, notes = 2 + Math.floor(Math.random() * 4), base = 2200 + Math.random() * 1800;
    var pan = actx.createStereoPanner ? actx.createStereoPanner() : null;
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(master); }
    for (var n = 0; n < notes; n++) {
      var o = actx.createOscillator(), g = actx.createGain(), st = t + n * (0.12 + Math.random() * 0.1), dur = 0.07 + Math.random() * 0.08;
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.25), st);
      o.frequency.exponentialRampToValueAtTime(base * (1.15 + Math.random() * 0.4), st + dur);
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.05, st + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
      o.connect(g); g.connect(pan || master); o.start(st); o.stop(st + dur + 0.05);
    }
    birdTimer = setTimeout(bird, 2500 + Math.random() * 6000);
  }
  function startSound() {
    var AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return false;
    if (!actx) {
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0; master.connect(actx.destination);
      var brown = noiseBuffer(actx, 4, true), white = noiseBuffer(actx, 3, false);
      var wind = loop(actx, brown, 'lowpass', 420, 0.6, 0.55);
      lfo(actx, wind.f.frequency, 0.07, 220);
      lfo(actx, wind.g.gain, 0.11, 0.18);
      var leaves = loop(actx, white, 'bandpass', 5200, 0.7, 0.035);
      lfo(actx, leaves.g.gain, 0.17, 0.025);
    }
    actx.resume();
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setTargetAtTime(0.55, actx.currentTime, 0.6);
    clearTimeout(birdTimer); birdTimer = setTimeout(bird, 1200);
    return true;
  }
  function stopSound() {
    if (!actx) return;
    clearTimeout(birdTimer);
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setTargetAtTime(0, actx.currentTime, 0.35);
    setTimeout(function () { if (!on) actx.suspend(); }, 1600);
  }
  /* autoplay: on by default. Browsers only allow sound after the visitor interacts, so it starts
     immediately where allowed, otherwise on the first click, tap or key press anywhere.
     Turning it off is remembered (localStorage) so it does not restart on every page. */
  var PREF = 'vj-sound';
  function getPref() { try { return localStorage.getItem(PREF); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(PREF, v); } catch (e) {} }
  function ui() {
    var playing = on && actx && actx.state === 'running';
    sbtns.forEach(function (x) { x.setAttribute('aria-pressed', !!playing); x.classList.toggle('is-on', !!playing); });
  }
  function soundOn() { on = true; if (!startSound()) on = false; if (actx) actx.onstatechange = ui; ui(); }
  function soundOff() { on = false; stopSound(); ui(); }
  var GESTURES = ['pointerdown', 'keydown', 'touchend'];
  function onGesture(e) {
    GESTURES.forEach(function (g) { d.removeEventListener(g, onGesture, true); });
    if (e.target && e.target.closest && e.target.closest('.sound')) return; // the button handles itself
    if (getPref() !== 'off') soundOn();
  }
  if (sbtns.length && getPref() !== 'off') {
    var policy = navigator.getAutoplayPolicy ? navigator.getAutoplayPolicy('audiocontext') : '';
    if (policy === 'allowed') soundOn();
    else GESTURES.forEach(function (g) { d.addEventListener(g, onGesture, true); });
  }
  sbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      GESTURES.forEach(function (g) { d.removeEventListener(g, onGesture, true); });
      var playing = on && actx && actx.state === 'running';
      if (playing) { soundOff(); setPref('off'); } else { soundOn(); setPref('on'); }
    });
  });
  d.addEventListener('visibilitychange', function () {
    if (!actx || !on) return;
    if (d.hidden) actx.suspend(); else actx.resume();
  });

  /* Kigali local time (fact row) */
  var kt = d.querySelectorAll('[data-kigali-time]');
  function tick() {
    var s = new Date().toLocaleTimeString(de.lang, { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });
    kt.forEach(function (el) { el.textContent = s; });
  }
  if (kt.length) { tick(); setInterval(tick, 30000); }

  /* next Umuganda (last Saturday of the month, 08:00–11:00 Kigali time) */
  var um = d.querySelectorAll('[data-next-umuganda]');
  if (um.length) {
    var t = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kigali' }));
    function lastSat(y, m) { var x = new Date(y, m + 1, 0); x.setDate(x.getDate() - ((x.getDay() + 1) % 7)); return x; }
    var c = lastSat(t.getFullYear(), t.getMonth());
    if (t.getDate() > c.getDate() || (t.getDate() === c.getDate() && t.getHours() >= 11)) c = lastSat(t.getFullYear(), t.getMonth() + 1);
    var txt = c.toLocaleDateString(de.lang, { weekday: 'short', day: 'numeric', month: 'short' });
    um.forEach(function (el) { el.textContent = txt; });
  }

  /* enquiry form: submit via fetch; if the relay fails, offer a pre-filled email instead */
  var f = d.querySelector('form[data-ajax]');
  if (f && w.fetch) {
    var mailto = function () {
      var lines = [];
      new FormData(f).forEach(function (v, k) { if (k.charAt(0) !== '_' && v) lines.push(k + ': ' + v); });
      return 'mailto:' + f.dataset.email + '?subject=' + encodeURIComponent(f.querySelector('[name=_subject]').value) + '&body=' + encodeURIComponent(lines.join('\n'));
    };
    f.addEventListener('submit', function (e) {
      var st = f.querySelector('.form-status');
      if (!f.checkValidity()) return;
      e.preventDefault();
      var btn = f.querySelector('[type=submit]'); btn.disabled = true;
      st.className = 'form-status'; st.textContent = f.dataset.sending;
      var ctrl = w.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { ctrl && ctrl.abort(); }, 15000);
      fetch(f.dataset.ajax, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(f), signal: ctrl && ctrl.signal })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          clearTimeout(timer);
          if (res.ok && String(res.j.success) !== 'false') { w.location.href = f.querySelector('[name=_next]').value; }
          else { throw new Error(res.j.message || 'error'); }
        })
        .catch(function () {
          clearTimeout(timer);
          st.className = 'form-status err';
          st.innerHTML = '';
          st.appendChild(d.createTextNode(f.dataset.error + ' '));
          var a = d.createElement('a'); a.href = mailto(); a.className = 'link'; a.textContent = f.dataset.mailto; st.appendChild(a);
          btn.disabled = false;
        });
    });
  }
})();
