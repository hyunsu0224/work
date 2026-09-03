// build-static.mjs — ビルダーを単一HTMLにバンドル → AES-GCM暗号化 → docs/index.html を生成(GitHub Pages用)
// パスワードを入力すると復号されて開く。なければソースは暗号文のみ露出(静的ホスティングで可能な最善策)。
// 使用: node build-static.mjs            (.wf-pass またはデフォルト値を使用)
//       WF_PASSWORD=xxx node build-static.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { webcrypto as wc } from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => readFileSync(path.join(ROOT, p), "utf8");

// ---- パスワード ----
function resolvePassword() {
  if (process.env.WF_PASSWORD) return process.env.WF_PASSWORD;
  try {
    const p = rd(".wf-pass").trim();
    if (p) return p;
  } catch (_) {}
  return "wireframe";
}
const PASSWORD = resolvePassword();

// ---- 1) モジュールバンドル: import/export を除去して1つのスクリプトに ----
const strip = (src) => src.replace(/^\s*import\s.*$/gm, "").replace(/^\s*export\s+/gm, "");

const wireframeCss = rd("styles/wireframe.css");
const builderCss = rd("styles/builder.css");

let appJs = strip(rd("src/app.js"));
// ランタイムの fetch(wireframe.css) → インライン定数に置換(静的な単一ファイルのため fetch 不可)
appJs = appJs.replace(/CSS\s*=\s*await\s*fetch\([^)]*\)\.then\([^;]*\);/, "CSS = WF_CSS;");

// バンドル順は依存関係の順。app.js は最後(他をすべて参照するため)。
// ※ src/ に新しいモジュールを足したら MODULE_ORDER にも追加すること。
//   漏れると「呼び出しはあるのに定義が無い」= 公開ページだけ ReferenceError になる。
//   下のチェックで検出してビルドを止める。
const MODULE_ORDER = [
  "src/version.js",
  "src/i18n.js",
  "src/templates.js",
  "src/gallery.js",
  "src/icons.js",
  "src/catalog.js",
  "src/sanitize.js",
  "src/share.js",
  "src/zip.js",
  "src/export.js",
];

// src/ にあるのに MODULE_ORDER に無いファイルを検出(バンドル漏れ防止)
{
  const onDisk = readdirSync(path.join(ROOT, "src"))
    .filter((f) => f.endsWith(".js"))
    .map((f) => "src/" + f)
    .filter((f) => f !== "src/app.js"); // app.js は最後に別途連結する
  const missing = onDisk.filter((f) => !MODULE_ORDER.includes(f));
  if (missing.length) {
    console.error("バンドル対象から漏れているモジュール:", missing.join(", "));
    console.error("build-static.mjs の MODULE_ORDER に追加してください。");
    process.exit(1);
  }
}

const bundleJs = [
  `const WF_CSS = ${JSON.stringify(wireframeCss)};`,
  ...MODULE_ORDER.map((f) => strip(rd(f))),
  appJs,
].join("\n");

// index.html の <body> 内部(モジュールスクリプトタグは除外)
const indexHtml = rd("index.html");
const bodyInner = indexHtml
  .replace(/[\s\S]*<body>/i, "")
  .replace(/<\/body>[\s\S]*/i, "")
  .replace(/<script[^>]*src=["']?\.\/src\/app\.js["']?[^>]*><\/script>/i, "");

const payload = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EC ワイヤーフレーム ビルダー</title>
<style>
${builderCss}
</style>
</head>
<body>
${bodyInner}
<script>
${bundleJs}
</script>
</body>
</html>`;

// ---- 2) AES-GCM 暗号化 ----
const enc = new TextEncoder();
const salt = wc.getRandomValues(new Uint8Array(16));
const iv = wc.getRandomValues(new Uint8Array(12));
const ITER = 200000;
const baseKey = await wc.subtle.importKey("raw", enc.encode(PASSWORD), "PBKDF2", false, ["deriveKey"]);
const key = await wc.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const ctBuf = await wc.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(payload));
const b64 = (u8) => Buffer.from(u8).toString("base64");
const CT = b64(new Uint8Array(ctBuf));
const SALT = b64(salt);
const IV = b64(iv);

// ---- 3) ゲートHTML(暗号文 + 復号ブートストラップ) ----
const gate = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🔒 EC ワイヤーフレーム ビルダー</title>
<style>
  body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
    background:#f4f5f7;font-family:-apple-system,"Yu Gothic UI",Meiryo,sans-serif;color:#1f2430;}
  .box{background:#fff;border:1px solid #e2e5ea;border-radius:14px;padding:34px 30px;width:320px;
    box-shadow:0 10px 40px rgba(0,0,0,.08);text-align:center;}
  .lock{font-size:34px;margin-bottom:8px;}
  h1{font-size:16px;margin:0 0 4px;} p{color:#6b7280;font-size:12px;margin:0 0 20px;}
  input{width:100%;box-sizing:border-box;padding:11px 12px;font-size:14px;border:1px solid #d0d4da;
    border-radius:8px;margin-bottom:10px;}
  button{width:100%;padding:11px;font-size:14px;font-weight:600;border:0;border-radius:8px;
    background:#2b6cb0;color:#fff;cursor:pointer;}
  button:hover{filter:brightness(1.06);}
  .err{color:#c0392b;font-size:12px;min-height:16px;margin-top:8px;}
</style>
</head>
<body>
  <form class="box" id="f">
    <div class="lock">🔒</div>
    <h1>EC ワイヤーフレーム ビルダー</h1>
    <p>パスワードを入力するとページが開きます。</p>
    <input id="pw" type="password" autocomplete="current-password" placeholder="パスワード" autofocus>
    <button type="submit" id="btn">開く</button>
    <div class="err" id="err"></div>
  </form>
<script>
  var SALT="${SALT}",IV="${IV}",CT="${CT}",ITER=${ITER};
  function b64d(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
  async function unlock(pw){
    var enc=new TextEncoder();
    var bk=await crypto.subtle.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveKey"]);
    var key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b64d(SALT),iterations:ITER,hash:"SHA-256"},
      bk,{name:"AES-GCM",length:256},false,["decrypt"]);
    var pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64d(IV)},key,b64d(CT));
    return new TextDecoder().decode(pt);
  }
  function reveal(html){document.open();document.write(html);document.close();}
  var f=document.getElementById("f"),pw=document.getElementById("pw"),err=document.getElementById("err"),btn=document.getElementById("btn");
  async function tryPw(p){
    btn.disabled=true;err.textContent="";
    try{ var html=await unlock(p); try{sessionStorage.setItem("wf_pw",p);}catch(e){} reveal(html); }
    catch(e){ err.textContent="パスワードが正しくありません。"; btn.disabled=false; pw.select(); }
  }
  f.addEventListener("submit",function(e){e.preventDefault();tryPw(pw.value);});
  // 同じセッションで再アクセス時に自動で開く
  try{ var saved=sessionStorage.getItem("wf_pw"); if(saved) tryPw(saved); }catch(e){}
<\/script>
</body>
</html>`;

// ---- 4) 出力: リポジトリルートの docs/ (GitHub Pages) ----
const outDir = path.join(ROOT, "..", "docs");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "index.html"), gate);
writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log("built docs/index.html  (payload " + Math.round(payload.length / 1024) + "KB → gate " + Math.round(gate.length / 1024) + "KB)");
console.log("password source:", process.env.WF_PASSWORD ? "WF_PASSWORD" : "(.wf-pass or default)");
