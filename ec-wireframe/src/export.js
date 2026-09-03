// export.js — 状態(state) → 自己完結ワイヤーフレームHTML文書の組み立て
import { catalog } from "./catalog.js";
import { strings, i18n, fmt } from "./i18n.js";

const headerNote = {
  ko: "hover→메가메뉴 전개 / SP→드로어 아코디언",
  ja: "hover→メガメニュー展開 / SP→ドロワーアコーディオン",
};

function headerHtml(lang) {
  return `<header class="wf-header">
  <div class="wf-header__utility">
    <div class="wf-container">
      <a href="#">ご利用ガイド</a>
      <a href="#">よくある質問</a>
      <a href="#">お問い合わせ</a>
      <a href="#">新規会員登録</a>
      <a href="#">ログイン</a>
    </div>
  </div>
  <div class="wf-container wf-header__main">
    <div class="wf-hamburger" id="wfHamburger" aria-label="menu"><span></span><span></span><span></span></div>
    <a href="#" class="wf-box wf-box--img wf-logo">LOGO</a>
    <nav class="wf-gnav">
      <ul>
        <li class="wf-gnav__item">CATEGORY
          <span class="wf-note">${headerNote[lang]}</span>
          <div class="wf-mega">
            <ul class="wf-grid wf-grid--3">
              <li class="wf-box">大カテゴリA</li><li class="wf-box">大カテゴリB</li><li class="wf-box">大カテゴリC</li>
              <li class="wf-box">中カテゴリ…</li><li class="wf-box">中カテゴリ…</li><li class="wf-box">中カテゴリ…</li>
            </ul>
          </div>
        </li>
        <li class="wf-gnav__item">BRAND
          <div class="wf-mega">
            <ul class="wf-grid wf-grid--4">
              <li class="wf-box wf-box--img">brand</li><li class="wf-box wf-box--img">brand</li>
              <li class="wf-box wf-box--img">brand</li><li class="wf-box wf-box--img">brand</li>
            </ul>
          </div>
        </li>
        <li class="wf-gnav__item">TOPICS
          <div class="wf-mega">
            <ul class="wf-grid wf-grid--2"><li class="wf-box">特集リンク</li><li class="wf-box">特集リンク</li></ul>
          </div>
        </li>
        <li class="wf-gnav__item" style="font-weight:normal;">SHOP LIST</li>
      </ul>
    </nav>
    <div class="wf-actions">
      <a href="#" class="wf-action">検索</a>
      <a href="#" class="wf-action">♡</a>
      <a href="#" class="wf-action">👤</a>
      <a href="#" class="wf-action">🛒<span class="wf-badge">0</span></a>
    </div>
  </div>
</header>

<div class="wf-overlay" id="wfOverlay"></div>
<aside class="wf-drawer" id="wfDrawer">
  <div style="text-align:right;margin-bottom:12px;">
    <span id="wfDrawerClose" style="border:1px solid #333;padding:4px 10px;cursor:pointer;">✕ close</span>
  </div>
  <div class="wf-drawer__acc"><div class="wf-drawer__head">CATEGORY</div>
    <ul class="wf-drawer__panel"><li>大カテゴリA</li><li>大カテゴリB</li><li>大カテゴリC</li></ul></div>
  <div class="wf-drawer__acc"><div class="wf-drawer__head">BRAND</div>
    <ul class="wf-drawer__panel"><li>brand 一覧</li></ul></div>
  <div class="wf-drawer__acc"><div class="wf-drawer__head">TOPICS</div>
    <ul class="wf-drawer__panel"><li>特集 一覧</li></ul></div>
  <ul style="margin-top:16px;border-top:2px solid #333;padding-top:12px;">
    <li style="padding:10px 0;">ログイン / 新規会員登録</li>
    <li style="padding:10px 0;">マイページ</li>
    <li style="padding:10px 0;">ご利用ガイド</li>
  </ul>
</aside>`;
}

// スクリプトは素の JS として保持し、埋め込み時だけ <script> で包む。
// (分割ダウンロードでは script.js にそのまま連結するため)
const wrapScript = (js) => `<script>
${js}
<\/script>`;

const DRAWER_JS = `(function(){
  var h=document.getElementById('wfHamburger'),d=document.getElementById('wfDrawer'),
      o=document.getElementById('wfOverlay'),c=document.getElementById('wfDrawerClose');
  function open(){d.classList.add('is-open');o.classList.add('is-open');}
  function close(){d.classList.remove('is-open');o.classList.remove('is-open');}
  if(h)h.addEventListener('click',open);
  if(o)o.addEventListener('click',close);
  if(c)c.addEventListener('click',close);
  document.querySelectorAll('.wf-drawer__head').forEach(function(head){
    head.addEventListener('click',function(){head.parentElement.classList.toggle('is-open');});
  });
})();`;

const FOOTER_HTML = `<footer class="wf-footer">
  <div class="wf-container">
    <div class="wf-footer__cols">
      <ul class="wf-footer__col">
        <li style="font-weight:bold;border:none;">ショッピングガイド</li>
        <li>ご注文について</li><li>お支払い方法</li><li>配送について</li><li>返品・交換について</li>
      </ul>
      <ul class="wf-footer__col">
        <li style="font-weight:bold;border:none;">サービス</li>
        <li>会員登録・マイページ</li><li>ギフトラッピング</li><li>ショップリスト</li><li>お問い合わせ</li>
      </ul>
      <ul class="wf-footer__col">
        <li style="font-weight:bold;border:none;">コーポレート</li>
        <li>会社概要</li><li>採用情報</li><li>IR情報</li>
      </ul>
      <ul class="wf-footer__col">
        <li style="font-weight:bold;border:none;">FOLLOW US</li>
        <li class="wf-flex" style="border:none;">
          <span class="wf-box" style="width:32px;height:32px;min-height:0;">SNS</span>
          <span class="wf-box" style="width:32px;height:32px;min-height:0;">SNS</span>
          <span class="wf-box" style="width:32px;height:32px;min-height:0;">SNS</span>
        </li>
      </ul>
    </div>
    <div class="wf-footer__legal">
      <a href="#">利用規約</a><a href="#">プライバシーポリシー</a>
      <a href="#">特定商取引法に基づく表示</a><a href="#">サイトについて</a>
    </div>
    <p class="wf-copyright">Copyright© COMPANY All Rights Reserved.</p>
  </div>
</footer>

<div class="wf-cookiebar" id="wfCookie">
  <span>当サイトはクッキーを使用します。ご利用に同意ください。</span>
  <span class="wf-cookiebar__btn" onclick="document.getElementById('wfCookie').style.display='none'">同意する</span>
</div>`;

// 実際に動作するスライダーランタイム(heroなど) — プレビュー・ダウンロード文書で共通
const SLIDER_JS = `(function(){
  document.querySelectorAll('.wf-slider').forEach(function(sl){
    var track=sl.querySelector('.wf-slider__track');
    var slides=sl.querySelectorAll('.wf-slider__slide');
    var dots=sl.querySelectorAll('.wf-slider__dots i');
    var n=slides.length,i=0,timer=null;
    function go(k){i=(k%n+n)%n;track.style.transform='translateX(-'+(i*100)+'%)';
      dots.forEach(function(d,j){d.classList.toggle('is-active',j===i);});}
    var p=sl.querySelector('.wf-slider__arrow--prev'),x=sl.querySelector('.wf-slider__arrow--next');
    if(p)p.addEventListener('click',function(){go(i-1);});
    if(x)x.addEventListener('click',function(){go(i+1);});
    dots.forEach(function(d,j){d.addEventListener('click',function(){go(j);});});
    function play(){if(sl.dataset.autoplay==='1'&&n>1){timer=setInterval(function(){go(i+1);},(+sl.dataset.interval||4000));}}
    function stop(){if(timer){clearInterval(timer);timer=null;}}
    sl.addEventListener('mouseenter',stop);sl.addEventListener('mouseleave',play);
    go(0);play();
  });
})();`;

// カルーセル矢印 / タブ切り替え / ギャラリー — 実際に動作するインタラクション(プレビュー・ダウンロード共通)
const INTERACTION_JS = `(function(){
  document.querySelectorAll('.wf-carousel-wrap').forEach(function(w){
    var c=w.querySelector('.wf-carousel');if(!c)return;
    var p=w.querySelector('.wf-carousel__nav--prev'),x=w.querySelector('.wf-carousel__nav--next');
    function step(){return Math.max(c.clientWidth*0.8,220);}
    if(p)p.addEventListener('click',function(){c.scrollBy({left:-step(),behavior:'smooth'});});
    if(x)x.addEventListener('click',function(){c.scrollBy({left:step(),behavior:'smooth'});});
  });
  document.querySelectorAll('.wf-tabs').forEach(function(tabs){
    var btns=tabs.querySelectorAll('.wf-tab');
    var panels=tabs.querySelectorAll('.wf-tabpanel');
    btns.forEach(function(b){b.addEventListener('click',function(){
      btns.forEach(function(y){y.classList.toggle('is-active',y===b);});
      panels.forEach(function(pn){pn.classList.toggle('is-active',pn.dataset.panel===b.dataset.tab);});
    });});
  });
  document.querySelectorAll('.wf-gallery').forEach(function(g){
    var idxEl=g.querySelector('.wf-gallery__idx');
    var thumbs=g.querySelectorAll('.wf-gallery__thumbs .wf-box');
    var n=thumbs.length,cur=0;if(!n)return;
    function set(k){cur=(k%n+n)%n;if(idxEl)idxEl.textContent=(cur+1);
      thumbs.forEach(function(t,j){t.classList.toggle('is-active',j===cur);});}
    thumbs.forEach(function(t,j){t.addEventListener('click',function(){set(j);});});
    var p=g.querySelector('.wf-gallery__nav--prev'),x=g.querySelector('.wf-gallery__nav--next');
    if(p)p.addEventListener('click',function(){set(cur-1);});
    if(x)x.addEventListener('click',function(){set(cur+1);});
    set(0);
  });
  document.querySelectorAll('.wf-faq__q').forEach(function(q){
    q.addEventListener('click',function(){q.parentElement.classList.toggle('is-open');});
  });
  (function(){
    var els=[].slice.call(document.querySelectorAll('.wf-reveal'));
    if(!els.length)return;
    function showAll(){els.forEach(function(e){e.classList.add('is-in');});}
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(ents){ents.forEach(function(en){
        if(en.isIntersecting){en.target.classList.add('is-in');io.unobserve(en.target);}});},{threshold:0.12});
      els.forEach(function(e){io.observe(e);});
      setTimeout(showAll,1500);
    } else { showAll(); }
  })();
})();`;

// 注記表示のトグルボタン(ダウンロード文書でもクライアント/開発ビューを切り替え)
function annoToggle(showNotes) {
  const label = showNotes === false ? "注記: OFF" : "注記: ON";
  return `<button data-wf-chrome class="wf-anno-toggle" onclick="document.body.classList.toggle('wf-hide-anno');this.textContent=document.body.classList.contains('wf-hide-anno')?'注記: OFF':'注記: ON';">${label}</button>`;
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// インラインCSSのコメント除去(出力物にコメントが露出しないように)
function stripCssComments(css) {
  return String(css).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{3,}/g, "\n\n").trim();
}

// state.sections = [{ comp, opts, comment }]  →  <main> 内側の文字列
// mark=true のとき、各セクションを display:contents のラッパーで包む(プレビュー内スクロール用)。
// display:contents はボックスを生成しないためレイアウトに影響しない。ダウンロード物には含めない。
export function renderSections(sections, lang, mark = false) {
  const ctx = { lang, notes: strings[lang].note };
  return sections
    .map((s, i) => {
      const comp = catalog[s.comp];
      if (!comp) return `  <!-- unknown component: ${s.comp} -->`;
      const html = comp.render(s.opts || {}, ctx);
      let out = html;
      if (s.comment && s.comment.trim()) {
        const cmt = `  <div class="wf-container" style="padding-top:14px;"><div class="wf-comment">${esc(s.comment.trim())}</div></div>`;
        out = cmt + "\n" + html;
      }
      return mark ? `<div data-wf-sec="${i}" style="display:contents">\n${out}\n</div>` : out;
    })
    .join("\n\n");
}

// 文書全体の組み立て。css = wireframe.css の原文文字列。
// opts.markSections=true でプレビュー用のセクションマーカーを付与。
export function buildDocument(state, css, opts = {}) {
  const { lang, pageType, sections } = state;
  const t = i18n[lang];
  const bar = fmt(t.meta.previewBar, { page: pageType });
  const body = renderSections(sections, lang, !!opts.markSections);
  const bodyClass = state.showNotes === false ? "wf-hide-anno" : "";
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[WIREFRAME] ${pageType.toUpperCase()} — ec-wireframe</title>
<!-- ${fmt(t.meta.docComment, { page: pageType })} -->
<style>
${stripCssComments(css)}
</style>
<noscript><style>.wf-reveal{opacity:1 !important;transform:none !important;}</style></noscript>
</head>
<body class="${bodyClass}">

${annoToggle(state.showNotes)}

<div data-wf-chrome style="background:#111;color:#fff;padding:6px 16px;font-size:12px;text-align:center;">${bar}</div>

${headerHtml(lang)}

${wrapScript(DRAWER_JS)}

<main>
${body}
</main>

${FOOTER_HTML}

${wrapScript(SLIDER_JS)}

${wrapScript(INTERACTION_JS)}

</body>
</html>`;
}

// ======================================================================
//  分割ダウンロード: index.html / style.css / script.js に分けて出力
//  ・buildDocument() が1ファイルに全部埋め込むのに対し、こちらは外部参照にする
//  ・スクリプトは <script> を剥がした素の JS を1本にまとめ、defer で末尾読み込み
//    (3つとも DOM を即時に走査する IIFE なので、defer なら要素が揃った後に動く)
// ======================================================================
export function buildFiles(state, css, opts = {}) {
  const { lang, pageType, sections } = state;
  const t = i18n[lang];
  const bar = fmt(t.meta.previewBar, { page: pageType });
  const body = renderSections(sections, lang, false); // 出力物にプレビュー用マーカーは入れない
  const bodyClass = state.showNotes === false ? "wf-hide-anno" : "";
  const base = opts.base || ".";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[WIREFRAME] ${pageType.toUpperCase()} — ec-wireframe</title>
<!-- ${fmt(t.meta.docComment, { page: pageType })} -->
<link rel="stylesheet" href="${base}/style.css">
<noscript><style>.wf-reveal{opacity:1 !important;transform:none !important;}</style></noscript>
</head>
<body class="${bodyClass}">

${annoToggle(state.showNotes)}

<div style="background:#111;color:#fff;padding:6px 16px;font-size:12px;text-align:center;">${bar}</div>

${headerHtml(lang)}

<main>
${body}
</main>

${FOOTER_HTML}

<script src="${base}/script.js" defer><\/script>

</body>
</html>`;

  const js = `// ec-wireframe — ワイヤーフレームのインタラクション
// ドロワー / スライダー / カルーセル・タブ・ギャラリー・FAQ・スクロール表示

${DRAWER_JS}

${SLIDER_JS}

${INTERACTION_JS}
`;

  return {
    "index.html": html,
    "style.css": stripCssComments(css).trim() + "\n",
    "script.js": js,
  };
}

// ======================================================================
//  マルチページ・プロジェクト出力
//  複数ページ(TOP/一覧/詳細…)を1つの ZIP にまとめ、互いにリンクさせる。
//  構成: index.html(目次) + <pageType>.html × N + style.css + script.js
// ======================================================================

// 各ページ上部に置く、姉妹ページへのナビゲーション
function pagesNav(pageTypes, current, lang) {
  const t = i18n[lang];
  const links = pageTypes
    .map((p) => {
      const label = t.pageTypes[p] || p;
      return p === current
        ? `<strong style="color:#fff;">${label}</strong>`
        : `<a href="./${p}.html" style="color:#9ecbff;">${label}</a>`;
    })
    .join(' <span style="opacity:.4;">/</span> ');
  return `<div style="background:#1b2330;color:#cfd6e4;padding:6px 16px;font-size:12px;text-align:center;">
  <a href="./index.html" style="color:#9ecbff;">INDEX</a> <span style="opacity:.4;">|</span> ${links}
</div>`;
}

function projectIndexHtml(pageTypes, lang) {
  const t = i18n[lang];
  const items = pageTypes
    .map((p) => `    <li><a href="./${p}.html">${t.pageTypes[p] || p}</a> <code>${p}.html</code></li>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[WIREFRAME] プロジェクト目次 — ec-wireframe</title>
<style>
  body{margin:0;padding:40px 24px;background:#f4f5f7;color:#1f2430;
    font-family:-apple-system,"Segoe UI","Yu Gothic UI",Meiryo,sans-serif;}
  .box{max-width:640px;margin:0 auto;background:#fff;border:1px solid #dcdfe4;border-radius:12px;padding:28px 30px;}
  h1{font-size:18px;margin:0 0 6px;}
  p{font-size:13px;color:#6b7280;margin:0 0 20px;}
  ul{list-style:none;margin:0;padding:0;}
  li{border-bottom:1px solid #eef0f3;padding:12px 4px;font-size:14px;display:flex;justify-content:space-between;align-items:center;}
  li:last-child{border-bottom:0;}
  a{color:#2b6cb0;text-decoration:none;font-weight:600;}
  a:hover{text-decoration:underline;}
  code{font-size:11px;color:#9aa1ab;}
</style>
</head>
<body>
  <div class="box">
    <h1>ワイヤーフレーム — プロジェクト目次</h1>
    <p>各ページは互いにリンクしています。スタイルとスクリプトは style.css / script.js を共有します。</p>
    <ul>
${items}
    </ul>
  </div>
</body>
</html>`;
}

// state.pages から、中身のあるページだけを ZIP 用ファイル一式に変換
export function buildProject(state, css, pageOrder) {
  const lang = state.lang;
  const pages = state.pages || {};
  const order = (pageOrder || Object.keys(pages)).filter(
    (p) => Array.isArray(pages[p]) && pages[p].length > 0
  );
  if (order.length === 0) return null;

  const files = {};
  for (const p of order) {
    const one = buildFiles({ ...state, pageType: p, sections: pages[p] }, css);
    // 姉妹ページへのナビを先頭に差し込む
    files[`${p}.html`] = one["index.html"].replace(
      "<body class=",
      `<body data-wf-page="${p}" class=`
    ).replace(
      /(<body[^>]*>\n)/,
      `$1\n${pagesNav(order, p, lang)}\n`
    );
    // style.css / script.js は全ページ共通なので1度だけ入れる
    if (!files["style.css"]) files["style.css"] = one["style.css"];
    if (!files["script.js"]) files["script.js"] = one["script.js"];
  }
  files["index.html"] = projectIndexHtml(order, lang);
  return files;
}
