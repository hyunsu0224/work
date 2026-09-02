// build-gallery.mjs — templates/*.wf.json → src/gallery.js を生成
// 新しいテンプレートを templates/ に置いた後 `node build-gallery.mjs` を実行。
import { readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(ROOT, "templates");

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".wf.json"))
  .sort();

const gallery = files.map((f) => {
  const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  const { name, desc, ...state } = raw; // name/desc=メタ, 残り=状態
  return { id: f.replace(/\.wf\.json$/, ""), name: name || f, desc: desc || "", state };
});

const out =
  "// 自動生成ファイル — templates/*.wf.json から build-gallery.mjs で生成される。直接編集禁止。\n" +
  "export const gallery = " +
  JSON.stringify(gallery, null, 2) +
  ";\n";

writeFileSync(path.join(ROOT, "src", "gallery.js"), out);
console.log("src/gallery.js 生成:", gallery.length, "個 (" + gallery.map((g) => g.id).join(", ") + ")");
