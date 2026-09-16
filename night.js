const rand = (min, max) => Math.random() * (max - min) + min;
const $ = (id) => document.getElementById(id);

/* ================= Thiên hà 3D xoắn ốc (Three.js) ================= */
(function initGalaxy() {
  if (!window.THREE) return;

  const canvas = $('galaxy');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 3.4, 6.6);

  /* Texture hạt sao tròn mềm (vẽ bằng canvas, không cần file ảnh) */
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const sctx = sprite.getContext('2d');
  const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const starTexture = new THREE.CanvasTexture(sprite);

  const isMobile = matchMedia('(max-width: 600px)').matches;
  const COUNT = isMobile ? 7000 : 14000;
  const ARMS = 4, RADIUS = 6, SPIN = 1.15, RAND = 0.35, RAND_POW = 2.8;

  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);
  const inside = new THREE.Color('#ffd9a3');   // vàng ấm ở tâm
  const outside = new THREE.Color('#6f5bff');  // tím ở rìa

  const jitter = (r) => Math.pow(Math.random(), RAND_POW) * (Math.random() < 0.5 ? 1 : -1) * RAND * r;

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random() * RADIUS;
    const armAngle = ((i % ARMS) / ARMS) * Math.PI * 2;
    const spinAngle = r * SPIN;

    positions[i * 3]     = Math.cos(armAngle + spinAngle) * r + jitter(r);
    positions[i * 3 + 1] = jitter(r) * 0.55;
    positions[i * 3 + 2] = Math.sin(armAngle + spinAngle) * r + jitter(r);

    const c = inside.clone().lerp(outside, Math.pow(r / RADIUS, 0.7));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    scales[i] = 0.25 + Math.random() * 0.75;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 42 * renderer.getPixelRatio() },
      uTexture: { value: starTexture },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      attribute float aScale;
      attribute vec3 aColor;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = 0.75 + 0.45 * sin(uTime * 1.6 + position.x * 4.0 + position.z * 3.0);
        gl_PointSize = uSize * aScale * twinkle * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec3 vColor;
      void main() {
        float alpha = texture2D(uTexture, gl_PointCoord).a;
        gl_FragColor = vec4(vColor, alpha);
      }`,
  });

  const galaxy = new THREE.Points(geo, mat);
  scene.add(galaxy);

  /* Bụi sao xa làm nền chiều sâu */
  const DUST = 700;
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const r = 14 + Math.random() * 18;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    dPos[i * 3 + 1] = r * Math.cos(phi) * 0.5 + 2;
    dPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.07,
    map: starTexture,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xdfe6ff,
  }));
  scene.add(dust);

  const clock = new THREE.Clock();
  const look = { x: 0, y: 0 };
  let usingTilt = false;

  addEventListener('mousemove', (e) => {
    if (usingTilt) return;
    look.x = (e.clientX / innerWidth - 0.5) * 2;
    look.y = (e.clientY / innerHeight - 0.5) * 2;
  });

  /* Nghiêng điện thoại để thiên hà nghiêng theo (xin quyền ở iOS khi chạm lần đầu) */
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    usingTilt = true;
    look.x = Math.max(-1, Math.min(1, e.gamma / 28));
    look.y = Math.max(-1, Math.min(1, (e.beta - 42) / 28));
  });

  function askTiltPermission() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(() => {});
      }
    } catch (e) { /* bỏ qua */ }
  }
  addEventListener('pointerdown', askTiltPermission, { once: true });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* Reduced-motion: vẽ 1 khung tĩnh, không xoay liên tục */
  if (window.Magic && Magic.REDUCED) {
    renderer.render(scene, camera);
    return;
  }

  function renderFrame() {
    const delta = clock.getDelta();
    mat.uniforms.uTime.value = clock.elapsedTime;
    galaxy.rotation.y += delta * 0.05;
    dust.rotation.y -= delta * 0.006;
    camera.position.x += (look.x * 0.6 - camera.position.x) * 0.03;
    camera.position.y += ((3.4 - look.y * 0.5) - camera.position.y) * 0.03;
    camera.lookAt(0, 0.2, 0);
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(renderFrame);

  /* Tiết kiệm pin tối đa khi ẩn tab */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else {
      clock.getDelta();
      renderer.setAnimationLoop(renderFrame);
    }
  });
})();

/* ================= Sao băng thỉnh thoảng lướt qua - chạm để ước ================= */
const sky = $('sky');
let starTimer = null;

function spawnShootingStar() {
  if (window.Magic && Magic.REDUCED) return;
  if (document.hidden) {
    starTimer = setTimeout(spawnShootingStar, 3000);
    return;
  }
  const sh = document.createElement('div');
  sh.className = 'shooting-star';
  sh.title = 'Chạm để ước';
  sh.style.left = rand(5, 65).toFixed(2) + '%';
  sh.style.top = rand(2, 35).toFixed(2) + '%';
  sh.style.setProperty('--dx', rand(18, 32).toFixed(1) + 'vw');
  sh.style.setProperty('--dy', rand(12, 22).toFixed(1) + 'vh');
  sh.addEventListener('click', (e) => {
    e.stopPropagation();
    chime();
    if (window.confetti) {
      confetti({
        shapes: ['star'],
        colors: ['#ffe9a8', '#ffffff', '#c9b8ff'],
        particleCount: 26,
        spread: 60,
        startVelocity: 28,
        zIndex: 90,
        disableForReducedMotion: true,
        origin: { x: e.clientX / innerWidth, y: e.clientY / innerHeight },
      });
    }
    if (window.Magic) Magic.toast('Đã ghi lại điều ước', 'fa-wand-magic-sparkles');
    sh.remove();
  });
  sky.appendChild(sh);
  setTimeout(() => sh.remove(), 1500);
  starTimer = setTimeout(spawnShootingStar, rand(2800, 7000));
}
starTimer = setTimeout(spawnShootingStar, 1200);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !starTimer) {
    starTimer = setTimeout(spawnShootingStar, rand(1500, 3500));
  }
});

/* ================= Đom đóm lượn lờ chân đồi ================= */
(function initFireflies() {
  if (window.Magic && Magic.REDUCED) return;
  const n = matchMedia('(max-width: 600px)').matches ? 9 : 14;
  for (let i = 0; i < n; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.left = rand(4, 96).toFixed(1) + '%';
    f.style.top = rand(34, 94).toFixed(1) + '%';
    f.style.setProperty('--x1', rand(-18, 18).toFixed(1) + 'vw');
    f.style.setProperty('--y1', rand(-9, 9).toFixed(1) + 'vh');
    f.style.setProperty('--x2', rand(-18, 18).toFixed(1) + 'vw');
    f.style.setProperty('--y2', rand(-9, 9).toFixed(1) + 'vh');
    f.style.setProperty('--x3', rand(-14, 14).toFixed(1) + 'vw');
    f.style.setProperty('--y3', rand(-8, 8).toFixed(1) + 'vh');
    f.style.setProperty('--fd', rand(16, 30).toFixed(1) + 's');
    f.style.setProperty('--fdel', (-rand(0, 30)).toFixed(1) + 's');
    f.style.setProperty('--gd', rand(2.6, 5).toFixed(1) + 's');
    sky.appendChild(f);
  }
})();

/* ================= Lời chào + nền theo giờ thực ================= */
function greetingByHour(h) {
  if (h >= 23 || h < 3) return 'Khuya lắm rồi đó, Như Ý ơi';
  if (h >= 21) return 'Đêm đã sâu rồi';
  if (h >= 18) return 'Buổi tối an yên';
  if (h >= 12) return 'Chiều rồi, nghỉ ngơi chút nhé';
  if (h >= 4) return 'Chúc Như Ý một giấc ngủ bù thật ngon';
  return 'Nửa đêm rồi, ngủ tiếp nhé';
}

function updateGreeting() {
  const h = new Date().getHours();
  $('timeGreeting').textContent = greetingByHour(h);
  document.body.classList.remove('night', 'day');
  if (h >= 21 || h < 3) document.body.classList.add('night');
  else if (h < 18) document.body.classList.add('day');
}
updateGreeting();
setInterval(updateGreeting, 30000);

/* ================= Hiệu ứng chữ đánh máy ================= */
/* Token theo từng element: đánh máy song song không giết nhau */
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

/* ================= Bài thơ ru ngủ ================= */
const POEM = [
  'Đêm về khép lại bộn bề',
  'Để gió ngân khúc êm đềm ru em',
  'Sao trời thức canh giấc êm',
  'Trăng cài mái tóc đêm thêm dịu dàng',
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
  const TITLE = 'Ngủ ngon nhé, Như Ý';
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
      .from('.time-greeting', { y: -18, autoAlpha: 0, duration: 0.9 }, 0.2)
      .from('.title .char', { y: 50, autoAlpha: 0, rotateX: -70, duration: 0.9, stagger: 0.055, ease: 'back.out(1.8)' }, 0.45)
      .fromTo('.poem', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, '-=0.35')
      .from('.hint', { y: 16, autoAlpha: 0, duration: 0.7 }, '-=0.45')
      .fromTo('.wish-hit',
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

/* ================= Ngôi sao ước - click nhận lời chúc ================= */
const wishes = [
  { top: 16, left: 13, mTop: 6,  mLeft: 15, text: 'Chúc Như Ý ngủ thật ngon và mơ một giấc mơ thật đẹp.' },
  { top: 11, left: 60, mTop: 13, mLeft: 86, text: 'Hôm nay đã vất vả rồi, giờ hãy gác lại mọi chuyện và nghỉ ngơi nhé.' },
  { top: 30, left: 84, mTop: 23, mLeft: 7,  text: 'Nhắm mắt lại nhé, để những vì sao thay nhau canh giấc cho Như Ý.' },
  { top: 58, left: 8,  mTop: 77, mLeft: 9,  text: 'Ngủ sớm một chút, mai thức dậy thật xinh và tràn đầy năng lượng nhé.' },
  { top: 66, left: 80, mTop: 85, mLeft: 88, text: 'Giấc ngủ là liều thuốc bổ miễn phí, nhớ dùng đủ liều đó nha.' },
  { top: 84, left: 42, mTop: 92, mLeft: 50, text: 'Cảm ơn Như Ý vì đã luôn cố gắng. Giờ đến lượt Như Ý được nghỉ ngơi rồi.' },
];

const mqMobile = matchMedia('(max-width: 600px)');
const wishEls = [];

wishes.forEach((w, idx) => {
  const hit = document.createElement('div');
  hit.className = 'wish-hit';
  hit.title = 'Chạm vào em đi';

  const star = document.createElement('div');
  star.className = 'wish-star';
  star.style.animationDelay = (idx * 0.4) + 's';

  hit.appendChild(star);
  hit.addEventListener('click', () => openWish(idx));
  sky.appendChild(hit);
  wishEls.push(hit);
});

function applyStarPositions() {
  const m = mqMobile.matches;
  wishEls.forEach((el, i) => {
    el.style.top = (m ? wishes[i].mTop : wishes[i].top) + '%';
    el.style.left = (m ? wishes[i].mLeft : wishes[i].left) + '%';
  });
}
applyStarPositions();
mqMobile.addEventListener('change', applyStarPositions);

if (window.Magic) {
  Magic.registerWishes(wishes.length);
  wishEls.forEach((el, i) => {
    if (Magic.isWishFound(i)) el.classList.add('opened');
  });
}

/* ================= Trăng - gõ 3 lần mở lời chúc bí mật ================= */
const MOON_SECRET = 'Êk, đang đêm mà gõ trăng ba lần nè. Thôi thì... thưởng thêm Như Ý một giấc mơ thật ngọt nha.';

const moonEl = document.querySelector('.moon');
let moonTaps = 0;
let moonTimer = null;

if (moonEl) {
  moonEl.addEventListener('click', () => {
    moonEl.classList.remove('wiggle');
    void moonEl.offsetWidth;
    moonEl.classList.add('wiggle');
    moonTaps++;
    clearTimeout(moonTimer);
    moonTimer = setTimeout(() => { moonTaps = 0; }, 1600);
    if (moonTaps >= 3) {
      moonTaps = 0;
      openMessage(MOON_SECRET);
    }
  });
}

/* ================= Pháo sao vàng (canvas-confetti) ================= */
function fireStarConfetti() {
  if (!window.confetti) return;
  const shared = {
    shapes: ['star'],
    colors: ['#ffe9a8', '#ffd166', '#ffffff', '#c9b8ff'],
    gravity: 0.65,
    ticks: 230,
    zIndex: 90,
    disableForReducedMotion: true,
  };
  confetti({ ...shared, particleCount: 55, spread: 70, startVelocity: 42, scalar: 1, origin: { x: 0.5, y: 0.4 } });
  confetti({ ...shared, particleCount: 30, spread: 130, startVelocity: 55, scalar: 0.6, decay: 0.92, origin: { x: 0.5, y: 0.4 } });
}

/* ================= Overlay lời chúc ================= */
const overlay = $('overlay');

const SECRET_MESSAGE = 'Như Ý đã chạm đủ 6 ngôi sao ước rồi đó. Điều ước số 7 là bí mật: mong mỗi đêm Ý đều ngủ thật sâu, thật ngoan và mơ thấy những điều đẹp nhất.';

function openWish(idx) {
  if (window.Magic) Magic.wishFound(idx, wishes.length);
  if (wishEls[idx]) wishEls[idx].classList.add('opened');
  openMessage(wishes[idx].text);
}

window.addEventListener('magic:all-found', () => {
  openMessage(SECRET_MESSAGE);
});

function openMessage(text) {
  chime();
  fireStarConfetti();

  if (window.gsap) {
    gsap.timeline()
      .set(overlay, { visibility: 'visible' })
      .to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      .fromTo('.card', { scale: 0.85, y: 28, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.12')
      .from('.card-star', { scale: 0, rotate: 200, duration: 0.55, ease: 'back.out(2)' }, '-=0.4');
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
const NOTE = { G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5 };

const MELODY = [
  ['C5',1],['C5',1],['G5',1],['G5',1],['A5',1],['A5',1],['G5',2],
  ['F5',1],['F5',1],['E5',1],['E5',1],['D5',1],['D5',1],['C5',2],
  ['G5',1],['G5',1],['F5',1],['F5',1],['E5',1],['E5',1],['D5',2],
  ['G5',1],['G5',1],['F5',1],['F5',1],['E5',1],['E5',1],['D5',2],
  ['C5',1],['C5',1],['G5',1],['G5',1],['A5',1],['A5',1],['G5',2],
  ['F5',1],['F5',1],['E5',1],['E5',1],['D5',1],['D5',1],['C5',2],
];

const MELODY_BRAHMS = [
  ['E5',1],['E5',1],['G5',2],
  ['E5',1],['E5',1],['G5',2],
  ['E5',1],['E5',1],['A5',2],['G5',2],
  ['F5',1],['F5',1],['E5',1],['D5',1],['C5',2],
  ['G5',1],['G5',1],['F5',1],['E5',1],['D5',2],
  ['E5',1],['E5',1],['D5',1],['C5',1],['C5',4],
];

const MELODY_CANON = [
  ['E5',2],['D5',2],['C5',2],['B4',2],
  ['A4',2],['G4',2],['A4',2],['B4',2],
  ['C5',1],['E5',1],['G5',1],['F5',1],['E5',1],['C5',1],['E5',1],['D5',1],
  ['C5',1],['A4',1],['C5',1],['B4',1],['A4',1],['G4',1],['A4',1],['B4',1],
  ['C5',4],
];

const SONGS = [
  { name: 'Twinkle Twinkle Little Star', beat: 0.55, melody: MELODY },
  { name: 'Brahms Lullaby', beat: 0.5, melody: MELODY_BRAHMS },
  { name: 'Canon in D', beat: 0.52, melody: MELODY_CANON },
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
      playNote(NOTE.E5, t, 0.9, chimeBus);
      playNote(NOTE.A5, t + 0.14, 0.9, chimeBus);
      playNote(NOTE.C6, t + 0.28, 1.1, chimeBus);
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
