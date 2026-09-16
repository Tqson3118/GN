# GN - Chúc Như Ý ngủ ngon & chào buổi sáng 🌙☀️

Bộ 2 trang gửi riêng cho Như Ý:

- **`index.html`** — trang chào buổi sáng: bầu trời bình minh, mặt trời mọc, cầu vồng, bụi nắng bay, bướm chúa mang lời chúc, chim bay, thơ lục bát, nhạc hộp nhạc.
- **`good-night.html`** — trang chúc ngủ ngon: thiên hà 3D xoắn ốc, trăng, sao băng, đom đóm, ngôi sao ước mang lời chúc, pháo sao vàng, nhạc hộp nhạc.

Chỉ cần gửi 1 link `.../` — trang tự chuyển sáng/tối theo giờ (19:00 – 05:00 là trang đêm). Thêm `?stay` vào URL nếu muốn ghim một trang cố định.

## Tính năng

- Tự chuyển trang theo giờ thực (chống loop bằng sessionStorage, thoát bằng `?stay`)
- Đếm lời chúc: mở đủ 6 lời chúc → pháo hoa bùng nổ + tin nhắn bí mật (lưu localStorage)
- Bụi sao lấp lánh bám theo con trỏ / ngón tay
- Chữ hiệu chạy màu gradient (shimmer)
- Trang đêm: nghiêng điện thoại để thiên hà nghiêng theo, chạm sao băng để ước, gõ trăng 3 lần mở lời chúc bí mật
- Nhạc hộp nhạc 2 bài mỗi trang (bấm nút nhạc lần lượt: tắt → bài 1 → bài 2), fade in/out êm
- PWA: cài lên màn hình chính như app, chạy offline (service worker)
- OG meta tags: preview đẹp khi gửi link qua Zalo/Messenger
- Favicon riêng cho từng trang, SRI hash cho mọi script CDN
- Tôn trọng `prefers-reduced-motion`, scheduler nhạc lookahead chống hụt tiếng khi tab nền

## Chạy

Mở trực tiếp `index.html` bằng trình duyệt, hoặc bật GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

Lưu ý khi deploy: đổi `og:image` trong 2 file HTML thành URL tuyệt đối (vd `https://user.github.io/repo/og-morning.png`) để preview hiển thị trên Zalo/Messenger. Muốn reset tiến độ lời chúc: xoá site data của trang.

## Công nghệ

- HTML / CSS / JS thuần
- [Three.js](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js) — thiên hà 3D (WebGL shader)
- [GSAP](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js) — animation
- [canvas-confetti](https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js) — pháo sao vàng / bướm
- Font Awesome + Google Fonts (Great Vibes, Playfair Display, Be Vietnam Pro)
- Web Audio API — nhạc nền không cần file mp3
- Service Worker + Web App Manifest — PWA
