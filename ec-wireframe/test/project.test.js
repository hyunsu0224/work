// マルチページ・プロジェクト出力の回帰テスト
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProject } from "../src/export.js";
import { templates, PAGE_TYPES } from "../src/templates.js";
import { defaultOpts } from "../src/catalog.js";

const CSS = ".wf-box{border:1px solid #333;}";
const secs = (p) => (templates[p] || []).map((s) => ({
  comp: s.comp, opts: { ...defaultOpts(s.comp), ...(s.opts || {}) }, comment: "",
}));
const mk = (pageTypes) => ({
  lang: "ja", device: "both", pageType: pageTypes[0], showNotes: true,
  sections: secs(pageTypes[0]),
  pages: Object.fromEntries(pageTypes.map((p) => [p, secs(p)])),
});

test("ページ数ぶんの html と共有 css/js と目次が出る", () => {
  const f = buildProject(mk(["top", "list", "detail"]), CSS, PAGE_TYPES);
  assert.deepEqual(Object.keys(f).sort(),
    ["detail.html", "index.html", "list.html", "script.js", "style.css", "top.html"]);
});

test("css/js は1本だけ共有される", () => {
  const f = buildProject(mk(["top", "list"]), CSS, PAGE_TYPES);
  assert.equal(typeof f["style.css"], "string");
  assert.equal(typeof f["script.js"], "string");
  for (const p of ["top", "list"]) {
    assert.ok(f[`${p}.html`].includes('href="./style.css"'));
    assert.ok(f[`${p}.html`].includes('src="./script.js"'));
  }
});

test("各ページが姉妹ページへリンクする", () => {
  const f = buildProject(mk(["top", "list", "detail"]), CSS, PAGE_TYPES);
  assert.ok(f["top.html"].includes('href="./list.html"'), "top → list");
  assert.ok(f["top.html"].includes('href="./detail.html"'), "top → detail");
  assert.ok(f["list.html"].includes('href="./top.html"'), "list → top");
  // 自分自身はリンクにしない
  assert.equal(f["top.html"].includes('href="./top.html"'), false);
});

test("各ページから目次へ戻れる", () => {
  const f = buildProject(mk(["top", "list"]), CSS, PAGE_TYPES);
  for (const p of ["top", "list"]) assert.ok(f[`${p}.html`].includes('href="./index.html"'));
});

test("目次が全ページを列挙する", () => {
  const f = buildProject(mk(["top", "list", "cart"]), CSS, PAGE_TYPES);
  for (const p of ["top", "list", "cart"]) {
    assert.ok(f["index.html"].includes(`./${p}.html`), `目次に ${p} がない`);
  }
});

test("空のページは出力されない", () => {
  const st = mk(["top", "list"]);
  st.pages.detail = [];        // 空
  st.pages.cart = undefined;   // 未作成
  const f = buildProject(st, CSS, PAGE_TYPES);
  assert.equal(f["detail.html"], undefined);
  assert.equal(f["cart.html"], undefined);
  assert.ok(f["top.html"] && f["list.html"]);
});

test("中身のあるページが1つも無ければ null", () => {
  const st = mk(["top"]);
  st.pages = { top: [], list: [] };
  assert.equal(buildProject(st, CSS, PAGE_TYPES), null);
});

test("ページ順は pageOrder に従う", () => {
  const f = buildProject(mk(["detail", "top"]), CSS, PAGE_TYPES);
  const idx = f["index.html"];
  assert.ok(idx.indexOf("./top.html") < idx.indexOf("./detail.html"), "PAGE_TYPES の順(top→detail)になる");
});

test("出力物にプレビュー用マーカーが入らない", () => {
  const f = buildProject(mk(["top", "list"]), CSS, PAGE_TYPES);
  for (const [name, c] of Object.entries(f)) {
    assert.equal(c.includes("data-wf-sec"), false, `${name} にマーカー`);
  }
});

test("各ページに正しい本文が入る(取り違えない)", () => {
  const f = buildProject(mk(["top", "list"]), CSS, PAGE_TYPES);
  assert.ok(f["list.html"].includes("wf-breadcrumb"), "list に パンくず");
  assert.ok(f["top.html"].includes("wf-slider"), "top に ヒーロー");
  assert.equal(f["top.html"].includes("wf-breadcrumb"), false, "top に list の中身が混入");
});
