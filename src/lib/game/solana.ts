/** Live $bLOkz on Solana (V2). No @solana/web3.js — pure fetch (SSR-safe). */

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export const SOLANA_TOKEN = {
  chain: "solana" as const,
  symbol: "bLOkz",
  name: "bLOkz",
  mint: "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  decimals: 6 as number,
  tokenProgram: TOKEN_2022_PROGRAM,
  /** Play host — Farcaster mini app (farcaster.json homeUrl). */
  website: "https://blok.grok.me",
  tradeUrl:
    "https://pump.fun/coin/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  chartUrl:
    "https://dexscreener.com/solana/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  solscanUrl:
    "https://solscan.io/token/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  shortMint: "5tX5…Dwf9",
  rpcUrls: [
    "https://api.mainnet-beta.solana.com",
    "https://solana-rpc.publicnode.com",
    "https://solana-mainnet.g.alchemy.com/v2/demo",
  ],
} as const;
