/**
 * Zustand persist storage that compresses board / solution / scoreboards
 * with slid-phi. Falls back to plain JSON on any error (migration-safe).
 */
import type { StateStorage } from "zustand/middleware";
import {
  isSpBoard,
  packBoard,
  packInts,
  packScoreColumns,
  unpackBoard,
  unpackInts,
} from "./slidPhi";

type AnyRow = {
  id: string;
  name: string;
  score: number;
  timeMs: number;
  moves: number;
  difficulty: string;
  at: number;
  completed?: boolean;
  clicksAway?: number;
};

function compressPersisted(raw: string): string {
  let state: Record<string, unknown>;
  try {
    state = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return raw;
  }

  // zustand may wrap as { state, version }
  const root = state;
  const s =
    state.state && typeof state.state === "object"
      ? (state.state as Record<string, unknown>)
      : state;
  const wrapped = s !== state;

  try {
    if (s.board && typeof s.board === "object" && !isSpBoard(s.board)) {
      const board = s.board as {
        size: number;
        cells: Array<{ ports: number; asset: string }>;
      };
      if (board.cells?.length) {
        s.board = packBoard(board);
      }
    }

    if (Array.isArray(s.solution) && s.solution.length) {
      const sol = s.solution as number[];
      if (typeof sol[0] === "number") {
        s.solution = {
          sp: 1,
          packed: packInts(sol, { mode: "universe", M: 15 }).packed,
        };
      }
    }

    for (const key of ["scoreboard", "timeboard"] as const) {
      const rows = s[key];
      if (!Array.isArray(rows) || !rows.length) continue;
      if ((rows as unknown as { sp?: number }).sp === 1) continue;
      const list = rows as AnyRow[];
      if (typeof list[0]?.score !== "number") continue;
      const cols = packScoreColumns(list);
      s[key] = {
        sp: 1,
        meta: list.map((r) => ({
          id: r.id,
          name: r.name,
          difficulty: r.difficulty,
          completed: r.completed,
        })),
        cols,
      };
    }

    s._sp = 1;
  } catch {
    // leave uncompressed
    return raw;
  }

  if (wrapped) {
    root.state = s;
    return JSON.stringify(root);
  }
  return JSON.stringify(s);
}

function expandPersisted(raw: string | null): string | null {
  if (raw == null) return null;
  let state: Record<string, unknown>;
  try {
    state = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return raw;
  }

  const root = state;
  const s =
    state.state && typeof state.state === "object"
      ? (state.state as Record<string, unknown>)
      : state;
  const wrapped = s !== state;

  try {
    if (isSpBoard(s.board)) {
      s.board = unpackBoard(s.board);
    }

    if (
      s.solution &&
      typeof s.solution === "object" &&
      (s.solution as { sp?: number }).sp === 1
    ) {
      const packed = (s.solution as { packed: string }).packed;
      s.solution = unpackInts(packed);
    }

    for (const key of ["scoreboard", "timeboard"] as const) {
      const blob = s[key] as
        | {
            sp?: number;
            meta?: Array<{
              id: string;
              name: string;
              difficulty: string;
              completed?: boolean;
            }>;
            cols?: {
              n: number;
              scores: string;
              timeMs: string;
              moves: string;
              ats: string;
              clicks?: string;
            };
          }
        | unknown;
      if (!blob || typeof blob !== "object" || (blob as { sp?: number }).sp !== 1)
        continue;
      const b = blob as {
        meta: Array<{
          id: string;
          name: string;
          difficulty: string;
          completed?: boolean;
        }>;
        cols: {
          n: number;
          scores: string;
          timeMs: string;
          moves: string;
          ats: string;
          clicks?: string;
        };
      };
      const scores = unpackInts(b.cols.scores);
      const timeMs = unpackInts(b.cols.timeMs);
      const moves = unpackInts(b.cols.moves);
      const ats = unpackInts(b.cols.ats);
      const clicks = b.cols.clicks ? unpackInts(b.cols.clicks) : null;
      s[key] = b.meta.map((m, i) => ({
        id: m.id,
        name: m.name,
        difficulty: m.difficulty,
        completed: m.completed,
        score: scores[i] ?? 0,
        timeMs: timeMs[i] ?? 0,
        moves: moves[i] ?? 0,
        at: ats[i] ?? 0,
        ...(clicks ? { clicksAway: clicks[i] ?? 0 } : {}),
      }));
    }
  } catch {
    return raw;
  }

  if (wrapped) {
    root.state = s;
    return JSON.stringify(root);
  }
  return JSON.stringify(s);
}

export function createSpSessionStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      const raw = window.sessionStorage.getItem(name);
      return expandPersisted(raw);
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      try {
        window.sessionStorage.setItem(name, compressPersisted(value));
      } catch {
        window.sessionStorage.setItem(name, value);
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      window.sessionStorage.removeItem(name);
    },
  };
}
