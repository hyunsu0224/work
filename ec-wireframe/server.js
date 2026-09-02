// server.js — 依存なしの静的ファイルサーバー (ESモジュール配信用) + Basic認証
// 使用: node server.js [port]
// パスワードの優先順位: 環境変数 WF_PASSWORD  >  同じフォルダの .wf-pass ファイル  >  デフォルト値
//   例) PowerShell:  $env:WF_PASSWORD="mypass"; node server.js 8000
//   例) .wf-pass ファイルにパスワードを1行だけ保存(ファイルはgit対象外)
// 認証をオフにしたい場合:  $env:WF_NOAUTH="1"; node server.js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2]) || 5173;

// ---- パスワードの決定 ----
function resolvePassword() {
  if (process.env.WF_PASSWORD) return process.env.WF_PASSWORD;
  try {
    const p = fs.readFileSync(path.join(ROOT, ".wf-pass"), "utf8").trim();
    if (p) return p;
  } catch (_) {
    /* ファイルなし → 次へ */
  }
  console.warn("[auth] デフォルトパスワード(wireframe)を使用中 — WF_PASSWORD または .wf-pass で変更を推奨");
  return "wireframe";
}
const PASSWORD = resolvePassword();
const NO_AUTH = process.env.WF_NOAUTH === "1";
const REALM = "EC Wireframe Builder";

// Authorizationヘッダーの検証(ユーザー名は無視、パスワードのみ確認)
function authorized(req) {
  const h = req.headers["authorization"] || "";
  const m = h.match(/^Basic\s+(.+)$/i);
  if (!m) return false;
  let decoded = "";
  try {
    decoded = Buffer.from(m[1], "base64").toString("utf8");
  } catch (_) {
    return false;
  }
  const pass = decoded.slice(decoded.indexOf(":") + 1); // "user:pass" → pass
  return pass === PASSWORD;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // ---- 認証ゲート: 通過できなければどのファイルも送信しない ----
  if (!NO_AUTH && !authorized(req)) {
    res.writeHead(401, {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
    });
    return res.end("401 Unauthorized — パスワードが必要です。");
  }

  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  // パス逸脱の防止
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  // .wf-pass などの機微なファイルは配信禁止
  if (path.basename(filePath) === ".wf-pass") {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found: " + urlPath);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`ec-wireframe builder → http://localhost:${PORT}`);
  console.log(NO_AUTH ? "[auth] 無効(WF_NOAUTH=1)" : "[auth] Basic認証 有効 — アクセス時にパスワードが必要");
});
