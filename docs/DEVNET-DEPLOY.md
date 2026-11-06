# Devnet Deploy Runbook — `blokz_stake` (Anchor)

Deploys the bLOkz staking vault (`blokz/programs/blokz-stake`) to Solana
devnet. Paths below are relative to the repo root; run Anchor commands from
`blokz/`. Canonical toolchain: **Anchor 0.31.1** (`blokz/Anchor.toml`
`[toolchain]`), Rust stable, Solana CLI (Agave), Node 22.

Background: [STAKING_VAULT.md](../blokz/docs/STAKING_VAULT.md). Web client
wiring: `blokz/src/lib/game/vault.ts` (reads
`blokz/src/lib/game/idl/blokz_stake.json`, gated by `isVaultLive()`).

## 0. Prerequisites

```bash
avm install 0.31.1 && avm use 0.31.1
anchor --version   # 0.31.1
solana --version
solana config set --url devnet
```

Fund the deployer wallet (this is the `[provider] wallet` in `Anchor.toml`):

```bash
solana-keygen new -o ~/.config/solana/id.json
solana airdrop 2
solana balance   # > 0 before continuing
```

## 1. Keypair generation

One keypair per program. The program id **is** this keypair's address.

```bash
cd blokz
mkdir -p target/deploy
solana-keygen new --no-bip39-passphrase -o target/deploy/blokz_stake-keypair.json
PROGRAM_ID="$(solana address -k target/deploy/blokz_stake-keypair.json)"
echo "$PROGRAM_ID"
```

Back this file up (password manager / offline copy). **Never commit it.**
`target/` is build output, not source.

## 2. Anchor keys sync (`declare_id!` + `Anchor.toml` + IDL)

All three of these must agree (pre-deploy they all carry the placeholder
`Gb5ZSSPaHM1C2DNYAsoMvD1HJru8WCY2VF47MamvkDYy`):

| Location | Field |
|---|---|
| `programs/blokz-stake/src/lib.rs` | `declare_id!(...)` |
| `Anchor.toml` | `[programs.devnet] blokz_stake` |
| `src/lib/game/idl/blokz_stake.json` | `metadata.address` |

Sync the first two, then rebuild the third:

```bash
anchor keys sync
grep -r "$PROGRAM_ID" programs/blokz-stake/src/lib.rs Anchor.toml
anchor build
anchor idl build
cp target/idl/blokz_stake.json src/lib/game/idl/blokz_stake.json
```

`anchor idl build` stamps `metadata.address` from the synced id, so the copy
keeps `vault.ts`'s `vaultIdlAddress()` honest. If `git diff` on the IDL shows
anything besides `metadata.address`, stop: that is real interface drift, and
`vault.ts` (discriminators, account order, arg types) must be reconciled
before deploy. CI enforces this (`idl-drift` job).

## 3. Anchor build

Same sequence CI runs (`.github/workflows/ci.yml` → `anchor` job):

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"
anchor build
cargo build-sbf --manifest-path programs/blokz-stake/Cargo.toml
test -f target/deploy/blokz_stake.so
```

## 4. SBF-safe lockfile policy (why the pins exist)

`programs/blokz-stake/Cargo.lock` is **checked in on purpose — never delete
or loosely regenerate it.**

Why: the SBF platform toolchain ships an older cargo that cannot parse
`edition = "2024"` manifests. A routine `cargo update` once pulled
`cpufeatures 0.3.x` (edition 2024) into the SBF dependency graph and broke
`cargo build-sbf`. The fix, applied incrementally (`git log`:
`Pin cpufeatures 0.2` → `Pin blake3 1.5.5 via lockfile` → three
`SBF-safe lockfile` sweeps), is a curated lockfile:

- `blake3 1.5.5`, `cpufeatures 0.2.17` (the 0.3 line is edition 2024)
- pre-edition-2024 `borsh 0.10.4`, `proc-macro-crate 0.1.5`,
  `hashbrown 0.13.2`, `indexmap 2.9.0`, `zeroize 1.8.1`
- `zeroize_derive 1.4.3`, plus wasm-family and
  `unicode-segmentation 1.10.1` MSRV fits

Rules:

1. Keep `Cargo.lock` committed; reproducible builds beat fresh resolves.
2. Build releases with `cargo build-sbf --locked` so a stale lock fails
   loudly instead of silently resolving past the pins.
3. After any dependency change, re-sweep the graph
   (`cargo tree -e normal --target bpfel-unknown-unknown` or the SBF target
   your toolchain uses) for `edition2024` crates before committing the new
   lock.
4. Do not re-add a `[patch.crates-io]` override for this — that was tried
   and replaced by the lockfile approach.

## 5. Solana program deploy (devnet)

```bash
solana config set --url devnet
anchor deploy --provider.cluster devnet
# — or, explicitly —
solana program deploy target/deploy/blokz_stake.so \
  --program-id target/deploy/blokz_stake-keypair.json \
  --url devnet
```

## 6. Verify (show program + vault state)

Program on-chain and executable:

```bash
solana program show "$PROGRAM_ID" --url devnet
```

Initialize the vault (one-time; live Token-2022 mint
`5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9`):

1. Create the vault + reward ATAs for that mint, owned by the config PDA
   (`findProgramAddress(["config"], programId)` — seeds in `VAULT_SEEDS`).
2. Call `initialize(lock_secs = 43200, daily_rate_bps = 200)`.
3. `fund_rewards` with the staking allocation.

Then show vault state — the config account must exist with data:

```bash
solana account <CONFIG_PDA> --url devnet
```

And flip the app to vault mode:

```bash
VITE_STAKE_PROGRAM_ID="$PROGRAM_ID" npm run test:vault
```

Setting `VITE_STAKE_PROGRAM_ID` makes `isVaultLive()` true, so `StakePanel`
switches from the simulated ledger (`store.ts`) to real vault transactions.

## 7. Upgrade authority note

By default the **upgrade authority is the wallet that signed the deploy**
(`~/.config/solana/id.json`), *not* the program keypair — the program
keypair only holds the address. Whoever holds the authority key can replace
the program at any time.

```bash
solana program show "$PROGRAM_ID" --url devnet   # shows upgrade authority
solana program set-upgrade-authority "$PROGRAM_ID" \
  --new-upgrade-authority <AUTHORITY_ADDRESS> --url devnet
```

Use a dedicated offline/cold authority keypair (multisig for mainnet); do
not leave a hot deploy wallet as the long-term authority. Record the final
authority address next to the program id before funding the reward pool.
