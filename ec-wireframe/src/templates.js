// templates.js — ページ種別ごとの標準セクション構成 (page-templates.md ベース)
// 各項目: { comp: コンポーネントid, opts?: 初期オプション }
// header / footer / cookie-bar は export.js で全ページ共通として自動挿入。

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

// 各ページ種別でパレットに表示する追加可能なコンポーネント(順序=表示順)。
// 共通コンポーネントは全ページで追加可能。
export const COMMON = ["custom", "carousel", "topics", "category-grid", "info", "free-banner", "free-text"];
// LP/特集型リッチコンポーネント — 全ページで追加可能
export const LP_RICH = ["media-text", "feature-cols", "cta-band", "faq", "steps", "voice"];
export const palette = {
  top: ["hero", "promo", "ranking", ...COMMON, ...LP_RICH],
  list: ["breadcrumb", "page-title", "sortbar", "list-body", "pagination", ...COMMON, ...LP_RICH],
  detail: ["breadcrumb", "detail-main", "detail-desc", "review", "related", ...COMMON, ...LP_RICH],
  cart: ["cart-steps", "cart-items", "cart-summary", ...COMMON, ...LP_RICH],
  mypage: ["mypage-overview", "mypage-menu", ...COMMON, ...LP_RICH],
  lp: ["free-banner", "media-text", "feature-cols", "voice", "faq", "steps", "cta-band", "free-text", "hero", "promo", ...COMMON],
};
