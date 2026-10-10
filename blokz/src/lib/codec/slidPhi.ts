/**
 * slid-phi helpers for packing integer lists used by bLOkz.
 * Full frames (mode + meta + bytes) are serialized as JSON with base64url payload.
 */
import { decode as spDecode, encode as spEncode } from "slid-phi";

export type PackedFrame = {
  m: string;
  n: number;
  bl: number;
  b: string;
  /** mode-specific extras (M, w, profile, ks, …) */
  x?: Record<string, unknown>;
};

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const raw =
    typeof atob !== "undefined"
      ? atob(b64 + pad)
      : Buffer.from(b64 + pad, "base64").toString("binary");
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function frameToPacked(frame: Record<string, unknown>): PackedFrame {
  const bytes = frame.bytes as Uint8Array | undefined;
  if (!bytes) throw new Error("slid-phi frame missing bytes");
  const m = String(frame.mode ?? "dense");
  const n = Number(frame.n ?? 0);
  const bl = Number(frame.bitLen ?? bytes.length * 8);
  const skip = new Set(["mode", "n", "bitLen", "bytes", "bits"]);
  const x: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(frame)) {
    if (skip.has(k)) continue;
    x[k] = v;
  }
  return {
    m,
    n,
    bl,
    b: bytesToB64url(bytes),
    ...(Object.keys(x).length ? { x } : {}),
  };
}

function packedToFrame(p: PackedFrame): Record<string, unknown> {
  const x = { ...(p.x ?? {}) };
  delete x._off; // app marker only
  return {
    mode: p.m,
    n: p.n,
    bitLen: p.bl,
    bytes: b64urlToBytes(p.b),
    ...x,
  };
}

export function packFrameString(p: PackedFrame): string {
  return JSON.stringify(p);
}

export function unpackFrameString(s: string): PackedFrame {
  return JSON.parse(s) as PackedFrame;
}

/**
 * Pack non-negative integers (0 allowed).
 * slid-phi pathways expect n≥1 — store as (v+1), reverse on unpack.
 * opts.M = max original value inclusive (e.g. 15 for port masks).
 * auto: 0..15 → universe; strictly increasing → gaps; else dense auto.
 */
export function packInts(
  values: number[],
  opts?: { mode?: "auto" | "universe" | "gaps" | "dense" | "for"; M?: number },
): { packed: string; mode: string; n: number } {
  if (!values.length) {
    return { packed: "", mode: "empty", n: 0 };
  }
  const raw = values.map((v) => {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`slid-phi pack expects non-negative ints, got ${v}`);
    }
    return n;
  });
  const ints = raw.map((n) => n + 1);

  let mode = opts?.mode ?? "auto";
  let frame: Record<string, unknown>;

  if (mode === "auto") {
    const max = Math.max(...raw);
    const increasing = raw.every((v, i) => i === 0 || v > raw[i - 1]!);
    if (max <= 15) {
      mode = "universe";
      frame = spEncode("universe", ints, { M: 16 }) as Record<string, unknown>;
    } else if (increasing) {
      mode = "gaps";
      frame = spEncode("gaps", ints) as Record<string, unknown>;
    } else {
      mode = "dense";
      frame = spEncode("dense", ints, { profile: "auto" }) as Record<
        string,
        unknown
      >;
    }
  } else if (mode === "universe") {
    const maxOrig = opts?.M ?? Math.max(...raw);
    frame = spEncode("universe", ints, { M: maxOrig + 1 }) as Record<
      string,
      unknown
    >;
  } else if (mode === "gaps") {
    frame = spEncode("gaps", ints) as Record<string, unknown>;
  } else if (mode === "for") {
    frame = spEncode("for", ints) as Record<string, unknown>;
  } else {
    frame = spEncode("dense", ints, { profile: "auto" }) as Record<
      string,
      unknown
    >;
  }

  const packedObj = frameToPacked(frame);
  packedObj.x = { ...(packedObj.x ?? {}), _off: 1 };
  return {
    packed: packFrameString(packedObj),
    mode,
    n: raw.length,
  };
}

export function unpackInts(packed: string): number[] {
  if (!packed) return [];
  const p = unpackFrameString(packed);
  // strip our offset marker before decode (not part of slid-phi frame)
  const x = { ...(p.x ?? {}) };
  const off = Number(x._off ?? 1);
  delete x._off;
  const frame = {
    mode: p.m,
    n: p.n,
    bitLen: p.bl,
    bytes: b64urlToBytes(p.b),
    ...x,
  };
  const out = spDecode(frame as Parameters<typeof spDecode>[0]);
  const arr = Array.isArray(out)
    ? out.map(Number)
    : typeof out === "number"
      ? [out]
      : [];
  return arr.map((n) => n - off);
}

/** Port masks 0..15 */
export function packPortMasks(ports: number[]): string {
  return packInts(ports, { mode: "universe", M: 15 }).packed;
}

export function unpackPortMasks(packed: string): number[] {
  return unpackInts(packed);
}

export type AssetId =
  | "btc"
  | "eth"
  | "sol"
  | "avax"
  | "link"
  | "dot"
  | "atom"
  | "blok";

const ASSET_IDS: AssetId[] = [
  "btc",
  "eth",
  "sol",
  "avax",
  "link",
  "dot",
  "atom",
  "blok",
];

export function assetToIndex(a: string): number {
  const i = ASSET_IDS.indexOf(a as AssetId);
  return i >= 0 ? i : 0;
}

export function indexToAsset(i: number): AssetId {
  return ASSET_IDS[i] ?? "blok";
}

export type SpBoard = {
  size: number;
  ports: string;
  assets: string;
  sp: 1;
};

export function packBoard(board: {
  size: number;
  cells: Array<{ ports: number; asset: string }>;
}): SpBoard {
  return {
    size: board.size,
    ports: packPortMasks(board.cells.map((c) => c.ports)),
    assets: packInts(
      board.cells.map((c) => assetToIndex(c.asset)),
      { mode: "universe", M: ASSET_IDS.length - 1 },
    ).packed,
    sp: 1,
  };
}

export function unpackBoard(packed: SpBoard): {
  size: number;
  cells: Array<{ ports: number; asset: AssetId }>;
} {
  const ports = unpackPortMasks(packed.ports);
  const assets = unpackInts(packed.assets);
  const n = packed.size * packed.size;
  const cells: Array<{ ports: number; asset: AssetId }> = [];
  for (let i = 0; i < n; i++) {
    cells.push({
      ports: ports[i] ?? 0,
      asset: indexToAsset(assets[i] ?? 0),
    });
  }
  return { size: packed.size, cells };
}

export function isSpBoard(v: unknown): v is SpBoard {
  return (
    !!v &&
    typeof v === "object" &&
    (v as SpBoard).sp === 1 &&
    typeof (v as SpBoard).ports === "string" &&
    typeof (v as SpBoard).assets === "string" &&
    typeof (v as SpBoard).size === "number"
  );
}

/** Numeric columns from leaderboard rows */
export function packScoreColumns(
  rows: Array<{
    score: number;
    timeMs: number;
    moves: number;
    at: number;
    clicksAway?: number;
  }>,
): {
  sp: 1;
  n: number;
  scores: string;
  timeMs: string;
  moves: string;
  ats: string;
  clicks?: string;
} {
  const n = rows.length;
  if (!n) {
    return { sp: 1, n: 0, scores: "", timeMs: "", moves: "", ats: "" };
  }
  const out = {
    sp: 1 as const,
    n,
    scores: packInts(rows.map((r) => Math.max(0, Math.round(r.score)))).packed,
    timeMs: packInts(rows.map((r) => Math.max(0, Math.round(r.timeMs))))
      .packed,
    moves: packInts(rows.map((r) => Math.max(0, Math.round(r.moves)))).packed,
    ats: packInts(rows.map((r) => Math.max(0, Math.round(r.at)))).packed,
  };
  if (rows.some((r) => r.clicksAway != null)) {
    return {
      ...out,
      clicks: packInts(
        rows.map((r) =>
          r.clicksAway != null ? Math.max(0, Math.round(r.clicksAway)) : 0,
        ),
      ).packed,
    };
  }
  return out;
}
