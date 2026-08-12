// build-static.mjs — 빌더를 단일 HTML로 번들 → AES-GCM 암호화 → docs/index.html 생성(GitHub Pages용)
// 비번을 입력해야 복호화되어 열림. 없으면 소스는 암호문만 노출(정적 호스팅에서 가능한 최선).
// 사용: node build-static.mjs            (.wf-pass 또는 기본값 사용)
//       WF_PASSWORD=xxx node build-static.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { webcrypto as wc } from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const rd = (p) => readFileSync(path.join(ROOT, p), "utf8");

// ---- 비밀번호 ----
function resolvePassword() {
  if (process.env.WF_PASSWORD) return process.env.WF_PASSWORD;
  try {
    const p = rd(".wf-pass").trim();
    if (p) return p;
  } catch (_) {}
  return "wireframe";
}
const PASSWORD = resolvePassword();

// ---- 1) 모듈 번들: import/export 제거 후 하나의 스크립트로 ----
const strip = (src) => src.replace(/^\s*import\s.*$/gm, "").replace(/^\s*export\s+/gm, "");

const wireframeCss = rd("styles/wireframe.css");
const builderCss = rd("styles/builder.css");

let appJs = strip(rd("src/app.js"));
// 런타임 fetch(wireframe.css) → 인라인 상수로 대체(정적 단일파일이라 fetch 불가)
appJs = appJs.replace(/CSS\s*=\s*await\s*fetch\([^)]*\)\.then\([^;]*\);/, "CSS = WF_CSS;");

const bundleJs = [
  `const WF_CSS = ${JSON.stringify(wireframeCss)};`,
  strip(rd("src/i18n.js")),
  strip(rd("src/templates.js")),
  strip(rd("src/gallery.js")),
  strip(rd("src/icons.js")),
  strip(rd("src/catalog.js")),
  strip(rd("src/export.js")),
  appJs,
].join("\n");

// index.html 의 <body> 내부(모듈 스크립트 태그는 제외)
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

// ---- 2) AES-GCM 암호화 ----
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

// ---- 3) 게이트 HTML(암호문 + 복호화 부트스트랩) ----
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
  // 같은 세션에서 재접속 시 자동 열기
  try{ var saved=sessionStorage.getItem("wf_pw"); if(saved) tryPw(saved); }catch(e){}
<\/script>
</body>
</html>`;

// ---- 4) 출력: 저장소 루트의 docs/ (GitHub Pages) ----
const outDir = path.join(ROOT, "..", "docs");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "index.html"), gate);
writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log("built docs/index.html  (payload " + Math.round(payload.length / 1024) + "KB → gate " + Math.round(gate.length / 1024) + "KB)");
console.log("password source:", process.env.WF_PASSWORD ? "WF_PASSWORD" : "(.wf-pass or default)");
