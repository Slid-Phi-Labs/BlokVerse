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
  /** Canonical site for token metadata (update pump.fun website to this). */
  website: "https://ceedot-rock.github.io/blokz",
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
  if (Array.isArray(list) && list.length > 0) {
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
  timeoutMs = 4000,
): Promise<SolanaProvider | null> {
  const existing = getSolanaProvider();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    let done = false;
    const finish = (p: SolanaProvider | null) => {
      if (done) return;
      done = true;
      window.clearInterval(iv);
      window.removeEventListener("solana#initialized", onInit as EventListener);
      resolve(p);
    };
    const onInit = () => {
      const p = getSolanaProvider();
      if (p) finish(p);
    };
    window.addEventListener("solana#initialized", onInit as EventListener);
    const start = Date.now();
    const iv = window.setInterval(() => {
      const p = getSolanaProvider();
      if (p) finish(p);
      else if (Date.now() - start >= timeoutMs) finish(null);
    }, 120);
  });
}

type RpcAccount = {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
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

async function rpcCall<T>(
  url: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = (await res.json()) as {
    result?: T;
    error?: { message: string };
  };
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result as T;
}

async function rpcFirst<T>(method: string, params: unknown[]): Promise<T> {
  let lastErr: Error | null = null;
  for (const url of SOLANA_TOKEN.rpcUrls) {
    try {
      return await rpcCall<T>(url, method, params);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("All Solana RPCs failed");
}

export async function fetchBlokzBalance(owner: string): Promise<{
  uiAmount: number;
  raw: bigint;
  decimals: number;
}> {
  const ownerTrim = owner.trim();
  const mint = SOLANA_TOKEN.mint;
  const decimalsDefault: number = SOLANA_TOKEN.decimals;

  try {
    const byMint = await rpcFirst<{ value: RpcAccount[] }>(
      "getTokenAccountsByOwner",
      [
        ownerTrim,
        { mint },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ],
    );
    const summed = sumAccounts(byMint?.value ?? [], mint);
    if (summed.found) return summed;
  } catch {
    /* fall through */
  }

  try {
    const by22 = await rpcFirst<{ value: RpcAccount[] }>(
      "getTokenAccountsByOwner",
      [
        ownerTrim,
        { programId: TOKEN_2022_PROGRAM },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ],
    );
    const summed = sumAccounts(by22?.value ?? [], mint);
    if (summed.found) return summed;
    return { uiAmount: 0, raw: 0n, decimals: decimalsDefault };
  } catch {
    /* fall through */
  }

  try {
    const byClassic = await rpcFirst<{ value: RpcAccount[] }>(
      "getTokenAccountsByOwner",
      [
        ownerTrim,
        { programId: TOKEN_PROGRAM },
        { encoding: "jsonParsed", commitment: "confirmed" },
      ],
    );
    const summed = sumAccounts(byClassic?.value ?? [], mint);
    if (summed.found) return summed;
  } catch {
    /* fall through */
  }

  return { uiAmount: 0, raw: 0n, decimals: decimalsDefault };
}

function sumAccounts(
  rows: RpcAccount[],
  mint: string,
): { found: boolean; uiAmount: number; raw: bigint; decimals: number } {
  let raw = 0n;
  let decimals: number = SOLANA_TOKEN.decimals;
  let found = false;
  for (const row of rows) {
    try {
      const info = row.account.data.parsed.info;
      if (info.mint && info.mint !== mint) continue;
      found = true;
      const ta = info.tokenAmount;
      decimals = ta.decimals ?? decimals;
      raw += BigInt(ta.amount || "0");
    } catch {
      /* skip */
    }
  }
  if (!found) return { found: false, uiAmount: 0, raw: 0n, decimals };
  return { found: true, uiAmount: Number(raw) / 10 ** decimals, raw, decimals };
}

export type ConnectResult = {
  address: string;
  method: "extension" | "manual";
};

export async function connectSolanaWallet(): Promise<ConnectResult> {
  if (typeof window === "undefined") {
    throw new Error("Wallet only available in the browser");
  }
  if (isEmbeddedFrame()) {
    throw new Error(
      "Wallet popups blocked in embed. Open full page first.",
    );
  }
  const provider = await waitForSolanaProvider(5000);
  if (!provider) {
    throw new Error(
      "No Solana wallet found. Install Phantom, unlock, refresh, connect.",
    );
  }
  try {
    const res = await provider.connect({ onlyIfTrusted: false });
    const address = res.publicKey?.toString();
    if (!address) throw new Error("Wallet returned no address");
    return { address, method: "extension" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/reject|denied|cancel/i.test(msg)) {
      throw new Error("You rejected the connection in the wallet");
    }
    const res = await provider.connect();
    const address = res.publicKey?.toString();
    if (!address) throw new Error("Wallet returned no address");
    return { address, method: "extension" };
  }
}

export async function disconnectSolanaWallet(): Promise<void> {
  const p = getSolanaProvider();
  if (p?.disconnect) {
    try {
      await p.disconnect();
    } catch {
      /* ignore */
    }
  }
}
