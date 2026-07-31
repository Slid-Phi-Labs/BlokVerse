import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createFarcasterNonce,
  fetchFarcasterProfile,
  getFarcasterAuthConfig,
  verifyFarcasterSignIn,
} from "./auth";
import type {
  FarcasterAuthMode,
  FarcasterUser,
} from "./types";
import { useGameStore } from "@/lib/game/store";

const STORAGE_KEY = "blok-farcaster-session-v1";

type FarcasterContextValue = {
  user: FarcasterUser | null;
  mode: FarcasterAuthMode;
  neynarConfigured: boolean;
  isInMiniApp: boolean;
  sdkReady: boolean;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  /** Apply untrusted mini-app context user (UI only). */
  applyContextUser: (user: FarcasterUser) => void;
};

const FarcasterCtx = createContext<FarcasterContextValue | null>(null);

function toPlayerName(user: FarcasterUser): string {
  const handle = user.username || user.displayName || `fid:${user.fid}`;
  return handle.replace(/^@/, "").slice(0, 18) || "You";
}

function readStoredSession(): {
  user: FarcasterUser;
  mode: FarcasterAuthMode;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      user?: FarcasterUser;
      mode?: FarcasterAuthMode;
    };
    if (!parsed.user?.fid) return null;
    return {
      user: parsed.user,
      mode: parsed.mode ?? "demo",
    };
  } catch {
    return null;
  }
}

function writeStoredSession(
  user: FarcasterUser | null,
  mode: FarcasterAuthMode,
) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, mode }));
  } catch {
    // ignore
  }
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const setFarcasterIdentity = useGameStore((s) => s.setFarcasterIdentity);
  const clearFarcasterIdentity = useGameStore((s) => s.clearFarcasterIdentity);

  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [mode, setMode] = useState<FarcasterAuthMode>("anonymous");
  const [neynarConfigured, setNeynarConfigured] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyUser = useCallback(
    (next: FarcasterUser | null, nextMode: FarcasterAuthMode) => {
      setUser(next);
      setMode(nextMode);
      writeStoredSession(next, nextMode);
      if (next) {
        setPlayerName(toPlayerName(next));
        setFarcasterIdentity({
          fid: next.fid,
          username: next.username,
          displayName: next.displayName,
          pfpUrl: next.pfpUrl,
          mode: nextMode,
        });
      } else {
        clearFarcasterIdentity();
      }
    },
    [setPlayerName, setFarcasterIdentity, clearFarcasterIdentity],
  );

  const applyContextUser = useCallback(
    (ctxUser: FarcasterUser) => {
      // Don't clobber a stronger verified session
      if (mode === "verified") return;
      applyUser(ctxUser, "context");
    },
    [applyUser, mode],
  );

  // Bootstrap: config + stored session + mini-app SDK
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      try {
        const cfg = await getFarcasterAuthConfig();
        if (cancelled) return;
        setNeynarConfigured(cfg.neynarConfigured);

        const stored = readStoredSession();
        if (stored && !cancelled) {
          applyUser(stored.user, stored.mode);
          // Refresh profile via Neynar when possible
          if (cfg.neynarConfigured) {
            try {
              const { user: refreshed } = await fetchFarcasterProfile({
                data: { fid: stored.user.fid },
              });
              if (refreshed && !cancelled) {
                applyUser(refreshed, stored.mode === "demo" ? "verified" : stored.mode);
              }
            } catch {
              // keep stored
            }
          }
        }

        // Mini App SDK — only on client
        try {
          const { sdk } = await import("@farcaster/miniapp-sdk");
          const inApp = await sdk.isInMiniApp();
          if (cancelled) return;
          setIsInMiniApp(inApp);

          if (inApp) {
            try {
              const ctx = await sdk.context;
              if (ctx?.user?.fid && !cancelled) {
                const base: FarcasterUser = {
                  fid: ctx.user.fid,
                  username: ctx.user.username ?? null,
                  displayName: ctx.user.displayName ?? null,
                  pfpUrl: ctx.user.pfpUrl ?? null,
                };

                // Enrich with Neynar when available
                if (cfg.neynarConfigured) {
                  try {
                    const { user: enriched } = await fetchFarcasterProfile({
                      data: { fid: base.fid },
                    });
                    if (enriched && !cancelled) {
                      // Only auto-apply context if not already verified
                      const currentMode = readStoredSession()?.mode;
                      if (currentMode !== "verified") {
                        applyUser(enriched, "context");
                      }
                    } else if (!cancelled && !readStoredSession()) {
                      applyUser(base, "context");
                    }
                  } catch {
                    if (!cancelled && !readStoredSession()) {
                      applyUser(base, "context");
                    }
                  }
                } else if (!readStoredSession()) {
                  applyUser(base, "context");
                }
              }
            } catch {
              // context unavailable outside host
            }

            try {
              await sdk.actions.ready();
            } catch {
              // ready() fails outside mini app host — ignore
            }
          } else {
            // Still call ready() is no-op / fail safely outside host
            try {
              await sdk.actions.ready();
            } catch {
              // ignore
            }
          }
        } catch (e) {
          console.warn("[farcaster] SDK init:", e);
        }

        if (!cancelled) setSdkReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Farcaster boot failed");
          setSdkReady(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once
  }, []);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setError(null);
    try {
      const { nonce } = await createFarcasterNonce();

      let message: string;
      let signature: string;
      let contextUser: FarcasterUser | null = null;

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const inApp = await sdk.isInMiniApp();
        if (inApp) {
          try {
            const ctx = await sdk.context;
            if (ctx?.user?.fid) {
              contextUser = {
                fid: ctx.user.fid,
                username: ctx.user.username ?? null,
                displayName: ctx.user.displayName ?? null,
                pfpUrl: ctx.user.pfpUrl ?? null,
              };
            }
          } catch {
            // ignore
          }

          const result = await sdk.actions.signIn({
            nonce,
            acceptAuthAddress: true,
          });
          message = result.message;
          signature = result.signature;
        } else {
          // Outside mini app: open Farcaster SIWF is host-dependent.
          // Offer clear guidance; still allow demo if context existed.
          throw new Error(
            "Open bLOK CHaiN inside Warpcast / a Farcaster client to Sign in with Farcaster. Outside the mini app, connect Solana for stake play.",
          );
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("Open bLOK")) throw e;
        // RejectedByUser or host missing
        const name = e && typeof e === "object" && "name" in e ? String((e as { name: string }).name) : "";
        if (name.includes("RejectedByUser") || /rejected/i.test(String(e))) {
          throw new Error("Sign-in cancelled");
        }
        throw e instanceof Error
          ? e
          : new Error("Farcaster sign-in failed");
      }

      const result = await verifyFarcasterSignIn({
        data: {
          message,
          signature,
          contextUser,
        },
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      applyUser(result.user, result.mode);
      if (result.message) {
        setError(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }, [applyUser]);

  const signOut = useCallback(() => {
    applyUser(null, "anonymous");
    setError(null);
  }, [applyUser]);

  const value = useMemo<FarcasterContextValue>(
    () => ({
      user,
      mode,
      neynarConfigured,
      isInMiniApp,
      sdkReady,
      loading,
      signingIn,
      error,
      signIn,
      signOut,
      applyContextUser,
    }),
    [
      user,
      mode,
      neynarConfigured,
      isInMiniApp,
      sdkReady,
      loading,
      signingIn,
      error,
      signIn,
      signOut,
      applyContextUser,
    ],
  );

  return (
    <FarcasterCtx.Provider value={value}>{children}</FarcasterCtx.Provider>
  );
}

export function useFarcaster(): FarcasterContextValue {
  const ctx = useContext(FarcasterCtx);
  if (!ctx) {
    throw new Error("useFarcaster must be used within FarcasterProvider");
  }
  return ctx;
}

/** Safe hook when provider may be missing (returns null). */
export function useFarcasterOptional(): FarcasterContextValue | null {
  return useContext(FarcasterCtx);
}
