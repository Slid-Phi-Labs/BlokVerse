import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  analyzeBoard,
  applyHint,
  clicksAway,
  generatePuzzle,
  rotateCell,
  scoreRound,
} from "./engine";
import {
  accruePending,
  canUnstake,
  claimStatus,
} from "./rewards";
import {
  connectSolanaWallet,
  disconnectSolanaWallet,
  fetchBlokzBalance,
  isValidSolanaAddress,
  SOLANA_TOKEN,
} from "./solana";
import type { FarcasterAuthMode } from "@/lib/farcaster/types";
import {
  type ChatMessage,
  type Difficulty,
  DIFFICULTIES,
  type LeaderboardEntry,
  type RoundScoreBreakdown,
  type SolveResult,
  type BoardState,
  type PortMask,
} from "./types";

export type AppTab =
  | "play"
  | "leaderboard"
  | "stake"
  | "tokenomics"
  | "chat";
export type GamePhase = "menu" | "playing" | "won" | "lost";

/** Lightweight Farcaster identity mirrored into the game store for HUD / lock name. */
export type GameFarcasterIdentity = {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  mode: FarcasterAuthMode;
};

interface GameStore {
  playerName: string;
  setPlayerName: (name: string) => void;

  farcaster: GameFarcasterIdentity | null;
  setFarcasterIdentity: (identity: GameFarcasterIdentity) => void;
  clearFarcasterIdentity: () => void;

  tab: AppTab;
  setTab: (tab: AppTab) => void;

  balance: number;
  staked: number;
  stakedAt: number | null;
  pendingStakeRewards: number;
  lastAccrualAt: number | null;
  lastMonthlyClaimAt: number | null;
  totalRewardsClaimed: number;
  walletStartedAt: number;

  walletAddress: string | null;
  walletMethod: "extension" | "manual" | null;
  tokenBalance: number;
  tokenDecimals: number;
  tokenLoading: boolean;
  tokenError: string | null;
  lastTokenSyncAt: number | null;

  connectWallet: () => Promise<{ ok: boolean; error?: string }>;
  /** Paste-a-wallet when extension can't inject (iframe). Read-only balance. */
  linkWalletAddress: (
    address: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  disconnectWallet: () => Promise<void>;
  refreshTokenBalance: () => Promise<void>;

  stake: (amount: number) => { ok: boolean; error?: string };
  unstake: (amount: number) => { ok: boolean; error?: string };
  claimRewards: () => {
    ok: boolean;
    error?: string;
    amount?: number;
    tier?: "staker" | "non-staker";
  };
  awardTokens: (amount: number) => void;

  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;

  phase: GamePhase;
  board: BoardState | null;
  solution: PortMask[];
  moves: number;
  startedAt: number | null;
  endsAt: number | null;
  lastResult: SolveResult | null;
  lastScore: number;
  lastTimeMs: number;
  lastClicksAway: number;
  lastBreakdown: RoundScoreBreakdown | null;
  hintsUsed: number;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  startGame: () => void;
  rotateAt: (index: number) => void;
  useHint: () => { ok: boolean; error?: string };
  tick: () => void;
  forfeit: () => void;
  backToMenu: () => void;
  settleExpiredSession: () => void;

  scoreboard: LeaderboardEntry[];
  timeboard: LeaderboardEntry[];
  submitScore: (entry: Omit<LeaderboardEntry, "id" | "at">) => void;

  chat: ChatMessage[];
  postChat: (text: string) => { ok: boolean; error?: string };
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const SEED_CHAT: ChatMessage[] = [
  {
    id: "seed1",
    author: "ChainSmith",
    text: "Solidified a hard forge in 41 clicks. Stakers only in this room.",
    at: Date.now() - 86_400_000,
    staked: 1200,
  },
  {
    id: "seed2",
    author: "PortQueen",
    text: "Tees + crosses change everything. Don't ignore open ports.",
    at: Date.now() - 43_200_000,
    staked: 800,
  },
];

function seedBoard(kind: "score" | "time"): LeaderboardEntry[] {
  const names = [
    "SatoshiForge",
    "EthLinker",
    "SolSpinner",
    "DotRotator",
    "AdaChain",
    "AvaxPort",
    "NearNode",
    "AtomGate",
    "OpStacker",
    "BaseBlock",
  ];
  return names.map((name, i) => {
    const completed = i < 7;
    const moves = 18 + i * 4 + (kind === "score" ? 0 : 6);
    const timeMs =
      kind === "time"
        ? 45_000 + i * 12_000
        : 60_000 + i * 18_000 + (completed ? 0 : 40_000);
    const score =
      kind === "score"
        ? 4200 - i * 180 - (completed ? 0 : 900)
        : 2800 - i * 90;
    return {
      id: `${kind}_${i}`,
      name,
      score: Math.max(50, score),
      timeMs,
      moves,
      difficulty: (i % 3 === 0
        ? "hard"
        : i % 2 === 0
          ? "medium"
          : "easy") as Difficulty,
      completed,
      clicksAway: completed ? 0 : 3 + (i % 5),
      at: Date.now() - i * 3_600_000,
    };
  });
}

function endRound(
  get: () => GameStore,
  set: (
    partial: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>),
  ) => void,
  completed: boolean,
) {
  const state = get();
  if (!state.board || !state.startedAt) return;
  const elapsedMs = Math.max(
    0,
    (completed
      ? Date.now()
      : Math.min(Date.now(), state.endsAt ?? Date.now())) - state.startedAt,
  );
  const elapsedSec = elapsedMs / 1000;
  const breakdown = scoreRound({
    difficulty: state.difficulty,
    completed,
    moves: state.moves,
    elapsedSec,
    board: state.board,
    solution: state.solution,
  });

  set({
    phase: completed ? "won" : "lost",
    lastScore: breakdown.score,
    lastTimeMs: elapsedMs,
    lastClicksAway: breakdown.clicksAway,
    lastBreakdown: breakdown,
    lastResult: analyzeBoard(state.board),
    endsAt: null,
    balance: state.balance + breakdown.reward,
  });

  const displayName =
    state.farcaster?.username ||
    state.farcaster?.displayName ||
    state.playerName;

  get().submitScore({
    name: displayName,
    score: breakdown.score,
    timeMs: elapsedMs,
    moves: state.moves,
    difficulty: state.difficulty,
    completed,
    clicksAway: breakdown.clicksAway,
  });
}

const gameStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return window.sessionStorage;
});

function markHydrated() {
  useGameStore.setState({ hasHydrated: true });
  try {
    useGameStore.getState().settleExpiredSession();
  } catch {
    // ignore
  }
  const s = useGameStore.getState();
  if (s.walletAddress) {
    void s.refreshTokenBalance();
  }
}

function syncAccrual(
  get: () => GameStore,
  set: (p: Partial<GameStore>) => void,
) {
  const s = get();
  if (s.staked <= 0) return;
  const next = accruePending(
    s.staked,
    s.pendingStakeRewards,
    s.lastAccrualAt,
  );
  set({
    pendingStakeRewards: next.pending,
    lastAccrualAt: next.lastAccrualAt,
  });
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      playerName: "You",
      setPlayerName: (name) => set({ playerName: name.slice(0, 18) || "You" }),

      farcaster: null,
      setFarcasterIdentity: (identity) => set({ farcaster: identity }),
      clearFarcasterIdentity: () => set({ farcaster: null }),

      tab: "play",
      setTab: (tab) => set({ tab }),

      balance: 0,
      staked: 0,
      stakedAt: null,
      pendingStakeRewards: 0,
      lastAccrualAt: null,
      lastMonthlyClaimAt: null,
      totalRewardsClaimed: 0,
      walletStartedAt: Date.now(),

      walletAddress: null,
      walletMethod: null,
      tokenBalance: 0,
      tokenDecimals: SOLANA_TOKEN.decimals,
      tokenLoading: false,
      tokenError: null,
      lastTokenSyncAt: null,

      /** Fallback connect (prefers wallet-adapter UI via WalletConnectModal). */
      connectWallet: async () => {
        try {
          set({ tokenLoading: true, tokenError: null });
          const { address, method } = await connectSolanaWallet();
          set({
            walletAddress: address,
            walletMethod: method,
            tokenLoading: false,
          });
          await get().refreshTokenBalance();
          return { ok: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Wallet connect failed";
          set({ tokenLoading: false, tokenError: msg });
          return { ok: false, error: msg };
        }
      },

      linkWalletAddress: async (address) => {
        const a = address.trim();
        if (!isValidSolanaAddress(a)) {
          return { ok: false, error: "Invalid Solana address" };
        }
        try {
          set({
            tokenLoading: true,
            tokenError: null,
            walletAddress: a,
            walletMethod: "manual",
          });
          await get().refreshTokenBalance();
          set({ tokenLoading: false });
          return { ok: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Balance fetch failed";
          set({ tokenLoading: false, tokenError: msg });
          return { ok: false, error: msg };
        }
      },

      disconnectWallet: async () => {
        try {
          if (get().walletMethod === "extension") {
            await disconnectSolanaWallet();
          }
        } catch {
          // ignore
        }
        set({
          walletAddress: null,
          walletMethod: null,
          tokenBalance: 0,
          tokenError: null,
          lastTokenSyncAt: null,
        });
      },

      refreshTokenBalance: async () => {
        const addr = get().walletAddress;
        if (!addr) return;
        try {
          set({ tokenLoading: true, tokenError: null });
          const bal = await fetchBlokzBalance(addr);
          set({
            tokenBalance: bal.uiAmount,
            tokenDecimals: bal.decimals,
            tokenLoading: false,
            lastTokenSyncAt: Date.now(),
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Balance fetch failed";
          set({ tokenLoading: false, tokenError: msg });
        }
      },

      stake: (amount) => {
        const a = Math.floor(amount);
        if (!Number.isFinite(a) || a <= 0) {
          return { ok: false, error: "Enter a positive amount" };
        }
        const state = get();
        if (!state.walletAddress) {
          return { ok: false, error: "Connect a wallet that holds $bLOkz" };
        }
        const free = Math.floor(state.tokenBalance);
        if (a > free) {
          return {
            ok: false,
            error: `Need ${a} free on-chain $bLOkz (${SOLANA_TOKEN.shortMint}). You have ${free}.`,
          };
        }
        syncAccrual(get, set);
        const now = Date.now();
        const wasZero = state.staked <= 0;
        set({
          staked: state.staked + a,
          stakedAt: now,
          lastAccrualAt: wasZero ? now : (get().lastAccrualAt ?? now),
        });
        return { ok: true };
      },

      unstake: (amount) => {
        const a = Math.floor(amount);
        if (!Number.isFinite(a) || a <= 0) {
          return { ok: false, error: "Enter a positive amount" };
        }
        const state = get();
        if (a > state.staked) {
          return { ok: false, error: "Not enough staked $bLOkz" };
        }
        const lock = canUnstake(state.staked, state.stakedAt);
        if (!lock.ok) {
          const hrs = Math.ceil(lock.waitMs / (60 * 60 * 1000));
          return {
            ok: false,
            error: `12h minimum stake lock — unlocks in ~${hrs}h`,
          };
        }
        syncAccrual(get, set);
        const next = get().staked - a;
        set({
          staked: next,
          stakedAt: next <= 0 ? null : get().stakedAt,
          lastAccrualAt: next <= 0 ? null : get().lastAccrualAt,
        });
        if (next <= 0) {
          const s = get();
          const paid = Math.floor(s.pendingStakeRewards);
          if (paid > 0) {
            set({
              balance: s.balance + paid,
              pendingStakeRewards: 0,
              totalRewardsClaimed: s.totalRewardsClaimed + paid,
            });
          } else {
            set({ pendingStakeRewards: 0 });
          }
        }
        return { ok: true };
      },

      claimRewards: () => {
        syncAccrual(get, set);
        const s = get();
        const status = claimStatus(
          s.staked,
          s.stakedAt,
          s.pendingStakeRewards,
          s.lastAccrualAt,
          s.lastMonthlyClaimAt,
          s.walletStartedAt,
        );
        if (!status.ready) {
          return {
            ok: false,
            error: status.reason ?? "Not ready to claim",
            tier: status.tier,
          };
        }
        if (status.tier === "staker") {
          const amount = status.amount;
          set({
            balance: s.balance + amount,
            pendingStakeRewards: Math.max(0, s.pendingStakeRewards - amount),
            lastAccrualAt: Date.now(),
            totalRewardsClaimed: s.totalRewardsClaimed + amount,
          });
          return { ok: true, amount, tier: "staker" };
        }
        if (!s.walletAddress) {
          return { ok: false, error: "Connect wallet holding $bLOkz" };
        }
        const amount = status.amount;
        set({
          balance: s.balance + amount,
          lastMonthlyClaimAt: Date.now(),
          totalRewardsClaimed: s.totalRewardsClaimed + amount,
        });
        return { ok: true, amount, tier: "non-staker" };
      },

      awardTokens: (amount) => {
        const a = Math.floor(amount);
        if (!Number.isFinite(a) || a <= 0) return;
        set({ balance: get().balance + a });
      },

      difficulty: "medium",
      setDifficulty: (d) => set({ difficulty: d }),

      phase: "menu",
      board: null,
      solution: [],
      moves: 0,
      startedAt: null,
      endsAt: null,
      lastResult: null,
      lastScore: 0,
      lastTimeMs: 0,
      lastClicksAway: 0,
      lastBreakdown: null,
      hintsUsed: 0,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      startGame: () => {
        const { difficulty } = get();
        const cfg = DIFFICULTIES[difficulty];
        const puzzle = generatePuzzle(difficulty);
        const now = Date.now();
        set({
          phase: "playing",
          board: puzzle.board,
          solution: puzzle.solution,
          moves: 0,
          startedAt: now,
          endsAt: now + cfg.timeLimit * 1000,
          lastResult: analyzeBoard(puzzle.board),
          lastScore: 0,
          lastTimeMs: 0,
          lastClicksAway: clicksAway(puzzle.board, puzzle.solution),
          lastBreakdown: null,
          hintsUsed: 0,
          tab: "play",
        });
      },

      rotateAt: (index) => {
        const state = get();
        if (state.phase !== "playing" || !state.board) return;
        const nextBoard = rotateCell(state.board, index);
        const result = analyzeBoard(nextBoard);
        const moves = state.moves + 1;
        const away = clicksAway(nextBoard, state.solution);
        set({
          board: nextBoard,
          moves,
          lastResult: result,
          lastClicksAway: away,
        });
        if (result.isSolved) endRound(get, set, true);
      },

      useHint: () => {
        const state = get();
        if (state.phase !== "playing" || !state.board) {
          return { ok: false, error: "No active forge" };
        }
        if (state.balance < 25) {
          return { ok: false, error: "Need 25 forge $bLOkz for a hint" };
        }
        const applied = applyHint(state.board, state.solution);
        if (!applied) {
          return { ok: false, error: "Board already optimal" };
        }
        const result = analyzeBoard(applied.board);
        const away = clicksAway(applied.board, state.solution);
        set({
          board: applied.board,
          balance: state.balance - 25,
          hintsUsed: state.hintsUsed + 1,
          lastResult: result,
          lastClicksAway: away,
        });
        if (result.isSolved) endRound(get, set, true);
        return { ok: true };
      },

      tick: () => {
        const state = get();
        if (state.phase !== "playing" || !state.endsAt || !state.board) return;
        if (Date.now() < state.endsAt) return;
        endRound(get, set, false);
      },

      forfeit: () => {
        const state = get();
        if (state.phase !== "playing" || !state.board) return;
        endRound(get, set, false);
      },

      backToMenu: () => {
        set({
          phase: "menu",
          board: null,
          solution: [],
          endsAt: null,
          startedAt: null,
        });
      },

      settleExpiredSession: () => {
        const state = get();
        if (state.phase !== "playing" || !state.endsAt || !state.board) return;
        if (Date.now() < state.endsAt) return;
        endRound(get, set, false);
      },

      scoreboard: seedBoard("score"),
      timeboard: seedBoard("time"),
      submitScore: (entry) => {
        const row: LeaderboardEntry = {
          ...entry,
          id: uid("lb"),
          at: Date.now(),
        };
        const scoreboard = [...get().scoreboard, row]
          .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
          .slice(0, 50);
        const completed = [...get().timeboard, row]
          .filter((e) => e.completed)
          .sort((a, b) => a.timeMs - b.timeMs || b.score - a.score);
        const incomplete = [...get().timeboard, row]
          .filter((e) => !e.completed)
          .sort((a, b) => a.timeMs - b.timeMs);
        set({
          scoreboard,
          timeboard: [...completed, ...incomplete].slice(0, 50),
        });
      },

      chat: SEED_CHAT,
      postChat: (text) => {
        const cleaned = text.trim().slice(0, 240);
        if (!cleaned) return { ok: false, error: "Message is empty" };
        const { staked, playerName, chat, walletAddress, farcaster } = get();
        if (!walletAddress) {
          return { ok: false, error: "Connect wallet first" };
        }
        if (staked <= 0) {
          return { ok: false, error: "Stake $bLOkz to post" };
        }
        const author =
          farcaster?.username || farcaster?.displayName || playerName;
        set({
          chat: [
            ...chat,
            {
              id: uid("chat"),
              author,
              text: cleaned,
              at: Date.now(),
              staked,
            },
          ].slice(-200),
        });
        return { ok: true };
      },
    }),
    {
      name: "blok-chain-v11-wallet-adapter",
      storage: gameStorage,
      partialize: (s) => ({
        playerName: s.playerName,
        farcaster: s.farcaster,
        balance: s.balance,
        staked: s.staked,
        stakedAt: s.stakedAt,
        pendingStakeRewards: s.pendingStakeRewards,
        lastAccrualAt: s.lastAccrualAt,
        lastMonthlyClaimAt: s.lastMonthlyClaimAt,
        totalRewardsClaimed: s.totalRewardsClaimed,
        walletStartedAt: s.walletStartedAt,
        walletAddress: s.walletAddress,
        walletMethod: s.walletMethod,
        difficulty: s.difficulty,
        scoreboard: s.scoreboard,
        timeboard: s.timeboard,
        chat: s.chat,
        tab: s.tab,
        phase: s.phase,
        board: s.board,
        solution: s.solution,
        moves: s.moves,
        startedAt: s.startedAt,
        endsAt: s.endsAt,
        lastResult: s.lastResult,
        lastScore: s.lastScore,
        lastTimeMs: s.lastTimeMs,
        lastClicksAway: s.lastClicksAway,
        lastBreakdown: s.lastBreakdown,
        hintsUsed: s.hintsUsed,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameStore>;
        const validTabs: AppTab[] = [
          "play",
          "leaderboard",
          "stake",
          "tokenomics",
          "chat",
        ];
        const tab = validTabs.includes(p.tab as AppTab)
          ? (p.tab as AppTab)
          : current.tab;
        return {
          ...current,
          ...p,
          tab,
          hasHydrated: current.hasHydrated,
          tokenLoading: false,
          tokenError: null,
          tokenBalance: 0,
        };
      },
      onRehydrateStorage: () => () => {
        markHydrated();
      },
    },
  ),
);

if (typeof window !== "undefined") {
  setTimeout(() => {
    if (!useGameStore.getState().hasHydrated) {
      markHydrated();
    }
  }, 50);
}
