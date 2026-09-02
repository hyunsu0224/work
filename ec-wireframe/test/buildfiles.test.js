// 分割ダウンロード(index.html / style.css / script.js)の回帰テスト
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFiles, buildDocument } from "../src/export.js";
import { templates, PAGE_TYPES } from "../src/templates.js";
import { defaultOpts } from "../src/catalog.js";

const CSS = ".wf-box{border:1px solid #333;} /* コメント */ .wf-note{display:block;}";
const mk = (pageType) => ({
  lang: "ja", device: "both", pageType, showNotes: true,
  sections: (templates[pageType] || []).map((s) => ({
    comp: s.comp, opts: { ...defaultOpts(s.comp), ...(s.opts || {}) }, comment: "",
  })),
});

test("3ファイルが揃って出力される", () => {
  const f = buildFiles(mk("top"), CSS);
  assert.deepEqual(Object.keys(f).sort(), ["index.html", "script.js", "style.css"]);
  for (const [name, content] of Object.entries(f)) {
    assert.equal(typeof content, "string", `${name} が文字列でない`);
    assert.ok(content.length > 0, `${name} が空`);
  }
});

test("index.html は CSS/JS を外部参照する(インライン化しない)", () => {
  const { "index.html": html } = buildFiles(mk("top"), CSS);
  assert.ok(html.includes('<link rel="stylesheet" href="./style.css">'));
  assert.ok(html.includes('<script src="./script.js" defer>'));
  // <style> ブロックは noscript フォールバックのみ
  assert.equal((html.match(/<style>/g) || []).length, 1);
  assert.ok(html.includes("<noscript><style>"));
});

test("index.html に本体スクリプトが埋め込まれていない", () => {
  const { "index.html": html } = buildFiles(mk("top"), CSS);
  assert.equal(html.includes("wfHamburger"), true, "マークアップ側の id は残る");
  assert.equal(html.includes("addEventListener"), false, "JS が HTML に残っている");
});

test("script.js に3つのランタイムが揃う", () => {
  const { "script.js": js } = buildFiles(mk("top"), CSS);
  assert.ok(js.includes("wfHamburger"), "ドロワー");
  assert.ok(js.includes("wf-slider"), "スライダー");
  assert.ok(js.includes("wf-carousel-wrap"), "カルーセル");
  assert.equal(js.includes("<script"), false, "<script> タグが混ざっている");
});

test("style.css にコメントが残らない", () => {
  const { "style.css": css } = buildFiles(mk("top"), CSS);
  assert.equal(css.includes("/*"), false);
  assert.ok(css.includes(".wf-box"));
});

test("出力物にプレビュー用マーカーが入らない", () => {
  for (const p of PAGE_TYPES) {
    const f = buildFiles(mk(p), CSS);
    for (const [name, content] of Object.entries(f)) {
      assert.equal(content.includes("data-wf-sec"), false, `${p}/${name} にマーカー`);
    }
  }
});

test("本文マークアップは単一ファイル版と一致する", () => {
  for (const p of PAGE_TYPES) {
    const st = mk(p);
    const one = buildDocument(st, CSS);
    const split = buildFiles(st, CSS)["index.html"];
    const pick = (s) => s.slice(s.indexOf("<main>"), s.indexOf("</main>") + 7);
    assert.equal(pick(split), pick(one), `${p} の <main> が不一致`);
  }
});

test("base オプションでパスを変えられる(マルチページ用)", () => {
  const { "index.html": html } = buildFiles(mk("top"), CSS, { base: ".." });
  assert.ok(html.includes('href="../style.css"'));
  assert.ok(html.includes('src="../script.js"'));
});
