// build-gallery.mjs — templates/*.wf.json → src/gallery.js 생성
// 새 템플릿을 templates/ 에 넣은 뒤 `node build-gallery.mjs` 실행.
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
  const { name, desc, ...state } = raw; // name/desc=메타, 나머지=상태
  return { id: f.replace(/\.wf\.json$/, ""), name: name || f, desc: desc || "", state };
});

const out =
  "// 자동 생성 파일 — templates/*.wf.json 에서 build-gallery.mjs 로 생성됨. 직접 수정 금지.\n" +
  "export const gallery = " +
  JSON.stringify(gallery, null, 2) +
  ";\n";

writeFileSync(path.join(ROOT, "src", "gallery.js"), out);
console.log("src/gallery.js 생성:", gallery.length, "개 (" + gallery.map((g) => g.id).join(", ") + ")");
