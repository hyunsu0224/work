// app.js — ビルダー UI コントローラー
import { catalog, defaultOpts } from "./catalog.js";
import { templates, palette, PAGE_TYPES, COMMON, LP_RICH } from "./templates.js";
import { i18n, strings } from "./i18n.js";
import { buildDocument, buildFiles, buildProject } from "./export.js";
import { zipStore } from "./zip.js";
import { encodeState, decodeState } from "./share.js";
import { APP_VERSION } from "./version.js";
import { iconFor } from "./icons.js";
import { gallery } from "./gallery.js";
import { sanitize } from "./sanitize.js";

const state = {
  lang: "ja", // 新規アクセス時のデフォルト言語(保存された値があれば復元される)
  device: "both",
  pageType: "top",
  showNotes: true, // 注記(wf-note·コメント)の表示可否
  sections: [], // アクティブページのセクション [{ comp, opts, comment }]
  pages: {}, // ページ種別ごとの作業内容 { [pageType]: sections } — 切り替えても消えない
};

let selIdx = null; // 挿入基準として選択されたセクション index (null=末尾に追加)
let paletteQuery = ""; // パレット検索クエリ
let palOpen = { page: true, common: false, rich: false }; // パレット各カテゴリの開閉
let palPickId = null; // インライン操作ボタンを開いているコンポーネントid
let panelCollapsed = false; // 編集パネルの折りたたみ可否(PC/SP 共通)
const REPO_URL = "https://github.com/hyunsu0224/work"; // リクエスト(イシュー)対象のリポジトリ

let CSS = ""; // wireframe.css の原文

const $ = (sel, root = document) => root.querySelector(sel);

// ======================================================================
//  永続化 (localStorage 自動保存 + JSON 保存/読み込み)
// ======================================================================
const STORAGE_KEY = "ec-wf-state-v1";

function persist() {
  syncActivePage();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    /* 容量超過·プライベートモードなどは静かに無視 */
  }
}

function applyState(next) {
  Object.assign(state, next);
}

// ======================================================================
//  ヒストリー (undo / redo) — 内容(pageType·sections)のスナップショットスタック
//  ※ 言語·表示対象·注記表示のような画面設定は元に戻す対象ではない(内容のみ)
// ======================================================================
const HIST_MAX = 100;
let history = [];
let hp = -1; // 現在のスナップショットポインター
let histTimer = null; // 連続入力(タイピング)のコアレッシング

function snapshot() {
  syncActivePage();
  return JSON.parse(JSON.stringify({ pageType: state.pageType, pages: state.pages }));
}
function histInit() {
  history = [snapshot()];
  hp = 0;
  updateHistButtons();
}
function histPush() {
  clearTimeout(histTimer);
  const snap = snapshot();
  if (hp >= 0 && JSON.stringify(history[hp]) === JSON.stringify(snap)) return; // 変化なし → skip
  history = history.slice(0, hp + 1); // redo の枝を切り落とす
  history.push(snap);
  if (history.length > HIST_MAX) history.shift();
  hp = history.length - 1;
  updateHistButtons();
}
function histPushDebounced() {
  clearTimeout(histTimer);
  histTimer = setTimeout(histPush, 500); // タイピングが止まると1つの項目にまとめられる
}
function loadSnapshot(snap) {
  state.pageType = snap.pageType;
  state.pages = JSON.parse(JSON.stringify(snap.pages));
  state.sections = state.pages[state.pageType] || [];
  selIdx = null;
  renderAll(); // 現在の言語·表示対象はそのまま維持
}
function undo() {
  clearTimeout(histTimer);
  if (hp > 0) {
    hp--;
    loadSnapshot(history[hp]);
  }
}
function redo() {
  clearTimeout(histTimer);
  if (hp < history.length - 1) {
    hp++;
    loadSnapshot(history[hp]);
  }
}
function updateHistButtons() {
  const u = $("#btnUndo");
  const r = $("#btnRedo");
  if (u) u.disabled = hp <= 0;
  if (r) r.disabled = hp >= history.length - 1;
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const clean = sanitize(JSON.parse(raw));
    if (!clean) return false;
    applyState(clean);
    return true;
  } catch (_) {
    return false;
  }
}

// ---- UI 状態(パネルの折りたたみ)の永続化 ----
const UI_KEY = "ec-wf-ui";
let guideSeen = false; // ガイドの初回表示可否
function loadUI() {
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    panelCollapsed = !!u.collapsed;
    guideSeen = !!u.guideSeen;
    if (u.palOpen && typeof u.palOpen === "object") palOpen = { ...palOpen, ...u.palOpen };
  } catch (_) {}
}
function saveUI() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ collapsed: panelCollapsed, guideSeen, palOpen }));
  } catch (_) {}
}
function applyCollapsed() {
  const app = document.querySelector(".app");
  if (app) app.classList.toggle("is-collapsed", panelCollapsed);
  const b = $("#btnPanel");
  if (b) b.textContent = (panelCollapsed ? "☰ " : "◀ ") + ui().panel;
}

// ---- 状態の初期化 ----
function loadTemplate(pageType) {
  state.pageType = pageType;
  state.sections = (templates[pageType] || []).map((s) => ({
    comp: s.comp,
    opts: { ...defaultOpts(s.comp), ...(s.opts || {}) },
    comment: "",
  }));
  state.pages[pageType] = state.sections; // pages 側にも反映(リセット/初期化経路の一貫性)
  selIdx = null;
}
// アクティブページの編集内容を pages に書き戻す(pages を読む前に必ず呼ぶ)
function syncActivePage() {
  state.pages[state.pageType] = state.sections;
}

// ページ種別の切り替え。今のページを保存し、切替先は保存済みがあれば復元・無ければ標準テンプレート。
function switchPage(nextType) {
  syncActivePage();
  state.pageType = nextType;
  if (Array.isArray(state.pages[nextType])) {
    state.sections = state.pages[nextType];
    selIdx = null;
  } else {
    loadTemplate(nextType);
    state.pages[nextType] = state.sections;
  }
}


// ---- ラベルヘルパー ----
const ui = () => i18n[state.lang].ui;
const compLabel = (id) => strings[state.lang].comp[id] || id;

// ======================================================================
//  レンダー: 上部ツールバー
// ======================================================================
function renderTopbar() {
  const t = i18n[state.lang];
  const pageOpts = PAGE_TYPES.map(
    (p) => `<option value="${p}" ${p === state.pageType ? "selected" : ""}>${t.pageTypes[p]}</option>`
  ).join("");
  const devOpts = ["both", "pc", "sp"].map(
    (d) => `<option value="${d}" ${d === state.device ? "selected" : ""}>${t.devices[d]}</option>`
  ).join("");

  $("#topbar").innerHTML = `
    <button id="btnPanel" class="btn btn-ico" title="${ui().panel}">◀ ${ui().panel}</button>
    <div class="tb-title" title="v${APP_VERSION}">${ui().appTitle} <span class="tb-ver">v${APP_VERSION}</span></div>
    <label class="tb-field">${ui().pageType}
      <select id="selPage">${pageOpts}</select>
    </label>
    <label class="tb-field">${ui().device}
      <select id="selDevice">${devOpts}</select>
    </label>
    ${gallery.length ? `<label class="tb-field">${ui().template}
      <select id="selTpl"><option value="">${ui().templatePick}</option>${gallery
        .map((g) => `<option value="${g.id}" title="${(g.desc || "").replace(/"/g, "&quot;")}">${g.name}</option>`)
        .join("")}</select>
    </label>` : ""}
    <label class="tb-field">${ui().notesToggle}
      <button id="btnNotes" class="btn btn-toggle ${state.showNotes ? "is-on" : ""}">${state.showNotes ? "ON" : "OFF"}</button>
    </label>
    <span class="tb-autosave" title="${ui().autosave}">● ${ui().autosaveShort}</span>
    <div class="tb-actions">
    <button id="btnUndo" class="btn btn-ico" title="${ui().undo} (Ctrl+Z)">↶</button>
    <button id="btnRedo" class="btn btn-ico" title="${ui().redo} (Ctrl+Shift+Z)">↷</button>
    <button id="btnSave" class="btn btn-ghost">${ui().save}</button>
    <button id="btnDownload" class="btn btn-primary">${ui().download}</button>
    <div class="tb-more">
      <button id="btnMore" class="btn btn-ico" title="${ui().more}" aria-haspopup="true" aria-expanded="false">⋯</button>
      <div id="moreMenu" class="tb-menu" hidden>
        <button id="btnLoad" class="tb-menu-item">${ui().load}</button>
        <button id="btnZip" class="tb-menu-item">${ui().downloadZip}</button>
        <button id="btnProject" class="tb-menu-item">${ui().downloadProject}</button>
        <button id="btnShare" class="tb-menu-item">${ui().shareLink}</button>
        <button id="btnCopy" class="tb-menu-item">${ui().copyHtml}</button>
        <button id="btnOpen" class="tb-menu-item">${ui().openTab}</button>
        <button id="btnReset" class="tb-menu-item">${ui().reset}</button>
        <hr class="tb-menu-sep">
        <button id="btnGuide" class="tb-menu-item">${ui().guide}</button>
        <button id="btnRequest" class="tb-menu-item" title="GitHub Issue">${ui().request}</button>
      </div>
    </div>
    </div>
    <input id="fileLoad" type="file" accept="application/json,.json" hidden>
  `;

  $("#selPage").addEventListener("change", (e) => {
    switchPage(e.target.value); // 現在のページの作業内容は保持される
    renderAll();
    histPush();
  });
  $("#selDevice").addEventListener("change", (e) => {
    state.device = e.target.value;
    updatePreview();
    $("#stage").className = "stage dev-" + state.device;
  });
  const selTpl = $("#selTpl");
  if (selTpl) {
    selTpl.addEventListener("change", (e) => {
      const id = e.target.value;
      e.target.value = ""; // 選択表示をリセット(次の選択を許可)
      if (!id) return;
      const tpl = gallery.find((g) => g.id === id);
      if (!tpl) return;
      if (!confirm(ui().templateWarn)) return; // 現在の作業が消える旨の警告
      const clean = sanitize(tpl.state);
      if (!clean) return;
      applyState(clean);
      renderAll();
      histPush();
    });
  }
  $("#btnReset").addEventListener("click", () => {
    if (confirm(ui().confirmReset)) {
      loadTemplate(state.pageType);
      renderAll();
      histPush();
    }
  });
  $("#btnPanel").addEventListener("click", () => {
    panelCollapsed = !panelCollapsed;
    saveUI();
    applyCollapsed();
  });
  $("#btnRequest").addEventListener("click", () => {
    window.open(REPO_URL + "/issues/new?template=component-request.yml", "_blank");
  });
  $("#btnGuide").addEventListener("click", openGuide);
  $("#btnUndo").addEventListener("click", undo);
  $("#btnRedo").addEventListener("click", redo);
  $("#btnDownload").addEventListener("click", download);
  $("#btnZip").addEventListener("click", downloadZip);
  $("#btnProject").addEventListener("click", downloadProject);
  $("#btnShare").addEventListener("click", shareLink);
  $("#btnOpen").addEventListener("click", openFull);
  $("#btnCopy").addEventListener("click", copyHtml);
  $("#btnSave").addEventListener("click", saveJson);
  $("#btnLoad").addEventListener("click", () => $("#fileLoad").click());
  $("#fileLoad").addEventListener("change", loadJson);
  $("#btnNotes").addEventListener("click", () => {
    state.showNotes = !state.showNotes;
    const b = $("#btnNotes");
    b.textContent = state.showNotes ? "ON" : "OFF";
    b.classList.toggle("is-on", state.showNotes);
    updatePreview();
  });

  // ---- ⋯ その他メニュー ----
  const moreBtn = $("#btnMore");
  const moreMenu = $("#moreMenu");
  const closeMore = () => {
    moreMenu.hidden = true;
    moreBtn.setAttribute("aria-expanded", "false");
  };
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = moreMenu.hidden;
    moreMenu.hidden = !willOpen;
    moreBtn.setAttribute("aria-expanded", String(willOpen));
  });
  moreMenu.addEventListener("click", () => closeMore()); // 項目選択後は閉じる
  document.addEventListener("click", (e) => {
    if (!moreMenu.hidden && !e.target.closest(".tb-more")) closeMore();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !moreMenu.hidden) closeMore();
  });
}

// ---- 構成 JSON の保存/読み込み ----
function saveJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.pageType}-wireframe.wf.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function loadJson(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = ""; // 同じファイルの再選択を許可
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const clean = sanitize(safeParse(reader.result));
    if (!clean) return alert(ui().loadFailed);
    applyState(clean);
    renderAll();
    histPush();
  };
  reader.readAsText(file);
}

function safeParse(txt) {
  try {
    return JSON.parse(txt);
  } catch (_) {
    return null;
  }
}

// ======================================================================
//  レンダー: 左パネル (パレット + セクションリスト)
// ======================================================================
// パレットをカテゴリ別に分類 (このページの標準 / 共通 / LP・特集)
function paletteGroups() {
  const all = (palette[state.pageType] || Object.keys(catalog)).filter((id, i, arr) => arr.indexOf(id) === i);
  const common = new Set(COMMON);
  const rich = new Set(LP_RICH);
  return [
    { key: "page", label: ui().grpPage, ids: all.filter((id) => !common.has(id) && !rich.has(id)) },
    { key: "common", label: ui().grpCommon, ids: all.filter((id) => common.has(id)) },
    { key: "rich", label: ui().grpRich, ids: all.filter((id) => rich.has(id)) },
  ].filter((g) => g.ids.length);
}

function renderPalette() {
  const q = paletteQuery.trim().toLowerCase();
  const match = (id) => {
    const name = compLabel(id);
    return !q || name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  };
  const row = (id) => {
    const name = compLabel(id);
    const picked = palPickId === id;
    return `<div class="chip-wrap${picked ? " is-picked" : ""}">
      <button class="chip" data-pick="${id}" title="${name}" aria-expanded="${picked}">
        <span class="cicon-wrap">${iconFor(id)}</span><span class="chip-lbl">${name}</span>
      </button>
      ${picked ? `<div class="chip-acts">
        <button class="chip-act chip-act--now" data-add="${id}">${ui().addNow}</button>
        <button class="chip-act chip-act--edit" data-addedit="${id}">${ui().addEdit}</button>
      </div>` : ""}
    </div>`;
  };
  const html = paletteGroups()
    .map((g) => {
      const hits = g.ids.filter(match);
      if (!hits.length) return "";
      // 検索中はヒットしたグループを常に開く(閉じたままだと検索が効かないように見えるため)
      const open = q ? true : palOpen[g.key] !== false;
      return `<div class="pal-grp${open ? " is-open" : ""}">
        <button type="button" class="pal-grp-ttl" data-grp="${g.key}" aria-expanded="${open}">
          <span class="pal-caret">${open ? "▾" : "▸"}</span>
          <span class="pal-grp-name">${g.label}</span>
          <span class="pal-grp-count">${hits.length}</span>
        </button>
        <div class="palette"${open ? "" : " hidden"}>${hits.map(row).join("")}</div>
      </div>`;
    })
    .join("");
  return html || `<p class="empty">${ui().searchEmpty}</p>`;
}

function renderPanel() {

  // セクションリスト
  let list;
  if (state.sections.length === 0) {
    list = `<p class="empty">${ui().empty}</p>`;
  } else {
    list = state.sections
      .map((s, i) => {
        const opts = renderOptions(s, i);
        const cust = s.comp === "custom" ? renderCustomEditor(s, i) : "";
        const sel = i === selIdx;
        const cmt = String(s.comment || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `
        <div class="sec${sel ? " is-sel" : ""}${s.comp === "custom" ? " is-custom" : ""}" data-i="${i}">
          <div class="sec-head">
            <span class="drag" title="${ui().dragHint}" draggable="true">⠿</span>
            <span class="sec-idx">${i + 1}</span>
            <span class="cicon-wrap sec-icon">${iconFor(s.comp)}</span>
            <span class="sec-name" data-select="${i}">${compLabel(s.comp)}</span>
            <span class="sec-actions">
              <button class="ico" data-dup="${i}" title="${ui().duplicate}">⧉</button>
              <button class="ico" data-move="${i}:-1" title="${ui().moveUp}">▲</button>
              <button class="ico" data-move="${i}:1" title="${ui().moveDown}">▼</button>
              <button class="ico ico-del" data-remove="${i}" title="${ui().remove}">✕</button>
            </span>
          </div>
          ${sel ? `<div class="sec-inserthint">${ui().insertHint}</div>` : ""}
          <div class="sec-body">
            <textarea class="sec-comment" data-comment="${i}" placeholder="${ui().commentPh}" rows="1">${cmt}</textarea>
            ${cust ? `<div class="sec-opts">${cust}</div>` : ""}
            ${opts ? `<div class="sec-opts">${opts}</div>` : ""}
          </div>
        </div>`;
      })
      .join("");
  }

  $("#panel").innerHTML = `
    <div class="pan-block">
      <h3>${ui().palette}</h3>
      <input id="palSearch" class="pal-search" type="search" placeholder="${ui().searchPh}"
             value="${paletteQuery.replace(/"/g, "&quot;")}" autocomplete="off">
      <div id="palList">${renderPalette()}</div>
    </div>
    <div class="pan-block">
      <h3>${ui().sections}</h3>
      <p class="fixed-note">${ui().fixedNote}</p>
      <div id="secList">${list}</div>
    </div>
  `;
}

// {ko,ja} または文字列ラベルを現在の言語に
function L(label) {
  if (label && typeof label === "object") return label[state.lang] || label.ja || label.ko || "";
  return label || "";
}

function renderOptions(s, i) {
  const comp = catalog[s.comp];
  if (!comp || !comp.options || comp.options.length === 0) return "";
  return comp.options
    .map((opt) => {
      const val = s.opts[opt.key];
      const name = `${i}:${opt.key}`;
      const lbl = L(opt.label);
      if (opt.type === "bool") {
        return `<label class="opt opt-bool"><input type="checkbox" data-opt="${name}" ${val ? "checked" : ""}> ${lbl}</label>`;
      }
      if (opt.type === "number") {
        return `<label class="opt"><span>${lbl}</span><input type="number" data-opt="${name}" value="${val}" min="${opt.min ?? 0}" max="${opt.max ?? 99}" step="${opt.step ?? 1}"></label>`;
      }
      if (opt.type === "select") {
        const choices = (opt.choices || []).map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${L(l)}</option>`).join("");
        return `<label class="opt"><span>${lbl}</span><select data-opt="${name}">${choices}</select></label>`;
      }
      // text
      return `<label class="opt"><span>${lbl}</span><input type="text" data-opt="${name}" value="${String(val).replace(/"/g, "&quot;")}"></label>`;
    })
    .join("");
}

// 新しいセクションを生成
function newSection(id) {
  const opts = defaultOpts(id);
  if (id === "custom" && !Array.isArray(opts.elements)) opts.elements = [];
  return { comp: id, opts, comment: "" };
}

// ---- カスタムブロックエディター ----
const CUST_TYPES = [
  ["heading", "見出し"], ["text", "テキスト"], ["image", "画像"],
  ["button", "ボタン"], ["spacer", "余白"], ["divider", "区切り線"],
];
const CUST_LABEL = Object.fromEntries(CUST_TYPES);
const ALIGN_OPTS = [["left", "左"], ["center", "中央"], ["right", "右"]];
const WIDTH_OPTS = [["full", "全幅"], ["half", "1/2"], ["third", "1/3"], ["twothird", "2/3"], ["quarter", "1/4"]];

function newEl(type) {
  switch (type) {
    case "heading": return { type, text: "見出しテキスト", align: "left" };
    case "text": return { type, text: "テキストが入ります。", align: "left" };
    case "image": return { type, label: "画像", size: "md", align: "center" };
    case "button": return { type, text: "ボタン", align: "center" };
    case "spacer": return { type, size: "md" };
    default: return { type }; // divider
  }
}

function celText(name, val, ph) {
  return `<input type="text" data-cel="${name}" value="${String(val == null ? "" : val).replace(/"/g, "&quot;")}" placeholder="${ph || ""}">`;
}
function celSelect(name, val, opts) {
  const os = opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${l}</option>`).join("");
  return `<select data-cel="${name}">${os}</select>`;
}
function renderElRow(i, ei, el) {
  const base = `${i}:${ei}`;
  let fields = "";
  if (el.type === "heading" || el.type === "text" || el.type === "button") fields += celText(`${base}:text`, el.text, "");
  if (el.type === "image") {
    fields += celText(`${base}:label`, el.label, "ラベル");
    fields += celSelect(`${base}:size`, el.size || "md", [["sm", "小"], ["md", "中"], ["lg", "大"], ["hero", "特大"]]);
  }
  if (el.type === "spacer") fields += celSelect(`${base}:size`, el.size || "md", [["sm", "小"], ["md", "中"], ["lg", "大"]]);
  if (el.type !== "spacer" && el.type !== "divider") fields += celSelect(`${base}:align`, el.align || "left", ALIGN_OPTS);
  fields += celSelect(`${base}:width`, el.width || "full", WIDTH_OPTS); // 幅(左右/多段配置)
  return `<div class="cel" data-si="${i}" data-ei="${ei}">
            <div class="cel-head"><span class="cel-drag" draggable="true" title="${ui().dragHint}">⠿</span><span class="cel-type">${CUST_LABEL[el.type] || el.type}</span>
              <span class="cel-act"><button class="ico" data-cmove="${base}:-1" title="${ui().moveUp}">▲</button><button class="ico" data-cmove="${base}:1" title="${ui().moveDown}">▼</button><button class="ico ico-del" data-cdel="${base}" title="${ui().remove}">✕</button></span>
            </div>
            ${fields ? `<div class="cel-fields">${fields}</div>` : ""}
          </div>`;
}
function renderCustomEditor(s, i) {
  const els = Array.isArray(s.opts.elements) ? s.opts.elements : [];
  const add = CUST_TYPES.map(([t, l]) => `<button class="chip cadd" data-cadd="${i}:${t}">＋${l}</button>`).join("");
  const list = els.length ? els.map((el, ei) => renderElRow(i, ei, el)).join("") : `<p class="empty" style="padding:8px;">要素を追加してください</p>`;
  return `<div class="cust"><div class="cust-add">${add}</div><div class="cust-list">${list}</div></div>`;
}

// ---- パネルイベント (委譲) ----
function bindPanel() {
  const panel = $("#panel");
  panel.addEventListener("click", (e) => {
    // ---- パレットのカテゴリ開閉(アコーディオン) ----
    const grp = e.target.closest("[data-grp]");
    if (grp) {
      const k = grp.dataset.grp;
      palOpen[k] = palOpen[k] === false; // false→true / true(未定義)→false
      saveUI();
      const list = $("#palList");
      if (list) list.innerHTML = renderPalette();
      return;
    }
    // ---- パレット: チップを押すと操作ボタンをインライン展開 ----
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      const id = pick.dataset.pick;
      palPickId = palPickId === id ? null : id; // 再クリックで閉じる
      const list = $("#palList");
      if (list) list.innerHTML = renderPalette();
      return;
    }
    // ---- 編集して追加 → モーダル ----
    const addEdit = e.target.closest("[data-addedit]");
    if (addEdit) {
      openAddModal(addEdit.dataset.addedit);
      return;
    }
    const add = e.target.closest("[data-add]");
    const dup = e.target.closest("[data-dup]");
    const rem = e.target.closest("[data-remove]");
    const mov = e.target.closest("[data-move]");
    const selBtn = e.target.closest("[data-select]");
    const cadd = e.target.closest("[data-cadd]");
    const cmove = e.target.closest("[data-cmove]");
    const cdel = e.target.closest("[data-cdel]");
    // ---- カスタムブロックの原始要素: 追加 / 移動 / 削除 ----
    if (cadd) {
      const [i, type] = cadd.dataset.cadd.split(":");
      const sec = state.sections[+i];
      if (!Array.isArray(sec.opts.elements)) sec.opts.elements = [];
      sec.opts.elements.push(newEl(type));
      renderPanel();
      updatePreview();
      histPush();
      return;
    }
    if (cmove) {
      const [i, ei, dir] = cmove.dataset.cmove.split(":").map(Number);
      const arr = state.sections[i].opts.elements || [];
      const j = ei + dir;
      if (j >= 0 && j < arr.length) {
        [arr[ei], arr[j]] = [arr[j], arr[ei]];
        renderPanel();
        updatePreview();
        histPush();
      }
      return;
    }
    if (cdel) {
      const [i, ei] = cdel.dataset.cdel.split(":").map(Number);
      (state.sections[i].opts.elements || []).splice(ei, 1);
      renderPanel();
      updatePreview();
      histPush();
      return;
    }
    if (add) {
      const id = add.dataset.add;
      let newIdx;
      if (selIdx != null && selIdx < state.sections.length) {
        state.sections.splice(selIdx + 1, 0, newSection(id));
        selIdx = selIdx + 1; // 방금 삽입한 항목을 다음 삽입 기준으로
        newIdx = selIdx;
      } else {
        state.sections.push(newSection(id));
        newIdx = state.sections.length - 1;
      }
      palPickId = null; // インライン操作ボタンを閉じる
      renderPanel();
      updatePreview();
      histPush();
      revealSection(newIdx); // ← 追加した位置までスクロール + ハイライト
      toast(ui().added.replace("{name}", compLabel(id)));
    } else if (dup) {
      const i = +dup.dataset.dup;
      const src = state.sections[i];
      // 깊은 복사(커스텀 블럭의 elements 배열 등 중첩 구조까지 독립적으로)
      state.sections.splice(i + 1, 0, { comp: src.comp, opts: JSON.parse(JSON.stringify(src.opts)), comment: src.comment || "" });
      selIdx = null;
      renderPanel();
      updatePreview();
      histPush();
    } else if (rem) {
      state.sections.splice(+rem.dataset.remove, 1);
      selIdx = null;
      renderPanel();
      updatePreview();
      histPush();
    } else if (mov) {
      const [i, dir] = mov.dataset.move.split(":").map(Number);
      const j = i + dir;
      if (j >= 0 && j < state.sections.length) {
        [state.sections[i], state.sections[j]] = [state.sections[j], state.sections[i]];
        selIdx = null;
        renderPanel();
        updatePreview();
        histPush();
      }
    } else if (selBtn) {
      const i = +selBtn.dataset.select;
      selIdx = selIdx === i ? null : i; // 다시 클릭하면 해제
      renderPanel();
    }
  });

  // 옵션/코멘트 변경 → 프리뷰만 갱신(패널 재렌더 X, 포커스 유지)
  panel.addEventListener("input", (e) => {
    // パレット検索: リストのみ差し替え(入力フォーカスを保つ)
    if (e.target.id === "palSearch") {
      paletteQuery = e.target.value;
      const list = $("#palList");
      if (list) list.innerHTML = renderPalette();
      return;
    }
    const opt = e.target.closest("[data-opt]");
    const cmt = e.target.closest("[data-comment]");
    const cel = e.target.closest("[data-cel]");
    if (cel) {
      const [i, ei, prop] = cel.dataset.cel.split(":");
      const el = state.sections[+i].opts.elements[+ei];
      if (el) el[prop] = cel.type === "checkbox" ? cel.checked : cel.value;
      updatePreview();
      histPushDebounced();
      return;
    }
    if (opt) {
      const [i, key] = opt.dataset.opt.split(":");
      let v;
      if (opt.type === "checkbox") v = opt.checked;
      else if (opt.type === "number") v = +opt.value;
      else v = opt.value;
      state.sections[+i].opts[key] = v;
      updatePreview();
      histPushDebounced();
    } else if (cmt) {
      state.sections[+cmt.dataset.comment].comment = cmt.value;
      updatePreview();
      histPushDebounced();
    }
  });

  // ---- 드래그 & 드롭 정렬 (섹션 / 커스텀 요소) ----
  let dragFrom = null; // 섹션 드래그
  let elDrag = null; // 커스텀 요소 드래그 {sec, ei}
  panel.addEventListener("dragstart", (e) => {
    const celHandle = e.target.closest(".cel-drag");
    if (celHandle) {
      // 커스텀 블럭 요소 드래그(섹션 드래그로 번지지 않게 먼저 처리)
      const cel = celHandle.closest(".cel");
      elDrag = { sec: +cel.dataset.si, ei: +cel.dataset.ei };
      e.dataTransfer.effectAllowed = "move";
      cel.classList.add("is-drag");
      return;
    }
    const sec = e.target.closest(".sec");
    if (!sec) return;
    dragFrom = +sec.dataset.i;
    e.dataTransfer.effectAllowed = "move";
    sec.classList.add("is-drag");
  });
  panel.addEventListener("dragend", () => {
    panel.querySelectorAll(".is-drag").forEach((el) => el.classList.remove("is-drag"));
    panel.querySelectorAll(".is-over").forEach((el) => el.classList.remove("is-over"));
  });
  panel.addEventListener("dragover", (e) => {
    if (elDrag) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const over = e.target.closest(".cel");
      panel.querySelectorAll(".cel.is-over").forEach((el) => el.classList.remove("is-over"));
      if (over && +over.dataset.si === elDrag.sec) over.classList.add("is-over");
      return;
    }
    if (dragFrom == null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const over = e.target.closest(".sec");
    panel.querySelectorAll(".sec.is-over").forEach((el) => el.classList.remove("is-over"));
    if (over) over.classList.add("is-over");
  });
  panel.addEventListener("drop", (e) => {
    if (elDrag) {
      e.preventDefault();
      const over = e.target.closest(".cel");
      if (over && +over.dataset.si === elDrag.sec) {
        const arr = state.sections[elDrag.sec].opts.elements;
        const to = +over.dataset.ei;
        if (to !== elDrag.ei) {
          const [m] = arr.splice(elDrag.ei, 1);
          arr.splice(to, 0, m);
          renderPanel();
          updatePreview();
          histPush();
        }
      }
      elDrag = null;
      return;
    }
    if (dragFrom == null) return;
    e.preventDefault();
    const over = e.target.closest(".sec");
    const to = over ? +over.dataset.i : state.sections.length - 1;
    const [moved] = state.sections.splice(dragFrom, 1);
    state.sections.splice(to, 0, moved);
    dragFrom = null;
    selIdx = null;
    renderPanel();
    updatePreview();
    histPush();
  });
}

// ======================================================================
//  프리뷰 & 다운로드
// ======================================================================
// srcdoc 差し替えでプレビューは先頭に戻るため、直前のスクロール位置を復元する。
// ただしセクション追加直後(revealPendingIdx がある)は、その位置へのスクロールを優先。
let previewScrollMemo = 0;
let revealPendingIdx = null;

function onPreviewLoad() {
  if (revealPendingIdx != null) {
    const i = revealPendingIdx;
    revealPendingIdx = null;
    scrollPreviewTo(i);
    return;
  }
  try {
    const doc = $("#preview").contentDocument;
    const se = doc && (doc.scrollingElement || doc.documentElement);
    if (se) se.scrollTop = previewScrollMemo; // 復元は即時(アニメーションなし)
  } catch (_) {
    /* クロスオリジン等は無視 */
  }
}

function updatePreview() {
  persist(); // 모든 변경이 여기로 수렴 → 자동저장 단일 지점
  const iframe = $("#preview");
  try {
    const doc = iframe.contentDocument;
    const se = doc && (doc.scrollingElement || doc.documentElement);
    previewScrollMemo = se ? se.scrollTop : 0;
  } catch (_) {
    previewScrollMemo = 0;
  }
  // 同一関数参照なので重複登録されない(連続入力でも1回だけ発火)
  iframe.addEventListener("load", onPreviewLoad, { once: true });
  iframe.srcdoc = buildDocument(state, CSS, { markSections: true });
}

// Blob をダウンロードさせる共通処理
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 単一HTML(CSS/JSを埋め込み) — 1ファイルで完結するので共有しやすい
function download() {
  const html = buildDocument(state, CSS);
  saveBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${state.pageType}-wireframe.html`);
}

// 構成を URL に載せてコピー(サーバー不要・リンク1本で共有)
async function shareLink() {
  syncActivePage();
  try {
    const token = await encodeState(state);
    const url = location.origin + location.pathname + "#wf=" + token;
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      // クリップボードが使えない場合は URL バーに反映するだけ
      location.hash = "wf=" + token;
    }
    toast(ui().shareCopied);
  } catch (_) {
    toast(ui().shareFailed);
  }
}

// 起動時: #wf=... があれば読み込みを提案する
async function loadFromHash() {
  const m = /(?:^|[#&])wf=([^&]+)/.exec(location.hash || "");
  if (!m) return false;
  const cleanHash = () => history.replaceState(null, "", location.pathname + location.search);
  const data = await decodeState(m[1]);
  if (!data) { cleanHash(); return false; } // 壊れたリンクは黙って捨てる
  const clean = sanitize(data);
  if (!clean || !clean.pages) { cleanHash(); return false; }
  // キャンセル時は URL を残す(あとで読み込み直せるように)
  if (!confirm(ui().shareConfirm)) return false;
  applyState(clean);
  cleanHash();
  return true;
}

// プロジェクトZIP(全ページ + 共有 css/js + 目次) — セットで引き渡す用
function downloadProject() {
  syncActivePage();
  const files = buildProject(state, CSS, PAGE_TYPES);
  if (!files) return toast(ui().projectEmpty);
  const pageCount = Object.keys(files).filter((n) => n.endsWith(".html") && n !== "index.html").length;
  saveBlob(new Blob([zipStore(files)], { type: "application/zip" }), "wireframe-project.zip");
  toast(ui().projectDone.replace("{count}", pageCount));
}

// 分割ZIP(index.html + style.css + script.js) — 実装に引き渡す用
function downloadZip() {
  const files = buildFiles(state, CSS);
  const zip = zipStore(files);
  saveBlob(new Blob([zip], { type: "application/zip" }), `${state.pageType}-wireframe.zip`);
  toast(ui().zipDone);
}


// ======================================================================
//  사용 가이드 (일본어) — ❓ ガイド 버튼 / 첫 접속 자동 표시
// ======================================================================
function guideHtml() {
  return `
  <h2>使い方ガイド <span class="guide-ver">v${APP_VERSION}</span></h2>
  <p>ECサイトのローファイ・ワイヤーフレームを <b>組み立て → プレビュー → HTML出力</b> するツールです。色や画像は入れず、構造と配置だけを素早く確認します。</p>

  <h3>基本の流れ</h3>
  <ol>
    <li>上部で <b>ページ種別</b>（TOP／一覧／詳細／カート／マイページ／LP）を選ぶ → 標準構成が入ります。</li>
    <li>左パネルの <b>コンポーネント</b> を押してセクションを追加。<b>⠿ドラッグ</b>で並べ替え、<b>⧉複製</b>、<b>✕削除</b>。</li>
    <li>各セクションの <b>オプション</b>（列数・枚数・テキスト等）を編集 → 右側で即プレビュー。</li>
    <li><b>⬇ ダウンロード</b> または <b>⧉ HTMLコピー</b> で書き出し。</li>
  </ol>

  <h3>セクションの編集</h3>
  <ul>
    <li><b>追加位置</b>：セクション名をクリックして選択すると、その下に挿入されます（もう一度クリックで解除／未選択なら末尾に追加）。</li>
    <li><b>コメント</b>：各セクションにメモを書くと、プレビューに黄色の吹き出しで表示されます（仕様メモ・指示用）。</li>
    <li><b>内容編集</b>：カテゴリ名・商品名・価格などを入力すると、ダミーが実際のテキストに変わります（空欄ならダミーのまま）。</li>
  </ul>

  <h3>ツールバー</h3>
  <table>
    <tr><td>◀ / ☰ 編集</td><td>編集パネルを開閉。閉じるとプレビューが全体に広がります（スマホで便利）。</td></tr>
    <tr><td>ページ種別</td><td>ページの標準テンプレートを読み込み。</td></tr>
    <tr><td>📁 テンプレート</td><td>共有テンプレートを読み込み（現在の内容は置き換わります）。</td></tr>
    <tr><td>注記 ON/OFF</td><td>注記とコメントの表示切替（<b>開発用</b>↔<b>クライアント用</b>）。書き出したファイルでも切替可。</td></tr>
    <tr><td>↶ / ↷</td><td>元に戻す／やり直し（<span class="guide-kbd">Ctrl+Z</span> / <span class="guide-kbd">Ctrl+Shift+Z</span>）。</td></tr>
    <tr><td>💾 / 📂</td><td>構成を .json で保存／読み込み（バックアップ・共有用）。</td></tr>
    <tr><td>🔍 全体表示</td><td>ビルダーの枠なしで、実寸のワイヤーフレームを新しいタブで確認。</td></tr>
    <tr><td>⧉ HTMLコピー</td><td>マークアップをクリップボードへコピー。</td></tr>
    <tr><td>⬇ ダウンロード</td><td>自己完結の単一HTMLファイルを保存。</td></tr>
    <tr><td>💬 リクエスト</td><td>追加してほしいコンポーネント等の要望を送る（GitHub）。</td></tr>
  </table>

  <h3>動くインタラクション（プレビュー・書き出し先の両方で動作）</h3>
  <ul>
    <li><b>スライダー</b>（hero・メディア＋テキスト）：矢印・自動送り。</li>
    <li><b>商品カルーセル</b>：左右の矢印でスクロール。</li>
    <li><b>タブ</b>（ランキング）：クリックで中身が切り替わります。</li>
    <li><b>ギャラリー</b>（詳細）：サムネイル・矢印でメイン画像を切替。</li>
    <li><b>FAQ</b>：クリックで開閉。<b>アニメーション</b>：スクロールでフェードイン／スライドアップ。</li>
  </ul>

  <h3>保存について</h3>
  <p>編集内容は <b>自動保存</b> され、タブを閉じても・再読み込みしても復元されます（同じブラウザ）。大事な案はときどき <b>💾 構成保存</b> でファイルにバックアップしてください。</p>
  `;
}
function openGuide() {
  let ov = document.getElementById("wfGuide");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "wfGuide";
    ov.className = "guide-overlay";
    ov.innerHTML = `<div class="guide-box"><button class="guide-close" id="guideClose" aria-label="close">✕</button>${guideHtml()}</div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeGuide();
    });
    document.getElementById("guideClose").addEventListener("click", closeGuide);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeGuide();
    });
  }
  ov.style.display = "flex";
}
function closeGuide() {
  const ov = document.getElementById("wfGuide");
  if (ov) ov.style.display = "none";
}

// 전체보기: 빌더 크롬 없이 실제 풀사이즈로 새 탭에서 확인
function openFull() {
  const blob = new Blob([buildDocument(state, CSS)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// HTML 복사: 파일 다운로드 없이 마크업을 클립보드로
function flashBtn(sel, msg) {
  const b = $(sel);
  if (!b) return;
  const prev = b.textContent;
  b.textContent = msg;
  setTimeout(() => (b.textContent = prev), 1200);
}

// 追加したセクションまでスクロールし、一瞬ハイライトする(操作結果を可視化)
function revealSection(i) {
  const el = document.querySelector(`#secList .sec[data-i="${i}"]`);
  if (el) {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("is-new");
    setTimeout(() => el.classList.remove("is-new"), 1400);
  }
  revealInPreview(i); // プレビュー側も同じセクションへ
}

// プレビュー(iframe)内の該当セクションへスクロール。
// ・マーカーは display:contents でボックスを持たないので、実体のある最初の子要素を対象にする
// ・sticky ヘッダーに隠れないよう、その高さぶんオフセットする
function scrollPreviewTo(i) {
  try {
    const doc = $("#preview").contentDocument;
    if (!doc) return false;
    const wrap = doc.querySelectorAll("[data-wf-sec]")[i];
    const target = wrap && wrap.firstElementChild;
    if (!target) return false;

    const hdr = doc.querySelector(".wf-header");
    let offset = 0;
    if (hdr) {
      const cs = doc.defaultView.getComputedStyle(hdr);
      offset = hdr.getBoundingClientRect().height + (parseFloat(cs.top) || 0);
    }
    const scroller = doc.scrollingElement || doc.documentElement;
    const top = target.getBoundingClientRect().top + scroller.scrollTop - offset - 12;
    // 直前に srcdoc を丸ごと差し替えた新しい文書なので、アニメーションせず即時に合わせる
    // (smooth は再描画が止まっている環境でスクロールが始まらないことがある)
    scroller.scrollTop = Math.max(0, top);
    return true;
  } catch (_) {
    return false; // クロスオリジン等は無視
  }
}

// updatePreview() は srcdoc を差し替えるため、読み込み完了を待ってからスクロールする
// (直後に実行すると古い文書をスクロールし、新文書は先頭に戻ってしまう)
// 直後の updatePreview() の load 時に「復元」ではなく「そのセクションへ移動」させる
function revealInPreview(i) {
  revealPendingIdx = i;
  setTimeout(() => {
    // load をすでに取り逃していた場合の保険
    if (revealPendingIdx === i) {
      revealPendingIdx = null;
      scrollPreviewTo(i);
    }
  }, 450);
}

// ======================================================================
//  「編集して追加」モーダル
//  挿入前にオプションを設定し、挿入位置を番号で直接指定できる。
// ======================================================================
let draft = null; // { comp, opts, comment } — まだ state に入っていない下書き

// 位置 0..N の選択肢を重複なく生成。0=先頭 / i+1=i番の後 / N=最後のセクションの後(=末尾)
// ※ 位置 N は「最後のセクションの後」と「末尾」が同義。値の重複を避けつつ、
//   最後に追加したセクション名も見えるよう「N. 名前 の後（末尾）」と表記する。
function insertPosOptions(defaultPos) {
  const n = state.sections.length;
  const opt = (v, label) => `<option value="${v}" ${v === defaultPos ? "selected" : ""}>${label}</option>`;
  if (n === 0) return opt(0, ui().modalPosEnd);
  const out = [opt(0, ui().modalPosTop)];
  for (let i = 0; i < n - 1; i++) {
    out.push(opt(i + 1, ui().modalPosAfter.replace("{n}", i + 1).replace("{name}", compLabel(state.sections[i].comp))));
  }
  out.push(opt(n, ui().modalPosAfterEnd.replace("{n}", n).replace("{name}", compLabel(state.sections[n - 1].comp))));
  return out.join("");
}

function addModalHtml() {
  const name = compLabel(draft.comp);
  const optsHtml = renderOptions({ comp: draft.comp, opts: draft.opts }, "d");
  const custHtml = draft.comp === "custom" ? renderCustomEditor({ comp: draft.comp, opts: draft.opts }, "d") : "";
  // 既定の挿入位置: 選択中セクションの直後、なければ末尾
  const defPos = selIdx != null && selIdx < state.sections.length ? selIdx + 1 : state.sections.length;
  const listHtml = state.sections.length
    ? state.sections
        .map((s, i) => `<li class="am-li"><span class="am-n">${i + 1}</span>${compLabel(s.comp)}</li>`)
        .join("")
    : `<li class="am-li am-li--empty">${ui().empty}</li>`;

  return `<div class="am-box">
    <button class="guide-close" id="amClose" aria-label="close">✕</button>
    <h2 class="am-ttl">${ui().modalTitle.replace("{name}", name)}</h2>

    <h3 class="am-h3">${ui().modalOptions}</h3>
    <div class="am-opts">${optsHtml || custHtml ? optsHtml + custHtml : `<p class="muted-note">${ui().modalNoOpts}</p>`}</div>

    <h3 class="am-h3">${ui().modalPos}</h3>
    <div class="am-pos">
      <select id="amPos">${insertPosOptions(defPos)}</select>
    </div>
    <details class="am-cur"><summary>${ui().modalCurrent.replace("{count}", state.sections.length)}</summary>
      <ol class="am-list">${listHtml}</ol>
    </details>

    <div class="am-actions">
      <button class="btn btn-ghost" id="amCancel">${ui().modalCancel}</button>
      <button class="btn btn-primary" id="amOk">${ui().modalConfirm}</button>
    </div>
  </div>`;
}

function openAddModal(id) {
  draft = newSection(id);
  let ov = document.getElementById("wfAddModal");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "wfAddModal";
    ov.className = "guide-overlay";
    document.body.appendChild(ov);
    ov.addEventListener("click", (e) => {
      if (e.target === ov) closeAddModal();
    });
    // 下書きのオプション編集(data-opt の index が "d" のものを draft に反映)
    ov.addEventListener("input", (e) => {
      const opt = e.target.closest("[data-opt]");
      const cel = e.target.closest("[data-cel]");
      if (cel) {
        const [, ei, prop] = cel.dataset.cel.split(":");
        const el = draft.opts.elements && draft.opts.elements[+ei];
        if (el) el[prop] = cel.type === "checkbox" ? cel.checked : cel.value;
        return;
      }
      if (opt) {
        const key = opt.dataset.opt.split(":")[1];
        draft.opts[key] = opt.type === "checkbox" ? opt.checked : opt.type === "number" ? +opt.value : opt.value;
      }
    });
    ov.addEventListener("click", (e) => {
      if (e.target.closest("#amClose") || e.target.closest("#amCancel")) return closeAddModal();
      if (e.target.closest("#amOk")) return confirmAddModal();
      // カスタムブロックの原始要素: 追加 / 移動 / 削除(モーダルは #panel の外なので専用に処理)
      const cadd = e.target.closest("[data-cadd]");
      const cmove = e.target.closest("[data-cmove]");
      const cdel = e.target.closest("[data-cdel]");
      if (!cadd && !cmove && !cdel) return;
      if (!Array.isArray(draft.opts.elements)) draft.opts.elements = [];
      const els = draft.opts.elements;
      if (cadd) {
        els.push(newEl(cadd.dataset.cadd.split(":")[1]));
      } else if (cmove) {
        const [, ei, dir] = cmove.dataset.cmove.split(":").map((v, k) => (k === 0 ? v : Number(v)));
        const j = ei + dir;
        if (j >= 0 && j < els.length) [els[ei], els[j]] = [els[j], els[ei]];
      } else if (cdel) {
        els.splice(+cdel.dataset.cdel.split(":")[1], 1);
      }
      redrawModalCustom();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && ov.style.display === "flex") closeAddModal();
    });
  }
  ov.innerHTML = addModalHtml();
  ov.style.display = "flex";
}

// カスタムブロック編集部分だけ差し替え(挿入位置の選択値は保持)
function redrawModalCustom() {
  const ov = document.getElementById("wfAddModal");
  if (!ov || !draft) return;
  const keepPos = ov.querySelector("#amPos")?.value;
  const host = ov.querySelector(".am-opts");
  if (!host) return;
  host.innerHTML =
    renderOptions({ comp: draft.comp, opts: draft.opts }, "d") +
    (draft.comp === "custom" ? renderCustomEditor({ comp: draft.comp, opts: draft.opts }, "d") : "");
  const pos = ov.querySelector("#amPos");
  if (pos && keepPos != null) pos.value = keepPos;
}

function closeAddModal() {
  const ov = document.getElementById("wfAddModal");
  if (ov) ov.style.display = "none";
  draft = null;
}

function confirmAddModal() {
  if (!draft) return;
  const posSel = document.getElementById("amPos");
  const pos = Math.max(0, Math.min(state.sections.length, +(posSel ? posSel.value : state.sections.length)));
  state.sections.splice(pos, 0, draft);
  const name = compLabel(draft.comp);
  selIdx = pos; // 次の挿入基準を今入れた位置に
  palPickId = null;
  closeAddModal();
  renderPanel();
  updatePreview();
  histPush();
  revealSection(pos);
  toast(ui().added.replace("{name}", name));
}

// 短いトースト通知
let toastTimer = null;
function toast(msg) {
  let t = $("#wfToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "wfToast";
    t.className = "wf-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-on"), 1800);
}

function copyHtml() {
  const html = buildDocument(state, CSS);
  const done = () => flashBtn("#btnCopy", ui().copied);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(html).then(done).catch(() => fallbackCopy(html, done));
  } else {
    fallbackCopy(html, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done();
  } catch (_) {}
  ta.remove();
}

// ======================================================================
function renderAll() {
  renderTopbar();
  renderPanel();
  $("#stage").className = "stage dev-" + state.device;
  updatePreview();
  updateHistButtons(); // 툴바 재생성 후 undo/redo 활성 상태 반영
  applyCollapsed(); // 툴바 재생성 후 패널 접힘 상태 반영
}

// 키보드 단축키: Ctrl+Z=되돌리기, Ctrl+Shift+Z / Ctrl+Y=다시실행
function bindShortcuts() {
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const inText = /^(input|textarea|select)$/i.test(e.target.tagName || "");
    if (inText) return; // 텍스트 입력 중엔 브라우저 기본 undo 유지
    const k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((k === "z" && e.shiftKey) || k === "y") {
      e.preventDefault();
      redo();
    }
  });
}

async function init() {
  CSS = await fetch("./styles/wireframe.css").then((r) => r.text());
  // 優先順: 共有リンク(#wf=) > localStorage の自動保存 > 標準テンプレート
  const fromShare = await loadFromHash();
  if (!fromShare && !restore()) loadTemplate("top");
  loadUI(); // 패널 접힘 상태 복원
  bindPanel();
  bindShortcuts();
  histInit(); // 현재 상태를 히스토리 0번으로
  renderAll();
  if (fromShare) toast(ui().shareLoaded);
  if (!guideSeen) {
    openGuide(); // 첫 접속 시 가이드 자동 표시
    guideSeen = true;
    saveUI();
  }
}

init();
