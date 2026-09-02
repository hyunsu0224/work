// sanitize.js — 外部から入ってきた state 候補の検証·整形(信頼できないデータへの防御)
// .wf.json の読み込み / localStorage の復元 / 共有URL の復号など、
// 外部由来のデータは必ずここを通してから state に適用する。
// ブラウザ API に依存しない純粋関数なので、Node 上でテストできる。
import { catalog, defaultOpts } from "./catalog.js";
import { PAGE_TYPES } from "./templates.js";

const CUSTOM_EL_TYPES = new Set(["heading", "text", "image", "button", "spacer", "divider"]);

// セクション配列1本を検証·整形
function cleanSections(arr) {
  return Array.isArray(arr)
    ? arr
        .filter((s) => s && catalog[s.comp]) // 未知のコンポーネントを除去
        .map((s) => {
          const opts = { ...defaultOpts(s.comp), ...(s.opts || {}) };
          if (s.comp === "custom") {
            opts.elements = Array.isArray(opts.elements)
              ? opts.elements.filter((el) => el && CUSTOM_EL_TYPES.has(el.type)).map((el) => ({ ...el }))
              : [];
          }
          return { comp: s.comp, opts, comment: typeof s.comment === "string" ? s.comment : "" };
        })
    : [];
}

export function sanitize(cand) {
  if (!cand || typeof cand !== "object") return null;
  const lang = "ja"; // 日本語固定(言語トグルを廃止)
  const device = ["both", "pc", "sp"].includes(cand.device) ? cand.device : "both";
  const pageType = PAGE_TYPES.includes(cand.pageType) ? cand.pageType : "top";
  const showNotes = cand.showNotes !== false;

  // pages: ページ種別ごとの作業内容。旧形式(sections のみ)は現在のページ種別へ移行する。
  const pages = {};
  if (cand.pages && typeof cand.pages === "object" && !Array.isArray(cand.pages)) {
    for (const key of PAGE_TYPES) {
      if (Array.isArray(cand.pages[key])) pages[key] = cleanSections(cand.pages[key]);
    }
  }
  const sections = pages[pageType] || cleanSections(cand.sections);
  pages[pageType] = sections; // アクティブページは必ず pages にも入れる

  return { lang, device, pageType, showNotes, sections, pages };
}
