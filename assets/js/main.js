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

    var lbVideo = lb.querySelector('.lightbox__video');
    function show(i) {
      index = (i + group.length) % group.length;
      var item = group[index];
      var vid = item.querySelector('video');
      var img = item.querySelector('img');
      if (vid) {
        lbImg.hidden = true;
        lbVideo.hidden = false;
        lbVideo.src = vid.getAttribute('src');
        lbVideo.poster = vid.getAttribute('poster') || '';
        lbVideo.muted = false;
        var pr = lbVideo.play(); if (pr && pr.catch) pr.catch(function () {});
      } else {
        lbVideo.pause(); lbVideo.hidden = true; lbVideo.removeAttribute('src');
        lbImg.hidden = false;
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
      }
      lbText.textContent = item.getAttribute('data-caption') || (img && img.alt) || '';
      lbCount.textContent = group.length > 1 ? (index + 1) + ' / ' + group.length : '';
    }
    lb.querySelector('[data-lb-full]').addEventListener('click', function () {
      var el = lbVideo.hidden ? lbImg : lbVideo;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
    });
    lb.addEventListener('close', function () { lbVideo.pause(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = document.activeElement;
      if (t && t.matches('figure[data-gallery]')) { e.preventDefault(); t.click(); }
    });

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
     Hero: floating dust particles, a robot head that follows the cursor,
     and rounded panels that grow into place as they scroll in.
     ========================================================================== */
  var hero = document.querySelector('.hero');
  var dust = document.querySelector('[data-dust]');
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* Starfield: twinkling stars drift upward; near the cursor they are pushed
     away and linked with faint lines, like a constellation. */
  if (hero && dust && dust.getContext && !reduceMotion.matches) {
    var dctx = dust.getContext('2d');
    var stars = [], dW = 0, dH = 0, dRunning = false;
    var mouse = { x: -9999, y: -9999, active: false };
    var sizeDust = function () {
      var r = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      dW = r.width; dH = r.height;
      dust.width = Math.round(dW * dpr); dust.height = Math.round(dH * dpr);
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round(Math.min(140, (dW * dH) / 9000));
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * dW, y: Math.random() * dH, r: Math.random() * 1.2 + 0.3,
          vx: (Math.random() - 0.5) * 0.1, vy: -Math.random() * 0.16 - 0.03,
          a: Math.random() * 0.5 + 0.2, tw: Math.random() * Math.PI * 2, ox: 0, oy: 0 });
      }
    };
    var drawDust = function (t) {
      if (!dRunning) return;
      dctx.clearRect(0, 0, dW, dH);
      var R = 140, near = [];
      for (var i = 0; i < stars.length; i++) {
        var m = stars[i];
        m.x += m.vx; m.y += m.vy;
        if (m.y < -5) { m.y = dH + 5; m.x = Math.random() * dW; }
        if (m.x < -5) m.x = dW + 5; else if (m.x > dW + 5) m.x = -5;
        var tx = 0, ty = 0;
        if (mouse.active) {
          var dx = m.x - mouse.x, dy = m.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < R && d > 0.1) { var f = (1 - d / R) * 26; tx = dx / d * f; ty = dy / d * f; near.push(m); }
        }
        m.ox += (tx - m.ox) * 0.08; m.oy += (ty - m.oy) * 0.08;
        var alpha = m.a * (0.65 + 0.35 * Math.sin(t / 900 + m.tw));
        dctx.globalAlpha = alpha;
        dctx.fillStyle = '#ffffff';
        dctx.beginPath(); dctx.arc(m.x + m.ox, m.y + m.oy, m.r, 0, Math.PI * 2); dctx.fill();
      }
      if (near.length > 1) {
        dctx.strokeStyle = '#ffffff';
        dctx.lineWidth = 0.6;
        for (var p = 0; p < near.length; p++) {
          for (var q = p + 1; q < near.length; q++) {
            var A = near[p], B = near[q];
            var ax = A.x + A.ox, ay = A.y + A.oy, bx = B.x + B.ox, by = B.y + B.oy;
            var dd = Math.hypot(ax - bx, ay - by);
            if (dd < 90) {
              dctx.globalAlpha = (1 - dd / 90) * 0.25;
              dctx.beginPath(); dctx.moveTo(ax, ay); dctx.lineTo(bx, by); dctx.stroke();
            }
          }
        }
      }
      dctx.globalAlpha = 1;
      requestAnimationFrame(drawDust);
    };
    sizeDust();
    window.addEventListener('resize', sizeDust);
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    hero.addEventListener('pointerleave', function () { mouse.active = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !dRunning) { dRunning = true; requestAnimationFrame(drawDust); }
        if (!vis) dRunning = false;
      }).observe(hero);
    } else { dRunning = true; requestAnimationFrame(drawDust); }
  }

  /* Hero: soft light that follows the cursor + 3D tilt on the portrait */
  if (hero && finePointer && !reduceMotion.matches) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    var frame = hero.querySelector('.hero__portrait .portrait__frame');
    hero.addEventListener('pointermove', function (e) {
      glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      glow.classList.add('is-on');
      if (frame) {
        var r = frame.getBoundingClientRect();
        var px = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        var py = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        frame.style.transform = 'perspective(900px) rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' + (-py * 10).toFixed(2) + 'deg)';
      }
    });
    hero.addEventListener('pointerleave', function () {
      glow.classList.remove('is-on');
      if (frame) frame.style.transform = '';
    });
  }

  /* Magnetic buttons: they lean slightly toward the cursor */
  if (finePointer && !reduceMotion.matches) {
    document.querySelectorAll('.hero .btn, .contact__links .btn, .nav__resume').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });

    /* Cards tilt gently in 3D under the cursor */
    document.querySelectorAll('.core, .lead-card, .mini').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(800px) rotateY(' + (px * 6).toFixed(2) + 'deg) rotateX(' + (-py * 6).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  var head = document.querySelector('[data-robot-head]');
  if (hero && head && !reduceMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      head.style.transform = 'translate(' + (dx * 14).toFixed(1) + 'px,' + (dy * 8).toFixed(1) + 'px) rotate(' + (dx * 7).toFixed(2) + 'deg)';
    });
    hero.addEventListener('pointerleave', function () { head.style.transform = ''; });
  }

  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  if (panels.length && !reduceMotion.matches) {
    var panelTick = false;
    var updatePanels = function () {
      var vh = window.innerHeight;
      panels.forEach(function (p) {
        var top = p.getBoundingClientRect().top;
        var t = Math.min(Math.max((vh - top) / (vh * 0.55), 0), 1);
        p.style.setProperty('--panel-scale', (0.95 + 0.05 * t).toFixed(4));
      });
      panelTick = false;
    };
    window.addEventListener('scroll', function () {
      if (!panelTick) { panelTick = true; requestAnimationFrame(updatePanels); }
    }, { passive: true });
    window.addEventListener('resize', updatePanels);
    updatePanels();
  }
})();
