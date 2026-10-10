/** Client-safe Farcaster identity types (no secrets). */

export type FarcasterUser = {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
};

export type FarcasterAuthMode =
  | "anonymous"
  | "context"
  | "verified"
  | "demo";

export type FarcasterAuthState = {
  user: FarcasterUser | null;
  mode: FarcasterAuthMode;
  /** True when NEYNAR_API_KEY is set on the server. */
  neynarConfigured: boolean;
  isInMiniApp: boolean;
  sdkReady: boolean;
  loading: boolean;
  error: string | null;
};

export type NeynarAuthConfig = {
  neynarConfigured: boolean;
  appDomain: string | null;
};

export type VerifySiwfResult =
  | {
      ok: true;
      user: FarcasterUser;
      mode: "verified" | "demo";
      message?: string;
    }
  | {
      ok: false;
      error: string;
      neynarConfigured: boolean;
    };
