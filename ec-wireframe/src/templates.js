// templates.js — 페이지 유형별 표준 섹션 구성 (page-templates.md 기반)
// 각 항목: { comp: 컴포넌트id, opts?: 초기옵션 }
// header / footer / cookie-bar 는 export.js에서 전 페이지 공통으로 자동 삽입.

export const PAGE_TYPES = ["top", "list", "detail", "cart", "mypage", "lp"];

export const templates = {
  top: [
    { comp: "hero", opts: { slides: 5, autoplay: true, indicator: true } },
    { comp: "promo", opts: { cols: 2 } },
    { comp: "category-grid", opts: { cols: 5 } },
    { comp: "ranking", opts: {} },
    { comp: "carousel", opts: { title: "新着商品 NEW ARRIVALS", badge: true, sale: true, more: true } },
    { comp: "topics", opts: { cols: 4 } },
    { comp: "info", opts: {} },
  ],
  list: [
    { comp: "breadcrumb", opts: {} },
    { comp: "page-title", opts: {} },
    { comp: "sortbar", opts: {} },
    { comp: "list-body", opts: { cols: 4 } },
    { comp: "pagination", opts: {} },
  ],
  detail: [
    { comp: "breadcrumb", opts: {} },
    { comp: "detail-main", opts: { variant: "サイズ·色", stickyCta: true } },
    { comp: "detail-desc", opts: {} },
    { comp: "review", opts: {} },
    { comp: "related", opts: {} },
  ],
  cart: [
    { comp: "cart-steps", opts: {} },
    { comp: "cart-items", opts: {} },
    { comp: "cart-summary", opts: {} },
  ],
  mypage: [
    { comp: "mypage-overview", opts: {} },
    { comp: "mypage-menu", opts: {} },
    { comp: "related", opts: {} },
  ],
  lp: [
    { comp: "free-banner", opts: {} },
    { comp: "feature-cols", opts: { cols: 3 } },
    { comp: "media-text", opts: { imageSide: "right", anim: "fade" } },
    { comp: "media-text", opts: { imageSide: "left", anim: "slide", slides: 3 } },
    { comp: "voice", opts: {} },
    { comp: "carousel", opts: { title: "おすすめ商品", badge: true, sale: false, more: true } },
    { comp: "faq", opts: {} },
    { comp: "cta-band", opts: {} },
  ],
};

// 각 페이지 유형에서 팔레트에 노출할 추가 가능한 컴포넌트(순서=표시순).
// 공통 컴포넌트는 모든 페이지에서 추가 가능.
const COMMON = ["custom", "carousel", "topics", "category-grid", "info", "free-banner", "free-text"];
// LP/특집형 리치 컴포넌트 — 전 페이지에서 추가 가능
const LP_RICH = ["media-text", "feature-cols", "cta-band", "faq", "steps", "voice"];
export const palette = {
  top: ["hero", "promo", "ranking", ...COMMON, ...LP_RICH],
  list: ["breadcrumb", "page-title", "sortbar", "list-body", "pagination", ...COMMON, ...LP_RICH],
  detail: ["breadcrumb", "detail-main", "detail-desc", "review", "related", ...COMMON, ...LP_RICH],
  cart: ["cart-steps", "cart-items", "cart-summary", ...COMMON, ...LP_RICH],
  mypage: ["mypage-overview", "mypage-menu", ...COMMON, ...LP_RICH],
  lp: ["free-banner", "media-text", "feature-cols", "voice", "faq", "steps", "cta-band", "free-text", "hero", "promo", ...COMMON],
};
