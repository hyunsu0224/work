// secrets.test.js — 実際のゲートパスワードがリポジトリ内に平文で混入していないか
// .wf-pass は .gitignore 対象のローカル専用ファイル。存在しない環境(CI)では skip する。
import { test, skip } from "node:test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PASS_FILE = path.join(ROOT, ".wf-pass");

test("実際のゲートパスワードがコミット対象ファイルに含まれない", (t) => {
  if (!existsSync(PASS_FILE)) return t.skip(".wf-pass が無い環境のため skip");
  const secret = readFileSync(PASS_FILE, "utf8").trim();
  if (!secret) return t.skip(".wf-pass が空のため skip");

  const GIT_ROOT = execSync("git rev-parse --show-toplevel", { cwd: ROOT, encoding: "utf8" }).trim();
  const files = execSync("git ls-files", { cwd: GIT_ROOT, encoding: "utf8" })
    .split("\n")
    .filter((f) => f && !/\.(png|jpe?g|gif|webp|ico|woff2?|zip)$/i.test(f));

  const hits = files.filter((f) => {
    try {
      return readFileSync(path.join(GIT_ROOT, f), "utf8").includes(secret);
    } catch (_) {
      return false; // バイナリ・削除済みなどは対象外
    }
  });

  // 失敗メッセージにパスワード本体を出さないよう、ファイル名のみ報告する
  assert.deepStrictEqual(hits, [], `平文パスワードが混入: ${hits.join(", ")}`);
});
