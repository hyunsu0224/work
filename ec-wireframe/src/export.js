// export.js — 상태(state) → 자기완결 와이어프레임 HTML 문서 조립
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

const DRAWER_SCRIPT = `<script>
(function(){
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
})();
<\/script>`;

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

// 실제 동작하는 슬라이더 런타임(hero 등) — 프리뷰·다운로드 문서 공통
const SLIDER_SCRIPT = `<script>
(function(){
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
})();
<\/script>`;

// 캐러셀 화살표 / 탭 전환 / 갤러리 — 실제 동작 인터랙션(프리뷰·다운로드 공통)
const INTERACTION_SCRIPT = `<script>
(function(){
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
})();
<\/script>`;

// 주석 표시 토글 버튼(다운로드 문서에서도 클라이언트/개발 뷰 전환)
function annoToggle(showNotes) {
  const label = showNotes === false ? "注記: OFF" : "注記: ON";
  return `<button class="wf-anno-toggle" onclick="document.body.classList.toggle('wf-hide-anno');this.textContent=document.body.classList.contains('wf-hide-anno')?'注記: OFF':'注記: ON';">${label}</button>`;
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// 인라인 CSS의 주석 제거(출력물에 주석 노출 방지)
function stripCssComments(css) {
  return String(css).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{3,}/g, "\n\n").trim();
}

// state.sections = [{ comp, opts, comment }]  →  <main> 안쪽 문자열
export function renderSections(sections, lang) {
  const ctx = { lang, notes: strings[lang].note };
  return sections
    .map((s) => {
      const comp = catalog[s.comp];
      if (!comp) return `  <!-- unknown component: ${s.comp} -->`;
      const html = comp.render(s.opts || {}, ctx);
      if (s.comment && s.comment.trim()) {
        const cmt = `  <div class="wf-container" style="padding-top:14px;"><div class="wf-comment">${esc(s.comment.trim())}</div></div>`;
        return cmt + "\n" + html;
      }
      return html;
    })
    .join("\n\n");
}

// 전체 문서 조립. css = wireframe.css 원문 문자열.
export function buildDocument(state, css) {
  const { lang, pageType, sections } = state;
  const t = i18n[lang];
  const bar = fmt(t.meta.previewBar, { page: pageType });
  const body = renderSections(sections, lang);
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

<div style="background:#111;color:#fff;padding:6px 16px;font-size:12px;text-align:center;">${bar}</div>

${headerHtml(lang)}

${DRAWER_SCRIPT}

<main>
${body}
</main>

${FOOTER_HTML}

${SLIDER_SCRIPT}

${INTERACTION_SCRIPT}

</body>
</html>`;
}
