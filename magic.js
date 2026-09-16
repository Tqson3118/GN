/* magic.js - widget dùng chung: glitter theo con trỏ, đếm lời chúc, toast, finale, PWA */
(function () {
  'use strict';

  const THEME = document.documentElement.getAttribute('data-magic') || 'morning';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* ================= localStorage an toàn (chế độ riêng tư / file://) ================= */
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bỏ qua */ }
    },
  };

  const FOUND_KEY = 'gn-found-' + THEME;
  const FINALE_KEY = 'gn-finale-' + THEME;

  /* ================= Toast thông báo nhỏ ================= */
  function toast(msg, icon) {
    const others = document.querySelectorAll('.magic-toast').length;
    const t = document.createElement('div');
    t.className = 'magic-toast';
    t.style.top = 'calc(' + (18 + others * 52) + 'px + env(safe-area-inset-top))';
    const i = document.createElement('i');
    i.className = 'fa-solid ' + (icon || (THEME === 'morning' ? 'fa-butterfly' : 'fa-star'));
    const s = document.createElement('span');
    s.textContent = msg;
    t.append(i, s);
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2900);
  }

  /* ================= Pill đếm lời chúc ================= */
  let pillEl = null;

  function ensurePill() {
    if (pillEl) return pillEl;
    pillEl = document.createElement('div');
    pillEl.className = 'magic-pill';
    document.body.appendChild(pillEl);
    return pillEl;
  }

  function refreshPill(total) {
    const found = store.get(FOUND_KEY, []);
    const done = found.length >= total;
    const pill = ensurePill();
    pill.classList.toggle('done', done);
    const icon = done ? 'fa-wand-magic-sparkles' : (THEME === 'morning' ? 'fa-butterfly' : 'fa-star');
    const label = done
      ? 'Đủ ' + total + ' lời chúc rồi'
      : 'Lời chúc ' + found.length + '/' + total;
    pill.innerHTML = '<i class="fa-solid ' + icon + '"></i><span></span>';
    pill.lastChild.textContent = label;
  }

  function registerWishes(total) {
    refreshPill(total);
    setTimeout(() => ensurePill().classList.add('show'), 3400);
  }

  function wishFound(idx, total) {
    const found = store.get(FOUND_KEY, []);
    const isNew = found.indexOf(idx) === -1;
    if (isNew) {
      found.push(idx);
      store.set(FOUND_KEY, found);
    }
    refreshPill(total);
    if (isNew) {
      const pill = ensurePill();
      pill.classList.remove('pop');
      void pill.offsetWidth;
      pill.classList.add('pop');
    }
    if (found.length >= total && !store.get(FINALE_KEY, false)) {
      store.set(FINALE_KEY, true);
      setTimeout(() => {
        finaleBurst();
        window.dispatchEvent(new Event('magic:all-found'));
      }, 350);
    }
    return isNew;
  }

  /* ================= Pháo hoa chào mừng khi mở đủ lời chúc ================= */
  function finaleBurst() {
    if (!window.confetti) return;
    const shared = {
      shapes: ['star'],
      colors: THEME === 'morning'
        ? ['#ffd166', '#ff8fab', '#fff0d9', '#ffb37a', '#b5e0ff']
        : ['#ffe9a8', '#ffd166', '#ffffff', '#c9b8ff'],
      zIndex: 90,
      disableForReducedMotion: true,
      ticks: 260,
    };
    const end = Date.now() + 1800;
    (function frame() {
      confetti(Object.assign({}, shared, { particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.75 } }));
      confetti(Object.assign({}, shared, { particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.75 } }));
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    setTimeout(() => {
      confetti(Object.assign({}, shared, { particleCount: 130, spread: 110, startVelocity: 42, scalar: 1.1, origin: { x: 0.5, y: 0.42 } }));
    }, 1250);
  }

  /* ================= Bụi sao lấp lánh bám theo con trỏ / ngón tay ================= */
  function initGlitter() {
    if (REDUCED) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'glitter';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W, H;

    function resize() {
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    addEventListener('resize', resize);

    const COLORS = THEME === 'morning'
      ? ['#ffe9a8', '#ffd1dc', '#fff4d6', '#ffb37a', '#ffaec9']
      : ['#ffffff', '#ffe9a8', '#c9b8ff', '#9ad9ff'];
    const pts = [];
    let lx = -1, ly = -1;
    let animRunning = true;

    function spawn(x, y) {
      if (pts.length > 110) return;
      const n = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const isPetal = THEME === 'morning' && Math.random() < 0.28;
        pts.push({
          x: x + rand(-6, 6),
          y: y + rand(-6, 6),
          vx: rand(-0.35, 0.35),
          vy: isPetal ? rand(0.4, 1.2) : rand(-0.55, -0.1),
          r: isPetal ? rand(2.2, 4.2) : rand(0.8, 2.4),
          rot: rand(0, Math.PI * 2),
          vRot: rand(-0.06, 0.06),
          life: 1,
          decay: isPetal ? rand(0.008, 0.018) : rand(0.012, 0.03),
          c: isPetal ? (Math.random() < 0.5 ? '#ffb7cb' : '#ffa0b8') : COLORS[(Math.random() * COLORS.length) | 0],
          star: !isPetal && Math.random() < 0.3,
          petal: isPetal,
        });
      }
    }

    addEventListener('pointermove', (e) => {
      if (document.hidden) return;
      if (lx < 0) { lx = e.clientX; ly = e.clientY; return; }
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      if (dx * dx + dy * dy > 80) {
        lx = e.clientX;
        ly = e.clientY;
        spawn(lx, ly);
      }
    }, { passive: true });

    function tick() {
      if (!animRunning) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.petal) {
          p.rot += p.vRot;
          p.x += Math.sin(p.life * 6) * 0.45;
        }
        if (p.life <= 0) { pts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        if (p.petal) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.star) {
          const s = p.r * 2.6;
          ctx.strokeStyle = p.c;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
          ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 7);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    /* Pause glitter khi tab ẩn để tiết kiệm pin */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        animRunning = false;
      } else {
        if (!animRunning) {
          animRunning = true;
          requestAnimationFrame(tick);
        }
      }
    });

    tick();
  }

  /* ================= Helpers kiểm tra lời chúc đã mở ================= */
  function isWishFound(idx) {
    const found = store.get(FOUND_KEY, []);
    return found.indexOf(idx) !== -1;
  }

  function getFoundWishes() {
    return store.get(FOUND_KEY, []);
  }

  /* ================= Service worker (PWA: cài app + chạy offline) ================= */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  initGlitter();
  registerSW();

  window.Magic = { THEME, REDUCED, toast, registerWishes, wishFound, isWishFound, getFoundWishes, finaleBurst };
})();

