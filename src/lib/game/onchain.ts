/**
 * Live on-chain $bLOkz (Solana V2 — pump.fun).
 *
 * pump.fun IPFS website is locked to https://blok.grok.app (404).
 * Canonical code/play link we control:
 */
export const GAME_URL = "https://github.com/ceedot-rock/blokz";

/** Immutable on pump IPFS — do not use for new product links */
export const GROK_APP_URL_LOCKED = "https://blok.grok.app";

export const BLOKZ_ONCHAIN = {
  chain: "solana" as const,
  name: "bLOkz",
  symbol: "bLOkz",
  mint: "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  website: GAME_URL,
  pumpIpfsWebsite: GROK_APP_URL_LOCKED,
  pumpUrl: "https://pump.fun/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  solscanMint:
    "https://solscan.io/token/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  createTx:
    "https://solscan.io/tx/2gY6ewYk7sQXeXcqfgHQi78dQH2GC5gbHnUtpnr5TvdJD7fWkT9VFUGAGhNFYm6pbeFVhLmn47sqmQVL4VgW49Wk",
  metadataUri:
    "https://ipfs.io/ipfs/bafkreifxwmrx3cgam4a5pof4kqr33uzic2gczhfoj4rmtkwnoulxpit74e",
  creator: "96V9SjAHLkQ7ZFqk6HFNHeVtz2YBi8DjevRqYjGaVUbx",
  platform: "pump.fun",
  launchedAt: "2026-07-31T00:07:05.399Z",
  baseV1Token: "0x9385cB183329C386391787D0f919a02C750A51CB",
} as const;
