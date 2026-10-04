(function () {
  'use strict';

  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasTHREE = typeof window.THREE !== 'undefined';
  var loader = $('#loader');

  function hideLoader() { if (loader) loader.classList.add('done'); }
  window.addEventListener('load', function () { setTimeout(hideLoader, 300); });
  setTimeout(hideLoader, 4000);

  if (hasST) { try { gsap.registerPlugin(ScrollTrigger); } catch (e) { hasST = false; } }

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    doc.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Waitlist ---------- */
  $('#wait').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#email').value.trim(), m = $('#wmsg');
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { m.textContent = 'Thank you. You are on the conceptual waitlist.'; $('#email').value = ''; }
    else { m.textContent = 'Enter a valid email address.'; }
  });

  /* ---------- Scene state (driven by scroll) ---------- */
  var states = {
    hero:     { x: 0,    y: 0.15, ym: 0.6, s: 1,    ry: 0 },
    frame:    { x: 0.5,  y: 0,    ym: 1.2, s: 0.72, ry: 0 },
    eyes:     { x: -0.5, y: 0,    ym: 1.2, s: 0.7,  ry: -0.9 },
    movement: { x: 0.5,  y: 0,    ym: 1.2, s: 0.7,  ry: 0.5 },
    analysis: { x: -0.5, y: 0,    ym: 1.2, s: 0.7,  ry: -0.9 },
    alert:    { x: 0.5,  y: 0,    ym: 1.2, s: 0.7,  ry: 0.5 },
    join:     { x: 0,    y: 2.0,  ym: 1.3, s: 0.5,  ry: 0 }
  };
  var cur = { x: 0, y: 0.15, ym: 0.6, s: 1, ry: 0, show: 0 };
  var active = 'hero';

  function activate(id) {
    if (!states[id] || id === active && cur.init) return;
    active = id; cur.init = true;
    $$('#menu a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-s') === id); });
    var t = states[id], show = (id === 'hero' || id === 'frame') ? 1 : 0;
    if (hasGSAP && !reduce) {
      gsap.to(cur, { x: t.x, y: t.y, ym: t.ym, s: t.s, ry: t.ry, show: show, duration: 2.4, ease: 'power2.inOut', overwrite: true });
    } else {
      cur.x = t.x; cur.y = t.y; cur.ym = t.ym; cur.s = t.s; cur.ry = t.ry; cur.show = show;
    }
  }
  cur.show = 1;

  $$('main section[data-state]').forEach(function (sec) {
    var id = sec.getAttribute('data-state');
    if (hasST) {
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) { if (self.isActive) activate(id); } });
    }
  });
  if (!hasST && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) activate(x.target.getAttribute('data-state')); });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('main section[data-state]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- Text reveals & hero entrance ---------- */
  if (hasST && !reduce) {
    try {
      $$('.rv').forEach(function (el) {
        gsap.from(el, { opacity: 0, y: 26, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });
      gsap.from('.hero-copy > *', { opacity: 0, y: 30, duration: 1.8, ease: 'power3.out', stagger: 0.18, delay: 0.8 });
      gsap.from('.hint', { opacity: 0, duration: 1.6, delay: 2 });
    } catch (e) { /* content stays visible */ }
  }

  /* ---------- Waveforms (lightweight SVG) ---------- */
  var w1 = $('.w1'), w2 = $('.w2'), frameN = 0;
  function waves(t) {
    if (!w1 || !w2) return;
    var a = '', b = '', i, x;
    for (i = 0; i <= 60; i++) {
      x = i * 5;
      a += (i ? 'L' : 'M') + x + ' ' + (20 + Math.sin(i * 0.28 + t * 1.6) * 8 * Math.sin(i * 0.05 + t * 0.4) + Math.sin(i * 0.9 + t * 3) * 2).toFixed(1);
      b += (i ? 'L' : 'M') + x + ' ' + (20 + Math.sin(i * 0.16 - t * 1.1) * 10 * Math.cos(i * 0.04 + t * 0.3)).toFixed(1);
    }
    w1.setAttribute('d', a); w2.setAttribute('d', b);
  }
  waves(0);

  /* ---------- WebGL glasses ---------- */
  var canvas = $('#gl'), svg = $('#callouts');
  var stage = $('#stage');
  function noGL() { stage.classList.add('no-gl'); doc.body.classList.add('no-gl'); hideLoader(); }
  if (!hasTHREE) { noGL(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) { noGL(); return; }
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); noGL(); });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var scene = new THREE.Scene();
  var FOV = 35, CAMZ = 9;
  var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAMZ);

  /* studio reflections: soft boxes baked into an environment map */
  try {
    var envScene = new THREE.Scene();
    var boxes = [[0, 6, 2, 8, 0.3, 4, 5], [-7, 1, 3, 0.3, 5, 5, 3], [7, 0, -2, 0.3, 4, 6, 4], [0, -3, 6, 7, 0.3, 3, 1.2], [0, 1, -8, 8, 4, 0.3, 2]];
    boxes.forEach(function (b) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[4], b[5]), new THREE.MeshBasicMaterial({ color: new THREE.Color(b[6], b[6], b[6]) }));
      m.position.set(b[0], b[1], b[2]); envScene.add(m);
    });
    var pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(envScene, 0.04).texture;
    pm.dispose();
  } catch (e2) { /* lights below still work */ }

  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.5));
  var key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(3, 5, 6); scene.add(key);
  var rimA = new THREE.DirectionalLight(0xcfe9d6, 1.6); rimA.position.set(-6, 2, -5); scene.add(rimA);
  var rimB = new THREE.DirectionalLight(0xffffff, 1.2); rimB.position.set(6, 1, -4); scene.add(rimB);

  /* ----- geometry helpers ----- */
  function rrShape(w, h, r) {
    var s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  var glasses = new THREE.Group();   // rotated by interaction
  var model = new THREE.Group();     // scaled by scroll
  glasses.add(model); scene.add(glasses);
  function buildGlasses(model) {
  var matFront = new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 });
  var matTi = new THREE.MeshStandardMaterial({ color: 0x4a4e52, roughness: 0.28, metalness: 1 });
  var matDark = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4, metalness: 0.6 });
  var matLens = new THREE.MeshPhysicalMaterial({ color: 0x9fb9b0, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 });
  var matGlow = new THREE.MeshBasicMaterial({ color: 0x9be0a8 });
  var matPad = new THREE.MeshPhysicalMaterial({ color: 0xcfd6d0, roughness: 0.3, transparent: true, opacity: 0.55 });

  /* rounded polygon -> Shape (corner radius per vertex) */
  function roundPoly(pts, r, shape) {
    var s = shape || new THREE.Shape(), n = pts.length, k;
    for (k = 0; k < n; k++) {
      var c = pts[k], p = pts[(k + n - 1) % n], q = pts[(k + 1) % n];
      var v1 = new THREE.Vector2(p[0] - c[0], p[1] - c[1]), v2 = new THREE.Vector2(q[0] - c[0], q[1] - c[1]);
      var rr = Math.min(Array.isArray(r) ? r[k] : r, v1.length() * 0.5, v2.length() * 0.5);
      v1.normalize().multiplyScalar(rr); v2.normalize().multiplyScalar(rr);
      if (k === 0) s.moveTo(c[0] + v1.x, c[1] + v1.y); else s.lineTo(c[0] + v1.x, c[1] + v1.y);
      s.quadraticCurveTo(c[0], c[1], c[0] + v2.x, c[1] + v2.y);
    }
    s.closePath();
    return s;
  }
  function mir(pts) { return pts.map(function (p) { return [-p[0], p[1]]; }).reverse(); }

  /* ---- one-piece acetate front: thick brow, thin lower rim, keyhole bridge ---- */
  var outerPts = [[-1.95, 0.56], [1.95, 0.56], [1.8, -0.46], [0.36, -0.46], [0.3, 0.04], [-0.3, 0.04], [-0.36, -0.46], [-1.8, -0.46]];
  var front = roundPoly(outerPts, [0.1, 0.1, 0.1, 0.06, 0.08, 0.08, 0.06, 0.1]);
  var lensPtsL = [[-1.78, 0.36], [-0.55, 0.36], [-0.62, -0.37], [-1.66, -0.37]];
  var lensPtsR = mir(lensPtsL);
  front.holes.push(roundPoly(lensPtsL, 0.07, new THREE.Path()));
  front.holes.push(roundPoly(lensPtsR, 0.07, new THREE.Path()));
  var fg = new THREE.ExtrudeGeometry(front, { depth: 0.24, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 10 });
  fg.translate(0, 0, -0.12);
  model.add(new THREE.Mesh(fg, matFront));

  /* clear lenses */
  [lensPtsL, lensPtsR].forEach(function (pts) {
    var lg = new THREE.ShapeGeometry(roundPoly(pts.map(function (p) { return [p[0] * 1.01, p[1] * 1.03]; }), 0.07), 8);
    var lm = new THREE.Mesh(lg, matLens); lm.position.z = 0.0; model.add(lm);
  });

  /* ---- wide flat acetate temples with tapered, curved tips ---- */
  var tProfile = [[0, 0.2], [1.7, 0.2], [2.45, -0.04], [2.98, -0.5], [2.86, -0.6], [2.3, -0.27], [1.7, -0.1], [1.2, -0.1], [0, -0.16]];
  var tg = new THREE.ExtrudeGeometry(roundPoly(tProfile, 0.05), { depth: 0.1, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 8 });
  tg.translate(0, 0, -0.05);
  [-1, 1].forEach(function (sd) {
    var t = new THREE.Mesh(tg, matFront);
    t.rotation.y = Math.PI / 2; t.position.set(sd * 1.9, 0.32, -0.2); model.add(t);

    /* end piece blocks bridging front and temple */
    var ep = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.3), matFront);
    ep.position.set(sd * 1.92, 0.34, -0.06); model.add(ep);
    /* hinge barrel */
    var hg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 14), matTi);
    hg.position.set(sd * 1.85, 0.34, -0.2); model.add(hg);

    /* inward-facing camera module on lower inner rim */
    var cam = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.05, 20), matDark);
    body.rotation.x = Math.PI / 2; cam.add(body);
    var lensC = new THREE.Mesh(new THREE.CircleGeometry(0.017, 14), matGlow);
    lensC.position.z = -0.027; lensC.rotation.y = Math.PI; cam.add(lensC);
    cam.position.set(sd * 0.7, -0.415, -0.16); model.add(cam);

    /* integral nose pad */
    var pad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 14), matPad);
    pad.scale.set(0.5, 1.35, 0.4); pad.position.set(sd * 0.3, -0.2, -0.2); pad.rotation.z = sd * 0.2; model.add(pad);
    var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), matTi);
    arm.position.set(sd * 0.31, -0.06, -0.14); arm.rotation.x = 0.7; model.add(arm);
  });

  /* temple details: plain metal plaque, IMU, battery cell, radio */
  function plate(x, y, z, sx, sy, sz, mat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); model.add(m); return m;
  }
  plate(1.965, 0.36, -0.5, 0.012, 0.11, 0.3, new THREE.MeshStandardMaterial({ color: 0xe2e2e2, roughness: 0.18, metalness: 1 }));
  plate(1.965, 0.36, -1.15, 0.012, 0.09, 0.22, matDark);      // IMU
  plate(-1.965, 0.35, -1.7, 0.012, 0.15, 0.7, matDark);       // battery
  plate(1.965, 0.33, -1.95, 0.012, 0.05, 0.1, matGlow);       // BLE

  }
  buildGlasses(model);

  /* centre the model on its visual middle (front + temples) */
  model.position.z = 0.9;

  /* ----- particles (small, cheap) ----- */
  var pn = 110, pp = new Float32Array(pn * 3), i;
  for (i = 0; i < pn; i++) { pp[i * 3] = (Math.random() - 0.5) * 22; pp[i * 3 + 1] = (Math.random() - 0.5) * 12; pp[i * 3 + 2] = -3 - Math.random() * 6; }
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  var particles = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xbfc8c0, size: 0.03, transparent: true, opacity: 0.35, depthWrite: false }));
  scene.add(particles); particles.visible = false;

  /* ----- feature tour: glasses turn to face each part, a leader line draws in and the part is highlighted ----- */
  var DIR = -1;                 // spin direction for auto-rotate, tour and scroll. Set to 1 to reverse everything.
  var TWO = Math.PI * 2;
  var NS = 'http://www.w3.org/2000/svg';
  var defs = [
    { t: 'TITANIUM FRAME',      s: 'Aerospace-grade, 28 g',            p: [1.99, 0.42, -0.1],  n: [0.7, 0, 0.7], off: 20,  dy: -80 },
    { t: 'MOTION IMU',          s: 'Head movement and balance',        p: [1.97, 0.36, -1.15], n: [1, 0, 0], off: 30,  dy: 70 },
    { t: 'BLUETOOTH LE 5.3',    s: 'Low-energy link to your phone',    p: [1.97, 0.33, -1.95], n: [1, 0, 0], off: 10,  dy: -70 },
    { t: 'ADAPTIVE NOSEPADS',   s: 'Comfort fit, steady sensing',      p: [-0.3, -0.2, -0.24], n: [0, 0, -1], off: 15,  dy: 80 },
    { t: 'DUAL INWARD CAMERAS', s: 'Observe eye movement (concept)',   p: [-0.7, -0.415, -0.2], n: [0, 0, -1], off: -20, dy: -80 },
    { t: '18 HR BATTERY',       s: 'Continuous sensing (proposed)',    p: [-1.97, 0.35, -1.7], n: [-1, 0, 0], off: -25, dy: -70 }
  ];
  var haloCv = doc.createElement('canvas'); haloCv.width = haloCv.height = 64;
  var hx = haloCv.getContext('2d'), hgr = hx.createRadialGradient(32, 32, 0, 32, 32, 32);
  hgr.addColorStop(0, 'rgba(155,224,168,1)'); hgr.addColorStop(0.35, 'rgba(155,224,168,.35)'); hgr.addColorStop(1, 'rgba(155,224,168,0)');
  hx.fillStyle = hgr; hx.fillRect(0, 0, 64, 64);
  var haloTex = new THREE.CanvasTexture(haloCv);

  defs.forEach(function (d) {
    function mk(tag, cls) { var e = doc.createElementNS(NS, tag); if (cls) e.setAttribute('class', cls); svg.appendChild(e); return e; }
    d.line = mk('line'); d.ringEl = mk('circle', 'ring'); d.dot = mk('circle'); d.tx = mk('text'); d.ds = mk('text', 'ds');
    d.dot.setAttribute('r', '3'); d.tx.textContent = d.t; d.ds.textContent = d.s;
    d.a = 0;
    d.pv = new THREE.Vector3(d.p[0], d.p[1], d.p[2]);
    d.nv = new THREE.Vector3(d.n[0], d.n[1], d.n[2]).normalize();
    d.theta = d.off * Math.PI / 180 - Math.atan2(d.nv.x, d.nv.z);
    d.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    d.halo.position.copy(d.pv).addScaledVector(d.nv, 0.06);
    model.add(d.halo);
  });
  var _w = new THREE.Vector3(), _n = new THREE.Vector3(), _c = new THREE.Vector3(), _p = new THREE.Vector3();

  var rotY = -0.55, vel = 0, dragging = false, lastX = 0, idleAt = 0;
  var autoSpeed = reduce ? 0 : 0.0042;
  var tour = { on: false, idx: 0, target: null, dwell: 0, force: null, started: false };

  var rail = doc.createElement('ul'); rail.className = 'rail'; rail.setAttribute('aria-label', 'Feature tour');
  defs.forEach(function (d, i) {
    var li = doc.createElement('li'), b = doc.createElement('button');
    b.type = 'button'; b.textContent = d.t;
    b.addEventListener('click', function () { tour.force = i; tour.started = true; idleAt = 0; });
    li.appendChild(b); rail.appendChild(li); d.btn = b;
  });
  stage.appendChild(rail);
  function setRail(i) { defs.forEach(function (d, j) { d.btn.classList.toggle('on', j === i); }); }

  function targetFor(i) {
    var tot = rotY + cur.ry;
    var dd = ((((defs[i].theta - tot) * DIR) % TWO) + TWO) % TWO;
    return tot + dd * DIR;
  }
  function pickFeature() {
    var tot = rotY + cur.ry, best = 0, bd = 1e9, i, dd;
    if (tour.force !== null) { best = tour.force; tour.force = null; }
    else {
      for (i = 0; i < defs.length; i++) {
        dd = ((((defs[i].theta - tot) * DIR) % TWO) + TWO) % TWO;
        if (dd < bd) { bd = dd; best = i; }
      }
    }
    tour.idx = best; tour.target = targetFor(best); tour.dwell = 0; setRail(best);
  }

  /* ----- interaction: drag to rotate (grab-style), inertia, idle auto-tour ----- */
  var hintEl = $('#hint');
  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX; vel = 0; canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    if (hintEl) hintEl.style.opacity = 0;
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX; lastX = e.clientX;
    rotY += dx * 0.009; vel = dx * 0.009;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false; canvas.classList.remove('drag');
    try { canvas.releasePointerCapture(e.pointerId); } catch (x) {}
    idleAt = performance.now() + 2200;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  var W = 1, H = 1;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  var last = performance.now(), running = true, reveal = { v: reduce || !hasGSAP ? 1 : 0 };
  if (hasGSAP && !reduce) {
    gsap.to(reveal, { v: 1, duration: 2.6, ease: 'power2.out', delay: 0.4 });
    gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 2.4, delay: 0.5, ease: 'power1.out' });
  }
  doc.addEventListener('visibilitychange', function () { running = !doc.hidden; last = performance.now(); });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!running) return;
    var dt = Math.min((now - last) / 16.67, 3); last = now;
    var mobile = W < 900, j, d;

    if (dragging) { tour.on = false; tour.target = null; tour.dwell = 0; }
    else {
      var canTour = cur.show > 0.5 && now > idleAt && (!reduce || tour.started);
      if (canTour) {
        if (!tour.on) { tour.on = true; tour.target = null; }
        if (tour.target === null || tour.force !== null) pickFeature();
        var diff = tour.target - cur.ry - rotY;
        vel += (diff * 0.0005 - vel * 0.045) * dt;
        rotY += vel * dt;
        if (!tour.dwell && Math.abs(diff) < 0.03 && Math.abs(vel) < 0.0015) tour.dwell = now + 3400;
        if (tour.dwell && now > tour.dwell) {
          tour.idx = (tour.idx + 1) % defs.length; tour.dwell = 0; tour.target = targetFor(tour.idx); setRail(tour.idx);
        }
      } else {
        tour.on = false; tour.target = null; tour.dwell = 0;
        var target = now > idleAt ? DIR * autoSpeed : 0;
        vel += (target - vel) * (target ? 0.03 : 0.06) * dt;
        rotY += vel * dt;
      }
    }

    var wv = 2 * Math.tan(FOV * Math.PI / 360) * CAMZ * camera.aspect;
    var sc = (mobile ? 0.8 : 0.5) * wv / 3.9 * cur.s * (0.82 + 0.18 * reveal.v);
    glasses.scale.setScalar(sc);
    glasses.position.x = mobile ? 0 : cur.x * wv / 2;
    glasses.position.y = (mobile ? cur.ym : cur.y) + Math.sin(now * 0.0006) * 0.05;
    glasses.rotation.y = rotY + cur.ry;
    glasses.rotation.x = 0.1 + Math.sin(now * 0.0004) * 0.02;
    particles.rotation.y += 0.0003 * dt;

    frameN++;
    if (frameN % 2 === 0) waves(now * 0.001);
    rail.style.opacity = (mobile ? 0 : cur.show).toFixed(2);
    rail.style.pointerEvents = (!mobile && cur.show > 0.5) ? 'auto' : 'none';

    glasses.updateMatrixWorld(true);
    var vis = (!mobile && cur.show > 0.01);
    var pulse = (now * 0.0009) % 1;
    if (vis) {
      _c.copy(camera.position);
      var fs = [];
      for (j = 0; j < defs.length; j++) {
        d = defs[j];
        _w.copy(d.pv).applyMatrix4(model.matrixWorld);
        _n.copy(d.nv).transformDirection(model.matrixWorld);
        d.f = _n.dot(_p.copy(_c).sub(_w).normalize());
        d.w = _w.clone(); fs.push(d.f);
      }
      fs.sort(function (a, b) { return b - a; });
      var thr = Math.max(fs[2], 0.28);
      for (j = 0; j < defs.length; j++) {
        d = defs[j];
        var isAct = tour.on && j === tour.idx;
        var want = tour.on ? (isAct ? Math.min(Math.max((d.f - 0.25) / 0.4, 0), 1) * cur.show : 0)
                           : (d.f >= thr ? Math.min((d.f - 0.28) / 0.35, 1) * cur.show : 0);
        d.a += (want - d.a) * 0.07 * dt;
        _p.copy(d.w).project(camera);
        var sx = (_p.x * 0.5 + 0.5) * W, sy = (-_p.y * 0.5 + 0.5) * H;
        var dir = sx < W / 2 ? -1 : 1;
        var lx = dir > 0 ? Math.min(sx + dir * 130, W - 230) : Math.max(sx + dir * 130, 230), ly = sy + d.dy;
        var ex = sx + (lx - sx) * d.a, ey = sy + (ly - sy) * d.a;
        d.line.setAttribute('x1', sx); d.line.setAttribute('y1', sy); d.line.setAttribute('x2', ex); d.line.setAttribute('y2', ey);
        d.dot.setAttribute('cx', sx); d.dot.setAttribute('cy', sy);
        d.ringEl.setAttribute('cx', sx); d.ringEl.setAttribute('cy', sy); d.ringEl.setAttribute('r', (5 + pulse * 18).toFixed(1));
        var anc = dir > 0 ? 'start' : 'end', tx = lx + dir * 8;
        d.tx.setAttribute('x', tx); d.tx.setAttribute('y', ly + 4); d.tx.setAttribute('text-anchor', anc);
        d.ds.setAttribute('x', tx); d.ds.setAttribute('y', ly + 21); d.ds.setAttribute('text-anchor', anc);
        var ta = Math.max(0, (d.a - 0.5) * 2);
        d.line.style.opacity = Math.min(1, d.a * 2) * 0.7; d.dot.style.opacity = Math.min(1, d.a * 3);
        d.tx.style.opacity = ta; d.ds.style.opacity = ta * 0.8;
        d.ringEl.style.opacity = isAct ? (1 - pulse) * d.a : 0;
        d.halo.material.opacity = isAct ? d.a * (0.75 - pulse * 0.35) : 0;
        d.halo.scale.setScalar(0.4 + pulse * 0.25);
      }
    } else {
      for (j = 0; j < defs.length; j++) {
        d = defs[j]; d.a = 0;
        d.line.style.opacity = 0; d.dot.style.opacity = 0; d.tx.style.opacity = 0; d.ds.style.opacity = 0; d.ringEl.style.opacity = 0; d.halo.material.opacity = 0;
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(frame);
  activate('hero');
})();