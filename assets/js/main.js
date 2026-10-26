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
     Hero: floating dust particles, a robot head that follows the cursor,
     and rounded panels that grow into place as they scroll in.
     ========================================================================== */
  var hero = document.querySelector('.hero');
  var dust = document.querySelector('[data-dust]');
  if (hero && dust && dust.getContext && !reduceMotion.matches) {
    var dctx = dust.getContext('2d');
    var motes = [], dW = 0, dH = 0, dRunning = false;
    var sizeDust = function () {
      var r = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      dW = r.width; dH = r.height;
      dust.width = Math.round(dW * dpr); dust.height = Math.round(dH * dpr);
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = [];
      var n = Math.round(Math.min(70, dW / 18));
      for (var i = 0; i < n; i++) {
        motes.push({ x: Math.random() * dW, y: Math.random() * dH, r: Math.random() * 1.3 + 0.3,
          vx: (Math.random() - 0.5) * 0.12, vy: -Math.random() * 0.18 - 0.03, a: Math.random() * 0.5 + 0.15 });
      }
    };
    var drawDust = function () {
      if (!dRunning) return;
      dctx.clearRect(0, 0, dW, dH);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx; m.y += m.vy;
        if (m.y < -5) { m.y = dH + 5; m.x = Math.random() * dW; }
        if (m.x < -5) m.x = dW + 5; else if (m.x > dW + 5) m.x = -5;
        dctx.globalAlpha = m.a;
        dctx.fillStyle = '#ffffff';
        dctx.beginPath(); dctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); dctx.fill();
      }
      requestAnimationFrame(drawDust);
    };
    sizeDust();
    window.addEventListener('resize', sizeDust);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !dRunning) { dRunning = true; requestAnimationFrame(drawDust); }
        if (!vis) dRunning = false;
      }).observe(hero);
    } else { dRunning = true; requestAnimationFrame(drawDust); }
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
