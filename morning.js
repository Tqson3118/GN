const rand = (min, max) => Math.random() * (max - min) + min;
const $ = (id) => document.getElementById(id);

/* ================= Bụi nắng bay lên (canvas 2D) ================= */
(function initDust() {
  if (window.Magic && Magic.REDUCED) { const c = $('dust'); if (c) c.remove(); return; }
  const canvas = $('dust');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W, H;
  let animRunning = true;

  function resize() {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const N = matchMedia('(max-width: 600px)').matches ? 34 : 58;

  function spawn(initial) {
    return {
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 12,
      r: 0.8 + Math.random() * 2.2,
      s: 0.12 + Math.random() * 0.4,
      ph: Math.random() * Math.PI * 2,
      a: 0.25 + Math.random() * 0.5,
    };
  }

  const ps = Array.from({ length: N }, () => spawn(true));

  function tick(t) {
    if (!animRunning) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.y -= p.s;
      p.ph += 0.015;
      if (p.y < -12) Object.assign(p, spawn(false));
      const x = p.x + Math.sin(p.ph) * 14;
      const tw = 0.55 + 0.45 * Math.sin(t / 700 + p.ph * 3);
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, 7);
      ctx.fillStyle = 'rgba(255, 232, 170, ' + (p.a * tw).toFixed(3) + ')';
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* Tạm dừng animation bụi nắng khi ẩn tab để tiết kiệm pin */
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
})();

/* ================= Parallax đồi và mây theo chuột / góc nghiêng ================= */
(function initMorningParallax() {
  if (window.Magic && Magic.REDUCED) return;
  let lookX = 0, lookY = 0;
  let usingTilt = false;

  function updateParallax() {
    document.documentElement.style.setProperty('--px', (lookX * 22).toFixed(1) + 'px');
    document.documentElement.style.setProperty('--py', (lookY * 14).toFixed(1) + 'px');
  }

  addEventListener('mousemove', (e) => {
    if (usingTilt || document.hidden) return;
    lookX = (e.clientX / innerWidth - 0.5) * 2;
    lookY = (e.clientY / innerHeight - 0.5) * 2;
    updateParallax();
  }, { passive: true });

  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null || document.hidden) return;
    usingTilt = true;
    lookX = Math.max(-1, Math.min(1, e.gamma / 26));
    lookY = Math.max(-1, Math.min(1, (e.beta - 42) / 26));
    updateParallax();
  });

  function askTiltPermission() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(() => {});
      }
    } catch (e) {}
  }
  addEventListener('pointerdown', askTiltPermission, { once: true });
})();

/* ================= Chim bay thỉnh thoảng lướt qua - chạm để tương tác ================= */
const sky = $('sky');
let birdTimer = null;

function spawnBird() {
  if (window.Magic && Magic.REDUCED) return;
  if (document.hidden) {
    birdTimer = setTimeout(spawnBird, 3000);
    return;
  }
  const b = document.createElement('div');
  b.className = 'bird';
  b.title = 'Chạm vào em đi';
  b.style.setProperty('--top', rand(6, 30).toFixed(1) + '%');
  const dur = rand(8, 14);
  b.style.setProperty('--dur', dur.toFixed(1) + 's');

  /* Chạm chim bay líu lo chuông + vệt hoa nắng */
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof chime === 'function') chime();
    if (window.confetti) {
      confetti({
        shapes: ['star'],
        colors: ['#ffd166', '#ff8fab', '#fff0d9'],
        particleCount: 18,
        spread: 50,
        startVelocity: 24,
        zIndex: 90,
        disableForReducedMotion: true,
        origin: { x: e.clientX / innerWidth, y: e.clientY / innerHeight },
      });
    }
    if (window.Magic) Magic.toast('Chim nhỏ gửi lời chúc một ngày thật xinh!', 'fa-feather');
  });

  sky.appendChild(b);
  setTimeout(() => b.remove(), dur * 1000 + 300);
  birdTimer = setTimeout(spawnBird, rand(4500, 12000));
}
birdTimer = setTimeout(spawnBird, 2500);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !birdTimer) {
    birdTimer = setTimeout(spawnBird, rand(2000, 5000));
  }
});

/* ================= Mặt trời - gõ 3 lần mở lời chúc bí mật ================= */
const SUN_SECRET = 'Ai đó vừa đánh thức mặt trời kìa! Nhưng mặt trời cũng chẳng rạng rỡ bằng nụ cười của Như Ý đâu nha ☀️';
const sunEl = document.querySelector('.sun');
let sunTaps = 0;
let sunTimer = null;

if (sunEl) {
  sunEl.addEventListener('click', () => {
    sunEl.classList.remove('wiggle', 'burst');
    void sunEl.offsetWidth;
    sunEl.classList.add('wiggle');
    sunTaps++;
    clearTimeout(sunTimer);
    sunTimer = setTimeout(() => { sunTaps = 0; }, 1600);
    if (sunTaps >= 3) {
      sunTaps = 0;
      sunEl.classList.add('burst');
      openMessage(SUN_SECRET);
    }
  });
}

/* ================= Lời chào buổi sáng (luôn luôn là sáng) ================= */
const MORNING_GREETINGS = [
  'Buổi sáng tươi mới, Như Ý ơi',
  'Chào ngày mới rực rỡ',
  'Một ngày thật đẹp đang chờ Như Ý',
  'Nắng đã lên rồi, Như Ý ơi',
  'Ngày mới an lành gửi Như Ý',
];

$('timeGreeting').textContent = MORNING_GREETINGS[Math.floor(Math.random() * MORNING_GREETINGS.length)];

/* ================= Hiệu ứng chữ đánh máy ================= */
const typeTokens = new WeakMap();

function cancelTyping(el) {
  typeTokens.set(el, (typeTokens.get(el) || 0) + 1);
}

function typeText(el, text, speed = 45) {
  const token = (typeTokens.get(el) || 0) + 1;
  typeTokens.set(el, token);
  el.textContent = '';
  return new Promise((resolve) => {
    let i = 0;
    (function tick() {
      if (typeTokens.get(el) !== token) return resolve();
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(tick, Math.max(20, speed + rand(-20, 40)));
      else resolve();
    })();
  });
}

/* ================= Bài thơ buổi sáng ================= */
const POEM = [
  'Nắng sớm nhẹ nhàng qua tay',
  'Gọi Như Ý dậy, chớ say giấc nồng',
  'Chúc em ngày mới ấm lòng',
  'Đẹp như hoa nở bờ sông đón nắng',
];

let poemStarted = false;

async function startPoemTyping() {
  if (poemStarted) return;
  poemStarted = true;
  for (let i = 0; i < POEM.length; i++) {
    await typeText($('poemLine' + i), POEM[i], 62);
  }
}

/* ================= Màn chào mừng (GSAP) ================= */
window.addEventListener('load', () => {
  const TITLE = 'Chào buổi sáng, Như Ý';
  const titleEl = $('titleText');

  if (window.gsap) {
    titleEl.innerHTML = '';
    [...TITLE].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      titleEl.appendChild(s);
    });

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.time-greeting', { y: -18, autoAlpha: 0, duration: 0.9 }, 1.2)
      .from('.title .char', { y: 50, autoAlpha: 0, rotateX: -70, duration: 0.85, stagger: 0.05, ease: 'back.out(1.8)' }, 1.5)
      .fromTo('.poem', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, '-=0.35')
      .from('.hint', { y: 16, autoAlpha: 0, duration: 0.7 }, '-=0.45')
      .fromTo('.butterfly-hit',
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, clearProps: 'transform,opacity,visibility', duration: 0.9, stagger: 0.12, ease: 'elastic.out(1, 0.5)' }, '-=0.55')
      .fromTo('.music-btn',
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, clearProps: 'transform,opacity,visibility', duration: 0.6, ease: 'back.out(2)' }, '-=0.7')
      .call(startPoemTyping);
    setTimeout(() => {
      const t = document.querySelector('.title');
      if (t) t.classList.add('shimmer');
    }, 3400);
  } else {
    titleEl.textContent = TITLE;
    const t = document.querySelector('.title');
    if (t) t.classList.add('shimmer');
    startPoemTyping();
  }
});

/* ================= Bướm chúa - click nhận lời chúc ================= */
const wishes = [
  { top: 15, left: 20, mTop: 7,  mLeft: 22, text: 'Chào buổi sáng Như Ý! Chúc hôm nay đèn xanh hết nấc, queue ngắn khỏi chờ, cà phê vừa ngon vừa ấm.' },
  { top: 12, left: 62, mTop: 12, mLeft: 80, text: 'Dậy thôi, chăn ấm thì để tối về ôm tiếp nha. Chúc Như Ý một ngày thật rực rỡ!' },
  { top: 30, left: 82, mTop: 22, mLeft: 8,  text: 'Ngày mới rồi đó, chúc Ý làm gì cũng xuôi, gặp ai cũng dễ thương, cơm trưa cũng thật ngon.' },
  { top: 60, left: 12, mTop: 74, mLeft: 14, text: 'Mở mắt ra đã có người nghĩ đến Ý trước tiên rồi nè. Hôm nay chắc chắn là ngày của Ý.' },
  { top: 62, left: 74, mTop: 82, mLeft: 78, text: 'Chúc một buổi sáng thật dịu dàng: gió nhẹ, nắng vừa đủ, và một Như Ý thật xinh.' },
  { top: 82, left: 46, mTop: 91, mLeft: 50, text: 'Hôm nay của Ý sẽ tuyệt như chính Ý vậy. Cứ tự tin tỏa sáng, bóng đèn phải ghen mất.' },
];

const PALETTE = [
  ['#ff9ad5', '#ff5f9e'],
  ['#ffc98f', '#ff9557'],
  ['#d5b8ff', '#a97fff'],
  ['#ffe6a3', '#ffc55c'],
];

const mqMobile = matchMedia('(max-width: 600px)');
const butterflyEls = [];

wishes.forEach((w, idx) => {
  const hit = document.createElement('div');
  hit.className = 'butterfly-hit';
  hit.title = 'Chạm vào em đi';

  const c = PALETTE[idx % PALETTE.length];
  const inner = document.createElement('div');
  inner.className = 'butterfly';
  inner.style.setProperty('--wc1', c[0]);
  inner.style.setProperty('--wc2', c[1]);
  inner.style.setProperty('--bobd', (4 + Math.random() * 3).toFixed(1) + 's');
  inner.innerHTML = '<span class="wing left"></span><span class="wing right"></span><span class="body"></span>';

  hit.appendChild(inner);
  hit.addEventListener('click', () => openWish(idx));
  sky.appendChild(hit);
  butterflyEls.push(hit);
});

function applyButterflyPositions() {
  const m = mqMobile.matches;
  butterflyEls.forEach((el, i) => {
    el.style.top = (m ? wishes[i].mTop : wishes[i].top) + '%';
    el.style.left = (m ? wishes[i].mLeft : wishes[i].left) + '%';
  });
}
applyButterflyPositions();
mqMobile.addEventListener('change', applyButterflyPositions);

if (window.Magic) {
  Magic.registerWishes(wishes.length);
  butterflyEls.forEach((el, i) => {
    if (Magic.isWishFound(i)) el.classList.add('opened');
  });
}

/* ================= Pháo sáng buổi sáng (canvas-confetti) ================= */
function fireMorningConfetti() {
  if (!window.confetti) return;
  let shapes = ['star'];
  try {
    if (confetti.shapeFromText) shapes = [confetti.shapeFromText({ text: '🦋', scalar: 1.4 }), 'star'];
  } catch (e) { /* dùng sao */ }
  const shared = {
    shapes,
    colors: ['#ffd166', '#ff8fab', '#fff0d9', '#ffb37a', '#b5e0ff'],
    gravity: 0.6,
    ticks: 240,
    zIndex: 90,
    disableForReducedMotion: true,
  };
  confetti({ ...shared, particleCount: 50, spread: 75, startVelocity: 44, scalar: 0.9, origin: { x: 0.5, y: 0.4 } });
  confetti({ ...shared, particleCount: 26, spread: 130, startVelocity: 56, scalar: 0.55, decay: 0.92, origin: { x: 0.5, y: 0.4 } });
}

/* ================= Overlay lời chúc ================= */
const overlay = $('overlay');

const SECRET_MESSAGE = 'Như Ý đã mở hết 6 lời chúc rồi! Có một điều nhỏ giấu cuối cùng: người làm trang này mong mỗi buổi sáng của Ý đều nhẹ nhàng và rực rỡ như chính Ý vậy.';

function openWish(idx) {
  if (window.Magic) Magic.wishFound(idx, wishes.length);
  if (butterflyEls[idx]) butterflyEls[idx].classList.add('opened');
  openMessage(wishes[idx].text);
}

window.addEventListener('magic:all-found', () => {
  openMessage(SECRET_MESSAGE);
});

function openMessage(text) {
  chime();
  fireMorningConfetti();

  if (window.gsap) {
    gsap.timeline()
      .set(overlay, { visibility: 'visible' })
      .to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      .fromTo('.card', { scale: 0.85, y: 28, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.12')
      .from('.card-sun', { scale: 0, rotate: 200, duration: 0.55, ease: 'back.out(2)' }, '-=0.4');
  } else {
    overlay.style.visibility = 'visible';
    overlay.style.opacity = 1;
  }

  typeText($('messageText'), text, 45);
}

function closeMessage() {
  cancelTyping($('messageText'));
  if (window.gsap) {
    gsap.timeline({ onComplete: () => { $('messageText').textContent = ''; } })
      .to(overlay, { opacity: 0, duration: 0.22, ease: 'power2.in' })
      .set(overlay, { visibility: 'hidden' });
  } else {
    overlay.style.opacity = 0;
    setTimeout(() => {
      overlay.style.visibility = 'hidden';
      $('messageText').textContent = '';
    }, 250);
  }
}

$('closeMessage').addEventListener('click', closeMessage);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMessage(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMessage(); });

/* ================= Nhạc nền hộp nhạc: 3 bài, chu kỳ bật/tắt có fade ================= */
const NOTE = { G4: 392.00, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, C6: 1046.50 };

const MELODY = [
  ['C5',1],['D5',1],['E5',1],['C5',1],
  ['C5',1],['D5',1],['E5',1],['C5',1],
  ['E5',1.5],['F5',1.5],['G5',3],
  ['E5',1.5],['F5',1.5],['G5',3],
  ['G5',0.75],['A5',0.75],['G5',0.75],['F5',0.75],['E5',1],['C5',1],
  ['G5',0.75],['A5',0.75],['G5',0.75],['F5',0.75],['E5',1],['C5',1],
  ['C5',2],['G4',2],['C5',4],
];

const MELODY_SUNSHINE = [
  ['C5',1],['C5',1],['F5',1],['F5',1],['G5',1],['G5',1],['F5',2],
  ['E5',1],['E5',1],['A5',1],['A5',1],['G5',2],
  ['D5',1],['D5',1],['E5',1],['E5',1],['F5',1],['F5',1],['E5',1],['D5',1],['C5',2],
  ['C5',1],['C5',1],['F5',1],['F5',1],['G5',1],['G5',1],['F5',2],
  ['E5',1],['E5',1],['A5',1],['A5',1],['G5',2],
  ['D5',1],['D5',1],['E5',1],['E5',1],['F5',1],['F5',1],['E5',1],['D5',1],['C5',4],
];

const MELODY_ODE_TO_JOY = [
  ['E5',1],['E5',1],['F5',1],['G5',1],
  ['G5',1],['F5',1],['E5',1],['D5',1],
  ['C5',1],['C5',1],['D5',1],['E5',1],
  ['E5',1.5],['D5',0.5],['D5',2],
  ['E5',1],['E5',1],['F5',1],['G5',1],
  ['G5',1],['F5',1],['E5',1],['D5',1],
  ['C5',1],['C5',1],['D5',1],['E5',1],
  ['D5',1.5],['C5',0.5],['C5',2],
];

const SONGS = [
  { name: 'Frère Jacques', beat: 0.42, melody: MELODY },
  { name: 'You Are My Sunshine', beat: 0.5, melody: MELODY_SUNSHINE },
  { name: 'Ode to Joy', beat: 0.46, melody: MELODY_ODE_TO_JOY },
];

let audioCtx = null;
let master = null;
let chimeBus = null;
let schedTimer = null;
let songIdx = 0;
let songPos = 0;
let nextNoteTime = 0;
let musicState = 0;

function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();
  master = audioCtx.createGain();
  master.gain.value = 0.35;
  master.connect(audioCtx.destination);
  chimeBus = audioCtx.createGain();
  chimeBus.gain.value = 0.3;
  chimeBus.connect(audioCtx.destination);
}

function playNote(freq, time, dur, dest) {
  const o1 = audioCtx.createOscillator();
  const o2 = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  const g2 = audioCtx.createGain();
  o1.type = 'sine';
  o2.type = 'sine';
  o1.frequency.value = freq;
  o2.frequency.value = freq * 2;
  g2.gain.value = 0.18;
  o1.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(dest || master);
  const hold = Math.max(0.5, Math.min(1.6, dur || 1.2));
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.5, time + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, time + hold);
  o1.start(time);
  o2.start(time);
  o1.stop(time + hold + 0.2);
  o2.stop(time + hold + 0.2);
}

/* Scheduler lookahead: đặt lịch trước 1.5s để không bị hụt tiếng khi tab nền */
function scheduleAhead() {
  const song = SONGS[songIdx];
  while (nextNoteTime < audioCtx.currentTime + 1.5) {
    const [note, dur] = song.melody[songPos];
    playNote(NOTE[note], nextNoteTime, dur * song.beat * 2.2);
    nextNoteTime += dur * song.beat;
    songPos = (songPos + 1) % song.melody.length;
  }
}

function startSong(i) {
  stopSong(true);
  songIdx = i;
  songPos = 0;
  nextNoteTime = audioCtx.currentTime + 0.25;
  const t = audioCtx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
  master.gain.exponentialRampToValueAtTime(0.35, t + 0.9);
  scheduleAhead();
  schedTimer = setInterval(scheduleAhead, 250);
}

function stopSong(keepGain) {
  if (schedTimer) {
    clearInterval(schedTimer);
    schedTimer = null;
  }
  if (!keepGain && audioCtx) {
    const t = audioCtx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  }
}

function chime() {
  try {
    if (!audioCtx) initAudio();
    const play = () => {
      const t = audioCtx.currentTime;
      playNote(NOTE.C5, t, 0.9, chimeBus);
      playNote(NOTE.E5, t + 0.12, 0.9, chimeBus);
      playNote(NOTE.G5, t + 0.24, 0.9, chimeBus);
      playNote(NOTE.C6, t + 0.36, 1.1, chimeBus);
    };
    if (audioCtx.state !== 'running') audioCtx.resume().then(play).catch(() => {});
    else play();
  } catch (e) { /* im lặng */ }
}

const musicBtn = $('musicBtn');

/* Bấm lần lượt: tắt → bài 1 → bài 2 → bài 3 → tắt */
function toggleMusic() {
  if (!audioCtx) initAudio();
  musicState = (musicState + 1) % (SONGS.length + 1);
  if (musicState > 0) {
    audioCtx.resume();
    startSong(musicState - 1);
    musicBtn.classList.add('on');
    musicBtn.setAttribute('aria-label', 'Tắt nhạc nền');
    if (window.Magic) Magic.toast(SONGS[musicState - 1].name, 'fa-music');
  } else {
    stopSong();
    musicBtn.classList.remove('on');
    musicBtn.setAttribute('aria-label', 'Bật nhạc nền');
  }
}

musicBtn.addEventListener('click', toggleMusic);
