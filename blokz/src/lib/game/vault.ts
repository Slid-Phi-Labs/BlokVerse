/**
 * On-chain staking-vault client (Anchor program `blokz_stake`).
 *
 * SSR-safe and dependency-free: no @solana/web3.js (same rule as
 * `solana.ts`). This module owns the IDL wiring + the liveness gate:
 *
 * - `STAKE_PROGRAM_ID` comes from `VITE_STAKE_PROGRAM_ID` (set after
 *   `anchor deploy`, see `docs/STAKING_VAULT.md`).
 * - `isVaultLive()` is the single gate `StakePanel` uses to switch between
 *   the simulated ledger and vault transactions.
 * - Instruction / account shapes are read from the checked-in IDL
 *   (`idl/blokz_stake.json`, kept in sync with
 *   `programs/blokz-stake/src/lib.rs`).
 *
 * Full transaction building + wallet signing is the remaining step once a
 * signing transport is chosen; the `requestVault*` entry points below already
 * enforce the gate and surface that honestly.
 */

import idl from "./idl/blokz_stake.json";

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

export type VaultResult = { ok: boolean; error?: string };

/**
 * Vault action entry points. They enforce the liveness gate first; transaction
 * construction + wallet signing lands on top of this IDL wiring.
 */
export async function requestVaultStake(
  amount: number,
): Promise<VaultResult> {
  if (!isVaultLive()) {
    return { ok: false, error: "On-chain vault is not live yet" };
  }
  if (!Number.isFinite(amount) || Math.floor(amount) <= 0) {
    return { ok: false, error: "Enter a positive amount" };
  }
  const def = getVaultInstructionDef("stake");
  if (!def) return { ok: false, error: "IDL is missing the stake instruction" };
  return {
    ok: false,
    error: `Vault tx signing is not wired yet (program ${STAKE_PROGRAM_ID}) — see vault.ts`,
  };
}

export async function requestVaultUnstake(
  amount: number,
): Promise<VaultResult> {
  if (!isVaultLive()) {
    return { ok: false, error: "On-chain vault is not live yet" };
  }
  if (!Number.isFinite(amount) || Math.floor(amount) <= 0) {
    return { ok: false, error: "Enter a positive amount" };
  }
  const def = getVaultInstructionDef("unstake");
  if (!def) {
    return { ok: false, error: "IDL is missing the unstake instruction" };
  }
  return {
    ok: false,
    error: `Vault tx signing is not wired yet (program ${STAKE_PROGRAM_ID}) — see vault.ts`,
  };
}

export async function requestVaultClaim(): Promise<VaultResult> {
  if (!isVaultLive()) {
    return { ok: false, error: "On-chain vault is not live yet" };
  }
  const def = getVaultInstructionDef("claim");
  if (!def) return { ok: false, error: "IDL is missing the claim instruction" };
  return {
    ok: false,
    error: `Vault tx signing is not wired yet (program ${STAKE_PROGRAM_ID}) — see vault.ts`,
  };
}
