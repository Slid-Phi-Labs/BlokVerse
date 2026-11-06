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
  /** Message signing for the custody challenge (not all wallets expose it). */
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  /**
   * Raw transaction-message signing for the vault path (`vault.ts`).
   * Absent on read-only / embedded wallets � vault submits refuse closed
   * instead of treating them as signers.
   */
  signTransaction?: (message: Uint8Array) => Promise<Uint8Array>;
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

/* ------------------------------------------------------------------ */
/* Wallet I/O vendored from blokgame (adapted to the multi-RPC list).  */
/* ------------------------------------------------------------------ */

async function rpcAt<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as {
    result?: T;
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

/** On-chain $bLOkz balance — tries each RPC URL in order, throws the last error. */
export async function fetchBlokzBalance(owner: string): Promise<{
  uiAmount: number;
  raw: bigint;
  decimals: number;
}> {
  type Acc = {
    account: {
      data: {
        parsed: {
          info: {
            tokenAmount: {
              amount: string;
              decimals: number;
              uiAmount: number | null;
            };
          };
        };
      };
    };
  };

  let lastError: unknown = new Error("No Solana RPC configured");
  for (const rpcUrl of SOLANA_TOKEN.rpcUrls) {
    try {
      const result = await rpcAt<{ value: Acc[] }>(
        rpcUrl,
        "getTokenAccountsByOwner",
        [owner, { mint: SOLANA_TOKEN.mint }, { encoding: "jsonParsed" }],
      );
      let raw = 0n;
      let decimals: number = SOLANA_TOKEN.decimals;
      for (const row of result?.value ?? []) {
        const ta = row.account.data.parsed.info.tokenAmount;
        decimals = ta.decimals;
        raw += BigInt(ta.amount);
      }
      const uiAmount = Number(raw) / 10 ** decimals;
      return { uiAmount, raw, decimals };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/** Connect via the injected provider (Phantom / Solflare / Backpack). */
export async function connectSolanaWallet(): Promise<{
  address: string;
  method: "extension";
  provider: SolanaProvider;
}> {
  const provider = await waitForSolanaProvider();
  if (!provider) {
    throw new Error(
      "No Solana wallet found — install Phantom or paste an address",
    );
  }
  const { publicKey } = await provider.connect();
  return { address: publicKey.toString(), method: "extension", provider };
}

export async function disconnectSolanaWallet(): Promise<void> {
  const provider = getSolanaProvider();
  if (provider?.disconnect) await provider.disconnect();
}

/**
 * Ask the wallet to sign the custody challenge. Resolves with the raw
 * signature bytes; throws when the provider cannot sign (embedded frames,
 * read-only wallets) so callers can fall back to read-only mode.
 */
export async function signChallengeWithProvider(
  provider: SolanaProvider,
  challenge: string,
): Promise<Uint8Array> {
  if (typeof provider.signMessage !== "function") {
    throw new Error("Wallet cannot sign messages — open the full page");
  }
  const bytes =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(challenge)
      : Uint8Array.from(challenge.split("").map((c) => c.charCodeAt(0) & 0xff));
  const { signature } = await provider.signMessage(bytes);
  if (!signature || signature.length < 64) {
    throw new Error("Wallet returned an invalid signature");
  }
  return signature;
}
