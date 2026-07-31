/**
 * Live on-chain $bLOkz (Solana V2 — pump.fun).
 *
 * Canonical play host = Farcaster mini app tunnel (homeUrl in farcaster.json).
 * pump.fun IPFS website is locked to https://blok.grok.app (404) — cannot change without new mint.
 */
export const GAME_URL =
  "https://blok.grok.me";

/** Farcaster Mini App origin (same as GAME_URL while on this tunnel). */
export const FARCASTER_HOME_URL = GAME_URL;

/** Immutable on pump IPFS — do not use for new product links */
export const GROK_APP_URL_LOCKED = "https://blok.grok.app";

export const BLOKZ_ONCHAIN = {
  chain: "solana" as const,
  name: "bLOkz",
  symbol: "bLOkz",
  mint: "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  website: GAME_URL,
  farcaster: FARCASTER_HOME_URL,
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
  neynar: true,
  launchedAt: "2026-07-31T00:07:05.399Z",
  baseV1Token: "0x9385cB183329C386391787D0f919a02C750A51CB",
} as const;
