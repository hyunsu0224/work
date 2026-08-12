// app.js — 빌더 UI 컨트롤러
import { catalog, defaultOpts } from "./catalog.js";
import { templates, palette, PAGE_TYPES } from "./templates.js";
import { i18n, strings } from "./i18n.js";
import { buildDocument } from "./export.js";
import { iconFor } from "./icons.js";
import { gallery } from "./gallery.js";

const state = {
  lang: "ja", // 신규 접속 기본 언어(저장된 값이 있으면 복원됨)
  device: "both",
  pageType: "top",
  showNotes: true, // 주석(wf-note·코멘트) 표시 여부
  sections: [], // [{ comp, opts, comment }]
};

let selIdx = null; // 삽입 기준으로 선택된 섹션 index (null=맨 뒤 추가)
let panelCollapsed = false; // 편집 패널 접힘 여부(PC/SP 공통)
const REPO_URL = "https://github.com/hyunsu0224/work"; // 요청(이슈) 대상 저장소

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
  const lang = "ja"; // 일본어 고정(언어 토글 제거)
  const device = ["both", "pc", "sp"].includes(cand.device) ? cand.device : "both";
  const pageType = PAGE_TYPES.includes(cand.pageType) ? cand.pageType : "top";
  const showNotes = cand.showNotes !== false;
  const sections = Array.isArray(cand.sections)
    ? cand.sections
        .filter((s) => s && catalog[s.comp]) // 알 수 없는 컴포넌트 제거
        .map((s) => {
          const opts = { ...defaultOpts(s.comp), ...(s.opts || {}) };
          if (s.comp === "custom") {
            const valid = new Set(["heading", "text", "image", "button", "spacer", "divider"]);
            opts.elements = Array.isArray(opts.elements)
              ? opts.elements.filter((el) => el && valid.has(el.type)).map((el) => ({ ...el }))
              : [];
          }
          return { comp: s.comp, opts, comment: typeof s.comment === "string" ? s.comment : "" };
        })
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

// ---- UI 상태(패널 접힘) 영속화 ----
const UI_KEY = "ec-wf-ui";
let guideSeen = false; // 가이드 첫 표시 여부
function loadUI() {
  try {
    const u = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    panelCollapsed = !!u.collapsed;
    guideSeen = !!u.guideSeen;
  } catch (_) {}
}
function saveUI() {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ collapsed: panelCollapsed, guideSeen }));
  } catch (_) {}
}
function applyCollapsed() {
  const app = document.querySelector(".app");
  if (app) app.classList.toggle("is-collapsed", panelCollapsed);
  const b = $("#btnPanel");
  if (b) b.textContent = (panelCollapsed ? "☰ " : "◀ ") + ui().panel;
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

  $("#topbar").innerHTML = `
    <button id="btnPanel" class="btn btn-ico" title="${ui().panel}">◀ ${ui().panel}</button>
    <div class="tb-title">${ui().appTitle}</div>
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
    <span class="tb-autosave" title="${ui().autosave}">● ${ui().autosave}</span>
    <div class="tb-spacer"></div>
    <button id="btnGuide" class="btn btn-ghost">${ui().guide}</button>
    <button id="btnRequest" class="btn btn-ghost" title="GitHub Issue">${ui().request}</button>
    <button id="btnUndo" class="btn btn-ico" title="${ui().undo} (Ctrl+Z)">↶</button>
    <button id="btnRedo" class="btn btn-ico" title="${ui().redo} (Ctrl+Shift+Z)">↷</button>
    <button id="btnSave" class="btn btn-ghost">${ui().save}</button>
    <button id="btnLoad" class="btn btn-ghost">${ui().load}</button>
    <button id="btnReset" class="btn btn-ghost">${ui().reset}</button>
    <button id="btnOpen" class="btn btn-ghost">${ui().openTab}</button>
    <button id="btnCopy" class="btn btn-ghost">${ui().copyHtml}</button>
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
  const selTpl = $("#selTpl");
  if (selTpl) {
    selTpl.addEventListener("change", (e) => {
      const id = e.target.value;
      e.target.value = ""; // 선택 표시 초기화(다음 선택 허용)
      if (!id) return;
      const tpl = gallery.find((g) => g.id === id);
      if (!tpl) return;
      if (!confirm(ui().templateWarn)) return; // 현재 작업 사라짐 경고
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
  const opts = defaultOpts(id);
  if (id === "custom" && !Array.isArray(opts.elements)) opts.elements = [];
  return { comp: id, opts, comment: "" };
}

// ---- 커스텀 블럭 편집기 ----
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
  fields += celSelect(`${base}:width`, el.width || "full", WIDTH_OPTS); // 幅(좌우/다단 배치)
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

// ---- 패널 이벤트 (위임) ----
function bindPanel() {
  const panel = $("#panel");
  panel.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const dup = e.target.closest("[data-dup]");
    const rem = e.target.closest("[data-remove]");
    const mov = e.target.closest("[data-move]");
    const selBtn = e.target.closest("[data-select]");
    const cadd = e.target.closest("[data-cadd]");
    const cmove = e.target.closest("[data-cmove]");
    const cdel = e.target.closest("[data-cdel]");
    // ---- 커스텀 블럭 원시요소: 추가 / 이동 / 삭제 ----
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
//  사용 가이드 (일본어) — ❓ ガイド 버튼 / 첫 접속 자동 표시
// ======================================================================
function guideHtml() {
  return `
  <h2>使い方ガイド</h2>
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
  if (!restore()) loadTemplate("top"); // 저장된 구성 있으면 복원, 없으면 기본 템플릿
  loadUI(); // 패널 접힘 상태 복원
  bindPanel();
  bindShortcuts();
  histInit(); // 현재 상태를 히스토리 0번으로
  renderAll();
  if (!guideSeen) {
    openGuide(); // 첫 접속 시 가이드 자동 표시
    guideSeen = true;
    saveUI();
  }
}

init();
