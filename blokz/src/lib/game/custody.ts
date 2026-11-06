/**
 * Custody boundary helpers for the simulated stake ledger.
 *
 * Until the on-chain vault (`vault.ts`) is live, stake/claim/unstake mutate a
 * persisted in-app ledger. These pure helpers enforce three things:
 *
 * 1. **Ownership proof** — state-changing actions require a `signMessage`
 *    challenge bound to the linked address (`buildLinkChallenge`).
 * 2. **Action gating** — `requireVerifiedWallet` is the single gate used by
 *    `stake` / `unstake` / `claimRewards` in `store.ts`.
 * 3. **Persisted-ledger hygiene** — `sanitizePersistedLedger` validates and
 *    clamps everything `merge` rehydrates so a corrupt/tampered store entry
 *    can never mint balances, resurrect stakes, or smuggle bad addresses.
 *
 * Dependency-free on purpose: the node:test suite imports this file directly
 * (Node type-stripping, no installs).
 */

export const CHALLENGE_DOMAIN = "blokz-wallet-link";
export const CHALLENGE_VERSION = 1;
/** Challenge freshness window — signatures older than this are rejected. */
export const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10min
/** Rehydration clock skew tolerance for persisted timestamps. */
export const REHYDRATE_SKEW_MS = 60 * 1000; // 60s
/** Hard ceiling for any rehydrated token-ish ledger field. */
export const LEDGER_FIELD_CAP = 1_000_000_000; // 1B = total in-app supply

export interface LinkChallenge {
  domain: string;
  version: number;
  address: string;
  nonce: string;
  issuedAt: number;
}

/** Build the exact message the wallet must sign to prove key custody. */
export function buildLinkChallenge(
  address: string,
  nonce: string,
  issuedAt = Date.now(),
): string {
  const a = address.trim();
  const n = nonce.trim();
  return [
    `${CHALLENGE_DOMAIN} v${CHALLENGE_VERSION}`,
    `address: ${a}`,
    `nonce: ${n}`,
    `issuedAt: ${Math.floor(issuedAt)}`,
  ].join("\n");
}

/** Parse a challenge message back into fields; null when malformed. */
export function parseLinkChallenge(message: string): LinkChallenge | null {
  const lines = message.split("\n");
  if (lines.length !== 4) return null;
  const [domainLine, addressLine, nonceLine, issuedLine] = lines as [
    string,
    string,
    string,
    string,
  ];
  const domainMatch = /^(\S+) v(\d+)$/.exec(domainLine.trim());
  if (!domainMatch) return null;
  const domain = domainMatch[1];
  const versionRaw = domainMatch[2];
  if (typeof domain !== "string" || typeof versionRaw !== "string") return null;
  if (domain !== CHALLENGE_DOMAIN) return null;
  const version = Number(versionRaw);
  const address = addressLine.replace(/^address:\s*/, "").trim();
  const nonce = nonceLine.replace(/^nonce:\s*/, "").trim();
  const issuedAt = Number(issuedLine.replace(/^issuedAt:\s*/, "").trim());
  if (!address || !nonce || !Number.isFinite(issuedAt) || issuedAt <= 0) {
    return null;
  }
  return { domain, version, address, nonce, issuedAt: Math.floor(issuedAt) };
}

/**
 * Validate a signed challenge: well-formed, bound to `expectedAddress`,
 * version match, and fresh (within TTL, not from the future past skew).
 */
export function verifyLinkChallenge(
  message: string,
  expectedAddress: string,
  now = Date.now(),
): { ok: boolean; error?: string } {
  const parsed = parseLinkChallenge(message);
  if (!parsed) return { ok: false, error: "Malformed custody challenge" };
  if (parsed.version !== CHALLENGE_VERSION) {
    return { ok: false, error: "Stale custody challenge version" };
  }
  if (parsed.address !== expectedAddress.trim()) {
    return { ok: false, error: "Signature is not for this address" };
  }
  if (parsed.issuedAt > now + REHYDRATE_SKEW_MS) {
    return { ok: false, error: "Custody challenge from the future" };
  }
  if (now - parsed.issuedAt > CHALLENGE_TTL_MS) {
    return { ok: false, error: "Custody challenge expired — sign again" };
  }
  return { ok: true };
}

export interface CustodyState {
  walletAddress: string | null;
  walletVerified: boolean;
}

/**
 * Single gate for state-changing ledger actions. Read-only (pasted, never
 * signed) links can view balances but cannot stake / unstake / claim.
 */
export function requireVerifiedWallet(
  s: CustodyState,
): { ok: boolean; error?: string } {
  if (!s.walletAddress) {
    return { ok: false, error: "Connect a wallet that holds $bLOkz" };
  }
  if (!s.walletVerified) {
    return {
      ok: false,
      error: "Verify wallet ownership (sign the challenge) first",
    };
  }
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Persisted-ledger validation + clamping (used by store `merge`).     */
/* ------------------------------------------------------------------ */

function clampLedgerNumber(v: unknown, fallback = 0): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  if (v <= 0) return 0;
  return Math.min(LEDGER_FIELD_CAP, v);
}

function clampInt(v: unknown, fallback = 0): number {
  return Math.floor(clampLedgerNumber(v, fallback));
}

/** Persisted timestamps must be finite, positive, and not from the future. */
function sanitizeTime(v: unknown, now: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const t = Math.floor(v);
  if (t <= 0 || t > now + REHYDRATE_SKEW_MS) return null;
  return t;
}

function isPlausibleAddress(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const a = v.trim();
  if (a.length < 32 || a.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(a);
}

export interface SanitizedLedger {
  playerName: string;
  balance: number;
  staked: number;
  stakedAt: number | null;
  pendingStakeRewards: number;
  lastAccrualAt: number | null;
  lastMonthlyClaimAt: number | null;
  totalRewardsClaimed: number;
  walletStartedAt: number;
  walletAddress: string | null;
  walletMethod: "extension" | "manual" | null;
  walletVerified: boolean;
  walletVerifiedAt: number | null;
  difficulty: "easy" | "medium" | "hard";
  moves: number;
  hintsUsed: number;
}

/**
 * Validate + clamp a raw rehydrated ledger. Never throws; unknown shapes fall
 * back to safe defaults. Verification never survives rehydrate unverified —
 * callers must re-verify after reload when the address is present.
 */
export function sanitizePersistedLedger(
  raw: unknown,
  now = Date.now(),
): SanitizedLedger {
  const p = (raw ?? {}) as Record<string, unknown>;

  const staked = clampLedgerNumber(p["staked"]);
  const walletAddress = isPlausibleAddress(p["walletAddress"])
    ? (p["walletAddress"] as string).trim()
    : null;
  const walletMethod =
    p["walletMethod"] === "extension" || p["walletMethod"] === "manual"
      ? p["walletMethod"]
      : null;

  const stakedAt = staked > 0 ? sanitizeTime(p["stakedAt"], now) : null;
  const lastAccrualAt =
    staked > 0 ? sanitizeTime(p["lastAccrualAt"], now) : null;

  const difficulty =
    p["difficulty"] === "easy" ||
    p["difficulty"] === "medium" ||
    p["difficulty"] === "hard"
      ? p["difficulty"]
      : "medium";

  const walletStartedAt = sanitizeTime(p["walletStartedAt"], now) ?? now;

  return {
    playerName:
      typeof p["playerName"] === "string" && p["playerName"].trim()
        ? (p["playerName"] as string).slice(0, 18)
        : "You",
    balance: clampLedgerNumber(p["balance"]),
    staked,
    stakedAt,
    pendingStakeRewards: staked > 0 ? clampLedgerNumber(p["pendingStakeRewards"]) : 0,
    lastAccrualAt,
    lastMonthlyClaimAt: sanitizeTime(p["lastMonthlyClaimAt"], now),
    totalRewardsClaimed: clampLedgerNumber(p["totalRewardsClaimed"]),
    walletStartedAt,
    walletAddress,
    // An address that failed validation drops its method + verification.
    walletMethod: walletAddress ? walletMethod : null,
    walletVerified: walletAddress
      ? (p["walletVerified"] as boolean) === true
      : false,
    walletVerifiedAt: walletAddress
      ? sanitizeTime(p["walletVerifiedAt"], now)
      : null,
    difficulty,
    moves: clampInt(p["moves"]),
    hintsUsed: clampInt(p["hintsUsed"]),
  };
}
