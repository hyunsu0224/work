// server.js — 무의존 정적 파일 서버 (ES 모듈 서빙용) + Basic 인증
// 사용: node server.js [port]
// 비밀번호 우선순위: 환경변수 WF_PASSWORD  >  같은 폴더의 .wf-pass 파일  >  기본값
//   예) PowerShell:  $env:WF_PASSWORD="mypass"; node server.js 8000
//   예) .wf-pass 파일에 비밀번호 한 줄만 저장(파일은 git 제외)
// 인증을 끄고 싶으면:  $env:WF_NOAUTH="1"; node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 5173;

// ---- 비밀번호 결정 ----
function resolvePassword() {
  if (process.env.WF_PASSWORD) return process.env.WF_PASSWORD;
  try {
    const p = fs.readFileSync(path.join(ROOT, ".wf-pass"), "utf8").trim();
    if (p) return p;
  } catch (_) {
    /* 파일 없음 → 다음 */
  }
  console.warn("[auth] 기본 비밀번호(wireframe) 사용 중 — WF_PASSWORD 또는 .wf-pass 로 변경 권장");
  return "wireframe";
}
const PASSWORD = resolvePassword();
const NO_AUTH = process.env.WF_NOAUTH === "1";
const REALM = "EC Wireframe Builder";

// Authorization 헤더 검증(사용자명은 무시, 비밀번호만 확인)
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
  // ---- 인증 게이트: 통과 못 하면 어떤 파일도 전송하지 않음 ----
  if (!NO_AUTH && !authorized(req)) {
    res.writeHead(401, {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
    });
    return res.end("401 Unauthorized — 비밀번호가 필요합니다.");
  }

  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  // 경로 이탈 방지
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  // .wf-pass 등 민감 파일은 서빙 금지
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
  console.log(NO_AUTH ? "[auth] 비활성(WF_NOAUTH=1)" : "[auth] Basic 인증 활성 — 접속 시 비밀번호 필요");
});
