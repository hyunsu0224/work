// share.js — 状態を URL に載せて共有する(サーバー不要)
// state → JSON → gzip(CompressionStream) → base64url → location.hash
// CompressionStream が無い環境では圧縮なしにフォールバックする。
// ブラウザ API を使うが、Node 18+ にも同じ API があるためテスト可能。

const MARKER_GZ = "z"; // 圧縮あり
const MARKER_RAW = "r"; // 圧縮なし(フォールバック)

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipeThrough(bytes, stream) {
  const res = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

// 共有する内容だけ抜き出す(UI 状態や履歴は載せない)
export function shareableState(state) {
  return {
    device: state.device,
    pageType: state.pageType,
    showNotes: state.showNotes,
    pages: state.pages,
  };
}

export async function encodeState(state) {
  const json = JSON.stringify(shareableState(state));
  const raw = enc.encode(json);
  if (typeof CompressionStream === "function") {
    try {
      return MARKER_GZ + toBase64Url(await pipeThrough(raw, new CompressionStream("gzip")));
    } catch (_) {
      /* 圧縮に失敗したら無圧縮へ */
    }
  }
  return MARKER_RAW + toBase64Url(raw);
}

export async function decodeState(token) {
  if (typeof token !== "string" || token.length < 2) return null;
  const marker = token[0];
  try {
    // 不正な文字が含まれると atob が例外を投げるので、復号処理ごと try に入れる
    const body = fromBase64Url(token.slice(1));
    if (marker === MARKER_GZ) {
      if (typeof DecompressionStream !== "function") return null;
      return JSON.parse(dec.decode(await pipeThrough(body, new DecompressionStream("gzip"))));
    }
    if (marker === MARKER_RAW) return JSON.parse(dec.decode(body));
  } catch (_) {
    return null; // 壊れた/改ざんされたトークンは黙って無視
  }
  return null;
}
