# bLOkz On-Chain Staking Vault

Real token lock + yield vault for `$bLOkz`.

| Chain | Artifact | Status |
|---|---|---|
| **Solana** (live mint) | `programs/blokz-stake` (Anchor) | Source ready — deploy |
| **EVM / Base** (V1 archive) | `contracts/StakingVault.sol` | Source ready — deploy |

Live mint: `5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9` (Token-2022)

## Reward model (on-chain)

| Param | Value |
|---|---|
| Lock | **12 hours** after stake / top-up |
| Yield | **2.00%/day** of personal stake (200 bps), continuous |
| Funding | Rewards paid from a **funded reward pool** (not infinite mint) |
| Top-up | Restarts the 12h lock |

Matches `src/lib/game/rewards.ts` / tokenomics buckets (staking 30%).

## Solana deploy (primary)

### Prerequisites

```bash
avm install 0.30.1 && avm use 0.30.1
solana config set --url mainnet-beta
solana balance
```

### Build and deploy

```bash
anchor build
anchor keys list
# Update declare_id! in programs/blokz-stake/src/lib.rs + Anchor.toml
anchor build && anchor deploy
```

### Initialize

1. Create two Token-2022 ATAs owned by the Config PDA (vault + reward_vault) for mint `5tX5…Dwf9`.
2. Call `initialize(lock_secs=43200, daily_rate_bps=200)`.
3. `fund_rewards` with staking allocation.
4. Set `VITE_STAKE_PROGRAM_ID=<program id>` in the app env.
5. Copy IDL to `src/lib/game/idl/blokz_stake.json` and finish client wiring in `vault.ts`.

### User flow

```
stake(amount) -> wait 12h -> claim() / unstake(amount)
```

## EVM / Base deploy (archive parity)

```bash
forge create contracts/StakingVault.sol:StakingVault \
  --constructor-args <BLOKZ_ERC20> 43200 200 \
  --rpc-url $BASE_RPC --private-key $PK
```

```solidity
token.approve(vault, amount);
vault.stake(amount);
vault.claim();
vault.unstake(amount);
vault.fundRewards(rewardAmount);
```

V1 token (archived): `0x9385cB183329C386391787D0f919a02C750A51CB`
Live Solana mint is not ERC-20 — use the Anchor program.

## Security notes

- Reward pool can run dry — claims cap to rewardPool.
- Authority can pause and update rate/lock.
- Top-up restarts lock.
- Token-2022 compatible via Token Interface.
- Audit before mainnet funding of large allocations.

## App integration

| File | Role |
|---|---|
| `src/lib/game/vault.ts` | Client helpers + isVaultLive() gate |
| `src/lib/game/rewards.ts` | Same math for UI previews |
| `src/components/game/StakePanel.tsx` | UI switches to vault txs when live |
| `src/lib/game/store.ts` | Legacy in-app ledger until vault is live |

Until `VITE_STAKE_PROGRAM_ID` is set, the app keeps the simulated stake ledger.
