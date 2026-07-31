/**
 * Smoke: slid-phi pack/unpack with 0-offset (ports include 0).
 * Run: node scripts/slid-phi-smoke.mjs
 */
import { encode, decode } from "slid-phi";

function pack(values, mode, opts = {}) {
  const enc = values.map((v) => v + 1);
  const f = encode(mode, enc, opts);
  return { f, back: decode(f).map((n) => n - 1) };
}

const ports = [0, 1, 2, 4, 8, 15, 3, 5, 10];
const { f, back } = pack(ports, "universe", { M: 16 });
const ok =
  back.length === ports.length && back.every((v, i) => v === ports[i]);

const scores = [0, 1200, 980, 450, 2100];
const s = pack(scores, "dense", { profile: "auto" });
const okS = s.back.every((v, i) => v === scores[i]);

console.log(
  JSON.stringify(
    {
      ok,
      okS,
      portsBack: back,
      portBytes: f.bytes?.length,
      portBitLen: f.bitLen,
      scoresBack: s.back,
      scoreBytes: s.f.bytes?.length,
    },
    null,
    2,
  ),
);

if (!ok || !okS) process.exit(1);
