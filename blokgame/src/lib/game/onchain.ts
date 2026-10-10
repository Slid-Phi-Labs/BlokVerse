/**
 * Live on-chain $bLOkz (Solana V2 — pump.fun).
 * Game product site: https://blok.grok.app
 */
export const GAME_URL = "https://blok.grok.app";

export const BLOKZ_ONCHAIN = {
  chain: "solana" as const,
  name: "bLOkz",
  symbol: "bLOkz",
  mint: "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  website: GAME_URL,
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
  /** Base V1 retired — do not use for new trading */
  baseV1Token: "0x9385cB183329C386391787D0f919a02C750A51CB",
} as const;
