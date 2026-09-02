// zip.js — 依存なしの ZIP 生成(無圧縮 store 方式)
// files: { "パス/名前": 文字列 } → Uint8Array(ZIP本体)
// ブラウザでも Node でも動く(TextEncoder / Uint8Array のみ使用)。
// 仕様: local file header + central directory + EOCD

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

// UTF-8 のファイル名を正しく扱うため general purpose flag bit 11 を立てる
const UTF8_FLAG = 0x0800;

export function zipStore(files) {
  const enc = new TextEncoder();
  const parts = [];
  const entries = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const data = content instanceof Uint8Array ? content : enc.encode(String(content));
    const nameBuf = enc.encode(name);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // signature
    local.setUint16(4, 20, true);         // version needed
    local.setUint16(6, UTF8_FLAG, true);  // flags
    local.setUint16(8, 0, true);          // method: 0 = store
    local.setUint16(10, 0, true);         // time
    local.setUint16(12, 0, true);         // date
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBuf.length, true);
    local.setUint16(28, 0, true);         // extra len

    parts.push(new Uint8Array(local.buffer), nameBuf, data);
    entries.push({ nameBuf, crc, size: data.length, offset });
    offset += 30 + nameBuf.length + data.length;
  }

  const central = [];
  let cdSize = 0;
  for (const e of entries) {
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);            // version made by
    cd.setUint16(6, 20, true);            // version needed
    cd.setUint16(8, UTF8_FLAG, true);
    cd.setUint16(10, 0, true);            // method
    cd.setUint16(12, 0, true);            // time
    cd.setUint16(14, 0, true);            // date
    cd.setUint32(16, e.crc, true);
    cd.setUint32(20, e.size, true);
    cd.setUint32(24, e.size, true);
    cd.setUint16(28, e.nameBuf.length, true);
    cd.setUint16(30, 0, true);            // extra
    cd.setUint16(32, 0, true);            // comment
    cd.setUint16(34, 0, true);            // disk
    cd.setUint16(36, 0, true);            // internal attrs
    cd.setUint32(38, 0, true);            // external attrs
    cd.setUint32(42, e.offset, true);
    central.push(new Uint8Array(cd.buffer), e.nameBuf);
    cdSize += 46 + e.nameBuf.length;
  }

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);

  const all = [...parts, ...central, new Uint8Array(eocd.buffer)];
  const total = all.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}
