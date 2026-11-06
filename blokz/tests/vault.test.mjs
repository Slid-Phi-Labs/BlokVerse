/**
 * Vault client suite (node:test — no installs required).
 *
 * Covers the dependency-free vault transaction construction in
 * `src/lib/game/vault.ts`, imported with an explicit `.ts` extension so
 * Node's type-stripping can load it directly:
 * - Anchor discriminators match sha256("global:<name>")[0..8] (node:crypto)
 * - base58 codec round-trips + known-answer (system program = 32 zeros)
 * - borsh arg encoding (u64 LE) + IDL account ordering
 * - message compilation structure + signed-envelope layout
 * - refusal-first submit: no signer / bad signature / missing accounts /
 *   bad amounts all return `{ ok: false }` with an error — never silent ok
 *
 * Run: `node --test tests/vault.test.mjs` from blokz/
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  base58Decode,
  base58Encode,
  buildVaultAccountMetas,
  compileVaultTransaction,
  encodeVaultInstructionData,
  requestVaultClaim,
  requestVaultStake,
  serializeSignedVaultTransaction,
  submitVaultInstruction,
  vaultDiscriminator,
  vaultInstructionNames,
} from "../src/lib/game/vault.ts";

const MINT = "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const SYSTEM = "11111111111111111111111111111111";
// Stand-in 32-byte program id for offline submit tests (wire-format only;
// nothing is broadcast without `blockhash` + a real signer + RPC).
const PROGRAM = TOKEN_2022;
const BLOCKHASH = SYSTEM; // 32 zero bytes, valid base58

function sha256Oracle(name) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

describe("vault discriminators", () => {
  it("matches sha256(global:<name>)[0..8] for every IDL instruction", () => {
    const names = vaultInstructionNames();
    assert.ok(names.includes("stake"));
    assert.ok(names.includes("unstake"));
    assert.ok(names.includes("claim"));
    for (const n of names) {
      assert.deepEqual(
        Buffer.from(vaultDiscriminator(n)),
        Buffer.from(sha256Oracle(n)),
        `discriminator for ${n}`,
      );
    }
  });
});

describe("vault base58 codec", () => {
  it("decodes the system program to 32 zero bytes", () => {
    assert.deepEqual(Buffer.from(base58Decode(SYSTEM)), Buffer.alloc(32));
  });

  it("round-trips the live mint and random keys", () => {
    assert.equal(base58Encode(base58Decode(MINT)), MINT);
    const raw = createHash("sha256").update("blokz").digest();
    assert.deepEqual(Buffer.from(base58Decode(base58Encode(raw))), raw);
  });

  it("rejects bad addresses", () => {
    assert.throws(() => base58Decode(""), /Empty/);
    assert.throws(() => base58Decode("0OIl!!!"), /Invalid base58/);
  });
});

describe("vault instruction encoding", () => {
  it("encodes stake amount as u64 LE after the discriminator", () => {
    const data = encodeVaultInstructionData("stake", { amount: 1000000000n });
    assert.equal(data.length, 16);
    assert.deepEqual(
      Buffer.from(data.subarray(0, 8)),
      Buffer.from(sha256Oracle("stake")),
    );
    // 1_000_000_000 LE = 00 CA 9A 3B 00 00 00 00
    assert.deepEqual(
      Buffer.from(data.subarray(8)),
      Buffer.from([0x00, 0xca, 0x9a, 0x3b, 0x00, 0x00, 0x00, 0x00]),
    );
  });

  it("encodes claim as discriminator only (no args)", () => {
    const data = encodeVaultInstructionData("claim", {});
    assert.equal(data.length, 8);
  });

  it("throws naming unknown instructions and missing args", () => {
    assert.throws(() => encodeVaultInstructionData("nope", {}), /missing the nope/);
    assert.throws(
      () => encodeVaultInstructionData("stake", {}),
      /missing arg "amount"/,
    );
  });
});

describe("vault account metas", () => {
  it("orders stake accounts per the IDL", () => {
    const keys = buildVaultAccountMetas("stake", {
      user: MINT,
      mint: MINT,
      vault: MINT,
      userAta: MINT,
      stakeAcc: MINT,
      config: MINT,
      tokenProgram: TOKEN_2022,
      systemProgram: SYSTEM,
    });
    assert.deepEqual(
      keys.map((k) => k.pubkey),
      [MINT, MINT, MINT, MINT, MINT, MINT, TOKEN_2022, SYSTEM],
    );
    assert.equal(keys[0].isSigner, true);
    assert.equal(keys[1].isSigner, false);
  });

  it("throws naming the first missing account", () => {
    assert.throws(
      () => buildVaultAccountMetas("stake", { user: MINT }),
      /missing account "mint"/,
    );
  });
});

describe("vault message compilation", () => {
  const claimData = encodeVaultInstructionData("claim", {});
  const keys = buildVaultAccountMetas("claim", {
    user: MINT,
    mint: MINT,
    rewardVault: MINT,
    userAta: MINT,
    stakeAcc: MINT,
    config: MINT,
    tokenProgram: TOKEN_2022,
  });

  it("puts the payer first, the program last, and embeds the blockhash", () => {
    const { messageBytes, accountKeys, header } = compileVaultTransaction(
      MINT,
      BLOCKHASH,
      [{ programId: PROGRAM, keys, data: claimData }],
    );
    assert.ok(header.requiredSignatures >= 1);
    assert.equal(accountKeys[0], MINT);
    assert.equal(accountKeys[accountKeys.length - 1], PROGRAM);
    assert.ok(
      Buffer.from(messageBytes).includes(Buffer.from(base58Decode(BLOCKHASH))),
    );
    assert.ok(Buffer.from(messageBytes).includes(Buffer.from(claimData)));
  });

  it("serializes the signed envelope as shortvec(1) + sig + message", () => {
    const { messageBytes } = compileVaultTransaction(MINT, BLOCKHASH, [
      { programId: PROGRAM, keys, data: claimData },
    ]);
    const sig = new Uint8Array(64).fill(9);
    const signed = serializeSignedVaultTransaction(messageBytes, [sig]);
    assert.equal(signed[0], 1);
    assert.equal(signed[1], 9);
    assert.deepEqual(
      Buffer.from(signed.subarray(65)),
      Buffer.from(messageBytes),
    );
  });

  it("rejects malformed signatures", () => {
    const { messageBytes } = compileVaultTransaction(MINT, BLOCKHASH, [
      { programId: PROGRAM, keys, data: claimData },
    ]);
    assert.throws(
      () => serializeSignedVaultTransaction(messageBytes, [new Uint8Array(10)]),
      /invalid signature/,
    );
  });
});

describe("vault submit refuses closed", () => {
  const accounts = {
    user: MINT,
    mint: MINT,
    rewardVault: MINT,
    userAta: MINT,
    stakeAcc: MINT,
    config: MINT,
    tokenProgram: TOKEN_2022,
  };

  it("refuses when no signing transport is available", async () => {
    const res = await submitVaultInstruction({
      programId: PROGRAM,
      name: "claim",
      accounts,
      signer: null,
      blockhash: BLOCKHASH,
      signOnly: true,
    });
    assert.equal(res.ok, false);
    assert.match(res.error ?? "", /signing transport/);
  });

  it("refuses a provider without signTransaction", async () => {
    const res = await submitVaultInstruction({
      programId: PROGRAM,
      name: "claim",
      accounts,
      signer: { publicKey: { toString: () => MINT } },
      blockhash: BLOCKHASH,
      signOnly: true,
    });
    assert.equal(res.ok, false);
    assert.match(res.error ?? "", /signing transport/);
  });

  it("refuses a malformed wallet signature", async () => {
    const res = await submitVaultInstruction({
      programId: PROGRAM,
      name: "claim",
      accounts,
      signer: {
        publicKey: { toString: () => MINT },
        signTransaction: async () => new Uint8Array(10),
      },
      blockhash: BLOCKHASH,
      signOnly: true,
    });
    assert.equal(res.ok, false);
    assert.match(res.error ?? "", /invalid signature/);
  });

  it("signs (but does not broadcast) with a stub signer + offline blockhash", async () => {
    let seen = null;
    const res = await submitVaultInstruction({
      programId: PROGRAM,
      name: "claim",
      accounts,
      signer: {
        publicKey: { toString: () => MINT },
        signTransaction: async (message) => {
          seen = message;
          return new Uint8Array(64).fill(3);
        },
      },
      blockhash: BLOCKHASH,
      signOnly: true,
    });
    assert.equal(res.ok, false);
    assert.match(res.error ?? "", /not broadcast \(signOnly\)/);
    assert.ok(seen instanceof Uint8Array && seen.length > 0);
  });

  it("names missing accounts instead of guessing them", async () => {
    const res = await submitVaultInstruction({
      programId: PROGRAM,
      name: "claim",
      accounts: { user: MINT },
      signer: {
        publicKey: { toString: () => MINT },
        signTransaction: async () => new Uint8Array(64),
      },
      blockhash: BLOCKHASH,
      signOnly: true,
    });
    assert.equal(res.ok, false);
    assert.match(res.error ?? "", /missing accounts.*"rewardVault"/);
  });

  it("requestVaultStake/requestVaultClaim never resolve ok without a live vault + signer", async () => {
    const stake = await requestVaultStake(100, { signer: null });
    assert.equal(stake.ok, false);
    assert.ok((stake.error ?? "").length > 0);
    const claim = await requestVaultClaim({ signer: null });
    assert.equal(claim.ok, false);
    assert.ok((claim.error ?? "").length > 0);
  });
});
