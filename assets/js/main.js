/* ==========================================================================
   Ashish Shajan — Portfolio interactions
   Plain JavaScript, no libraries. Each feature is a small self-contained block.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  window.__portfolioReady = true;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Theme toggle (dark / light, remembered per visitor) ---------- */
  var themeBtn = document.querySelector('[data-theme-toggle]');
  function syncThemeLabel() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (themeBtn) themeBtn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }
  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeLabel();
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  }

  /* ---------- Navigation: scrolled state, progress bar, mobile menu ---------- */
  var nav = document.querySelector('[data-nav]');
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    mobileMenu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
  }

  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 8);
    root.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Highlight the nav link of the section in view ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var link = byId[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- Reveal elements as they scroll into view ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    // stagger siblings that appear together (cards in a grid)
    reveals.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); });
      var i = siblings.indexOf(el);
      if (siblings.length > 1 && i > 0) el.style.setProperty('--delay', Math.min(i, 6) * 0.06 + 's');
    });
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Lightbox for project images ---------- */
  var lb = document.querySelector('[data-lightbox]');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('.lightbox__img');
    var lbText = lb.querySelector('.lightbox__text');
    var lbCount = lb.querySelector('.lightbox__count');
    var group = [];
    var index = 0;

    function show(i) {
      index = (i + group.length) % group.length;
      var btn = group[index];
      var img = btn.querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbText.textContent = btn.getAttribute('data-caption') || img.alt;
      lbCount.textContent = group.length > 1 ? (index + 1) + ' / ' + group.length : '';
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gallery]');
      if (!btn) return;
      var name = btn.getAttribute('data-gallery');
      group = Array.prototype.slice.call(document.querySelectorAll('[data-gallery="' + name + '"]'));
      lb.classList.toggle('is-single', group.length < 2);
      show(group.indexOf(btn));
      lb.showModal();
      document.body.style.overflow = 'hidden';
    });

    lb.querySelector('[data-lb-close]').addEventListener('click', function () { lb.close(); });
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(index - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(index + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    lb.addEventListener('close', function () { document.body.style.overflow = ''; });

    // swipe on touch screens
    var touchX = null;
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ---------- Project videos: play only while on screen ---------- */
  var videos = document.querySelectorAll('.media video');
  if (videos.length) {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      videos.forEach(function (v) { v.controls = true; v.preload = 'metadata'; });
    } else {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.35 });
      videos.forEach(function (v) { videoObserver.observe(v); });
    }
  }

  /* ---------- Copy email to clipboard ---------- */
  var toast = document.querySelector('[data-toast]');
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('is-copied');
        showToast('Email copied to clipboard');
        setTimeout(function () { btn.classList.remove('is-copied'); }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(done, function () { window.location.href = 'mailto:' + value; });
      } else {
        window.location.href = 'mailto:' + value;
      }
    });
  });

  /* ---------- Footer: year and live Kerala time ---------- */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  var clockEl = document.querySelector('[data-clock]');
  if (clockEl) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
    } catch (e) { fmt = null; }
    var tick = function () { if (fmt) clockEl.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ==========================================================================
     Hero background: a simulated 2D LiDAR sweep.
     A virtual room (walls, crates, pillars) is ray-cast from a scanner origin,
     producing a point cloud. A rotating beam lights points as it passes,
     then they fade to a faint "map" — like SLAM in RViz.
     ========================================================================== */
  var canvas = document.querySelector('[data-lidar]');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var dpr = 1, W = 0, H = 0, origin = { x: 0, y: 0 };
    var points = [];
    var sweep = 0;
    var running = false;
    var visible = true;
    var lastT = 0;
    var colors = {};

    var RAYS = 900;
    var TWO_PI = Math.PI * 2;
    var SPEED = 0.55;     // radians per second
    var TRAIL = 2.3;      // radians of afterglow behind the beam

    function readColors() {
      var cs = getComputedStyle(root);
      colors.accent = cs.getPropertyValue('--accent').trim() || '#ffffff';
      colors.dim = cs.getPropertyValue('--scan-dim').trim() || 'rgba(237,238,240,.16)';
    }

    // deterministic random so the "room" is the same on every visit
    function rng(seed) {
      return function () {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function buildScene() {
      var rand = rng(480);
      var segs = [];
      var circles = [];
      var addRect = function (x, y, w, h, gaps) {
        var pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        for (var i = 0; i < 4; i++) {
          var a = pts[i], b = pts[(i + 1) % 4];
          if (gaps && gaps[i]) {
            // leave a doorway in this wall: split at fractions [g0, g1]
            var g = gaps[i];
            segs.push([a[0], a[1], a[0] + (b[0] - a[0]) * g[0], a[1] + (b[1] - a[1]) * g[0]]);
            segs.push([a[0] + (b[0] - a[0]) * g[1], a[1] + (b[1] - a[1]) * g[1], b[0], b[1]]);
          } else {
            segs.push([a[0], a[1], b[0], b[1]]);
          }
        }
      };

      // outer building + inner room with doorways
      addRect(W * 0.02, H * 0.04, W * 0.96, H * 0.92);
      addRect(W * 0.34, H * 0.1, W * 0.6, H * 0.74, { 0: [0.18, 0.3], 2: [0.55, 0.7], 3: [0.3, 0.45] });

      // crates & shelves (kept away from the scanner)
      for (var i = 0; i < 9; i++) {
        var bw = W * (0.025 + rand() * 0.05);
        var bh = H * (0.04 + rand() * 0.08);
        var bx = W * (0.38 + rand() * 0.5);
        var by = H * (0.14 + rand() * 0.62);
        if (Math.hypot(bx + bw / 2 - origin.x, by + bh / 2 - origin.y) < Math.min(W, H) * 0.16) continue;
        addRect(bx, by, bw, bh);
      }
      // pillars
      for (var j = 0; j < 5; j++) {
        var cx = W * (0.1 + rand() * 0.85);
        var cy = H * (0.1 + rand() * 0.8);
        if (Math.hypot(cx - origin.x, cy - origin.y) < Math.min(W, H) * 0.18) continue;
        circles.push([cx, cy, Math.min(W, H) * (0.008 + rand() * 0.012)]);
      }

      // ray-cast
      points = [];
      var maxR = Math.hypot(W, H);
      for (var r = 0; r < RAYS; r++) {
        var ang = (r / RAYS) * TWO_PI;
        var dx = Math.cos(ang), dy = Math.sin(ang);
        var best = maxR;
        for (var s = 0; s < segs.length; s++) {
          var sg = segs[s];
          var ex = sg[2] - sg[0], ey = sg[3] - sg[1];
          var den = dx * ey - dy * ex;
          if (Math.abs(den) < 1e-9) continue;
          var qx = sg[0] - origin.x, qy = sg[1] - origin.y;
          var t = (qx * ey - qy * ex) / den;
          var u = (qx * dy - qy * dx) / den;
          if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
        }
        for (var c = 0; c < circles.length; c++) {
          var cc = circles[c];
          var ox = origin.x - cc[0], oy = origin.y - cc[1];
          var b = ox * dx + oy * dy;
          var disc = b * b - (ox * ox + oy * oy - cc[2] * cc[2]);
          if (disc >= 0) {
            var tc = -b - Math.sqrt(disc);
            if (tc > 0 && tc < best) best = tc;
          }
        }
        if (best < maxR) {
          var noise = (rand() - 0.5) * 2.2;
          points.push({ a: ang, x: origin.x + dx * (best + noise), y: origin.y + dy * (best + noise), d: best });
        }
      }
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // the scanner sits behind the portrait, as if the camera were the robot
      var portrait = hero.querySelector('.portrait__frame');
      if (portrait) {
        var p = portrait.getBoundingClientRect();
        origin.x = p.left - rect.left + p.width / 2;
        origin.y = p.top - rect.top + p.height / 2;
      } else {
        origin.x = W * 0.75; origin.y = H * 0.4;
      }
      hero.style.setProperty('--scan-x', (origin.x / W * 100).toFixed(1) + '%');
      hero.style.setProperty('--scan-y', (origin.y / H * 100).toFixed(1) + '%');
      buildScene();
      if (!running) draw(0);
    }

    function draw(dt) {
      sweep = (sweep + dt * SPEED) % TWO_PI;
      ctx.clearRect(0, 0, W, H);

      // range rings
      ctx.strokeStyle = colors.dim;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      for (var k = 1; k <= 4; k++) {
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, k * Math.min(W, H) * 0.16, 0, TWO_PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // beam wedge
      if (!reduceMotion.matches) {
        var grad = ctx.createConicGradient ? ctx.createConicGradient(sweep - TRAIL * 0.35, origin.x, origin.y) : null;
        if (grad) {
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(TRAIL * 0.35 / TWO_PI, colors.accent);
          grad.addColorStop(TRAIL * 0.35 / TWO_PI + 0.0001, 'rgba(0,0,0,0)');
          ctx.globalAlpha = root.getAttribute('data-theme') === 'light' ? 0.035 : 0.08;
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
        }
      }

      // points: faint map + bright afterglow behind the beam
      for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        var behind = reduceMotion.matches ? TRAIL : (sweep - pt.a + TWO_PI) % TWO_PI;
        var glow = behind < TRAIL ? 1 - behind / TRAIL : 0;
        if (glow > 0) {
          ctx.globalAlpha = 0.15 + glow * 0.85;
          ctx.fillStyle = colors.accent;
          ctx.fillRect(pt.x - 1.2, pt.y - 1.2, 2.4, 2.4);
        } else {
          ctx.globalAlpha = 1;
          ctx.fillStyle = colors.dim;
          ctx.fillRect(pt.x - 0.9, pt.y - 0.9, 1.8, 1.8);
        }
      }
      ctx.globalAlpha = 1;

      // scanner origin
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, 3, 0, TWO_PI);
      ctx.fill();
    }

    function frame(t) {
      if (!running) return;
      var dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0;
      lastT = t;
      draw(dt);
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduceMotion.matches || !visible || document.hidden) return;
      running = true; lastT = 0;
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    readColors();
    resize();
    start();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });
    document.addEventListener('themechange', function () { readColors(); if (!running) draw(0); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(hero);
    }
    reduceMotion.addEventListener && reduceMotion.addEventListener('change', function () {
      reduceMotion.matches ? (stop(), draw(0)) : start();
    });
    // fonts can shift layout once loaded — re-measure the portrait position
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  }
})();
