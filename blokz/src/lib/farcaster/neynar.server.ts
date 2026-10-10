/**
 * Server-only Neynar helpers. Never import from client components directly —
 * call via createServerFn in auth.ts so NEYNAR_API_KEY stays server-side.
 */

import type { FarcasterUser } from "./types";

const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

export function getNeynarApiKey(): string | undefined {
  const key = process.env.NEYNAR_API_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}

export function isNeynarConfigured(): boolean {
  return Boolean(getNeynarApiKey());
}

export function getAppDomain(): string | null {
  const raw =
    process.env.FARCASTER_DOMAIN?.trim() ||
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.VITE_PUBLIC_APP_URL?.trim() ||
    null;
  if (!raw) return null;
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return new URL(raw).host;
    }
    return raw.replace(/\/$/, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function mapNeynarUser(raw: {
  fid?: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
}): FarcasterUser | null {
  if (typeof raw.fid !== "number") return null;
  return {
    fid: raw.fid,
    username: raw.username ?? null,
    displayName: raw.display_name ?? null,
    pfpUrl: raw.pfp_url ?? null,
  };
}

export async function fetchNeynarUserByFid(
  fid: number,
): Promise<FarcasterUser | null> {
  const apiKey = getNeynarApiKey();
  if (!apiKey) return null;

  const url = new URL(`${NEYNAR_BASE}/user/bulk`);
  url.searchParams.set("fids", String(fid));

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Neynar user/bulk failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    users?: Array<{
      fid?: number;
      username?: string;
      display_name?: string;
      pfp_url?: string;
    }>;
  };

  const first = data.users?.[0];
  return first ? mapNeynarUser(first) : null;
}

/**
 * Validate SIWF message+signature via Neynar signer list.
 * Returns the FID from the first signer when present.
 */
export async function fetchFidFromSiwf(
  message: string,
  signature: string,
): Promise<number | null> {
  const apiKey = getNeynarApiKey();
  if (!apiKey) return null;

  const url = new URL(`${NEYNAR_BASE}/signer/list`);
  url.searchParams.set("message", message);
  url.searchParams.set("signature", signature);

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Neynar signer/list failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as {
    signers?: Array<{ fid?: number }>;
  };

  const fid = data.signers?.find((s) => typeof s.fid === "number")?.fid;
  return typeof fid === "number" ? fid : null;
}

/** Parse FID from SIWF Resources line: farcaster://fid/123 */
export function parseFidFromSiwfMessage(message: string): number | null {
  const m = message.match(/farcaster:\/\/fid\/(\d+)/i);
  if (!m?.[1]) return null;
  const fid = Number(m[1]);
  return Number.isFinite(fid) && fid > 0 ? fid : null;
}

export function createAuthNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
