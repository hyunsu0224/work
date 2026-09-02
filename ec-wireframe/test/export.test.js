// 出力物(ダウンロードされる HTML)の回帰テスト
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDocument, renderSections } from "../src/export.js";
import { templates, palette, PAGE_TYPES } from "../src/templates.js";
import { catalog, defaultOpts } from "../src/catalog.js";

const mk = (pageType) => ({
  lang: "ja", device: "both", pageType, showNotes: true,
  sections: (templates[pageType] || []).map((s) => ({
    comp: s.comp, opts: { ...defaultOpts(s.comp), ...(s.opts || {}) }, comment: "",
  })),
});

test("ダウンロード物にプレビュー用マーカーが混入しない", () => {
  for (const p of PAGE_TYPES) {
    const html = buildDocument(mk(p), "/* css */");
    assert.equal(html.includes("data-wf-sec"), false, `${p} にマーカーが漏れている`);
  }
});

test("プレビューにはセクション数ぶんのマーカーが付く", () => {
  for (const p of PAGE_TYPES) {
    const st = mk(p);
    const html = buildDocument(st, "/* css */", { markSections: true });
    const n = (html.match(/data-wf-sec/g) || []).length;
    assert.equal(n, st.sections.length, `${p} のマーカー数が不一致`);
  }
});

test("マーカーはラッパーを足すだけで、中身は書き換えない", () => {
  const st = mk("top");
  st.sections.forEach((sec, i) => {
    const plain = renderSections([sec], "ja", false);
    const marked = renderSections([sec], "ja", true);
    const head = '<div data-wf-sec="0" style="display:contents">\n';
    const tail = "\n</div>";
    assert.ok(marked.startsWith(head), `section ${i}: ラッパー開始タグがない`);
    assert.ok(marked.endsWith(tail), `section ${i}: ラッパー終了タグがない`);
    // ラッパーを外したら元の描画結果と完全一致する
    assert.equal(marked.slice(head.length, marked.length - tail.length), plain);
  });
});

test("カタログの全コンポーネントがエラーなく描画できる", () => {
  const ids = Object.keys(catalog);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    const html = renderSections([{ comp: id, opts: defaultOpts(id), comment: "" }], "ja");
    assert.equal(typeof html, "string");
    assert.ok(html.length > 0, `${id} の描画結果が空`);
    assert.equal(html.includes("unknown component"), false, `${id} が catalog 未登録扱い`);
  }
});

test("パレットに載る id はすべて catalog に存在する", () => {
  for (const p of PAGE_TYPES) {
    for (const id of palette[p] || []) {
      assert.ok(catalog[id], `palette.${p} の "${id}" が catalog にない`);
    }
  }
});

test("各ページ種別の標準テンプレートも catalog に存在する", () => {
  for (const p of PAGE_TYPES) {
    for (const s of templates[p] || []) {
      assert.ok(catalog[s.comp], `templates.${p} の "${s.comp}" が catalog にない`);
    }
  }
});

test("出力は完結した HTML 文書である", () => {
  const html = buildDocument(mk("top"), "/* css */");
  assert.ok(html.startsWith("<!DOCTYPE html>"));
  assert.ok(html.includes("<html lang=\"ja\">"));
  assert.ok(html.trimEnd().endsWith("</html>"));
});
