// URL共有(state ⇄ トークン)の回帰テスト
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeState, decodeState, shareableState } from "../src/share.js";
import { sanitize } from "../src/sanitize.js";
import { templates, PAGE_TYPES } from "../src/templates.js";
import { defaultOpts } from "../src/catalog.js";

const secs = (p) => (templates[p] || []).map((s) => ({
  comp: s.comp, opts: { ...defaultOpts(s.comp), ...(s.opts || {}) }, comment: "",
}));
const mk = (pageTypes = ["top"]) => ({
  lang: "ja", device: "sp", pageType: pageTypes[0], showNotes: false,
  sections: secs(pageTypes[0]),
  pages: Object.fromEntries(pageTypes.map((p) => [p, secs(p)])),
});

test("往復して内容が保たれる", async () => {
  const st = mk(["top", "list"]);
  const back = await decodeState(await encodeState(st));
  assert.deepEqual(back, shareableState(st));
});

test("共有に含めるのは内容だけ(UI状態は載せない)", () => {
  const s = shareableState(mk());
  assert.deepEqual(Object.keys(s).sort(), ["device", "pageType", "pages", "showNotes"]);
});

test("トークンはURLセーフな文字だけを含む", async () => {
  const token = await encodeState(mk(["top", "list", "detail"]));
  assert.match(token, /^[A-Za-z0-9._~-]+$/, "URLで壊れる文字が混ざっている");
});

test("gzip でしっかり縮む", async () => {
  const st = mk(PAGE_TYPES); // 全ページ = 最大級
  const token = await encodeState(st);
  const rawLen = JSON.stringify(shareableState(st)).length;
  assert.equal(token[0], "z", "圧縮されていない");
  assert.ok(token.length < rawLen * 0.5, `圧縮率が悪い: ${token.length} / ${rawLen}`);
});

test("壊れたトークンは null(例外を投げない)", async () => {
  for (const bad of ["", "z", "x!!!", "zzzz", "r@@@", null, undefined, "znotbase64!!"]) {
    assert.equal(await decodeState(bad), null, `${bad} で null にならない`);
  }
});

test("復号結果は sanitize を通せる(信頼しない前提)", async () => {
  const token = await encodeState(mk(["top", "list"]));
  const clean = sanitize(await decodeState(token));
  assert.ok(clean);
  assert.deepEqual(Object.keys(clean.pages).sort(), ["list", "top"]);
});

test("改ざんされたトークンでも壊れない", async () => {
  const token = await encodeState(mk(["top"]));
  const tampered = token.slice(0, -4) + "AAAA";
  const out = await decodeState(tampered);
  assert.ok(out === null || typeof out === "object"); // 例外を投げないこと
});

test("空のプロジェクトも往復できる", async () => {
  const st = { lang: "ja", device: "both", pageType: "top", showNotes: true, sections: [], pages: {} };
  assert.deepEqual(await decodeState(await encodeState(st)), shareableState(st));
});
