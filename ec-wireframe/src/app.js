// app.js — 빌더 UI 컨트롤러
import { catalog, defaultOpts } from "./catalog.js";
import { templates, palette, PAGE_TYPES } from "./templates.js";
import { i18n, strings } from "./i18n.js";
import { buildDocument } from "./export.js";
import { iconFor } from "./icons.js";

const state = {
  lang: "ko",
  device: "both",
  pageType: "top",
  showNotes: true, // 주석(wf-note·코멘트) 표시 여부
  sections: [], // [{ comp, opts, comment }]
};

let selIdx = null; // 삽입 기준으로 선택된 섹션 index (null=맨 뒤 추가)

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
  const showNotes = cand.showNotes !== false;
  const sections = Array.isArray(cand.sections)
    ? cand.sections
        .filter((s) => s && catalog[s.comp]) // 알 수 없는 컴포넌트 제거
        .map((s) => ({
          comp: s.comp,
          opts: { ...defaultOpts(s.comp), ...(s.opts || {}) },
          comment: typeof s.comment === "string" ? s.comment : "",
        }))
    : [];
  return { lang, device, pageType, showNotes, sections };
}

function applyState(next) {
  Object.assign(state, next);
}

// ======================================================================
//  히스토리 (undo / redo) — 내용(pageType·sections) 스냅샷 스택
//  ※ 언어·표시대상·주석표시 같은 화면설정은 되돌리기 대상 아님(내용만)
// ======================================================================
const HIST_MAX = 100;
let history = [];
let hp = -1; // 현재 스냅샷 포인터
let histTimer = null; // 연속 입력(타이핑) 코얼레싱

function snapshot() {
  return JSON.parse(JSON.stringify({ pageType: state.pageType, sections: state.sections }));
}
function histInit() {
  history = [snapshot()];
  hp = 0;
  updateHistButtons();
}
function histPush() {
  clearTimeout(histTimer);
  const snap = snapshot();
  if (hp >= 0 && JSON.stringify(history[hp]) === JSON.stringify(snap)) return; // 변화 없음 → skip
  history = history.slice(0, hp + 1); // redo 가지 잘라냄
  history.push(snap);
  if (history.length > HIST_MAX) history.shift();
  hp = history.length - 1;
  updateHistButtons();
}
function histPushDebounced() {
  clearTimeout(histTimer);
  histTimer = setTimeout(histPush, 500); // 타이핑이 멈추면 1개 항목으로 묶임
}
function loadSnapshot(snap) {
  state.pageType = snap.pageType;
  state.sections = JSON.parse(JSON.stringify(snap.sections));
  selIdx = null;
  renderAll(); // 현재 언어·표시대상은 그대로 유지
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

// ---- 상태 초기화 ----
function loadTemplate(pageType) {
  state.pageType = pageType;
  state.sections = (templates[pageType] || []).map((s) => ({
    comp: s.comp,
    opts: { ...defaultOpts(s.comp), ...(s.opts || {}) },
    comment: "",
  }));
  selIdx = null;
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
    <label class="tb-field">${ui().notesToggle}
      <button id="btnNotes" class="btn btn-toggle ${state.showNotes ? "is-on" : ""}">${state.showNotes ? "ON" : "OFF"}</button>
    </label>
    <span class="tb-autosave" title="${ui().autosave}">● ${ui().autosave}</span>
    <div class="tb-spacer"></div>
    <button id="btnUndo" class="btn btn-ico" title="${ui().undo} (Ctrl+Z)">↶</button>
    <button id="btnRedo" class="btn btn-ico" title="${ui().redo} (Ctrl+Shift+Z)">↷</button>
    <button id="btnSave" class="btn btn-ghost">${ui().save}</button>
    <button id="btnLoad" class="btn btn-ghost">${ui().load}</button>
    <button id="btnReset" class="btn btn-ghost">${ui().reset}</button>
    <button id="btnDownload" class="btn btn-primary">${ui().download}</button>
    <input id="fileLoad" type="file" accept="application/json,.json" hidden>
  `;

  $("#selPage").addEventListener("change", (e) => {
    loadTemplate(e.target.value);
    renderAll();
    histPush();
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
      histPush();
    }
  });
  $("#btnUndo").addEventListener("click", undo);
  $("#btnRedo").addEventListener("click", redo);
  $("#btnDownload").addEventListener("click", download);
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
//  렌더: 왼쪽 패널 (팔레트 + 섹션 리스트)
// ======================================================================
function renderPanel() {
  // 팔레트
  const pal = (palette[state.pageType] || Object.keys(catalog))
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => `<button class="chip" data-add="${id}"><span class="cicon-wrap">${iconFor(id)}</span><span class="chip-lbl">${compLabel(id)}</span></button>`)
    .join("");

  // 섹션 리스트
  let list;
  if (state.sections.length === 0) {
    list = `<p class="empty">${ui().empty}</p>`;
  } else {
    list = state.sections
      .map((s, i) => {
        const opts = renderOptions(s, i);
        const sel = i === selIdx;
        const cmt = String(s.comment || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `
        <div class="sec${sel ? " is-sel" : ""}" data-i="${i}">
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
            ${opts ? `<div class="sec-opts">${opts}</div>` : ""}
          </div>
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

// {ko,ja} 또는 문자열 라벨을 현재 언어로
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

// 새 섹션 생성
function newSection(id) {
  return { comp: id, opts: defaultOpts(id), comment: "" };
}

// ---- 패널 이벤트 (위임) ----
function bindPanel() {
  const panel = $("#panel");
  panel.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const dup = e.target.closest("[data-dup]");
    const rem = e.target.closest("[data-remove]");
    const mov = e.target.closest("[data-move]");
    const selBtn = e.target.closest("[data-select]");
    if (add) {
      const id = add.dataset.add;
      if (selIdx != null && selIdx < state.sections.length) {
        state.sections.splice(selIdx + 1, 0, newSection(id));
        selIdx = selIdx + 1; // 방금 삽입한 항목을 다음 삽입 기준으로
      } else {
        state.sections.push(newSection(id));
      }
      renderPanel();
      updatePreview();
      histPush();
    } else if (dup) {
      const i = +dup.dataset.dup;
      const src = state.sections[i];
      state.sections.splice(i + 1, 0, { comp: src.comp, opts: { ...src.opts }, comment: src.comment || "" });
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
    const opt = e.target.closest("[data-opt]");
    const cmt = e.target.closest("[data-comment]");
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

  // ---- 드래그 & 드롭 정렬 ----
  let dragFrom = null;
  panel.addEventListener("dragstart", (e) => {
    const sec = e.target.closest(".sec");
    if (!sec) return;
    dragFrom = +sec.dataset.i;
    e.dataTransfer.effectAllowed = "move";
    sec.classList.add("is-drag");
  });
  panel.addEventListener("dragend", (e) => {
    const sec = e.target.closest(".sec");
    if (sec) sec.classList.remove("is-drag");
  });
  panel.addEventListener("dragover", (e) => {
    if (dragFrom == null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const over = e.target.closest(".sec");
    panel.querySelectorAll(".sec.is-over").forEach((el) => el.classList.remove("is-over"));
    if (over) over.classList.add("is-over");
  });
  panel.addEventListener("drop", (e) => {
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
  updateHistButtons(); // 툴바 재생성 후 undo/redo 활성 상태 반영
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
  if (!restore()) loadTemplate("top"); // 저장된 구성 있으면 복원, 없으면 기본 템플릿
  bindPanel();
  bindShortcuts();
  histInit(); // 현재 상태를 히스토리 0번으로
  renderAll();
}

init();
