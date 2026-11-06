/**
 * On-chain staking-vault client (Anchor program `blokz_stake`).
 *
 * SSR-safe and dependency-free: no @solana/web3.js (same rule as
 * `solana.ts`). This module owns the IDL wiring, the liveness gate, the
 * transaction construction, and the wallet signing transport:
 *
 * - `STAKE_PROGRAM_ID` comes from `VITE_STAKE_PROGRAM_ID` (set after
 *   `anchor deploy`, see `docs/STAKING_VAULT.md`).
 * - `isVaultLive()` is the single gate `StakePanel` uses to switch between
 *   the simulated ledger and vault transactions.
 * - Instruction data is Anchor-compatible: the 8-byte discriminator
 *   (`sha256("global:<name>")[0..8]`, vendored SHA-256 below) followed by
 *   borsh-encoded args, with account metas ordered from the checked-in IDL
 *   (`idl/blokz_stake.json`, kept in sync with
 *   `programs/blokz-stake/src/lib.rs`).
 * - Unsigned transactions are compiled to legacy Solana wire bytes and
 *   handed to the wallet signing transport (`signTransaction`). There are
 *   no silent stubs: every entry point refuses closed (`{ ok: false }`
 *   with an actionable error) when the vault is not live, when accounts
 *   are missing, or when no signing transport is available.
 *
 * PDA/ATA addresses (config PDA, stake PDA, vault + user ATAs) are
 * deployment-specific, so callers pass them via `accounts`. Anything not
 * supplied — and not safely defaultable (user = signer, mint = live mint,
 * well-known program ids) — is reported by name instead of guessed.
 */

import idl from "./idl/blokz_stake.json" with { type: "json" };
import { getSolanaProvider, SOLANA_TOKEN } from "./solana.ts";

export interface VaultIdlInstruction {
  name: string;
  accounts: { name: string; isMut: boolean; isSigner: boolean }[];
  args: { name: string; type: string }[];
}

export interface VaultIdl {
  version: string;
  name: string;
  instructions: VaultIdlInstruction[];
  metadata?: { address?: string };
}

const VAULT_IDL = idl as VaultIdl;

/** PDA seeds — must match `programs/blokz-stake/src/lib.rs`. */
export const VAULT_SEEDS = {
  config: "config",
  stake: "stake",
} as const;

/** Reward model mirrored on-chain (must match lib.rs constants). */
export const VAULT_PARAMS = {
  lockSecs: 43_200,
  dailyRateBps: 200,
} as const;

/** Well-known program ids (immutable, safe to hardcode). */
export const TOKEN_2022_PROGRAM_ID =
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

function readEnvProgramId(): string | null {
  try {
    const raw =
      typeof import.meta !== "undefined"
        ? (import.meta.env?.["VITE_STAKE_PROGRAM_ID"] as unknown)
        : null;
    if (typeof raw !== "string") return null;
    const v = raw.trim();
    return v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Deployed program id, or null until `VITE_STAKE_PROGRAM_ID` is set. */
export const STAKE_PROGRAM_ID: string | null = readEnvProgramId();

function isPlausibleProgramId(v: string | null): v is string {
  if (!v) return false;
  const a = v.trim();
  if (a.length < 32 || a.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(a);
}

/**
 * The one gate for vault mode. True only when a program id is configured —
 * until then the app keeps the simulated stake ledger in `store.ts`.
 */
export function isVaultLive(): boolean {
  return isPlausibleProgramId(STAKE_PROGRAM_ID);
}

/** IDL instruction names exposed by the deployed program. */
export function vaultInstructionNames(): string[] {
  return VAULT_IDL.instructions.map((ix) => ix.name);
}

/** Look up one instruction's accounts + args from the IDL. */
export function getVaultInstructionDef(
  name: string,
): VaultIdlInstruction | null {
  return VAULT_IDL.instructions.find((ix) => ix.name === name) ?? null;
}

export function vaultIdlVersion(): string {
  return VAULT_IDL.version;
}

export function vaultIdlAddress(): string | null {
  const a = VAULT_IDL.metadata?.address;
  return typeof a === "string" && a.length > 0 ? a : null;
}

/* ------------------------------------------------------------------ */
/* SHA-256 (vendored, no deps) — Anchor instruction discriminators.    */
/* ------------------------------------------------------------------ */

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr32(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

function sha256Bytes(data: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const len = data.length;
  const bitLenHi = Math.floor(len / 0x20000000);
  const bitLenLo = (len << 3) >>> 0;
  const paddedLen = (((len + 8) >> 6) + 1) << 6;
  const msg = new Uint8Array(paddedLen);
  msg.set(data);
  msg[len] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(paddedLen - 8, bitLenHi);
  view.setUint32(paddedLen - 4, bitLenLo);

  const w = new Uint32Array(64);
  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 =
        rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 =
        rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let i = 0; i < 64; i++) {
      const s1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + s1 + ch + SHA256_K[i] + w[i]) | 0;
      const s0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0);
  outView.setUint32(4, h1);
  outView.setUint32(8, h2);
  outView.setUint32(12, h3);
  outView.setUint32(16, h4);
  outView.setUint32(20, h5);
  outView.setUint32(24, h6);
  outView.setUint32(28, h7);
  return out;
}

/**
 * Anchor instruction discriminator: first 8 bytes of
 * `sha256("global:<name>")`.
 */
export function vaultDiscriminator(name: string): Uint8Array {
  const pre =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(`global:${name}`)
      : Uint8Array.from(
          `global:${name}`.split("").map((c) => c.charCodeAt(0) & 0xff),
        );
  return sha256Bytes(pre).slice(0, 8);
}

/* ------------------------------------------------------------------ */
/* Borsh arg encoding (u64 / u16 / bool — every arg type in the IDL). */
/* ------------------------------------------------------------------ */

export type VaultArgValue = number | bigint | boolean;

function encodeU64(v: number | bigint): Uint8Array {
  let n: bigint;
  try {
    n = typeof v === "bigint" ? v : BigInt(Math.floor(v));
  } catch {
    throw new Error(`Vault arg: expected u64, got ${String(v)}`);
  }
  if (n < 0n || n > 0xffffffffffffffffn) {
    throw new Error(`Vault arg: u64 out of range (${String(v)})`);
  }
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    out[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return out;
}

function encodeU16(v: number | bigint): Uint8Array {
  const n = typeof v === "bigint" ? Number(v) : Math.floor(v);
  if (!Number.isInteger(n) || n < 0 || n > 0xffff) {
    throw new Error(`Vault arg: u16 out of range (${String(v)})`);
  }
  return Uint8Array.from([n & 0xff, (n >> 8) & 0xff]);
}

function encodeBool(v: VaultArgValue): Uint8Array {
  if (typeof v !== "boolean") {
    throw new Error(`Vault arg: expected bool, got ${String(v)}`);
  }
  return Uint8Array.from([v ? 1 : 0]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Borsh-encode one instruction's args in IDL order. Throws naming the arg. */
export function encodeVaultArgs(
  def: VaultIdlInstruction,
  args: Record<string, VaultArgValue> = {},
): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const a of def.args) {
    const v = args[a.name];
    if (v === undefined) {
      throw new Error(
        `Vault ${def.name}: missing arg "${a.name}" (${a.type})`,
      );
    }
    try {
      if (a.type === "u64") parts.push(encodeU64(v as number | bigint));
      else if (a.type === "u16") parts.push(encodeU16(v as number | bigint));
      else if (a.type === "bool") parts.push(encodeBool(v));
      else throw new Error(`unsupported IDL type "${a.type}"`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith(`Vault ${def.name}`)) {
        throw e;
      }
      const detail = e instanceof Error ? e.message : String(e);
      throw new Error(`Vault ${def.name}: bad arg "${a.name}" — ${detail}`);
    }
  }
  return concatBytes(parts);
}

/**
 * Full instruction data: discriminator + borsh args. Throws when the
 * instruction is missing from the IDL or an arg is bad.
 */
export function encodeVaultInstructionData(
  name: string,
  args: Record<string, VaultArgValue> = {},
): Uint8Array {
  const def = getVaultInstructionDef(name);
  if (!def) throw new Error(`IDL is missing the ${name} instruction`);
  return concatBytes([vaultDiscriminator(name), encodeVaultArgs(def, args)]);
}

/* ------------------------------------------------------------------ */
/* Account metas (IDL order) + base58 + message compilation.           */
/* ------------------------------------------------------------------ */

export interface VaultAccountMeta {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

/**
 * Map caller-supplied addresses onto the IDL's account order for one
 * instruction. Throws naming the first missing account.
 */
export function buildVaultAccountMetas(
  name: string,
  accounts: Record<string, string>,
): VaultAccountMeta[] {
  const def = getVaultInstructionDef(name);
  if (!def) throw new Error(`IDL is missing the ${name} instruction`);
  return def.accounts.map((a) => {
    const pubkey = accounts[a.name];
    if (typeof pubkey !== "string" || pubkey.trim().length === 0) {
      throw new Error(
        `Vault ${name}: missing account "${a.name}" — pass it in accounts ` +
          `(PDA/ATA from your deploy; see docs/STAKING_VAULT.md)`,
      );
    }
    return { pubkey: pubkey.trim(), isSigner: a.isSigner, isWritable: a.isMut };
  });
}

const B58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(data: Uint8Array): string {
  let zeros = 0;
  while (zeros < data.length && data[zeros] === 0) zeros++;
  let arr = Array.from(data.slice(zeros));
  let out = "";
  while (arr.length > 0) {
    let carry = 0;
    const next: number[] = [];
    for (const b of arr) {
      const v = carry * 256 + b;
      const q = Math.floor(v / 58);
      carry = v % 58;
      if (next.length > 0 || q > 0) next.push(q);
    }
    out = B58_ALPHABET[carry] + out;
    arr = next;
  }
  return "1".repeat(zeros) + out;
}

export function base58Decode(s: string): Uint8Array {
  const t = s.trim();
  if (t.length === 0) throw new Error("Empty base58 address");
  let zeros = 0;
  while (zeros < t.length && t[zeros] === "1") zeros++;
  const num: number[] = [0]; // little-endian base-256
  for (let i = zeros; i < t.length; i++) {
    const d = B58_ALPHABET.indexOf(t[i] ?? "");
    if (d < 0) throw new Error(`Invalid base58 character in address`);
    let carry = d;
    for (let j = 0; j < num.length; j++) {
      const v = (num[j] ?? 0) * 58 + carry;
      num[j] = v & 0xff;
      carry = Math.floor(v / 256);
    }
    while (carry > 0) {
      num.push(carry & 0xff);
      carry = Math.floor(carry / 256);
    }
  }
  num.reverse();
  let start = 0;
  while (start < num.length && num[start] === 0) start++;
  const out = new Uint8Array(zeros + (num.length - start));
  out.set(num.slice(start), zeros);
  return out;
}

/** Decode a 32-byte Solana address or throw naming it. */
export function decodeVaultAddress(addr: string, label: string): Uint8Array {
  let raw: Uint8Array;
  try {
    raw = base58Decode(addr);
  } catch {
    throw new Error(`Vault: invalid address for "${label}"`);
  }
  if (raw.length !== 32) {
    throw new Error(`Vault: invalid address for "${label}" (want 32 bytes)`);
  }
  return raw;
}

function shortVecEncode(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Vault: bad vector length ${String(n)}`);
  }
  const out: number[] = [];
  let v = n;
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  out.push(v);
  return Uint8Array.from(out);
}

export interface VaultInstruction {
  programId: string;
  keys: VaultAccountMeta[];
  data: Uint8Array;
}

export interface CompiledVaultTransaction {
  messageBytes: Uint8Array;
  accountKeys: string[];
  header: {
    requiredSignatures: number;
    readonlySigned: number;
    readonlyUnsigned: number;
  };
}

/**
 * Compile a legacy Solana transaction message for the given instructions.
 * Account order is deterministic: fee payer first, then other
 * signer-writable, signer-readonly, non-signer-writable, and finally
 * non-signer-readonly (program ids last) — mirroring web3.js buckets.
 */
export function compileVaultTransaction(
  payer: string,
  recentBlockhash: string,
  instructions: VaultInstruction[],
): CompiledVaultTransaction {
  if (instructions.length === 0) {
    throw new Error("Vault: nothing to compile (no instructions)");
  }
  decodeVaultAddress(payer, "payer");
  const blockhashBytes = decodeVaultAddress(recentBlockhash, "recentBlockhash");

  const payerKey = payer.trim();
  const flags = new Map<string, { isSigner: boolean; isWritable: boolean }>();
  flags.set(payerKey, { isSigner: true, isWritable: true });
  const programIds: string[] = [];
  for (const ix of instructions) {
    decodeVaultAddress(ix.programId, "programId");
    for (const k of ix.keys) {
      decodeVaultAddress(k.pubkey, "account");
      const prev = flags.get(k.pubkey);
      flags.set(k.pubkey, {
        isSigner: (prev?.isSigner ?? false) || k.isSigner,
        isWritable: (prev?.isWritable ?? false) || k.isWritable,
      });
    }
    if (!programIds.includes(ix.programId)) programIds.push(ix.programId);
  }
  for (const p of programIds) {
    const prev = flags.get(p);
    flags.set(p, {
      isSigner: prev?.isSigner ?? false,
      isWritable: false,
    });
  }

  const isPayer = (k: string) => k === payerKey;
  const ordered = [...flags.entries()]
    .filter(([k]) => !isPayer(k))
    .sort((a, b) => {
      const rank = (f: { isSigner: boolean; isWritable: boolean }) =>
        f.isSigner ? (f.isWritable ? 0 : 1) : f.isWritable ? 2 : 3;
      return rank(a[1]) - rank(b[1]);
    })
    .map(([k]) => k);
  const accountKeys = [payerKey, ...ordered];
  if (accountKeys.length > 256) {
    throw new Error("Vault: too many accounts for a legacy message");
  }
  const indexOf = new Map(accountKeys.map((k, i) => [k, i]));

  const signers = accountKeys.filter((k) => flags.get(k)?.isSigner);
  const readonlySigned = signers.filter((k) => !flags.get(k)?.isWritable).length;
  const readonlyUnsigned = accountKeys.filter(
    (k) => !flags.get(k)?.isSigner && !flags.get(k)?.isWritable,
  ).length;
  const header = {
    requiredSignatures: signers.length,
    readonlySigned,
    readonlyUnsigned,
  };

  const parts: Uint8Array[] = [
    Uint8Array.from([
      header.requiredSignatures,
      header.readonlySigned,
      header.readonlyUnsigned,
    ]),
    shortVecEncode(accountKeys.length),
    ...accountKeys.map((k) => base58Decode(k)),
    blockhashBytes,
    shortVecEncode(instructions.length),
  ];
  for (const ix of instructions) {
    const programIndex = indexOf.get(ix.programId) ?? 0;
    parts.push(
      Uint8Array.from([programIndex]),
      shortVecEncode(ix.keys.length),
      Uint8Array.from(ix.keys.map((k) => indexOf.get(k.pubkey) ?? 0)),
      shortVecEncode(ix.data.length),
      ix.data,
    );
  }
  return { messageBytes: concatBytes(parts), accountKeys, header };
}

/** Wrap a compiled message + signatures into the signed-tx wire format. */
export function serializeSignedVaultTransaction(
  messageBytes: Uint8Array,
  signatures: Uint8Array[],
): Uint8Array {
  for (const s of signatures) {
    if (!(s instanceof Uint8Array) || s.length !== 64) {
      throw new Error("Vault: wallet returned an invalid signature");
    }
  }
  return concatBytes([shortVecEncode(signatures.length), ...signatures, messageBytes]);
}

function vaultBase64(bytes: Uint8Array): string {
  const g = globalThis as unknown as {
    Buffer?: { from(b: Uint8Array): { toString(e: string): string } };
  };
  if (g.Buffer) return g.Buffer.from(bytes).toString("base64");
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i] as number);
  }
  return btoa(s);
}

/* ------------------------------------------------------------------ */
/* Signing transport + RPC broadcast.                                  */
/* ------------------------------------------------------------------ */

/**
 * Wallet signing capability for vault transactions. Accepts the injected
 * extension providers (`window.phantom/solana`, see `solana.ts`) when they
 * expose raw `signTransaction(messageBytes)`; anything else is refused
 * closed at submit time — never silently treated as signed.
 */
export interface VaultSignerLike {
  publicKey?: { toString(): string } | null;
  signTransaction?: unknown;
}

export interface VaultSigner {
  address: string;
  signTransaction: (message: Uint8Array) => Promise<Uint8Array>;
}

/** Resolve a signing transport or return null (caller refuses closed). */
export function resolveVaultSigner(
  candidate?: VaultSignerLike | null,
): VaultSigner | null {
  const injected =
    candidate ?? (getSolanaProvider() as unknown as VaultSignerLike | null);
  if (!injected || typeof injected.signTransaction !== "function") {
    return null;
  }
  const sign = injected.signTransaction as (
    message: Uint8Array,
  ) => Promise<Uint8Array>;
  let address = "";
  try {
    address = injected.publicKey?.toString?.() ?? "";
  } catch {
    address = "";
  }
  return { address, signTransaction: sign };
}

async function rpcCall<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status} (${method})`);
  const json = (await res.json()) as {
    result?: T;
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

/** Latest blockhash, trying each RPC URL in order (throws the last error). */
export async function getVaultBlockhash(rpcUrls?: string[]): Promise<string> {
  const urls =
    rpcUrls && rpcUrls.length > 0 ? rpcUrls : [...SOLANA_TOKEN.rpcUrls];
  let lastError: unknown = new Error("No Solana RPC configured");
  for (const rpcUrl of urls) {
    try {
      const result = await rpcCall<{ value: { blockhash: string } }>(
        rpcUrl,
        "getLatestBlockhash",
        [{ commitment: "confirmed" }],
      );
      const blockhash = result?.value?.blockhash;
      if (typeof blockhash === "string" && blockhash.length > 0) {
        return blockhash;
      }
      lastError = new Error("RPC returned no blockhash");
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/**
 * Broadcast a signed transaction (base64) via RPC. Resolves with the
 * transaction signature (base58).
 */
export async function broadcastVaultTransaction(
  signedTx: Uint8Array,
  rpcUrls?: string[],
): Promise<string> {
  const urls =
    rpcUrls && rpcUrls.length > 0 ? rpcUrls : [...SOLANA_TOKEN.rpcUrls];
  const payload = vaultBase64(signedTx);
  let lastError: unknown = new Error("No Solana RPC configured");
  for (const rpcUrl of urls) {
    try {
      const sig = await rpcCall<string>(rpcUrl, "sendTransaction", [
        payload,
        { encoding: "base64", preflightCommitment: "confirmed" },
      ]);
      if (typeof sig === "string" && sig.length > 0) return sig;
      lastError = new Error("RPC returned no signature");
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export type VaultResult = { ok: boolean; error?: string; signature?: string };

/**
 * Fill instruction accounts with safe defaults (user = signer, mint = live
 * mint, well-known program ids). Anything else must come from `provided`;
 * missing names throw instead of being guessed.
 */
export function resolveVaultAccounts(
  name: string,
  signerAddress: string,
  provided: Record<string, string> = {},
): Record<string, string> {
  const def = getVaultInstructionDef(name);
  if (!def) throw new Error(`IDL is missing the ${name} instruction`);
  const merged: Record<string, string> = {
    user: signerAddress,
    authority: signerAddress,
    funder: signerAddress,
    mint: SOLANA_TOKEN.mint,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SYSTEM_PROGRAM_ID,
    ...provided,
  };
  const missing = def.accounts
    .map((a) => a.name)
    .filter((n) => {
      const v = merged[n];
      return typeof v !== "string" || v.trim().length === 0;
    });
  if (missing.length > 0) {
    throw new Error(
      `Vault ${name}: missing account${missing.length > 1 ? "s" : ""} ` +
        `${missing.map((m) => `"${m}"`).join(", ")} — pass them in accounts ` +
        `(PDA/ATA from your deploy; see docs/STAKING_VAULT.md)`,
    );
  }
  return merged;
}

function toBaseUnits(amount: number, decimals = SOLANA_TOKEN.decimals): bigint {
  if (!Number.isFinite(amount)) {
    throw new Error("Enter a positive amount");
  }
  const base = BigInt(Math.floor(amount * 10 ** decimals));
  if (base <= 0n) throw new Error("Enter a positive amount");
  if (base > 0xffffffffffffffffn) throw new Error("Amount is too large");
  return base;
}

export interface VaultSubmitOptions {
  programId: string;
  name: string;
  args?: Record<string, VaultArgValue>;
  accounts?: Record<string, string>;
  signer?: VaultSignerLike | null;
  rpcUrl?: string;
  rpcUrls?: string[];
  /** Skip the blockhash RPC (offline signing / tests). */
  blockhash?: string;
  /**
   * When true, compile + sign but do not broadcast; the result carries no
   * signature. Useful for dry-runs and tests.
   */
  signOnly?: boolean;
}

/**
 * Build, sign, and broadcast one vault instruction. Refuses closed
 * (`{ ok: false }`) when there is no signer, when accounts/args are
 * incomplete, or when the network fails — success always carries the
 * on-chain signature (or, for `signOnly`, an explicit unsigned build).
 */
export async function submitVaultInstruction(
  opts: VaultSubmitOptions,
): Promise<VaultResult> {
  const rpcUrls =
    opts.rpcUrl ? [opts.rpcUrl] : (opts.rpcUrls ?? [...SOLANA_TOKEN.rpcUrls]);
  try {
    if (!isPlausibleProgramId(opts.programId)) {
      return { ok: false, error: "On-chain vault is not live yet" };
    }
    const signer = resolveVaultSigner(opts.signer);
    if (!signer) {
      return {
        ok: false,
        error:
          "No wallet signing transport — connect a wallet that supports " +
          "transaction signing (read-only links cannot move vault funds)",
      };
    }
    if (!signer.address) {
      return {
        ok: false,
        error: "Wallet address is unknown — reconnect the wallet and retry",
      };
    }
    const accounts = resolveVaultAccounts(
      opts.name,
      signer.address,
      opts.accounts,
    );
    const data = encodeVaultInstructionData(opts.name, opts.args ?? {});
    const keys = buildVaultAccountMetas(opts.name, accounts);
    const blockhash = opts.blockhash ?? (await getVaultBlockhash(rpcUrls));
    const { messageBytes } = compileVaultTransaction(signer.address, blockhash, [
      { programId: opts.programId.trim(), keys, data },
    ]);
    let signature: Uint8Array;
    try {
      signature = await signer.signTransaction(messageBytes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Wallet signing failed";
      return { ok: false, error: msg };
    }
    const signed = serializeSignedVaultTransaction(messageBytes, [signature]);
    if (opts.signOnly) {
      return {
        ok: false,
        error: "Vault transaction signed but not broadcast (signOnly)",
      };
    }
    try {
      const txSig = await broadcastVaultTransaction(signed, rpcUrls);
      return { ok: true, signature: txSig };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Broadcast failed";
      return { ok: false, error: msg };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Vault request failed";
    return { ok: false, error: msg };
  }
}

export interface VaultRequestOptions {
  signer?: VaultSignerLike | null;
  rpcUrl?: string;
  accounts?: Record<string, string>;
  blockhash?: string;
  signOnly?: boolean;
}

/**
 * Vault action entry points. They enforce the liveness gate first, then run
 * the full build + sign + broadcast pipeline — refusing closed whenever no
 * signing transport is available.
 */
export async function requestVaultStake(
  amount: number,
  opts: VaultRequestOptions = {},
): Promise<VaultResult> {
  if (!isVaultLive()) {
    return { ok: false, error: "On-chain vault is not live yet" };
  }
  let base: bigint;
  try {
    base = toBaseUnits(amount);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Enter a positive amount",
    };
  }
  return submitVaultInstruction({
    programId: STAKE_PROGRAM_ID as string,
    name: "stake",
    args: { amount: base },
    ...opts,
  });
}

export async function requestVaultUnstake(
  amount: number,
  opts: VaultRequestOptions = {},
): Promise<VaultResult> {
  if (!isVaultLive()) {
    return { ok: false, error: "On-chain vault is not live yet" };
  }
  let base: bigint;
  try {
    base = toBaseUnits(amount);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Enter a positive amount",
    };
  }
  return submitVaultInstruction({
    programId: STAKE_PROGRAM_ID as string,
    name: "unstake",
    args: { amount: base },
    ...opts,
  });
}

export async function requestVaultClaim(
  opts: VaultRequestOptions = {},
): Promise<VaultResult> {
  if (!isVaultLive()) {
    return { ok: false, error: "On-chain vault is not live yet" };
  }
  return submitVaultInstruction({
    programId: STAKE_PROGRAM_ID as string,
    name: "claim",
    args: {},
    ...opts,
  });
}
