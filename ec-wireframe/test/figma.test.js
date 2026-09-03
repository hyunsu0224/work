// figma.test.js — state → Figma ノードツリー変換
// DOM の代わりに最小限のスタブを注入して検証する(ctx.getStyle / ctx.getRect)
import { test } from "node:test";
import assert from "node:assert";
import { parseColor, inferLayout, domToFigma, buildFigmaDoc, FIGMA_FORMAT } from "../src/figma.js";

// ---- DOM スタブ ------------------------------------------------------------
const DEFAULTS = {
  display: "block", visibility: "visible", opacity: "1",
  paddingTop: "0px", paddingRight: "0px", paddingBottom: "0px", paddingLeft: "0px",
  backgroundColor: "transparent", borderTopWidth: "0px", borderTopStyle: "none",
  borderTopColor: "transparent", borderTopLeftRadius: "0px",
  fontSize: "14px", fontWeight: "400", color: "rgb(17, 17, 17)", textAlign: "left",
  fontFamily: "sans-serif", lineHeight: "normal",
};

function el(tag, opts = {}) {
  const kids = opts.children || [];
  const node = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    className: opts.className || "",
    childNodes: kids,
    _style: { ...DEFAULTS, ...(opts.style || {}) },
    _rect: { width: opts.w == null ? 100 : opts.w, height: opts.h == null ? 20 : opts.h, ...(opts.rect || {}) },
    _attrs: opts.attrs || {},
    hasAttribute(n) { return n in this._attrs; },
    getAttribute(n) { return this._attrs[n]; },
  };
  return node;
}
const txt = (s) => ({ nodeType: 3, nodeValue: s });
const ctx = { getStyle: (e) => e._style, getRect: (e) => e._rect };

// ---- parseColor ------------------------------------------------------------
test("parseColor: rgb を16進に変換する", () => {
  assert.strictEqual(parseColor("rgb(255, 0, 128)"), "#ff0080");
  assert.strictEqual(parseColor("rgb(17, 17, 17)"), "#111111");
});

test("parseColor: 透明は塗りなし(null)", () => {
  assert.strictEqual(parseColor("transparent"), null);
  assert.strictEqual(parseColor("rgba(0, 0, 0, 0)"), null);
  assert.strictEqual(parseColor(""), null);
  assert.strictEqual(parseColor(null), null);
});

test("parseColor: 半透明は色として残す", () => {
  assert.strictEqual(parseColor("rgba(255, 255, 255, 0.5)"), "#ffffff");
});

test("parseColor: 3桁/6桁の16進表記も受け付ける", () => {
  assert.strictEqual(parseColor("#ABC"), "#aabbcc");
  assert.strictEqual(parseColor("#A1B2C3"), "#a1b2c3");
});

// ---- inferLayout -----------------------------------------------------------
test("inferLayout: flex row → 横 Auto Layout", () => {
  const l = inferLayout({ ...DEFAULTS, display: "flex", flexDirection: "row", columnGap: "12px" }, 2);
  assert.strictEqual(l.mode, "HORIZONTAL");
  assert.strictEqual(l.gap, 12);
});

test("inferLayout: flex column → 縦 Auto Layout", () => {
  const l = inferLayout({ ...DEFAULTS, display: "flex", flexDirection: "column", rowGap: "8px" }, 2);
  assert.strictEqual(l.mode, "VERTICAL");
  assert.strictEqual(l.gap, 8);
});

test("inferLayout: grid は折り返しありの横 Auto Layout で近似する", () => {
  const l = inferLayout({ ...DEFAULTS, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", columnGap: "16px", rowGap: "20px" }, 8);
  assert.strictEqual(l.mode, "HORIZONTAL");
  assert.strictEqual(l.wrap, true);
  assert.strictEqual(l.cols, 4);
  assert.strictEqual(l.rowGap, 20);
});

test("inferLayout: 通常のブロック積みは縦 Auto Layout とみなす", () => {
  const l = inferLayout({ ...DEFAULTS }, 3);
  assert.strictEqual(l.mode, "VERTICAL");
  assert.strictEqual(l.gap, 0);
});

test("inferLayout: 子も余白も無い要素は Auto Layout を付けない", () => {
  assert.strictEqual(inferLayout({ ...DEFAULTS }, 0), null);
});

test("inferLayout: padding を4辺そのまま取り込む", () => {
  const l = inferLayout({ ...DEFAULTS, paddingTop: "4px", paddingRight: "8px", paddingBottom: "12px", paddingLeft: "16px" }, 1);
  assert.deepStrictEqual(l.pad, [4, 8, 12, 16]);
});

test("inferLayout: justify-content / align-items を Figma の指定に変換する", () => {
  const l = inferLayout({ ...DEFAULTS, display: "flex", justifyContent: "space-between", alignItems: "center" }, 2);
  assert.strictEqual(l.justify, "SPACE_BETWEEN");
  assert.strictEqual(l.align, "CENTER");
});

// ---- domToFigma ------------------------------------------------------------
test("文字だけの要素は TEXT ノードになる", () => {
  const { node } = domToFigma(el("h2", { className: "wf-h2", children: [txt("特集バナー")], style: { fontSize: "20px", fontWeight: "700" } }), ctx);
  assert.strictEqual(node.type, "TEXT");
  assert.strictEqual(node.text.chars, "特集バナー");
  assert.strictEqual(node.text.size, 20);
  assert.strictEqual(node.text.weight, 700);
});

test("テキストの前後の空白は詰められる", () => {
  const { node } = domToFigma(el("p", { children: [txt("\n   商品名が   入ります \n ")] }), ctx);
  assert.strictEqual(node.text.chars, "商品名が 入ります");
});

test("子要素を持つ要素は FRAME になり階層が保たれる", () => {
  const root = el("section", {
    className: "wf-section",
    w: 1280, h: 400,
    style: { backgroundColor: "rgb(244, 245, 247)" },
    children: [el("div", { className: "wf-container", children: [txt("中身")] })],
  });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.type, "FRAME");
  assert.strictEqual(node.name, "wf-section");
  assert.strictEqual(node.fill, "#f4f5f7");
  assert.strictEqual(node.children.length, 1);
  assert.strictEqual(node.children[0].type, "TEXT");
});

test("display:none / visibility:hidden / opacity:0 は出力されない", () => {
  for (const style of [{ display: "none" }, { visibility: "hidden" }, { opacity: "0" }]) {
    const { node } = domToFigma(el("div", { style, children: [txt("x")] }), ctx);
    assert.strictEqual(node, null, JSON.stringify(style));
  }
});

test("幅または高さが0の要素は出力されない", () => {
  assert.strictEqual(domToFigma(el("div", { w: 0, children: [txt("x")] }), ctx).node, null);
  assert.strictEqual(domToFigma(el("div", { h: 0, children: [txt("x")] }), ctx).node, null);
});

test("script/style は変換対象外", () => {
  const root = el("div", { children: [el("script", { children: [txt("alert(1)")] }), el("p", { children: [txt("本文")] })] });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.children.length, 1);
  assert.strictEqual(node.children[0].text.chars, "本文");
});

test("data-wf-chrome が付いたビルダー用UIは除外される", () => {
  const root = el("body", {
    children: [
      el("div", { attrs: { "data-wf-chrome": "" }, children: [txt("WIREFRAME PREVIEW")] }),
      el("main", { children: [txt("本文")] }),
    ],
  });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.children.length, 1);
  assert.strictEqual(node.children[0].text.chars, "本文");
});

test("親と同じ幅の子には fillW(幅いっぱい)が付く", () => {
  const root = el("div", {
    w: 1000,
    style: { paddingLeft: "20px", paddingRight: "20px" },
    children: [el("div", { w: 960, children: [txt("いっぱい")] }), el("div", { w: 300, children: [txt("固定")] })],
  });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.children[0].fillW, true);
  assert.strictEqual(node.children[1].fillW, undefined);
});

test("枠線は色・太さ・破線かどうかを保持する", () => {
  const root = el("div", { style: { borderTopWidth: "1px", borderTopStyle: "dashed", borderTopColor: "rgb(220, 223, 228)" }, children: [el("p", { children: [txt("枠")] })] });
  const { node } = domToFigma(root, ctx);
  assert.deepStrictEqual(node.stroke, { color: "#dcdfe4", width: 1, dashed: true });
});

// グレーボックス(背景・枠線を持ち中に文字だけ)は、ワイヤーフレームの主役なので箱を失ってはいけない
test("背景を持つ文字だけの要素は FRAME + TEXT になり箱が残る", () => {
  const root = el("div", { className: "wf-box", w: 200, h: 200, style: { backgroundColor: "rgb(233, 236, 239)" }, children: [txt("商品画像")] });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.type, "FRAME");
  assert.strictEqual(node.name, "wf-box");
  assert.strictEqual(node.fill, "#e9ecef");
  assert.strictEqual(node.h, 200);
  assert.strictEqual(node.children.length, 1);
  assert.strictEqual(node.children[0].text.chars, "商品画像");
});

test("枠線だけの文字要素も FRAME として残る", () => {
  const root = el("div", { className: "wf-box", style: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "rgb(200, 200, 200)" }, children: [txt("ボタン")] });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.type, "FRAME");
  assert.strictEqual(node.stroke.color, "#c8c8c8");
  assert.strictEqual(node.children[0].type, "TEXT");
});

test("装飾の無い文字要素はこれまで通り TEXT のまま", () => {
  const { node } = domToFigma(el("p", { children: [txt("ただの本文")] }), ctx);
  assert.strictEqual(node.type, "TEXT");
});

test("img は RECT になり、塗りが無ければ既定のグレーを当てる", () => {
  const { node } = domToFigma(el("img", { w: 200, h: 200 }), ctx);
  assert.strictEqual(node.type, "RECT");
  assert.strictEqual(node.fill, "#d8dce1");
  assert.strictEqual(node.children, undefined);
});

test("取り消し線(セール価格)が引き継がれる", () => {
  const { node } = domToFigma(el("del", { children: [txt("¥5,000")] , style: { textDecorationLine: "line-through" } }), ctx);
  assert.strictEqual(node.text.strike, true);
});

test("ノード数が数えられ、通常構造では省略が起きない", () => {
  const root = el("div", { children: [el("p", { children: [txt("a")] }), el("p", { children: [txt("b")] })] });
  const { stats } = domToFigma(root, ctx);
  assert.strictEqual(stats.nodes, 3);
  assert.strictEqual(stats.truncated, false);
});

test("深すぎる入れ子は打ち切られ truncated が立つ", () => {
  let node = el("div", { children: [txt("底")] });
  for (let i = 0; i < 40; i++) node = el("div", { children: [node] });
  const { stats } = domToFigma(node, ctx);
  assert.strictEqual(stats.truncated, true);
});

// ---- buildFigmaDoc ---------------------------------------------------------
test("buildFigmaDoc: 形式と版数が付き、空フレームは除かれる", () => {
  const doc = buildFigmaDoc([{ name: "TOP / PC" }, null, undefined], { pageType: "top" });
  assert.strictEqual(doc.format, FIGMA_FORMAT);
  assert.strictEqual(doc.version, 1);
  assert.strictEqual(doc.meta.app, "ec-wireframe");
  assert.strictEqual(doc.meta.pageType, "top");
  assert.strictEqual(doc.frames.length, 1);
});

test("buildFigmaDoc: JSON として往復できる", () => {
  const { node } = domToFigma(el("section", { className: "wf-section", children: [el("h2", { children: [txt("見出し")] })] }), ctx);
  const doc = buildFigmaDoc([{ name: "TOP / PC", width: 1280, node }], { appVersion: "0.0.0" });
  const wire = JSON.stringify(doc);
  const back = JSON.parse(wire);
  assert.strictEqual(JSON.stringify(back), wire); // 再直列化しても変化しない(循環・NaN 等が無い)
  assert.strictEqual(back.format, FIGMA_FORMAT);
  assert.strictEqual(back.frames[0].width, 1280);
  assert.strictEqual(back.frames[0].node.children[0].text.chars, "見出し");
});

// ---- 絶対配置 --------------------------------------------------------------
test("position:absolute/fixed は積み上げから外れ、相対座標を持つ", () => {
  const root = el("body", {
    w: 1280, h: 800, rect: { left: 0, top: 0 },
    children: [
      el("div", { className: "wf-cookiebar", w: 1280, h: 60, rect: { left: 0, top: 740 }, style: { position: "fixed" }, children: [txt("Cookie")] }),
      el("main", { w: 1280, rect: { left: 0, top: 0 }, children: [txt("本文")] }),
    ],
  });
  const { node } = domToFigma(root, ctx);
  const bar = node.children.find((c) => c.name === "wf-cookiebar");
  assert.deepStrictEqual(bar.abs, { x: 0, y: 740 });
  assert.strictEqual(node.children.find((c) => c.name === "main").abs, undefined);
});

test("画面の外に出ている要素(閉じたドロワー)は出力されない", () => {
  const root = el("body", {
    w: 375, h: 800, rect: { left: 0, top: 0 },
    children: [
      el("div", { className: "wf-drawer", w: 300, h: 800, rect: { left: -300, top: 0 }, style: { position: "fixed" }, children: [txt("メニュー")] }),
      el("main", { w: 375, rect: { left: 0, top: 0 }, children: [txt("本文")] }),
    ],
  });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.children.length, 1);
  assert.strictEqual(node.children[0].name, "main");
});

test("display:contents のラッパーは箱を作らないので中身を親に繰り上げる", () => {
  const root = el("main", {
    w: 1280, rect: { left: 0, top: 0 },
    children: [
      el("div", { w: 0, h: 0, style: { display: "contents" }, children: [el("section", { className: "wf-section", w: 1280, rect: { left: 0, top: 0 }, children: [txt("中身A")] })] }),
      el("div", { w: 0, h: 0, style: { display: "contents" }, children: [el("section", { className: "wf-section", w: 1280, rect: { left: 0, top: 0 }, children: [txt("中身B")] })] }),
    ],
  });
  const { node } = domToFigma(root, ctx);
  assert.strictEqual(node.children.length, 2);
  assert.deepStrictEqual(node.children.map((c) => c.name), ["wf-section", "wf-section"]);
  assert.strictEqual(node.children[0].text.chars, "中身A");
});
