/** Minimum stake lock before unstake / first staker claim. */
export const STAKE_LOCK_MS = 12 * 60 * 60 * 1000; // 12h
export const DAILY_REWARD_MS = 24 * 60 * 60 * 1000;
export const MONTHLY_REWARD_MS = 30 * 24 * 60 * 60 * 1000;

/** Monthly drip for wallets holding the mint but with zero stake. */
export const MONTHLY_NON_STAKER_REWARD = 75;
/** Daily yield rate while staked (continuous accrual). */
export const DAILY_STAKE_RATE = 0.02;
export const MIN_STAKE_CLAIM = 1;

export type RewardTier = "staker" | "non-staker";

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function stakeUnlockAt(stakedAt: number | null): number | null {
  if (stakedAt == null) return null;
  return stakedAt + STAKE_LOCK_MS;
}

export function canUnstake(
  staked: number,
  stakedAt: number | null,
  now = Date.now(),
): { ok: boolean; unlockAt: number | null; waitMs: number } {
  if (staked <= 0) return { ok: false, unlockAt: null, waitMs: 0 };
  const unlockAt = stakeUnlockAt(stakedAt);
  if (unlockAt == null) return { ok: true, unlockAt: null, waitMs: 0 };
  const waitMs = unlockAt - now;
  if (waitMs > 0) return { ok: false, unlockAt, waitMs };
  return { ok: true, unlockAt, waitMs: 0 };
}

export function accruePending(
  staked: number,
  pending: number,
  lastAccrualAt: number | null,
  now = Date.now(),
): { pending: number; lastAccrualAt: number } {
  if (staked <= 0 || lastAccrualAt == null) {
    return { pending: Math.max(0, pending), lastAccrualAt: now };
  }
  const elapsed = Math.max(0, now - lastAccrualAt);
  const earned = staked * DAILY_STAKE_RATE * (elapsed / DAILY_REWARD_MS);
  return {
    pending: Math.max(0, pending) + earned,
    lastAccrualAt: now,
  };
}

export function previewPending(
  staked: number,
  pending: number,
  lastAccrualAt: number | null,
  now = Date.now(),
): number {
  return accruePending(staked, pending, lastAccrualAt, now).pending;
}

export function claimStatus(
  staked: number,
  stakedAt: number | null,
  pending: number,
  lastAccrualAt: number | null,
  lastMonthlyClaimAt: number | null,
  walletStartedAt: number,
  now = Date.now(),
): {
  tier: RewardTier;
  ready: boolean;
  amount: number;
  nextAt: number | null;
  reason?: string;
  pendingPreview: number;
} {
  if (staked > 0) {
    const { pending: pendingNow } = accruePending(
      staked,
      pending,
      lastAccrualAt,
      now,
    );
    const unlockAt = stakeUnlockAt(stakedAt);
    const lockWait = unlockAt != null ? unlockAt - now : 0;

    if (lockWait > 0) {
      return {
        tier: "staker",
        ready: false,
        amount: 0,
        nextAt: unlockAt,
        reason: "12h stake lock before first claim / unstake",
        pendingPreview: pendingNow,
      };
    }

    const amount = Math.floor(pendingNow);
    if (amount < MIN_STAKE_CLAIM) {
      const perMs = (staked * DAILY_STAKE_RATE) / DAILY_REWARD_MS;
      const need = MIN_STAKE_CLAIM - pendingNow;
      const waitMs = perMs > 0 ? Math.ceil(need / perMs) : DAILY_REWARD_MS;
      return {
        tier: "staker",
        ready: false,
        amount: 0,
        nextAt: now + waitMs,
        reason: "Yield accruing on staked $bLOkz…",
        pendingPreview: pendingNow,
      };
    }

    return {
      tier: "staker",
      ready: true,
      amount,
      nextAt: null,
      pendingPreview: pendingNow,
    };
  }

  const anchor = lastMonthlyClaimAt ?? walletStartedAt;
  const nextAt = anchor + MONTHLY_REWARD_MS;
  if (now < nextAt) {
    return {
      tier: "non-staker",
      ready: false,
      amount: MONTHLY_NON_STAKER_REWARD,
      nextAt,
      reason: "Monthly drip for holders with 0 staked",
      pendingPreview: 0,
    };
  }
  return {
    tier: "non-staker",
    ready: true,
    amount: MONTHLY_NON_STAKER_REWARD,
    nextAt: null,
    pendingPreview: 0,
  };
}

/** Estimated full-day yield for UI (not claim amount). */
export function estimateDailyYield(staked: number): number {
  if (staked <= 0) return 0;
  return Math.floor(staked * DAILY_STAKE_RATE);
}
