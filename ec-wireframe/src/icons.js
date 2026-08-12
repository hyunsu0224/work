// icons.js — 컴포넌트별 미니 도식 아이콘(인라인 SVG)
// 각 아이콘은 해당 블록의 레이아웃을 회색 와이어프레임 톤으로 축약 표현. viewBox 28x20.

const svg = (inner) => `<svg viewBox="0 0 28 20" class="cicon" aria-hidden="true">${inner}</svg>`;
const b = (x, y, w, h, f = "#d8d8d8") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".5" fill="${f}" stroke="#666" stroke-width=".7"/>`;
const im = (x, y, w, h) => b(x, y, w, h) + `<path d="M${x} ${y + h}L${x + w} ${y}" stroke="#adadad" stroke-width=".6" fill="none"/>`;
const l = (x, y, w, h = 1.4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".4" fill="#9a9a9a"/>`;
const c = (cx, cy, r, f = "#cfcfcf") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" stroke="#666" stroke-width=".6"/>`;
const rep = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");

export const icons = {
  // TOP
  hero: svg(im(2, 2, 24, 12) + rep(3, (i) => c(11 + i * 3, 16.5, 0.9))),
  promo: svg(im(3, 3, 10, 14) + im(15, 3, 10, 14)),
  "category-grid": svg(rep(3, (i) => b(3 + i * 8, 4, 6, 5)) + rep(3, (i) => b(3 + i * 8, 11, 6, 5))),
  ranking: svg(b(3, 2.5, 6, 3, "#666") + b(10, 2.5, 6, 3) + rep(3, (i) => im(3 + i * 8, 8, 6, 9))),
  carousel: svg(rep(3, (i) => im(2 + i * 8, 4, 6, 12)) + `<path d="M25 8l2 2-2 2" stroke="#666" stroke-width="1" fill="none"/>`),
  topics: svg(rep(4, (i) => im(2 + i * 6.3, 5, 5, 10))),
  info: svg(rep(3, (i) => b(2, 4.5 + i * 4.5, 5, 2, "#cfcfcf") + l(9, 5 + i * 4.5, 15))),

  // LIST
  breadcrumb: svg(b(2, 8, 5, 3) + b(9, 8, 7, 3) + b(18, 8, 7, 3)),
  "page-title": svg(b(2, 4, 15, 4, "#c2c2c2") + l(2, 12, 10)),
  sortbar: svg(b(2, 7, 24, 6, "#eee") + b(4, 9, 6, 2, "#bbb") + b(19, 9, 5, 2, "#bbb")),
  "list-body": svg(b(2, 3, 6, 14, "#eee") + rep(2, (i) => im(10 + i * 8, 3, 7, 6)) + rep(2, (i) => im(10 + i * 8, 11, 7, 6))),
  pagination: svg(b(4, 8, 4, 5, "#666") + rep(3, (i) => b(9 + i * 5, 8, 4, 5))),

  // DETAIL
  "detail-main": svg(im(2, 3, 12, 14) + l(16, 5, 9) + l(16, 8, 7) + l(16, 11, 9) + b(16, 13.5, 9, 3.5, "#c2c2c2")),
  "detail-desc": svg(l(2, 4, 11) + b(2, 7, 24, 10) + `<path d="M2 17L26 7" stroke="#adadad" stroke-width=".6" fill="none"/>`),
  review: svg(rep(5, (i) => c(4 + i * 3.4, 4.5, 1.3, "#e6c34d")) + l(2, 9, 22) + l(2, 13, 16)),
  related: svg(rep(3, (i) => im(2 + i * 8, 4, 6, 12)) + `<path d="M25 8l2 2-2 2" stroke="#666" stroke-width="1" fill="none"/>`),

  // CART
  "cart-steps": svg(`<path d="M4 10H24" stroke="#999" stroke-width=".8"/>` + rep(4, (i) => c(4 + i * 6.7, 10, 1.8, i === 0 ? "#666" : "#d8d8d8"))),
  "cart-items": svg(im(2, 4, 8, 11) + l(12, 6, 11) + l(12, 10, 7) + b(20, 12, 5, 3, "#c2c2c2")),
  "cart-summary": svg(b(6, 3, 16, 14, "#f3f3f3") + l(9, 6, 10) + l(9, 9, 10) + b(9, 12, 10, 3, "#666")),

  // MYPAGE
  "mypage-overview": svg(c(6, 10, 4) + l(12, 7, 12) + l(12, 12, 8)),
  "mypage-menu": svg(rep(3, (i) => b(3 + i * 8, 4, 6, 5)) + rep(3, (i) => b(3 + i * 8, 11, 6, 5))),

  // LP / 자유
  "free-banner": svg(im(2, 3, 24, 14)),
  "free-text": svg(b(2, 4, 11, 3, "#c2c2c2") + l(2, 10, 22) + l(2, 14, 18)),
  "media-text": svg(im(2, 4, 12, 12) + l(16, 6, 9) + l(16, 9, 7) + l(16, 12, 9) + b(19, 15, 6, 2.4, "#666")),
  "feature-cols": svg(rep(3, (i) => c(5 + i * 9, 6, 2.6) + l(2.5 + i * 9, 11, 6) + l(3.5 + i * 9, 14, 4))),
  "cta-band": svg(b(2, 5, 24, 10, "#f0f0f0") + b(10, 8, 8, 4, "#666")),
  faq: svg(rep(3, (i) => b(3, 3.5 + i * 5, 22, 4) + `<path d="M22 5.5${i * 5 > 0 ? "" : ""}h2M23 ${4.5 + i * 5}v2" stroke="#666" stroke-width=".7"/>`)),
  steps: svg(rep(3, (i) => b(2 + i * 9, 7, 6, 7)) + `<path d="M8.5 10.5h2M17.5 10.5h2" stroke="#666" stroke-width="1"/>`),
  voice: svg(c(6, 7, 3) + rep(3, (i) => c(11 + i * 2.6, 6, 1, "#e6c34d")) + l(3, 13, 22) + l(3, 16, 15)),
  custom: svg(l(3, 3, 14) + im(3, 7, 11, 6) + b(3, 15, 9, 3, "#666") + `<path d="M20 3l4 4-4 4" stroke="#999" stroke-width=".7" fill="none"/>`),
};

// 기본(미정의) 아이콘
const fallback = svg(b(3, 4, 22, 12) + l(6, 8, 12) + l(6, 12, 8));

export function iconFor(id) {
  return icons[id] || fallback;
}
