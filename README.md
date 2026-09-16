# GN - Chúc Như Ý ngủ ngon & chào buổi sáng 🌙☀️

Bộ 2 trang gửi riêng cho Như Ý:

- **`index.html`** — trang chào buổi sáng: bầu trời bình minh, mặt trời mọc, bụi nắng bay, bướm chúa mang lời chúc, chim bay, thơ lục bát, nhạc *Frère Jacques* hộp nhạc.
- **`good-night.html`** — trang chúc ngủ ngon: thiên hà 3D xoắn ốc, trăng, sao băng, ngôi sao ước mang lời chúc, pháo sao vàng, nhạc *Twinkle Twinkle* hộp nhạc.

Gửi link nào đúng lúc đó: sáng thì `.../GN/`, tối thì `.../GN/good-night.html`.

## Chạy

Mở trực tiếp `index.html` bằng trình duyệt, hoặc bật GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

## Công nghệ

- HTML / CSS / JS thuần
- [Three.js](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) — thiên hà 3D (WebGL shader)
- [GSAP](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js) — animation
- [canvas-confetti](https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js) — pháo sao vàng / bướm
- Font Awesome + Google Fonts (Great Vibes, Playfair Display, Be Vietnam Pro)
- Web Audio API — nhạc nền không cần file mp3
