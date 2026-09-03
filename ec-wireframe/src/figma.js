// figma.js — state → Figma ノードツリー変換 (2つ目のレンダラー)
//
// 設計: HTML と同じデータから、AI を介さず決定的に変換する。
//   state ─┬─▶ export.js ─▶ HTML/CSS/JS
//          └─▶ figma.js  ─▶ Figma ノードツリー (この機構)
//
// コンポーネント29種を手で対応表にすると CSS と二重管理になり必ずズレる。
// そこで「実際に描画されたプレビューの計算済みスタイル」を読んで変換する。
// これによりCSSが唯一の情報源になり、新規コンポーネントも自動で追随する。
//
// DOM 依存は ctx.getStyle / ctx.getRect に注入させ、Node 環境でも検証できるようにしている。

export const FIGMA_FORMAT = "ec-wireframe-figma";
export const FIGMA_FORMAT_VERSION = 1;

const MAX_NODES = 6000; // クリップボード経由のため上限を設ける
const MAX_DEPTH = 24;

// 変換対象外 — スクリプト類など
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "TEMPLATE", "BR"]);

// ---- 色 -------------------------------------------------------------------
// "rgb(a)" → "#rrggbb"。完全透明は null (塗りなし) として扱う。
export function parseColor(css) {
  if (!css) return null;
  const s = String(css).trim();
  if (s === "transparent" || s === "none") return null;
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length >= 3 && p.slice(0, 3).every((n) => Number.isFinite(n))) {
      const a = p.length > 3 ? p[3] : 1;
      if (!(a > 0.01)) return null;
      return "#" + p.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
    }
  }
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(s)) return "#" + s.slice(1).split("").map((c) => c + c).join("").toLowerCase();
  return null;
}

// 幅は切り上げないこと。子を四捨五入すると合計が親の内寸を超え、
// 折り返しレイアウトで列が1つ落ちる(例: 220.8px×5列 が 221×5=1105+gap で溢れる)。
const floorW = (v) => Math.floor(v);

const px = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

// ---- Auto Layout の推定 ----------------------------------------------------
// flex/grid はそのまま、通常のブロック積みは縦 Auto Layout とみなす。
const ALIGN_MAP = { "flex-start": "MIN", start: "MIN", center: "CENTER", "flex-end": "MAX", end: "MAX", stretch: "STRETCH", baseline: "MIN" };
const JUSTIFY_MAP = { "flex-start": "MIN", start: "MIN", center: "CENTER", "flex-end": "MAX", end: "MAX", "space-between": "SPACE_BETWEEN", "space-around": "SPACE_BETWEEN", "space-evenly": "SPACE_BETWEEN" };

export function inferLayout(st, childCount) {
  const disp = String(st.display || "block");
  const pad = [px(st.paddingTop), px(st.paddingRight), px(st.paddingBottom), px(st.paddingLeft)];
  const hasPad = pad.some((v) => v > 0);
  const base = { pad, align: "MIN", justify: "MIN", wrap: false };

  if (disp === "flex" || disp === "inline-flex") {
    const col = String(st.flexDirection || "row").startsWith("column");
    return {
      ...base,
      mode: col ? "VERTICAL" : "HORIZONTAL",
      gap: px(col ? st.rowGap || st.gap : st.columnGap || st.gap),
      align: ALIGN_MAP[st.alignItems] || "MIN",
      justify: JUSTIFY_MAP[st.justifyContent] || "MIN",
      wrap: !col && String(st.flexWrap || "").startsWith("wrap"),
    };
  }
  if (disp === "grid" || disp === "inline-grid") {
    // grid は Figma に相当機能が無いため、折り返しありの横 Auto Layout で近似する
    const cols = String(st.gridTemplateColumns || "").trim().split(/\s+/).filter(Boolean).length || 1;
    return { ...base, mode: "HORIZONTAL", gap: px(st.columnGap || st.gap), wrap: cols > 1, cols, rowGap: px(st.rowGap || st.gap) };
  }
  if (childCount > 0) return { ...base, mode: "VERTICAL", gap: 0 };
  return hasPad ? { ...base, mode: "VERTICAL", gap: 0 } : null;
}

// ---- 枠線 ------------------------------------------------------------------
function readStroke(st) {
  const w = px(st.borderTopWidth);
  const style = String(st.borderTopStyle || "none");
  if (!(w > 0) || style === "none" || style === "hidden") return null;
  const color = parseColor(st.borderTopColor);
  if (!color) return null;
  return { color, width: w, dashed: style === "dashed" || style === "dotted" };
}

function isHidden(st) {
  return st.display === "none" || st.visibility === "hidden" || parseFloat(st.opacity) === 0;
}

// 意味のあるテキスト(空白のみは無視)
function textOf(node) {
  return String(node.nodeValue == null ? "" : node.nodeValue).replace(/\s+/g, " ").trim();
}

const ALIGN_TEXT = { center: "CENTER", right: "RIGHT", end: "RIGHT", justify: "JUSTIFIED" };

function textNode(chars, st, name) {
  const fam = String(st.fontFamily || "").split(",")[0].replace(/['"]/g, "").trim();
  const deco = String(st.textDecorationLine || st.textDecoration || "");
  return {
    type: "TEXT",
    name: name || chars.slice(0, 24),
    text: {
      chars,
      size: px(st.fontSize) || 14,
      weight: parseInt(st.fontWeight, 10) || 400,
      color: parseColor(st.color) || "#111111",
      align: ALIGN_TEXT[st.textAlign] || "LEFT",
      font: fam || undefined,
      lineHeight: /px$/.test(String(st.lineHeight)) ? px(st.lineHeight) : undefined,
      strike: deco.includes("line-through") || undefined,
    },
  };
}

// ---- 本体 ------------------------------------------------------------------
// ctx = { getStyle(el), getRect(el) } — DOM 非依存にするための注入口
const childNodesOf = (el) =>
  Array.from(el.childNodes || []).filter((n) => n.nodeType === 1 || (n.nodeType === 3 && textOf(n)));

export function domToFigma(root, ctx) {
  const stats = { nodes: 0, truncated: false };
  const rootRect = ctx.getRect(root) || { left: 0, top: 0, width: 0, height: 0 };

  function walk(el, depth, parentRect) {
    if (!el || el.nodeType !== 1) return null;
    if (SKIP_TAGS.has(el.tagName)) return null;
    // ビルダー側のクローム(注記トグル・プレビューバー)はワイヤーフレームではないので除外
    if (el.hasAttribute && el.hasAttribute("data-wf-chrome")) return null;
    if (stats.nodes >= MAX_NODES || depth > MAX_DEPTH) {
      stats.truncated = true;
      return null;
    }

    const st = ctx.getStyle(el);
    if (!st || isHidden(st)) return null;

    // display:contents は箱を作らない(rect が 0 になる)ため、
    // ここで捨てると中身ごと消える。子を親の階層にそのまま繰り上げる。
    if (st.display === "contents") {
      const spliced = [];
      for (const kid of childNodesOf(el)) {
        if (kid.nodeType === 3) {
          stats.nodes++;
          spliced.push(textNode(textOf(kid), st));
          continue;
        }
        const c = walk(kid, depth, parentRect);
        if (c) spliced.push(...(c.__splice || [c]));
      }
      return spliced.length ? { __splice: spliced } : null;
    }

    const rect = ctx.getRect(el);
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    // 画面の左右完全に外にある要素(閉じた状態のドロワー等)は成果物に含めない
    if (Number.isFinite(rect.left) && Number.isFinite(rootRect.left) && rootRect.width > 0) {
      if (rect.left + rect.width <= rootRect.left || rect.left >= rootRect.left + rootRect.width) return null;
    }

    const kids = childNodesOf(el);
    const elemKids = kids.filter((n) => n.nodeType === 1);

    // fixed/absolute は積み上げの流れに入れず、親からの相対座標で置く
    // (テキストだけの要素も対象になるため、分岐より前で決めておく)
    const pos = String(st.position || "static");
    let abs = null;
    if ((pos === "absolute" || pos === "fixed") && parentRect && Number.isFinite(rect.left) && Number.isFinite(parentRect.left)) {
      const x = Math.round(rect.left - parentRect.left);
      const y = Math.round(rect.top - parentRect.top);
      abs = { x, y };
      const fromRight = Math.round(parentRect.left + parentRect.width - (rect.left + rect.width));
      const fromBottom = Math.round(parentRect.top + parentRect.height - (rect.top + rect.height));
      if (fromRight < x) abs.r = fromRight;
      if (fromBottom < y) abs.b = fromBottom;
    }
    const withAbs = (n) => {
      if (n && abs) n.abs = abs;
      return n;
    };

    const boxFill = parseColor(st.backgroundColor);
    const boxStroke = readStroke(st);
    const boxRadius = px(st.borderTopLeftRadius) || undefined;

    // 子要素が無く文字だけ → TEXT ノードにする(Figma 側で直接編集できる)
    // ただし背景・枠線・角丸を持つ場合はワイヤーフレームのグレーボックスそのものなので、
    // TEXT だけにすると箱が消える。FRAME + TEXT 子の形で残す。
    if (elemKids.length === 0) {
      const chars = kids.map(textOf).filter(Boolean).join(" ");
      if (chars) {
        const name = String(el.className || "").split(" ")[0] || el.tagName.toLowerCase();
        if (!boxFill && !boxStroke && !boxRadius) {
          stats.nodes++;
          const n = textNode(chars, st, name);
          n.w = floorW(rect.width);
          n.h = Math.round(rect.height);
          return withAbs(n);
        }
        stats.nodes += 2;
        const box = {
          type: "FRAME",
          name,
          w: floorW(rect.width),
          h: Math.round(rect.height),
          fill: boxFill,
          radius: boxRadius,
          layout: { ...inferLayout(st, 1), align: "CENTER", justify: "CENTER" },
          children: [textNode(chars, st)],
        };
        if (boxStroke) box.stroke = boxStroke;
        return withAbs(box);
      }
    }

    stats.nodes++;
    const layout = inferLayout(st, elemKids.length);
    const node = {
      type: el.tagName === "IMG" ? "RECT" : "FRAME",
      name: String(el.className || "").split(" ")[0] || el.tagName.toLowerCase(),
      w: floorW(rect.width),
      h: Math.round(rect.height),
      fill: boxFill,
      radius: boxRadius,
    };
    if (boxStroke) node.stroke = boxStroke;
    if (node.type === "RECT") {
      node.fill = node.fill || "#d8dce1";
      return withAbs(node);
    }
    if (layout) node.layout = layout;
    const children = [];
    for (const kid of kids) {
      if (kid.nodeType === 3) {
        stats.nodes++;
        children.push(textNode(textOf(kid), st));
        continue;
      }
      const child = walk(kid, depth + 1, rect);
      if (!child) continue;
      for (const c of child.__splice || [child]) {
        // 親と横幅が一致する子は「幅いっぱい(FILL)」として扱う
        if (layout && layout.mode === "VERTICAL") {
          const inner = node.w - (layout.pad[1] + layout.pad[3]);
          if (Math.abs(c.w - inner) <= 1) c.fillW = true;
        }
        children.push(c);
      }
    }
    if (children.length) node.children = children;
    return withAbs(node);
  }

  const res = walk(root, 0, rootRect);
  const node = res && res.__splice ? { type: "FRAME", name: "root", children: res.__splice } : res;
  return { node, stats };
}

// フレーム群 + メタ情報を1つの受け渡し用ドキュメントにまとめる
export function buildFigmaDoc(frames, meta = {}) {
  return {
    format: FIGMA_FORMAT,
    version: FIGMA_FORMAT_VERSION,
    meta: { app: "ec-wireframe", ...meta },
    frames: frames.filter(Boolean),
  };
}
