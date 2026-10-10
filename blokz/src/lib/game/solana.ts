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

export function shortAddress(addr: string, n = 4): string {
  if (addr.length < n * 2 + 3) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

export function formatTokenAmount(n: number, maxDigits = 4): string {
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n >= 1_000_000)
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1)
    return n.toLocaleString(undefined, {
      maximumFractionDigits: Math.min(2, maxDigits),
    });
  return n.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}

export function isValidSolanaAddress(addr: string): boolean {
  const a = addr.trim();
  if (a.length < 32 || a.length > 44) return false;
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(a);
}

export type SolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toString(): string } | null;
  connect: (opts?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
};

export function isEmbeddedFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getSolanaProvider(): SolanaProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    phantom?: { solana?: SolanaProvider };
    solana?: SolanaProvider & { providers?: SolanaProvider[] };
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  };
  if (w.phantom?.solana?.isPhantom) return w.phantom.solana;
  if (w.solana?.isPhantom) return w.solana;
  const list = w.solana?.providers;
  if (Array.isArray(list) && list.length) {
    const phantom = list.find((p) => p?.isPhantom);
    if (phantom) return phantom;
    if (typeof list[0]?.connect === "function") return list[0];
  }
  if (w.solflare?.isSolflare) return w.solflare;
  if (w.backpack && typeof w.backpack.connect === "function") return w.backpack;
  if (w.solana && typeof w.solana.connect === "function") return w.solana;
  return null;
}

export function waitForSolanaProvider(
  timeoutMs = 3000,
): Promise<SolanaProvider | null> {
  const existing = getSolanaProvider();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const p = getSolanaProvider();
      if (p || Date.now() - start > timeoutMs) {
        window.clearInterval(id);
        resolve(p);
      }
    }, 100);
  });
}
