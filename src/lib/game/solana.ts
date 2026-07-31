/** Live $bLOkz on Solana (V2). Base V1 deprecated. */

export const SOLANA_TOKEN = {
  chain: "solana" as const,
  symbol: "bLOkz",
  name: "bLOkz",
  mint: "5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  /** Default; real decimals come from the token account when read. */
  decimals: 6,
  tradeUrl:
    "https://pump.fun/coin/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  chartUrl:
    "https://dexscreener.com/solana/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  solscanUrl:
    "https://solscan.io/token/5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9",
  shortMint: "5tX5…Dwf9",
  rpcUrl: "https://api.mainnet-beta.solana.com",
} as const;

export function shortAddress(addr: string, n = 4): string {
  if (addr.length < n * 2 + 3) return addr;
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toString(): string };
  }>;
  disconnect: () => Promise<void>;
};

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    solana?: PhantomProvider;
    phantom?: { solana?: PhantomProvider };
  };
  const p = w.solana?.isPhantom ? w.solana : w.phantom?.solana;
  return p ?? null;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(SOLANA_TOKEN.rpcUrl, {
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

  const result = await rpc<{ value: Acc[] }>("getTokenAccountsByOwner", [
    owner,
    { mint: SOLANA_TOKEN.mint },
    { encoding: "jsonParsed" },
  ]);

  let raw = 0n;
  let decimals: number = SOLANA_TOKEN.decimals;
  for (const row of result?.value ?? []) {
    const ta = row.account.data.parsed.info.tokenAmount;
    decimals = ta.decimals;
    raw += BigInt(ta.amount);
  }
  const uiAmount = Number(raw) / 10 ** decimals;
  return { uiAmount, raw, decimals };
}

export async function connectPhantom(): Promise<string> {
  const p = getPhantom();
  if (!p) {
    throw new Error(
      "Phantom not found — install Phantom or open in a Solana wallet browser",
    );
  }
  const { publicKey } = await p.connect();
  return publicKey.toString();
}

export async function disconnectPhantom(): Promise<void> {
  const p = getPhantom();
  if (p?.disconnect) await p.disconnect();
}
