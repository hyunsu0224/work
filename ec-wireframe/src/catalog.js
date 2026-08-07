// catalog.js — 컴포넌트 사전 (components.md 기반)
// 각 컴포넌트: { options:[스키마], render(opts, ctx)->html(<section> 포함) }
// ctx = { lang, notes }  (notes = strings[lang].note)
// 출력 마크업은 demo/*.html 과 동일한 wf-* 구조. EC 콘텐츠 라벨은 일본어 고정.

// ---- 헬퍼 --------------------------------------------------------------
function note(ctx, key, opts) {
  const fn = ctx.notes && ctx.notes[key];
  if (!fn) return "";
  const txt = fn(opts || {});
  return txt ? `<span class="wf-note">${txt}</span>` : "";
}

function card(o = {}) {
  const badge = o.badge ? `<span class="wf-card__badge">${o.badgeText || "NEW"}</span>` : "";
  const fav = o.fav === false ? "" : `<span class="wf-card__fav">♡</span>`;
  const rank = o.rank ? ` data-rank="${o.rank}"` : "";
  const cat = o.cat || "カテゴリ";
  const name = o.name || "商品名テキストが入ります";
  const priceTxt = o.price || "¥0,000";
  const price = o.sale
    ? `<div class="wf-card__price wf-card__price--sale"><del>${priceTxt}</del>30%OFF ${priceTxt}（税込）</div>`
    : `<div class="wf-card__price">${priceTxt}（税込）</div>`;
  return `<div class="wf-card">
        <div class="wf-card__thumb"${rank}><div class="wf-box wf-box--img wf-box--sq">商品画像</div>${badge}${fav}</div>
        <div class="wf-card__cat">${cat}</div>
        <div class="wf-card__name">${name}</div>
        ${price}
      </div>`;
}

// 카드 내용 오버라이드 옵션(공통) — 비우면 더미
const cardContentOpts = [
  { key: "name", type: "text", default: "", label: "상품명 / 商品名" },
  { key: "cat", type: "text", default: "", label: "카테고리 / カテゴリ" },
  { key: "price", type: "text", default: "", label: "가격 / 価格 (예: ¥3,900)" },
];

function cards(n, o = {}) {
  return Array.from({ length: n }, (_, i) => card({ ...o, rank: o.ranked ? i + 1 : undefined })).join("\n        ");
}

function section(inner, cls = "") {
  return `  <section class="wf-section${cls ? " " + cls : ""}">
    <div class="wf-container">
${inner}
    </div>
  </section>`;
}

// 옵션 스키마 타입: number{min,max,step} / bool / select{choices:[[value,label]]} / text
export const catalog = {
  // ---------------------------------------------------------------- TOP
  hero: {
    options: [
      { key: "slides", type: "number", min: 1, max: 10, default: 5, label: "슬라이드 매수 / 枚数" },
      { key: "autoplay", type: "bool", default: true, label: "자동재생 / 自動再生" },
      { key: "arrows", type: "bool", default: true, label: "화살표 표시 / 矢印表示" },
      { key: "indicator", type: "bool", default: true, label: "인디케이터 / インジケータ" },
    ],
    render(o, ctx) {
      const n = Math.max(1, o.slides || 5);
      const slides = Array.from(
        { length: n },
        (_, i) => `        <div class="wf-slider__slide"><div class="wf-box wf-box--img wf-box--hero">HERO ${i + 1} / ${n}</div></div>`
      ).join("\n");
      const arrows = o.arrows && n > 1
        ? `\n        <button class="wf-slider__arrow wf-slider__arrow--prev" aria-label="prev">‹</button>\n        <button class="wf-slider__arrow wf-slider__arrow--next" aria-label="next">›</button>`
        : "";
      const dots = o.indicator && n > 1
        ? `\n        <div class="wf-slider__dots">${Array.from({ length: n }, () => "<i></i>").join("")}</div>`
        : "";
      return section(`      <div class="wf-slider" data-autoplay="${o.autoplay ? 1 : 0}" data-interval="4000">
        <div class="wf-slider__track">
${slides}
        </div>${arrows}${dots}
      </div>
      ${note(ctx, "hero", o)}`);
    },
  },

  promo: {
    options: [{ key: "cols", type: "number", min: 2, max: 4, default: 2, label: "열수 / 列数" }],
    render(o) {
      const n = o.cols || 2;
      const tiles = Array.from({ length: n }, () => `<div class="wf-box wf-box--img wf-box--tall">プロモバナー</div>`).join("\n        ");
      return section(`      <div class="wf-grid wf-grid--${n}">
        ${tiles}
      </div>`);
    },
  },

  "category-grid": {
    options: [
      { key: "cols", type: "number", min: 3, max: 6, default: 5, label: "열수 / 列数" },
      { key: "labels", type: "text", default: "", label: "타일 라벨(콤마) / タイルラベル" },
    ],
    render(o, ctx) {
      const n = o.cols || 5;
      const labels = (o.labels || "").split(",").map((s) => s.trim()).filter(Boolean);
      const tiles = Array.from({ length: n }, (_, i) => `<li><a class="wf-box wf-box--img wf-box--sq" href="/shop/c/c{code}/">${labels[i] || "カテゴリ"}</a></li>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">カテゴリから探す CATEGORY</h2>
      ${note(ctx, "category-grid", o)}
      <ul class="wf-grid wf-grid--${n}" style="margin-top:8px;">
        ${tiles}
      </ul>`);
    },
  },

  ranking: {
    options: [
      { key: "count", type: "number", min: 3, max: 8, default: 4, label: "표시 개수 / 表示数" },
      { key: "tabs", type: "text", default: "総合,カテゴリA,カテゴリB,カテゴリC", label: "탭(콤마) / タブ" },
      ...cardContentOpts,
    ],
    render(o, ctx) {
      const tabs = (o.tabs || "総合,カテゴリA,カテゴリB,カテゴリC").split(",").map((t, i) =>
        `<span${i === 0 ? ' class="is-active"' : ""}>${t.trim()}</span>`).join("");
      return section(`      <h2 class="wf-section__ttl">ランキング RANKING</h2>
      <div class="wf-rank-tabs">${tabs}</div>
      ${note(ctx, "ranking", o)}
      <div class="wf-carousel" style="margin-top:8px;">
        ${cards(o.count || 4, { ranked: true, fav: true, name: o.name, cat: o.cat, price: o.price })}
      </div>`, "wf-rank");
    },
  },

  carousel: {
    options: [
      { key: "title", type: "text", default: "おすすめ商品", label: "제목 / タイトル" },
      { key: "count", type: "number", min: 2, max: 8, default: 4, label: "표시 개수 / 表示数" },
      { key: "badge", type: "bool", default: true, label: "NEW뱃지 / NEWバッジ" },
      { key: "sale", type: "bool", default: false, label: "SALE 표기 / SALE表示" },
      { key: "more", type: "bool", default: true, label: "もっと見る 버튼" },
      ...cardContentOpts,
    ],
    render(o, ctx) {
      const n = o.count || 4;
      const cc = { name: o.name, cat: o.cat, price: o.price };
      const list = Array.from({ length: n }, (_, i) =>
        card({ ...cc, badge: o.badge && i % 2 === 0, sale: o.sale && i === 1 })
      ).join("\n        ");
      const more = o.more ? `\n      <div class="wf-box wf-more">もっと見る ＞</div>` : "";
      return section(`      <h2 class="wf-section__ttl">${o.title || "おすすめ商品"}</h2>
      ${note(ctx, "carousel", o)}
      <div class="wf-carousel" style="margin-top:8px;">
        ${list}
      </div>${more}`);
    },
  },

  topics: {
    options: [{ key: "cols", type: "number", min: 2, max: 4, default: 4, label: "열수 / 列数" }],
    render(o, ctx) {
      const n = o.cols || 4;
      const tiles = Array.from({ length: n }, () => `<li><a class="wf-box wf-box--img wf-box--tall" href="/shop/e/e{code}/">特集バナー</a></li>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">特集から探す TOPICS</h2>
      ${note(ctx, "topics", o)}
      <ul class="wf-grid wf-grid--${n}" style="margin-top:8px;">
        ${tiles}
      </ul>`);
    },
  },

  info: {
    options: [{ key: "rows", type: "number", min: 1, max: 8, default: 3, label: "행수 / 行数" }],
    render(o) {
      const rows = Array.from({ length: o.rows || 3 }, () =>
        `<li class="wf-flex" style="border-bottom:1px dashed #ccc;padding:10px 0;"><span class="wf-card__cat" style="flex:0 0 90px;">2026.00.00</span><span>お知らせタイトルが入ります</span></li>`
      ).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">INFORMATION</h2>
      <ul>
        ${rows}
      </ul>`);
    },
  },

  // ---------------------------------------------------------------- LIST
  breadcrumb: {
    options: [],
    render(o, ctx) {
      return section(`      <div class="wf-breadcrumb"><span>ホーム</span><span>カテゴリ</span><span>現在のページ</span></div>
      ${note(ctx, "breadcrumb", o)}`);
    },
  },

  "page-title": {
    options: [
      { key: "title", type: "text", default: "", label: "카테고리명 / カテゴリ名" },
      { key: "count", type: "text", default: "", label: "건수 / 件数 (예: 128)" },
      { key: "sub", type: "bool", default: true, label: "서브카테고리 칩 / サブカテゴリ" },
    ],
    render(o) {
      const ttl = o.title || "カテゴリ名";
      const cnt = o.count || "000";
      const chips = o.sub
        ? `\n      <div class="wf-variant__chips" style="margin-top:10px;"><span class="wf-chip">サブA</span><span class="wf-chip">サブB</span><span class="wf-chip">サブC</span></div>`
        : "";
      return section(`      <h1 class="wf-section__ttl" style="font-size:20px;">${ttl} <span style="font-size:13px;color:#888;font-weight:normal;">（全 ${cnt} 件）</span></h1>${chips}`);
    },
  },

  sortbar: {
    options: [{ key: "viewToggle", type: "bool", default: true, label: "뷰전환 / 表示切替" }],
    render(o, ctx) {
      const view = o.viewToggle ? `<span class="wf-chip">▦</span><span class="wf-chip">▤</span>` : "";
      return section(`      <div class="wf-sortbar">
        <div>並び替え：<span class="wf-chip">新着順 ▾</span></div>
        <div class="wf-flex">表示：<span class="wf-chip">40件 ▾</span>${view}</div>
      </div>
      ${note(ctx, "sortbar", o)}`);
    },
  },

  "list-body": {
    options: [
      { key: "cols", type: "number", min: 2, max: 4, default: 4, label: "상품 열수 / 商品列数" },
      { key: "count", type: "number", min: 4, max: 16, default: 8, label: "표시 건수 / 表示件数" },
      ...cardContentOpts,
    ],
    render(o, ctx) {
      const n = o.cols || 4;
      const grid = cards(o.count || 8, { badge: false, name: o.name, cat: o.cat, price: o.price });
      return section(`      ${note(ctx, "list-body", o)}
      <div class="wf-listlayout" style="margin-top:8px;">
        <aside class="wf-filter">
          <div class="wf-filter__group"><b>価格</b><br>□ 〜3,000円<br>□ 3,000〜5,000円</div>
          <div class="wf-filter__group"><b>カラー</b><br>□ 黒 □ 白 □ 赤</div>
          <div class="wf-filter__group"><b>サイズ</b><br>□ S □ M □ L</div>
          <div class="wf-filter__group"><b>ブランド</b><br>□ A □ B □ C</div>
        </aside>
        <div class="wf-grid wf-grid--${n}">
        ${grid}
        </div>
      </div>`);
    },
  },

  pagination: {
    options: [{ key: "type", type: "select", default: "number", choices: [["number", "번호형 / 番号"], ["more", "もっと見る"]], label: "타입 / タイプ" }],
    render(o, ctx) {
      if (o.type === "more") {
        return section(`      <div class="wf-box wf-more">もっと見る ＞</div>
      ${note(ctx, "pagination", o)}`);
      }
      return section(`      <div class="wf-pagination"><span>‹</span><span class="is-current">1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>›</span></div>
      ${note(ctx, "pagination", o)}`);
    },
  },

  // ---------------------------------------------------------------- DETAIL
  "detail-main": {
    options: [
      { key: "variant", type: "text", default: "サイズ·色", label: "variant 축 / 軸" },
      { key: "stickyCta", type: "bool", default: true, label: "SP 하단고정 cta" },
      { key: "instant", type: "bool", default: true, label: "즉시구매 / 今すぐ購入" },
    ],
    render(o, ctx) {
      const chips = `<span class="wf-chip">S</span><span class="wf-chip">M</span><span class="wf-chip">L</span>`;
      const sub = o.instant
        ? `<div class="wf-cta wf-cta--sub">今すぐ購入</div><div class="wf-cta wf-cta--sub">♡ お気に入り</div>`
        : `<div class="wf-cta wf-cta--sub">♡ お気に入り</div>`;
      return section(`      ${note(ctx, "detail-main", o)}
      <div class="wf-detail" style="margin-top:8px;">
        <div>
          <div class="wf-box wf-box--img wf-gallery__main" style="min-height:360px;">商品メイン画像</div>
          <div class="wf-gallery__thumbs">
            <div class="wf-box wf-box--img">1</div><div class="wf-box wf-box--img">2</div>
            <div class="wf-box wf-box--img">3</div><div class="wf-box wf-box--img">4</div>
          </div>
        </div>
        <div>
          <div class="wf-card__cat">ブランド名</div>
          <h1 style="font-size:18px;margin:6px 0;">商品名テキストが入ります</h1>
          <div class="wf-card__price" style="font-size:20px;">¥0,000（税込）</div>
          <div class="wf-variant">
            <b>${o.variant || "サイズ·色"}</b>
            <div class="wf-variant__chips">${chips}</div>
          </div>
          <div class="wf-variant">数量 <span class="wf-chip">− 1 ＋</span></div>
          <div class="wf-cta">カートに入れる</div>
          ${sub}
        </div>
      </div>`);
    },
  },

  "detail-desc": {
    options: [],
    render() {
      return section(`      <h2 class="wf-section__ttl">商品説明</h2>
      <div class="wf-box" style="min-height:40px;justify-content:flex-start;padding:12px;">スペック表（素材 / サイズ / 原産国 …）</div>
      <div class="wf-box wf-box--img wf-box--tall" style="margin-top:12px;">説明画像 本文</div>`);
    },
  },

  review: {
    options: [{ key: "count", type: "number", min: 1, max: 6, default: 3, label: "리뷰 표시수 / 表示数" }],
    render(o, ctx) {
      const rows = Array.from({ length: o.count || 3 }, () =>
        `<li style="border-bottom:1px dashed #ccc;padding:12px 0;"><b>★★★★☆</b> レビュータイトル<br><span style="color:#888;font-size:12px;">レビュー本文が入ります…</span></li>`
      ).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">レビュー REVIEW</h2>
      ${note(ctx, "review", o)}
      <ul>
        ${rows}
      </ul>`);
    },
  },

  related: {
    options: [{ key: "count", type: "number", min: 2, max: 8, default: 4, label: "표시 개수 / 表示数" }],
    render(o, ctx) {
      return section(`      <h2 class="wf-section__ttl">この商品を見た人はこちらも RELATED</h2>
      ${note(ctx, "related", o)}
      <div class="wf-carousel" style="margin-top:8px;">
        ${cards(o.count || 4, {})}
      </div>`);
    },
  },

  // ---------------------------------------------------------------- CART
  "cart-steps": {
    options: [],
    render(o, ctx) {
      return section(`      <div class="wf-steps"><span class="is-current">カート</span><span>情報入力</span><span>確認</span><span>完了</span></div>
      ${note(ctx, "cart-steps", o)}`);
    },
  },

  "cart-items": {
    options: [{ key: "count", type: "number", min: 1, max: 6, default: 2, label: "아이템 수 / 件数" }],
    render(o) {
      const rows = Array.from({ length: o.count || 2 }, () =>
        `<div class="wf-cartitem">
          <div class="wf-box wf-box--img">画像</div>
          <div><div class="wf-card__cat">ブランド</div><div>商品名テキスト</div><div style="color:#888;font-size:12px;">サイズ:M / カラー:黒</div></div>
          <div style="text-align:right;"><div class="wf-chip">− 1 ＋</div><div style="margin-top:8px;font-weight:bold;">¥0,000</div><div style="font-size:12px;color:#888;margin-top:6px;">削除</div></div>
        </div>`
      ).join("\n      ");
      return section(`      <h2 class="wf-section__ttl">カート内商品</h2>
      ${rows}`);
    },
  },

  "cart-summary": {
    options: [{ key: "coupon", type: "bool", default: true, label: "쿠폰·포인트 / クーポン" }],
    render(o) {
      const coupon = o.coupon ? `<div class="wf-summary__row"><span>クーポン / ポイント</span><span>入力 ▾</span></div>` : "";
      return section(`      <div style="max-width:420px;margin-left:auto;">
        <div class="wf-summary">
          <div class="wf-summary__row"><span>小計</span><span>¥0,000</span></div>
          <div class="wf-summary__row"><span>送料</span><span>¥000</span></div>
          ${coupon}
          <div class="wf-summary__row" style="font-weight:bold;border:none;"><span>合計</span><span>¥0,000（税込）</span></div>
          <div class="wf-cta" style="margin-top:12px;">レジに進む</div>
        </div>
      </div>`);
    },
  },

  // ---------------------------------------------------------------- MYPAGE
  "mypage-overview": {
    options: [],
    render() {
      return section(`      <div class="wf-flex" style="align-items:center;gap:20px;">
        <div class="wf-box wf-box--sq" style="width:72px;">👤</div>
        <div><b>会員名 様</b><br><span style="color:#888;font-size:12px;">保有ポイント: 0,000 pt / 会員ランク: レギュラー</span></div>
      </div>`);
    },
  },

  "mypage-menu": {
    options: [{ key: "cols", type: "number", min: 2, max: 4, default: 3, label: "열수 / 列数" }],
    render(o, ctx) {
      const items = ["注文履歴", "お気に入り", "会員情報", "住所帳", "クーポン", "ポイント履歴"];
      const tiles = items.map((t) => `<li><a class="wf-box" href="#" style="min-height:80px;flex-direction:column;">${t}</a></li>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">メニュー</h2>
      ${note(ctx, "mypage-menu", o)}
      <ul class="wf-grid wf-grid--${o.cols || 3}" style="margin-top:8px;">
        ${tiles}
      </ul>`);
    },
  },

  // ---------------------------------------------------------------- LP / 자유
  "free-banner": {
    options: [{ key: "height", type: "select", default: "hero", choices: [["hero", "특대 / 特大"], ["tall", "큰 / 大"], ["", "보통 / 中"]], label: "높이 / 高さ" }],
    render(o) {
      const h = o.height === "" ? "" : ` wf-box--${o.height || "hero"}`;
      return section(`      <div class="wf-box wf-box--img${h}">フリーバナー / メインビジュアル</div>`);
    },
  },

  "free-text": {
    options: [{ key: "heading", type: "text", default: "セクション見出し", label: "제목 / 見出し" }],
    render(o) {
      return section(`      <h2 class="wf-section__ttl">${o.heading || "セクション見出し"}</h2>
      <div class="wf-box" style="min-height:80px;justify-content:flex-start;padding:12px;">自由テキスト・説明文が入ります。</div>`);
    },
  },
};

// 컴포넌트 기본 옵션 추출
export function defaultOpts(compId) {
  const c = catalog[compId];
  if (!c) return {};
  const o = {};
  (c.options || []).forEach((opt) => (o[opt.key] = opt.default));
  return o;
}
