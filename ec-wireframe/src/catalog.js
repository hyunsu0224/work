// catalog.js — 컴포넌트 사전 (components.md 기반)
// 각 컴포넌트: { options:[스키마], render(opts, ctx)->html(<section> 포함) }
// ctx = { lang, notes }
// 옵션 label / select choice label 은 {ko, ja} 로 언어별 분리(빌더 UI가 언어 토글 따라감).
// 출력 마크업의 EC 콘텐츠 라벨은 일본어 고정(일본 EC 사이트 대상).

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

function cards(n, o = {}) {
  return Array.from({ length: n }, (_, i) => card({ ...o, rank: o.ranked ? i + 1 : undefined })).join("\n        ");
}

// 상품 캐러셀 — 좌우 화살표로 실제 스크롤(슬라이드)되는 이미지 영역
function carouselSlider(cardsHtml) {
  return `<div class="wf-carousel-wrap" style="margin-top:8px;">
        <button class="wf-carousel__nav wf-carousel__nav--prev" aria-label="prev">‹</button>
        <div class="wf-carousel">
        ${cardsHtml}
        </div>
        <button class="wf-carousel__nav wf-carousel__nav--next" aria-label="next">›</button>
      </div>`;
}

function section(inner, cls = "") {
  return `  <section class="wf-section${cls ? " " + cls : ""}">
    <div class="wf-container">
${inner}
    </div>
  </section>`;
}

// 사용자 입력 텍스트 이스케이프(커스텀 블럭용)
function escText(s) {
  return String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// 커스텀 블럭 원시요소 1개 → 마크업
function renderPrimitive(el) {
  const al = `text-align:${el.align === "center" ? "center" : el.align === "right" ? "right" : "left"};`;
  switch (el.type) {
    case "heading":
      return `      <h2 class="wf-section__ttl" style="${al}border:0;padding-left:0;">${escText(el.text || "見出し")}</h2>`;
    case "text":
      return `      <p style="${al}line-height:1.7;color:#333;margin:8px 0;">${escText(el.text || "テキストが入ります。")}</p>`;
    case "image": {
      const h = { sm: "120px", md: "200px", lg: "320px", hero: "360px" }[el.size] || "200px";
      return `      <div style="${al}"><span class="wf-box wf-box--img" style="display:inline-flex;min-height:${h};min-width:220px;vertical-align:top;">${escText(el.label || "画像")}</span></div>`;
    }
    case "button":
      return `      <div style="${al}margin:10px 0;"><a class="wf-btn" href="#">${escText(el.text || "ボタン")}</a></div>`;
    case "spacer": {
      const h = { sm: "12px", md: "28px", lg: "56px" }[el.size] || "28px";
      return `      <div style="height:${h};"></div>`;
    }
    case "divider":
      return `      <hr style="border:0;border-top:1px solid #ccc;margin:16px 0;">`;
    default:
      return "";
  }
}

// 카드 내용 오버라이드 옵션(공통) — 비우면 더미
const cardContentOpts = [
  { key: "name", type: "text", default: "", label: { ko: "상품명", ja: "商品名" } },
  { key: "cat", type: "text", default: "", label: { ko: "카테고리", ja: "カテゴリ" } },
  { key: "price", type: "text", default: "", label: { ko: "가격 (예: ¥3,900)", ja: "価格 (例: ¥3,900)" } },
];

// 옵션 스키마 타입: number{min,max,step} / bool / select{choices:[[value,label]]} / text
export const catalog = {
  // ---------------------------------------------------------------- TOP
  hero: {
    options: [
      { key: "slides", type: "number", min: 1, max: 10, default: 5, label: { ko: "슬라이드 매수", ja: "スライド枚数" } },
      { key: "autoplay", type: "bool", default: true, label: { ko: "자동재생", ja: "自動再生" } },
      { key: "arrows", type: "bool", default: true, label: { ko: "화살표 표시", ja: "矢印表示" } },
      { key: "indicator", type: "bool", default: true, label: { ko: "인디케이터", ja: "インジケータ" } },
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
    options: [{ key: "cols", type: "number", min: 2, max: 4, default: 2, label: { ko: "열 수", ja: "列数" } }],
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
      { key: "cols", type: "number", min: 3, max: 6, default: 5, label: { ko: "열 수", ja: "列数" } },
      { key: "labels", type: "text", default: "", label: { ko: "타일 라벨(콤마)", ja: "タイルラベル(カンマ)" } },
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
      { key: "count", type: "number", min: 3, max: 8, default: 4, label: { ko: "표시 개수", ja: "表示数" } },
      { key: "tabs", type: "text", default: "総合,カテゴリA,カテゴリB,カテゴリC", label: { ko: "탭(콤마 구분)", ja: "タブ(カンマ区切り)" } },
      ...cardContentOpts,
    ],
    render(o, ctx) {
      const tabsArr = (o.tabs || "総合,カテゴリA,カテゴリB,カテゴリC").split(",").map((s) => s.trim()).filter(Boolean);
      const count = o.count || 4;
      const head = tabsArr.map((t, i) => `<button class="wf-tab${i === 0 ? " is-active" : ""}" data-tab="${i}">${t}</button>`).join("");
      const panels = tabsArr
        .map((t, i) => {
          const cardsHtml = cards(count, { ranked: true, fav: true, name: o.name, cat: o.cat || t, price: o.price });
          return `        <div class="wf-tabpanel${i === 0 ? " is-active" : ""}" data-panel="${i}">
          ${carouselSlider(cardsHtml)}
        </div>`;
        })
        .join("\n");
      return section(`      <h2 class="wf-section__ttl">ランキング RANKING</h2>
      <div class="wf-tabs">
        <div class="wf-tabs__head">${head}</div>
        ${note(ctx, "ranking", o)}
        <div class="wf-tabs__body">
${panels}
        </div>
      </div>`, "wf-rank");
    },
  },

  carousel: {
    options: [
      { key: "title", type: "text", default: "おすすめ商品", label: { ko: "제목", ja: "タイトル" } },
      { key: "count", type: "number", min: 2, max: 8, default: 4, label: { ko: "표시 개수", ja: "表示数" } },
      { key: "badge", type: "bool", default: true, label: { ko: "NEW 뱃지", ja: "NEWバッジ" } },
      { key: "sale", type: "bool", default: false, label: { ko: "SALE 표기", ja: "SALE表示" } },
      { key: "more", type: "bool", default: true, label: { ko: "더보기 버튼", ja: "もっと見るボタン" } },
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
      ${carouselSlider(list)}${more}`);
    },
  },

  topics: {
    options: [{ key: "cols", type: "number", min: 2, max: 4, default: 4, label: { ko: "열 수", ja: "列数" } }],
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
    options: [{ key: "rows", type: "number", min: 1, max: 8, default: 3, label: { ko: "행 수", ja: "行数" } }],
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
      { key: "title", type: "text", default: "", label: { ko: "카테고리명", ja: "カテゴリ名" } },
      { key: "count", type: "text", default: "", label: { ko: "건수 (예: 128)", ja: "件数 (例: 128)" } },
      { key: "sub", type: "bool", default: true, label: { ko: "서브카테고리 칩", ja: "サブカテゴリチップ" } },
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
    options: [{ key: "viewToggle", type: "bool", default: true, label: { ko: "뷰 전환", ja: "表示切替" } }],
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
      { key: "cols", type: "number", min: 2, max: 4, default: 4, label: { ko: "상품 열 수", ja: "商品列数" } },
      { key: "count", type: "number", min: 4, max: 16, default: 8, label: { ko: "표시 건수", ja: "表示件数" } },
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
    options: [{
      key: "type", type: "select", default: "number", label: { ko: "타입", ja: "タイプ" },
      choices: [["number", { ko: "번호형", ja: "番号型" }], ["more", { ko: "더보기(무한로드)", ja: "もっと見る" }]],
    }],
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
      { key: "variant", type: "text", default: "サイズ·色", label: { ko: "variant 축", ja: "バリアント軸" } },
      { key: "gallery", type: "number", min: 2, max: 8, default: 4, label: { ko: "갤러리 매수", ja: "ギャラリー枚数" } },
      { key: "stickyCta", type: "bool", default: true, label: { ko: "SP 하단고정 CTA", ja: "SP下部固定CTA" } },
      { key: "instant", type: "bool", default: true, label: { ko: "즉시구매", ja: "今すぐ購入" } },
    ],
    render(o, ctx) {
      const gN = Math.max(2, o.gallery || 4);
      const thumbs = Array.from(
        { length: gN },
        (_, i) => `<div class="wf-box wf-box--img${i === 0 ? " is-active" : ""}" data-idx="${i}">${i + 1}</div>`
      ).join("");
      const chips = `<span class="wf-chip">S</span><span class="wf-chip">M</span><span class="wf-chip">L</span>`;
      const sub = o.instant
        ? `<div class="wf-cta wf-cta--sub">今すぐ購入</div><div class="wf-cta wf-cta--sub">♡ お気に入り</div>`
        : `<div class="wf-cta wf-cta--sub">♡ お気に入り</div>`;
      return section(`      ${note(ctx, "detail-main", o)}
      <div class="wf-detail" style="margin-top:8px;">
        <div>
          <div class="wf-gallery" data-count="${gN}">
            <div class="wf-gallery__stage">
              <button class="wf-gallery__nav wf-gallery__nav--prev" aria-label="prev">‹</button>
              <div class="wf-box wf-box--img wf-gallery__main" style="min-height:360px;">商品画像 <span class="wf-gallery__idx">1</span> / ${gN}</div>
              <button class="wf-gallery__nav wf-gallery__nav--next" aria-label="next">›</button>
            </div>
            <div class="wf-gallery__thumbs">${thumbs}</div>
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
    options: [{ key: "count", type: "number", min: 1, max: 6, default: 3, label: { ko: "리뷰 표시수", ja: "表示数" } }],
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
    options: [{ key: "count", type: "number", min: 2, max: 8, default: 4, label: { ko: "표시 개수", ja: "表示数" } }],
    render(o, ctx) {
      return section(`      <h2 class="wf-section__ttl">この商品を見た人はこちらも RELATED</h2>
      ${note(ctx, "related", o)}
      ${carouselSlider(cards(o.count || 4, {}))}`);
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
    options: [{ key: "count", type: "number", min: 1, max: 6, default: 2, label: { ko: "아이템 수", ja: "件数" } }],
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
    options: [{ key: "coupon", type: "bool", default: true, label: { ko: "쿠폰·포인트", ja: "クーポン·ポイント" } }],
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
    options: [{ key: "cols", type: "number", min: 2, max: 4, default: 3, label: { ko: "열 수", ja: "列数" } }],
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
    options: [{
      key: "height", type: "select", default: "hero", label: { ko: "높이", ja: "高さ" },
      choices: [["hero", { ko: "특대", ja: "特大" }], ["tall", { ko: "큰", ja: "大" }], ["", { ko: "보통", ja: "中" }]],
    }],
    render(o) {
      const h = o.height === "" ? "" : ` wf-box--${o.height || "hero"}`;
      return section(`      <div class="wf-box wf-box--img${h}">フリーバナー / メインビジュアル</div>`);
    },
  },

  "free-text": {
    options: [{ key: "heading", type: "text", default: "セクション見出し", label: { ko: "제목", ja: "見出し" } }],
    render(o) {
      return section(`      <h2 class="wf-section__ttl">${o.heading || "セクション見出し"}</h2>
      <div class="wf-box" style="min-height:80px;justify-content:flex-start;padding:12px;">自由テキスト・説明文が入ります。</div>`);
    },
  },

  // ---------------------------------------------------------------- LP 리치 컴포넌트
  // 미디어+텍스트: 한쪽 이미지(단일/슬라이드) ↔ 반대쪽 타이틀·설명·CTA(우하단). 좌우 교차 + 스크롤 애니메이션.
  "media-text": {
    options: [
      {
        key: "imageSide", type: "select", default: "right", label: { ko: "이미지 위치", ja: "画像位置" },
        choices: [["right", { ko: "오른쪽", ja: "右" }], ["left", { ko: "왼쪽", ja: "左" }]],
      },
      { key: "title", type: "text", default: "セクションタイトル", label: { ko: "타이틀", ja: "タイトル" } },
      { key: "desc", type: "text", default: "特長やベネフィットの説明テキストが入ります。", label: { ko: "설명", ja: "説明文" } },
      { key: "cta", type: "text", default: "詳しく見る", label: { ko: "버튼 라벨", ja: "ボタンラベル" } },
      { key: "slides", type: "number", min: 1, max: 6, default: 1, label: { ko: "이미지 슬라이드 매수", ja: "画像スライド枚数" } },
      {
        key: "anim", type: "select", default: "fade", label: { ko: "애니메이션", ja: "アニメーション" },
        choices: [["none", { ko: "없음", ja: "なし" }], ["fade", { ko: "페이드인", ja: "フェードイン" }], ["slide", { ko: "슬라이드업", ja: "スライドアップ" }]],
      },
    ],
    render(o, ctx) {
      const side = o.imageSide === "left" ? "left" : "right";
      const n = Math.max(1, o.slides || 1);
      let media;
      if (n > 1) {
        const sl = Array.from({ length: n }, (_, i) => `          <div class="wf-slider__slide"><div class="wf-box wf-box--img wf-box--tall">画像 ${i + 1} / ${n}</div></div>`).join("\n");
        media = `<div class="wf-slider" data-autoplay="1" data-interval="4000">
          <div class="wf-slider__track">
${sl}
          </div>
          <button class="wf-slider__arrow wf-slider__arrow--prev" aria-label="prev">‹</button>
          <button class="wf-slider__arrow wf-slider__arrow--next" aria-label="next">›</button>
          <div class="wf-slider__dots">${Array.from({ length: n }, () => "<i></i>").join("")}</div>
        </div>`;
      } else {
        media = `<div class="wf-box wf-box--img wf-box--tall" style="min-height:260px;">画像</div>`;
      }
      const anim = o.anim === "fade" ? " wf-reveal wf-reveal--fade" : o.anim === "slide" ? " wf-reveal wf-reveal--slide" : "";
      return section(`      ${note(ctx, "media-text", o)}
      <div class="wf-mediatext wf-mediatext--img${side}${anim}">
        <div class="wf-mediatext__media">${media}</div>
        <div class="wf-mediatext__body">
          <h2 class="wf-mediatext__ttl">${o.title || "セクションタイトル"}</h2>
          <p class="wf-mediatext__desc">${o.desc || ""}</p>
          <div class="wf-mediatext__cta"><a class="wf-btn" href="/shop/e/e{code}/">${o.cta || "詳しく見る"} ＞</a></div>
        </div>
      </div>`);
    },
  },

  "feature-cols": {
    options: [
      { key: "cols", type: "number", min: 2, max: 4, default: 3, label: { ko: "열 수", ja: "列数" } },
      { key: "title", type: "text", default: "選ばれる3つの理由", label: { ko: "타이틀", ja: "タイトル" } },
    ],
    render(o) {
      const n = o.cols || 3;
      const cols = Array.from({ length: n }, (_, i) => `<li class="wf-feature"><div class="wf-box wf-box--img wf-box--sq" style="width:64px;margin:0 auto 12px;">${i + 1}</div><b>ポイント${i + 1}</b><p style="color:#666;font-size:12px;margin:6px 0 0;">特長の説明テキストが入ります。</p></li>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl" style="text-align:center;border:0;padding-left:0;">${o.title || "選ばれる理由"}</h2>
      <ul class="wf-grid wf-grid--${n}" style="margin-top:16px;text-align:center;">
        ${cols}
      </ul>`);
    },
  },

  "cta-band": {
    options: [
      { key: "headline", type: "text", default: "今すぐチェック", label: { ko: "헤드라인", ja: "見出し" } },
      { key: "cta", type: "text", default: "購入はこちら", label: { ko: "버튼 라벨", ja: "ボタンラベル" } },
    ],
    render(o) {
      return section(`      <div class="wf-ctaband">
        <div class="wf-ctaband__h">${o.headline || "今すぐチェック"}</div>
        <a class="wf-btn wf-btn--lg" href="/shop/e/e{code}/">${o.cta || "購入はこちら"} ＞</a>
      </div>`);
    },
  },

  faq: {
    options: [{ key: "count", type: "number", min: 2, max: 8, default: 4, label: { ko: "질문 수", ja: "質問数" } }],
    render(o, ctx) {
      const items = Array.from({ length: o.count || 4 }, () => `<div class="wf-faq__item"><div class="wf-faq__q">質問テキストが入りますか？</div><div class="wf-faq__a">回答テキストが入ります。詳しい説明を記載します。</div></div>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">よくある質問 FAQ</h2>
      ${note(ctx, "faq", o)}
      <div class="wf-faq" style="margin-top:8px;">
        ${items}
      </div>`);
    },
  },

  steps: {
    options: [{ key: "count", type: "number", min: 2, max: 6, default: 3, label: { ko: "스텝 수", ja: "ステップ数" } }],
    render(o) {
      const n = o.count || 3;
      const items = Array.from({ length: n }, (_, i) => `<li class="wf-flowstep"><div class="wf-flowstep__no">STEP ${i + 1}</div><div class="wf-box wf-box--img wf-box--sq" style="margin:8px 0;">図</div><b>ステップ${i + 1}</b><p style="color:#666;font-size:12px;margin:4px 0 0;">手順の説明。</p></li>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">ご利用の流れ STEP</h2>
      <ul class="wf-grid wf-grid--${n}" style="margin-top:16px;">
        ${items}
      </ul>`);
    },
  },

  voice: {
    options: [{ key: "count", type: "number", min: 2, max: 4, default: 3, label: { ko: "표시 수", ja: "表示数" } }],
    render(o) {
      const n = o.count || 3;
      const cards = Array.from({ length: n }, () => `<li class="wf-voice"><div class="wf-flex" style="gap:10px;"><span class="wf-box wf-box--sq" style="width:44px;min-height:0;">👤</span><div><b>お客様 A様</b><br><span style="color:#e6a700;">★★★★★</span></div></div><p style="font-size:12px;color:#555;margin:10px 0 0;">お客様の声・レビューコメントが入ります。</p></li>`).join("\n        ");
      return section(`      <h2 class="wf-section__ttl">お客様の声 VOICE</h2>
      <ul class="wf-grid wf-grid--${n}" style="margin-top:16px;">
        ${cards}
      </ul>`);
    },
  },

  // ---------------------------------------------------------------- 커스텀 블럭
  // 원시요소(見出し/テキスト/画像/ボタン/余白/区切り線)를 자유롭게 쌓아 만드는 블럭.
  // opts.elements = [{ type, text?, label?, size?, align? }]
  custom: {
    options: [], // flat 옵션 없음 — app.js의 전용 편집기 사용
    render(o) {
      const els = Array.isArray(o.elements) ? o.elements : [];
      if (!els.length) {
        return section(`      <div class="wf-box" style="min-height:60px;">カスタムブロック（要素を追加してください）</div>`);
      }
      return section(els.map(renderPrimitive).join("\n"));
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
