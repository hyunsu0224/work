// sanitize() の回帰テスト — 外部由来データ(共有URL/JSON/localStorage)への防御
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitize } from "../src/sanitize.js";
import { catalog, defaultOpts } from "../src/catalog.js";

test("object でない入力は null", () => {
  for (const bad of [null, undefined, 0, "", "abc", 42, true, []]) {
    if (Array.isArray(bad)) { assert.notEqual(sanitize(bad), undefined); continue; }
    assert.equal(sanitize(bad), null, `${JSON.stringify(bad)} は null であるべき`);
  }
});

test("未知のコンポーネントは除去される", () => {
  const out = sanitize({ sections: [
    { comp: "hero" }, { comp: "__evil__" }, { comp: "faq" }, { comp: null },
  ]});
  assert.deepEqual(out.sections.map((s) => s.comp), ["hero", "faq"]);
});

test("不正な pageType / device は既定値に落ちる", () => {
  const out = sanitize({ pageType: "../../etc/passwd", device: "watch" });
  assert.equal(out.pageType, "top");
  assert.equal(out.device, "both");
});

test("正当な pageType / device は保持される", () => {
  const out = sanitize({ pageType: "detail", device: "sp" });
  assert.equal(out.pageType, "detail");
  assert.equal(out.device, "sp");
});

test("custom の未知要素タイプは除去される", () => {
  const out = sanitize({ sections: [
    { comp: "custom", opts: { elements: [
      { type: "heading" }, { type: "script" }, { type: "image" }, { type: "iframe" }, null,
    ]}},
  ]});
  assert.deepEqual(out.sections[0].opts.elements.map((e) => e.type), ["heading", "image"]);
});

test("custom の elements が配列でなければ空配列になる", () => {
  for (const bad of [undefined, null, "x", 5, {}]) {
    const out = sanitize({ sections: [{ comp: "custom", opts: { elements: bad } }] });
    assert.deepEqual(out.sections[0].opts.elements, []);
  }
});

test("comment は文字列以外を受け付けない", () => {
  const out = sanitize({ sections: [
    { comp: "hero", comment: { toString: () => "x" } },
    { comp: "faq", comment: "正しいメモ" },
  ]});
  assert.equal(out.sections[0].comment, "");
  assert.equal(out.sections[1].comment, "正しいメモ");
});

test("欠けている opts は既定値で埋まる", () => {
  const out = sanitize({ sections: [{ comp: "hero" }] });
  assert.deepEqual(out.sections[0].opts, defaultOpts("hero"));
});

test("sections が無い/配列でない場合は空配列", () => {
  assert.deepEqual(sanitize({}).sections, []);
  assert.deepEqual(sanitize({ sections: "nope" }).sections, []);
});

test("出力は常に決まった形をしている", () => {
  const out = sanitize({});
  assert.deepEqual(Object.keys(out).sort(), ["device", "lang", "pageType", "pages", "sections", "showNotes"]);
  assert.equal(out.lang, "ja");
  assert.equal(out.showNotes, true);
});

test("カタログの全コンポーネントが sanitize を通過する", () => {
  const ids = Object.keys(catalog);
  const out = sanitize({ sections: ids.map((comp) => ({ comp })) });
  assert.equal(out.sections.length, ids.length);
});

test("旧形式(sections のみ)は現在のページ種別へ移行される", () => {
  const out = sanitize({ pageType: "list", sections: [{ comp: "breadcrumb" }] });
  assert.deepEqual(out.sections.map((s) => s.comp), ["breadcrumb"]);
  assert.deepEqual(out.pages.list.map((s) => s.comp), ["breadcrumb"]);
  assert.equal(out.pages.top, undefined, "他ページを勝手に作らない");
});

test("pages 形式はページごとに保持される", () => {
  const out = sanitize({
    pageType: "top",
    pages: { top: [{ comp: "hero" }], list: [{ comp: "breadcrumb" }, { comp: "__evil__" }] },
  });
  assert.deepEqual(out.pages.top.map((s) => s.comp), ["hero"]);
  assert.deepEqual(out.pages.list.map((s) => s.comp), ["breadcrumb"], "他ページも検証される");
  assert.deepEqual(out.sections.map((s) => s.comp), ["hero"], "sections はアクティブページ");
});

test("未知のページ種別キーは pages から除去される", () => {
  const out = sanitize({ pageType: "top", pages: { top: [{ comp: "hero" }], "../etc": [{ comp: "hero" }], bogus: [] } });
  assert.deepEqual(Object.keys(out.pages).sort(), ["top"]);
});

test("pages が配列や不正型なら無視される", () => {
  for (const bad of [[], "x", 5, null]) {
    const out = sanitize({ pageType: "top", pages: bad, sections: [{ comp: "hero" }] });
    assert.deepEqual(out.pages.top.map((s) => s.comp), ["hero"]);
  }
});

test("アクティブページは必ず pages に含まれる", () => {
  const out = sanitize({ pageType: "cart", pages: { top: [{ comp: "hero" }] } });
  assert.ok(Array.isArray(out.pages.cart));
  assert.equal(out.pages.cart, out.sections);
});
