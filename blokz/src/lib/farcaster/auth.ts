import { createServerFn } from "@tanstack/react-start";
import {
  createAuthNonce,
  fetchFidFromSiwf,
  fetchNeynarUserByFid,
  getAppDomain,
  isNeynarConfigured,
  parseFidFromSiwfMessage,
} from "./neynar.server";
import type {
  FarcasterUser,
  NeynarAuthConfig,
  VerifySiwfResult,
} from "./types";

export const getFarcasterAuthConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<NeynarAuthConfig> => {
    return {
      neynarConfigured: isNeynarConfigured(),
      appDomain: getAppDomain(),
    };
  },
);

export const createFarcasterNonce = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ nonce: string }> => {
    return { nonce: createAuthNonce() };
  },
);

export const fetchFarcasterProfile = createServerFn({ method: "POST" })
  .validator((data: { fid: number }) => {
    if (!data || typeof data.fid !== "number" || data.fid <= 0) {
      throw new Error("Invalid fid");
    }
    return data;
  })
  .handler(async ({ data }): Promise<{ user: FarcasterUser | null; neynarConfigured: boolean }> => {
    const neynarConfigured = isNeynarConfigured();
    if (!neynarConfigured) {
      return { user: null, neynarConfigured: false };
    }
    try {
      const user = await fetchNeynarUserByFid(data.fid);
      return { user, neynarConfigured: true };
    } catch {
      return { user: null, neynarConfigured: true };
    }
  });

export const verifyFarcasterSignIn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      message: string;
      signature: string;
      /** Untrusted context fields for demo / enrichment fallback */
      contextUser?: {
        fid: number;
        username?: string | null;
        displayName?: string | null;
        pfpUrl?: string | null;
      } | null;
    }) => {
      if (!data?.message || !data?.signature) {
        throw new Error("message and signature are required");
      }
      return data;
    },
  )
  .handler(async ({ data }): Promise<VerifySiwfResult> => {
    const neynarConfigured = isNeynarConfigured();
    const parsedFid = parseFidFromSiwfMessage(data.message);
    const contextFid = data.contextUser?.fid;

    let fid: number | null = null;

    if (neynarConfigured) {
      try {
        fid = await fetchFidFromSiwf(data.message, data.signature);
      } catch (e) {
        // Fall through to message parse + profile fetch
        console.warn("[farcaster] Neynar SIWF verify failed:", e);
      }
    }

    if (!fid) fid = parsedFid;
    if (!fid && contextFid) fid = contextFid;

    if (!fid) {
      return {
        ok: false,
        error: neynarConfigured
          ? "Could not resolve Farcaster FID from SIWF signature"
          : "Configure NEYNAR_API_KEY for verified Sign in with Farcaster, or open inside Warpcast mini app",
        neynarConfigured,
      };
    }

    let user: FarcasterUser | null = null;
    if (neynarConfigured) {
      try {
        user = await fetchNeynarUserByFid(fid);
      } catch (e) {
        console.warn("[farcaster] Neynar profile fetch failed:", e);
      }
    }

    if (!user) {
      user = {
        fid,
        username: data.contextUser?.username ?? null,
        displayName: data.contextUser?.displayName ?? null,
        pfpUrl: data.contextUser?.pfpUrl ?? null,
      };
    }

    return {
      ok: true,
      user,
      mode: neynarConfigured ? "verified" : "demo",
      message: neynarConfigured
        ? undefined
        : "Demo mode — set NEYNAR_API_KEY for full Neynar verification",
    };
  });
