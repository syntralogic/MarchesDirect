// @ts-nocheck
// Animation engine for the « Analyse croisée » demo, ported unchanged from the client preview.
export function xhEngine(root, opts) {
  opts = opts || {};
  var Q = function (s) { return root.querySelector(s); };
  var QA = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  // mise en page compacte selon la largeur disponible (requêtes de conteneur), pas selon l'écran
  var cq = root.closest ? root.closest('.xh-cq') : null;
  var mq = { get matches() { var w = cq ? cq.clientWidth : window.innerWidth; return w <= 820; } };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var flow = QA('.xh-fs'), inp = Q('.xh-in'), sv = Q('.xh-sv');
  var secs = QA('.xh-sc'), bar = Q('.xh-pb i'), pc = Q('.xh-pcn'), ps = Q('.xh-pg-s');
  var secN = secs.map(function (sc) { return +sc.getAttribute('data-n'); });
  var rolls = secs.map(function (sc) { return sc.querySelector('.xh-roll-in'); });
  var lines = secs.map(function (sc) { return Array.prototype.slice.call(sc.querySelectorAll('.xh-roll-in li:not(.xh-sp0)')); });
  var sks = secs.map(function (sc) { return sc.querySelector('.xh-sk'); });
  var sbars = secs.map(function (sc) { return sc.querySelector('.xh-sbar b'); });
  var ring = Q('.xh-ring'), rg = Q('.xh-rg1'), pn = Q('.xh-pn'), items = QA('.xh-ni'), nh = Q('.xh-nh'), ca = Q('.xh-ca');
  var pz = Q('.xh-pz'), again = Q('.xh-again');
  var SIRET = root.getAttribute('data-siret') || '', SCORE = +(root.getAttribute('data-score') || 72);
  var N = secN.reduce(function (a, b) { return a + b; }, 0), HOLD = 8, LOOP = opts.loop !== false, C = 326.73;
  // Personalised analysis (client brief 17 Oct): opts.intro = extra seconds the recognised company stays on screen,
  // opts.speed = multiplier on the per-line and per-step pauses (< 1 = faster), opts.calcHold = length of the
  // "Calcul de l'indice" pause, opts.onResult = called when the result would appear: the sequence then stops (no
  // illustrative score is ever shown in the real journey).
  var INTRO = opts.intro || 0, SPEED = opts.speed || 1, CALC = opts.calcHold == null ? 1.0 : opts.calcHold;
  var ST = ['s-type', 's-found', 's-ready', 's-press', 's-ov', 's-calc', 's-out', 's-res'];
  var MSG = { start: 'Analyse en cours', run: 'Croisement en cours', calc: "Calcul de l'indice" };
  var tl = [], raf = 0, t0 = 0, state = 'idle', paused = false, pauseAt = 0, restart = false;
  var userPaused = false, inView = true, docVisible = !document.hidden, M = false;

  function at(t, fn) { tl.push({ t: t, fn: fn, d: 0 }); }
  function on(c) { root.classList.add(c); }
  function setFlow(k) { flow.forEach(function (f, i) { f.classList.toggle('is-done', i < k); f.classList.toggle('is-cur', i === k); }); }
  function setProg(k) { if (bar) bar.style.transform = 'scaleX(' + (k / N) + ')'; if (pc) pc.textContent = String(k); }
  function setScore(v) { if (pn) pn.textContent = String(v); if (rg) rg.style.strokeDashoffset = (C * (1 - v / 100)).toFixed(2); }
  // ligne j de l'étape i au centre du rouleau ; les lignes au-dessus sont parcourues
  function rollTo(i, j, dur) {
    var r = rolls[i], ls = lines[i]; if (!r) return;
    var lh = ls[0] ? ls[0].offsetHeight || 20 : 20;
    r.style.transitionDuration = (dur || 0) + 's';
    r.style.transform = 'translateY(' + (-j * lh) + 'px)';
    ls.forEach(function (l, k) { l.classList.toggle('is-done', k < j); l.classList.toggle('is-cur', k === j); });
  }
  function setSec(i, k) {
    if (sks[i]) sks[i].textContent = String(k);
    if (sbars[i]) sbars[i].style.transform = 'scaleX(' + (k / secN[i]) + ')';
  }
  function secReset() {
    secs.forEach(function (sc, i) { sc.classList.remove('is-open', 'is-done'); setSec(i, 0); rollTo(i, 0, 0); });
  }
  function secFinal() {
    secs.forEach(function (sc, i) { sc.classList.remove('is-open'); sc.classList.add('is-done'); setSec(i, secN[i]); rollTo(i, secN[i] - 1, 0); });
  }
  function reset() {
    cancelAnimationFrame(raf); tl = []; t0 = 0;
    root.classList.add('xh-noanim');
    root.classList.remove('xh-final', 'xh-fade', 'xh-frozen', 'xh-done');
    ST.forEach(function (c) { root.classList.remove(c); });
    secReset();
    items.concat([nh, ca]).forEach(function (e) { if (e) e.classList.remove('is-on'); });
    if (ring) ring.classList.remove('is-bim');
    if (inp) inp.classList.remove('is-focus');
    if (sv) sv.textContent = '';
    if (ps) ps.textContent = MSG.start;
    setFlow(1); setProg(0); setScore(0);
    void root.offsetWidth; root.classList.remove('xh-noanim');
  }
  function build() {
    M = mq.matches;
    var t = 0.35, i;
    // 1. le visiteur saisit son SIRET
    at(t, function () { inp.classList.add('is-focus'); });
    t += 0.3;
    at(t, function () { on('s-type'); });
    for (i = 1; i <= SIRET.length; i++) (function (n) { at(t + n * 0.07, function () { sv.textContent = SIRET.slice(0, n); }); })(i);
    t += SIRET.length * 0.07 + 0.3;
    at(t, function () { on('s-found'); inp.classList.remove('is-focus'); });
    t += 0.45; at(t, function () { on('s-ready'); });
    t += INTRO;                       // le visiteur a le temps de reconnaître sa société
    // 2. il valide
    t += 0.6; at(t, function () { on('s-press'); });
    t += 0.35; at(t, function () { setFlow(2); on('s-ov'); });
    // 3. l'analyse croisée : chaque étape s'ouvre, son détail défile très vite, puis elle se referme
    t += 0.7; at(t, function () { ps.textContent = MSG.run; });
    var k = 0;
    secs.forEach(function (sc, si) {
      var n = secN[si];
      at(t, function () { sc.classList.add('is-open'); rollTo(si, 0, 0); });
      t += 0.26 * SPEED;
      for (var j = 0; j < n; j++) (function (j) {
        var per = (j < 2 ? 0.13 : (j < 4 ? 0.08 : 0.04)) * SPEED, kk = ++k;
        at(t, function () { rollTo(si, j, Math.min(per * 0.8, 0.12)); setSec(si, j + 1); setProg(kk); });
        t += per;
      })(j);
      t += 0.14 * SPEED;
      at(t, function () { sc.classList.remove('is-open'); sc.classList.add('is-done'); });
      t += 0.08 * SPEED;
    });
    t += 0.25; at(t, function () { on('s-calc'); ps.textContent = MSG.calc; });
    t += CALC; at(t, function () { on('s-out'); });
    // 4. le pourcentage, puis le résultat aux couleurs du site
    if (opts.onResult) { t += 0.3; at(t, function () { setFlow(3); setProg(N); opts.onResult(); }); tl.sort(function (a, b) { return a.t - b.t; }); return; }
    t += 0.3; at(t, function () { root.classList.remove('s-ov', 's-out', 's-calc'); on('s-res'); setFlow(3); });
    t += 0.25;
    var dur = 0.9;
    for (i = 1; i <= SCORE; i++) (function (v) { at(t + dur * Math.pow(v / SCORE, 1.6), function () { setScore(v); }); })(i);
    t += dur + 0.02; at(t, function () { setScore(SCORE); ring.classList.add('is-bim'); });
    t += 0.6; at(t, function () { nh.classList.add('is-on'); });
    items.forEach(function (it, j) { at(t + 0.15 + j * 0.3, function () { it.classList.add('is-on'); }); });
    t += 0.15 + items.length * 0.3 + 0.2;
    at(t, function () { ca.classList.add('is-on'); });
    t += 0.3; at(t, function () { on('xh-done'); });
    if (LOOP) {
      at(t + HOLD, function () { on('xh-fade'); });
      at(t + HOLD + 0.55, function () { restart = true; });
    }
    tl.sort(function (a, b) { return a.t - b.t; });
  }
  function frame() {
    if (paused) return;
    var now = performance.now();
    if (!t0) t0 = now - startAt * 1000;
    var t = (now - t0) / 1000, going = false;
    for (var i = 0; i < tl.length; i++) {
      var e = tl[i]; if (e.d) continue; going = true;
      if (t >= e.t) { e.d = 1; e.fn(); } else break;
    }
    if (restart) { restart = false; start(true); return; }
    if (going) raf = requestAnimationFrame(frame); else state = 'done';
  }
  var startAt = 0;
  function start(again_, from) {
    if (reduce) { showFinal(); return; }
    reset(); build(); on('xh-run');
    startAt = from || 0; t0 = 0; paused = false; state = 'play';
    raf = requestAnimationFrame(frame);
    if (!again_) userPaused = false;
    apply();
  }
  function play() { start(false, 0); }
  function prime() { if (reduce) { showFinal(); return; } reset(); state = 'primed'; }
  function pause() { if (paused || state !== 'play') return; paused = true; cancelAnimationFrame(raf); pauseAt = performance.now(); on('xh-frozen'); }
  function resume() { if (!paused) return; paused = false; root.classList.remove('xh-frozen'); if (t0) t0 += performance.now() - pauseAt; raf = requestAnimationFrame(frame); }
  function ui() {
    root.classList.toggle('xh-upaused', userPaused);
    if (pz) { pz.setAttribute('aria-pressed', userPaused ? 'true' : 'false'); pz.setAttribute('aria-label', userPaused ? "Reprendre l'animation" : "Mettre l'animation en pause"); }
  }
  function apply() { if (inView && docVisible && !userPaused) resume(); else pause(); ui(); }
  function toggle() { if (state !== 'play') return; userPaused = !userPaused; apply(); }
  function setVisible(v) { inView = !!v; apply(); }
  function onVis() { docVisible = !document.hidden; apply(); }
  function showFinal() {
    cancelAnimationFrame(raf); tl = []; paused = false; state = 'final';
    root.classList.add('xh-noanim');
    root.classList.remove('xh-fade', 'xh-frozen', 's-press', 's-ov', 's-calc', 's-out');
    ['xh-final', 'xh-done', 's-type', 's-found', 's-ready', 's-res'].forEach(on);
    secFinal();
    items.concat([nh, ca]).forEach(function (e) { if (e) e.classList.add('is-on'); });
    if (inp) inp.classList.remove('is-focus');
    if (sv) sv.textContent = SIRET;
    if (ps) ps.textContent = MSG.calc;
    setFlow(3); setProg(N); setScore(SCORE);
    void root.offsetWidth; root.classList.remove('xh-noanim');
    userPaused = false; ui();
  }
  var lastW = window.innerWidth;
  function onResize() {
    if (window.innerWidth === lastW) return; lastW = window.innerWidth;
    if (state === 'play' && mq.matches !== M) start(true);
  }
  root.classList.add('xh-js');
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  if (opts.bindButton !== false) { if (again) again.addEventListener('click', play); if (pz) pz.addEventListener('click', toggle); }
  return {
    play: play, replay: play, prime: prime, final: showFinal, toggle: toggle, setVisible: setVisible,
    info: function () { return { state: state, t: t0 ? ((paused ? pauseAt : performance.now()) - t0) / 1000 : 0, paused: paused, userPaused: userPaused }; },
    destroy: function () { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); }
  };
}
export function xhWatch(root, api) {
  if (!root || !api) return null;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { api.final(); return null; }
  if (!('IntersectionObserver' in window)) { api.play(); return null; }
  var started = false;
  api.prime();
  // un en-tête fixe masque le haut de l'écran : la zone utile commence sous lui
  var hd = document.querySelector('header'), top = 0;
  if (hd) { var ps = getComputedStyle(hd).position; if (ps === 'sticky' || ps === 'fixed') top = Math.round(hd.getBoundingClientRect().height); }
  var io = new IntersectionObserver(function (es) {
    var e = es[0], vis = e.isIntersecting ? e.intersectionRect.height : 0, full = Math.min(e.boundingClientRect.height, window.innerHeight - top);
    if (!started) { if (vis >= full * .9) { started = true; api.setVisible(true); api.play(); } return; }
    if (vis < full * .35) api.setVisible(false); else if (vis >= full * .7) api.setVisible(true);
  }, { rootMargin: '-' + top + 'px 0px 0px 0px', threshold: [0, .1, .2, .3, .35, .4, .5, .6, .7, .8, .85, .9, .95, 1] });
  io.observe(root);
  return io;
}

(function(){
  var t0=Date.now();
  function done(){ var st=document.getElementById('md-static'); if(st) st.remove(); var c=document.getElementById('md-static-css'); if(c) c.remove(); }
  function fallback(){
    var r=document.getElementById('dc-root'); if(r) r.remove();
    var x=document.querySelector('x-dc'); if(x) x.remove();
    var st=document.getElementById('md-static'); if(!st) return;
    var root=st.querySelector('.xh'); if(root && !root.xh){ var api=xhEngine(root); root.xh=api; xhWatch(root, api); }
  }
  (function poll(){
    if(document.querySelector('#dc-root h1')) return done();
    if(Date.now()-t0>3000) return fallback();
    setTimeout(poll,40);
  })();
})();
