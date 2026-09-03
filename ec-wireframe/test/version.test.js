// バージョン表記のズレ防止 — src/version.js と package.json を一致させる
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { APP_VERSION } from "../src/version.js";

test("src/version.js と package.json のバージョンが一致する", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(APP_VERSION, pkg.version,
    `src/version.js(${APP_VERSION}) と package.json(${pkg.version}) がズレています`);
});

test("バージョンは SemVer 形式", () => {
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
});

test("README の最新バージョン行と一致する", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const m = readme.match(/\|\s*\*\*v(\d+\.\d+\.\d+)\*\*\s*\|/);
  assert.ok(m, "README にバージョン行が見つかりません");
  assert.equal(m[1], APP_VERSION,
    `README(${m && m[1]}) と version.js(${APP_VERSION}) がズレています`);
});
