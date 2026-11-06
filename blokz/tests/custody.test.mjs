/**
 * Custody-boundary suite (node:test — no installs required).
 *
 * Covers the real modules, imported with explicit `.ts` extensions so Node's
 * type-stripping can load them directly:
 * - rewards math + stake/claim transitions + lock enforcement (rewards.ts)
 * - EMISSION alignment with MIN_STAKE_CLAIM (tokenomics.ts)
 * - signMessage challenge + custody gate + ledger sanitize (custody.ts)
 * - challenge signing transport (solana.ts, fake providers only)
 *
 * Run: `node --test tests/custody.test.mjs` from blokz/
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  accruePending,
  canUnstake,
  claimStatus,
  DAILY_REWARD_MS,
  DAILY_STAKE_RATE,
  estimateDailyYield,
  MIN_STAKE_CLAIM,
  MONTHLY_NON_STAKER_REWARD,
  MONTHLY_REWARD_MS,
  STAKE_LOCK_MS,
  stakeUnlockAt,
} from "../src/lib/game/rewards.ts";
import {
  EMISSION,
  projectWallet,
} from "../src/lib/game/tokenomics.ts";
import {
  buildLinkChallenge,
  CHALLENGE_TTL_MS,
  LEDGER_FIELD_CAP,
  parseLinkChallenge,
  requireVerifiedWallet,
  sanitizePersistedLedger,
  verifyLinkChallenge,
} from "../src/lib/game/custody.ts";
import { signChallengeWithProvider } from "../src/lib/game/solana.ts";

const DAY = DAILY_REWARD_MS;
const ADDR = "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9";

describe("rewards math", () => {
  it("lock is 12h (matches on-chain lock_secs=43200)", () => {
    assert.equal(STAKE_LOCK_MS, 43_200_000);
    assert.equal(stakeUnlockAt(1_000), 1_000 + STAKE_LOCK_MS);
    assert.equal(stakeUnlockAt(null), null);
  });

  it("accrues 2%/day continuously", () => {
    const t0 = 1_700_000_000_000;
    const r = accruePending(1000, 0, t0, t0 + DAY);
    assert.ok(Math.abs(r.pending - 20) < 1e-9);
    assert.equal(r.lastAccrualAt, t0 + DAY);
    // Half a day -> half the yield.
    const half = accruePending(1000, 0, t0, t0 + DAY / 2);
    assert.ok(Math.abs(half.pending - 10) < 1e-9);
  });

  it("accrue with zero stake keeps pending, stamps now", () => {
    const t0 = 1_700_000_000_000;
    const r = accruePending(0, 3.5, null, t0);
    assert.equal(r.pending, 3.5);
    assert.equal(r.lastAccrualAt, t0);
  });

  it("daily estimate floors personal stake yield", () => {
    assert.equal(estimateDailyYield(1000), 20);
    assert.equal(estimateDailyYield(0), 0);
    assert.equal(estimateDailyYield(-5), 0);
  });
});

describe("stake/claim transitions + lock enforcement", () => {
  const T0 = 1_700_000_000_000;

  it("blocks unstake before the lock, allows it exactly at unlock", () => {
    const before = canUnstake(500, T0, T0 + STAKE_LOCK_MS - 1);
    assert.equal(before.ok, false);
    assert.ok(before.waitMs > 0);
    assert.equal(before.unlockAt, T0 + STAKE_LOCK_MS);

    const at = canUnstake(500, T0, T0 + STAKE_LOCK_MS);
    assert.equal(at.ok, true);
    assert.equal(at.waitMs, 0);
  });

  it("rejects unstake with nothing staked", () => {
    assert.equal(canUnstake(0, T0, T0 + 10 * DAY).ok, false);
  });

  it("full arc: stake -> 12h -> claim ready with half-day yield", () => {
    // Staker claim is locked first (6h in)...
    const locked = claimStatus(500, T0, 0, T0, null, T0 - DAY, T0 + DAY / 4);
    assert.equal(locked.tier, "staker");
    assert.equal(locked.ready, false);

    // ...then claimable: 500 * 2% * 0.5 day = 5.
    const ready = claimStatus(500, T0, 0, T0, null, T0 - DAY, T0 + STAKE_LOCK_MS);
    assert.equal(ready.ready, true);
    assert.equal(ready.amount, 5);
  });

  it("top-up restarts the lock (new stakedAt re-locks)", () => {
    const toppedUpAt = T0 + DAY / 4; // 6h after T0
    const s = claimStatus(
      600,
      toppedUpAt,
      0,
      toppedUpAt,
      null,
      T0 - DAY,
      T0 + STAKE_LOCK_MS, // 12h after T0, but only 6h after top-up
    );
    assert.equal(s.ready, false);
    assert.ok((s.nextAt ?? 0) > T0 + STAKE_LOCK_MS);
  });

  it("staker with dust pending keeps accruing instead of claiming", () => {
    const s = claimStatus(
      1,
      T0,
      0,
      T0,
      null,
      T0 - DAY,
      T0 + STAKE_LOCK_MS + 60_000,
    );
    assert.equal(s.tier, "staker");
    assert.equal(s.ready, false); // 1 token earns < MIN_STAKE_CLAIM in 1 minute
  });

  it("non-staker monthly drip: gated by 30d, flat 75", () => {
    const early = claimStatus(0, null, 0, null, T0, T0, T0 + DAY);
    assert.equal(early.tier, "non-staker");
    assert.equal(early.ready, false);
    assert.equal(early.amount, MONTHLY_NON_STAKER_REWARD);

    const due = claimStatus(0, null, 0, null, T0, T0, T0 + MONTHLY_REWARD_MS);
    assert.equal(due.ready, true);
    assert.equal(due.amount, 75);
  });
});

describe("tokenomics alignment", () => {
  it("EMISSION.dailyStakeMin is single-sourced from MIN_STAKE_CLAIM", () => {
    assert.equal(EMISSION.dailyStakeMin, MIN_STAKE_CLAIM);
    assert.equal(EMISSION.dailyStakeMin, 1);
  });

  it("emission mirrors rewards constants", () => {
    assert.equal(EMISSION.dailyStakeRate, DAILY_STAKE_RATE);
    assert.equal(EMISSION.monthlyNonStaker, MONTHLY_NON_STAKER_REWARD);
    assert.equal(EMISSION.stakeLockHours, 12);
  });

  it("projection floor matches claim reality for tiny stakes", () => {
    const p = projectWallet(10, 0);
    assert.equal(p.dailyIfStaked, MIN_STAKE_CLAIM);
    const big = projectWallet(1000, 0);
    assert.equal(big.dailyIfStaked, 20);
  });
});

describe("signMessage challenge", () => {
  it("build/parse round-trips", () => {
    const msg = buildLinkChallenge(ADDR, "abc123", 1_700_000_000_000);
    const parsed = parseLinkChallenge(msg);
    assert.deepEqual(parsed, {
      domain: "blokz-wallet-link",
      version: 1,
      address: ADDR,
      nonce: "abc123",
      issuedAt: 1_700_000_000_000,
    });
  });

  it("rejects malformed messages", () => {
    assert.equal(parseLinkChallenge("hello"), null);
    assert.equal(parseLinkChallenge("a\nb\nc"), null);
    assert.equal(
      parseLinkChallenge(
        "other-domain v1\naddress: x\nnonce: y\nissuedAt: 5",
      ),
      null,
    );
  });

  it("accepts a fresh challenge for the right address", () => {
    const now = 1_700_000_000_000;
    const msg = buildLinkChallenge(ADDR, "n", now);
    assert.deepEqual(verifyLinkChallenge(msg, ADDR, now), { ok: true });
  });

  it("rejects wrong address, expired, future, and stale versions", () => {
    const now = 1_700_000_000_000;
    const msg = buildLinkChallenge(ADDR, "n", now);
    assert.equal(verifyLinkChallenge(msg, "other", now).ok, false);

    const old = buildLinkChallenge(ADDR, "n", now - CHALLENGE_TTL_MS - 1);
    const expired = verifyLinkChallenge(old, ADDR, now);
    assert.equal(expired.ok, false);
    assert.match(expired.error ?? "", /expired/);

    const future = buildLinkChallenge(ADDR, "n", now + 3_600_000);
    assert.equal(verifyLinkChallenge(future, ADDR, now).ok, false);

    const stale = [
      "blokz-wallet-link v999",
      `address: ${ADDR}`,
      "nonce: n",
      `issuedAt: ${now}`,
    ].join("\n");
    assert.equal(verifyLinkChallenge(stale, ADDR, now).ok, false);
  });
});

describe("custody gate", () => {
  it("blocks anonymous, blocks unverified, allows verified", () => {
    const anon = requireVerifiedWallet({
      walletAddress: null,
      walletVerified: false,
    });
    assert.equal(anon.ok, false);
    assert.match(anon.error ?? "", /Connect a wallet/);

    const readonly = requireVerifiedWallet({
      walletAddress: ADDR,
      walletVerified: false,
    });
    assert.equal(readonly.ok, false);
    assert.match(readonly.error ?? "", /Verify wallet ownership/);

    assert.deepEqual(
      requireVerifiedWallet({ walletAddress: ADDR, walletVerified: true }),
      { ok: true },
    );
  });
});

describe("persisted ledger sanitize", () => {
  const NOW = 1_700_000_000_000;

  it("clamps negatives, non-finite, and oversized balances", () => {
    const c = sanitizePersistedLedger(
      {
        balance: -50,
        staked: 10,
        stakedAt: NOW - 1000,
        lastAccrualAt: NOW - 1000,
        pendingStakeRewards: Number.POSITIVE_INFINITY,
        totalRewardsClaimed: 4e12,
      },
      NOW,
    );
    assert.equal(c.balance, 0);
    assert.equal(c.pendingStakeRewards, 0);
    assert.equal(c.totalRewardsClaimed, LEDGER_FIELD_CAP);
  });

  it("drops bad addresses together with method + verification", () => {
    const c = sanitizePersistedLedger(
      {
        walletAddress: "not-an-address!!!",
        walletMethod: "extension",
        walletVerified: true,
        walletVerifiedAt: NOW - 10,
      },
      NOW,
    );
    assert.equal(c.walletAddress, null);
    assert.equal(c.walletMethod, null);
    assert.equal(c.walletVerified, false);
    assert.equal(c.walletVerifiedAt, null);
  });

  it("nulls future or missing stake timestamps, zeroes idle pending", () => {
    const future = sanitizePersistedLedger(
      {
        staked: 100,
        stakedAt: NOW + 3_600_000,
        lastAccrualAt: NOW + 3_600_000,
        pendingStakeRewards: 9,
      },
      NOW,
    );
    assert.equal(future.stakedAt, null);
    assert.equal(future.lastAccrualAt, null);

    const idle = sanitizePersistedLedger(
      { staked: 0, stakedAt: NOW - 10, pendingStakeRewards: 9 },
      NOW,
    );
    assert.equal(idle.stakedAt, null);
    assert.equal(idle.pendingStakeRewards, 0);
  });

  it("preserves a sane ledger and falls back safely on garbage", () => {
    const good = sanitizePersistedLedger(
      {
        playerName: "ForgeFan",
        balance: 42.5,
        staked: 100,
        stakedAt: NOW - 1000,
        lastAccrualAt: NOW - 1000,
        pendingStakeRewards: 1.5,
        totalRewardsClaimed: 7,
        walletStartedAt: NOW - DAY,
        walletAddress: ADDR,
        walletMethod: "manual",
        difficulty: "hard",
        moves: 12,
        hintsUsed: 1,
      },
      NOW,
    );
    assert.equal(good.balance, 42.5);
    assert.equal(good.staked, 100);
    assert.equal(good.walletAddress, ADDR);
    assert.equal(good.difficulty, "hard");

    const junk = sanitizePersistedLedger(
      { balance: "rich", difficulty: "insane", moves: -3 },
      NOW,
    );
    assert.equal(junk.balance, 0);
    assert.equal(junk.difficulty, "medium");
    assert.equal(junk.moves, 0);
    assert.ok(Math.abs(junk.walletStartedAt - NOW) < 1000);
  });
});

describe("challenge signing transport", () => {
  it("resolves with a valid 64-byte signature", async () => {
    const provider = {
      connect: async () => ({ publicKey: { toString: () => ADDR } }),
      signMessage: async () => ({ signature: new Uint8Array(64).fill(7) }),
    };
    const sig = await signChallengeWithProvider(provider, "challenge");
    assert.equal(sig.length, 64);
  });

  it("throws when the wallet cannot sign", async () => {
    const provider = {
      connect: async () => ({ publicKey: { toString: () => ADDR } }),
    };
    await assert.rejects(
      signChallengeWithProvider(provider, "challenge"),
      /cannot sign/,
    );
  });

  it("throws on a malformed signature", async () => {
    const provider = {
      connect: async () => ({ publicKey: { toString: () => ADDR } }),
      signMessage: async () => ({ signature: new Uint8Array(10) }),
    };
    await assert.rejects(
      signChallengeWithProvider(provider, "challenge"),
      /invalid signature/,
    );
  });
});
