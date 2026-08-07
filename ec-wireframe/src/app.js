// app.js — 빌더 UI 컨트롤러
import { catalog, defaultOpts } from "./catalog.js";
import { templates, palette, PAGE_TYPES } from "./templates.js";
import { i18n, strings } from "./i18n.js";
import { buildDocument } from "./export.js";

const state = {
  lang: "ko",
  device: "both",
  pageType: "top",
  sections: [], // [{ comp, opts }]
};

let CSS = ""; // wireframe.css 원문

const $ = (sel, root = document) => root.querySelector(sel);

// ======================================================================
//  영속화 (localStorage 자동저장 + JSON 저장/불러오기)
// ======================================================================
const STORAGE_KEY = "ec-wf-state-v1";

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    /* 용량초과·프라이빗모드 등은 조용히 무시 */
  }
}

// 외부에서 들어온 state 후보를 검증·정제(신뢰 못 할 데이터 방어)
function sanitize(cand) {
  if (!cand || typeof cand !== "object") return null;
  const lang = ["ko", "ja"].includes(cand.lang) ? cand.lang : "ko";
  const device = ["both", "pc", "sp"].includes(cand.device) ? cand.device : "both";
  const pageType = PAGE_TYPES.includes(cand.pageType) ? cand.pageType : "top";
  const sections = Array.isArray(cand.sections)
    ? cand.sections
        .filter((s) => s && catalog[s.comp]) // 알 수 없는 컴포넌트 제거
        .map((s) => ({ comp: s.comp, opts: { ...defaultOpts(s.comp), ...(s.opts || {}) } }))
    : [];
  return { lang, device, pageType, sections };
}

function applyState(next) {
  Object.assign(state, next);
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

// ---- 상태 초기화 ----
function loadTemplate(pageType) {
  state.pageType = pageType;
  state.sections = (templates[pageType] || []).map((s) => ({
    comp: s.comp,
    opts: { ...defaultOpts(s.comp), ...(s.opts || {}) },
  }));
}

// ---- 라벨 헬퍼 ----
const ui = () => i18n[state.lang].ui;
const compLabel = (id) => strings[state.lang].comp[id] || id;

// ======================================================================
//  렌더: 상단 툴바
// ======================================================================
function renderTopbar() {
  const t = i18n[state.lang];
  const pageOpts = PAGE_TYPES.map(
    (p) => `<option value="${p}" ${p === state.pageType ? "selected" : ""}>${t.pageTypes[p]}</option>`
  ).join("");
  const devOpts = ["both", "pc", "sp"].map(
    (d) => `<option value="${d}" ${d === state.device ? "selected" : ""}>${t.devices[d]}</option>`
  ).join("");
  const langOpts = ["ko", "ja"].map(
    (l) => `<option value="${l}" ${l === state.lang ? "selected" : ""}>${l === "ko" ? "한국어" : "日本語"}</option>`
  ).join("");

  $("#topbar").innerHTML = `
    <div class="tb-title">${ui().appTitle}</div>
    <label class="tb-field">${ui().pageType}
      <select id="selPage">${pageOpts}</select>
    </label>
    <label class="tb-field">${ui().device}
      <select id="selDevice">${devOpts}</select>
    </label>
    <label class="tb-field">${ui().language}
      <select id="selLang">${langOpts}</select>
    </label>
    <span class="tb-autosave" title="${ui().autosave}">● ${ui().autosave}</span>
    <div class="tb-spacer"></div>
    <button id="btnSave" class="btn btn-ghost">${ui().save}</button>
    <button id="btnLoad" class="btn btn-ghost">${ui().load}</button>
    <button id="btnReset" class="btn btn-ghost">${ui().reset}</button>
    <button id="btnDownload" class="btn btn-primary">${ui().download}</button>
    <input id="fileLoad" type="file" accept="application/json,.json" hidden>
  `;

  $("#selPage").addEventListener("change", (e) => {
    loadTemplate(e.target.value);
    renderAll();
  });
  $("#selDevice").addEventListener("change", (e) => {
    state.device = e.target.value;
    updatePreview();
    $("#stage").className = "stage dev-" + state.device;
  });
  $("#selLang").addEventListener("change", (e) => {
    state.lang = e.target.value;
    renderAll();
  });
  $("#btnReset").addEventListener("click", () => {
    if (confirm(ui().confirmReset)) {
      loadTemplate(state.pageType);
      renderAll();
    }
  });
  $("#btnDownload").addEventListener("click", download);
  $("#btnSave").addEventListener("click", saveJson);
  $("#btnLoad").addEventListener("click", () => $("#fileLoad").click());
  $("#fileLoad").addEventListener("change", loadJson);
}

// ---- 구성 JSON 저장/불러오기 ----
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
  e.target.value = ""; // 같은 파일 재선택 허용
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const clean = sanitize(safeParse(reader.result));
    if (!clean) return alert(ui().loadFailed);
    applyState(clean);
    renderAll();
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
//  렌더: 왼쪽 패널 (팔레트 + 섹션 리스트)
// ======================================================================
function renderPanel() {
  // 팔레트
  const pal = (palette[state.pageType] || Object.keys(catalog))
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => `<button class="chip" data-add="${id}">＋ ${compLabel(id)}</button>`)
    .join("");

  // 섹션 리스트
  let list;
  if (state.sections.length === 0) {
    list = `<p class="empty">${ui().empty}</p>`;
  } else {
    list = state.sections
      .map((s, i) => {
        const opts = renderOptions(s, i);
        return `
        <div class="sec" data-i="${i}">
          <div class="sec-head">
            <span class="sec-idx">${i + 1}</span>
            <span class="sec-name">${compLabel(s.comp)}</span>
            <span class="sec-actions">
              <button class="ico" data-move="${i}:-1" title="${ui().moveUp}">▲</button>
              <button class="ico" data-move="${i}:1" title="${ui().moveDown}">▼</button>
              <button class="ico ico-del" data-remove="${i}" title="${ui().remove}">✕</button>
            </span>
          </div>
          ${opts ? `<div class="sec-opts">${opts}</div>` : ""}
        </div>`;
      })
      .join("");
  }

  $("#panel").innerHTML = `
    <div class="pan-block">
      <h3>${ui().palette}</h3>
      <div class="palette">${pal}</div>
    </div>
    <div class="pan-block">
      <h3>${ui().sections}</h3>
      <p class="fixed-note">${ui().fixedNote}</p>
      <div id="secList">${list}</div>
    </div>
  `;
}

function renderOptions(s, i) {
  const comp = catalog[s.comp];
  if (!comp || !comp.options || comp.options.length === 0) return "";
  return comp.options
    .map((opt) => {
      const val = s.opts[opt.key];
      const name = `${i}:${opt.key}`;
      if (opt.type === "bool") {
        return `<label class="opt opt-bool"><input type="checkbox" data-opt="${name}" ${val ? "checked" : ""}> ${opt.label}</label>`;
      }
      if (opt.type === "number") {
        return `<label class="opt"><span>${opt.label}</span><input type="number" data-opt="${name}" value="${val}" min="${opt.min ?? 0}" max="${opt.max ?? 99}" step="${opt.step ?? 1}"></label>`;
      }
      if (opt.type === "select") {
        const choices = (opt.choices || []).map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${l}</option>`).join("");
        return `<label class="opt"><span>${opt.label}</span><select data-opt="${name}">${choices}</select></label>`;
      }
      // text
      return `<label class="opt"><span>${opt.label}</span><input type="text" data-opt="${name}" value="${String(val).replace(/"/g, "&quot;")}"></label>`;
    })
    .join("");
}

// ---- 패널 이벤트 (위임) ----
function bindPanel() {
  const panel = $("#panel");
  panel.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const rem = e.target.closest("[data-remove]");
    const mov = e.target.closest("[data-move]");
    if (add) {
      const id = add.dataset.add;
      state.sections.push({ comp: id, opts: defaultOpts(id) });
      renderPanel();
      updatePreview();
    } else if (rem) {
      state.sections.splice(+rem.dataset.remove, 1);
      renderPanel();
      updatePreview();
    } else if (mov) {
      const [i, dir] = mov.dataset.move.split(":").map(Number);
      const j = i + dir;
      if (j >= 0 && j < state.sections.length) {
        [state.sections[i], state.sections[j]] = [state.sections[j], state.sections[i]];
        renderPanel();
        updatePreview();
      }
    }
  });
  // 옵션 변경 → 프리뷰만 갱신(패널 재렌더 X, 포커스 유지)
  panel.addEventListener("input", (e) => {
    const el = e.target.closest("[data-opt]");
    if (!el) return;
    const [i, key] = el.dataset.opt.split(":");
    let v;
    if (el.type === "checkbox") v = el.checked;
    else if (el.type === "number") v = +el.value;
    else v = el.value;
    state.sections[+i].opts[key] = v;
    updatePreview();
  });
}

// ======================================================================
//  프리뷰 & 다운로드
// ======================================================================
function updatePreview() {
  persist(); // 모든 변경이 여기로 수렴 → 자동저장 단일 지점
  const html = buildDocument(state, CSS);
  const iframe = $("#preview");
  iframe.srcdoc = html;
}

function download() {
  const html = buildDocument(state, CSS);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.pageType}-wireframe.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ======================================================================
function renderAll() {
  renderTopbar();
  renderPanel();
  $("#stage").className = "stage dev-" + state.device;
  updatePreview();
}

async function init() {
  CSS = await fetch("./styles/wireframe.css").then((r) => r.text());
  if (!restore()) loadTemplate("top"); // 저장된 구성 있으면 복원, 없으면 기본 템플릿
  bindPanel();
  renderAll();
}

init();
