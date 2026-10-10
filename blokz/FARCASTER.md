# bLOK CHaiN — Farcaster Mini App + Neynar

Social/auth shell for the existing puzzle game. Solana stake / wallet path is unchanged; Farcaster identity sits alongside `playerName`.

## Packages

- `@farcaster/miniapp-sdk` — mini app host bridge (`ready`, `signIn`, `context`, `isInMiniApp`)
- Neynar HTTP API (server-only via TanStack `createServerFn`) — SIWF verification + profile by FID

## Environment variables

| Variable | Required | Where | Purpose |
|----------|----------|--------|---------|
| `NEYNAR_API_KEY` | No (demo without) | **Server only** | Verify SIWF (`signer/list`), hydrate user via `user/bulk`. Never expose to the client. |
| `FARCASTER_DOMAIN` | Recommended for prod | Server | Domain only, e.g. `blok.example.com` (no protocol). Used in auth config. |
| `PUBLIC_APP_URL` | Recommended | Server / build | Full origin, e.g. `https://blok.example.com`. Used if `FARCASTER_DOMAIN` unset. |

Without `NEYNAR_API_KEY`:

- UI shell still loads
- Mini-app context user (pfp / username) still shows when opened in Warpcast
- Sign-in can fall back to **demo mode** (message + context FID, not fully verified)
- Banner/copy: configure Neynar for verified SIWF

## Manifest

Served at:

```
/.well-known/farcaster.json
```

File: `public/.well-known/farcaster.json`

Update `homeUrl`, `iconUrl`, splash/OG URLs to your **stable production domain** (not a transient tunnel) before listing.

### Account association (required for production discovery)

1. Deploy the app so `https://YOUR_DOMAIN/.well-known/farcaster.json` is live.
2. Open [Farcaster Mini Apps Manifest tool](https://farcaster.xyz/~/developers/mini-apps/manifest).
3. Claim ownership and sign with your custody address.
4. Merge the returned `accountAssociation` object into `farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "miniapp": { "...": "..." }
}
```

## Local / preview

```bash
# optional
export NEYNAR_API_KEY=your_key_from_dev.neynar.com
export PUBLIC_APP_URL=https://your-tunnel-or-domain

npm run dev   # 0.0.0.0:8080
```

`startup.sh` already starts Vite on `0.0.0.0:8080` and may write a Cloudflare tunnel URL to `PUBLIC_URL.txt`. Point manifest URLs at that origin while testing tunnels.

## Open in Warpcast / Farcaster

1. Ensure the public HTTPS origin serves the app and `/.well-known/farcaster.json`.
2. In Warpcast: Developers → Mini Apps → preview your domain, or share:

   ```
   https://warpcast.com/~/developers/mini-apps/preview?domain=YOUR_DOMAIN
   ```

3. Or cast a link to `homeUrl` once the manifest is associated.
4. Inside the client, splash dismisses after `sdk.actions.ready()`; header shows Farcaster pfp/username when signed in or context is available.

## Auth flow (summary)

1. Client detects mini app via `sdk.isInMiniApp()` and reads `sdk.context.user` (untrusted UI).
2. **Sign in with Farcaster** → server nonce → `sdk.actions.signIn({ nonce })`.
3. Server: if `NEYNAR_API_KEY` set, call Neynar `signer/list` + `user/bulk`; else demo/context mode.
4. Store FID + profile in game store (`farcaster`) and set `playerName` from username.

## Solana

Stake / Phantom / mint path is independent. Users can play with Farcaster identity only, or connect Solana for on-chain `$bLOkz` stake (mint `5tX5u37fxBPV6wGwuU5pzn9oZuvqXmH4trGvmhUnDwf9`).

## Typecheck

```bash
npm run typecheck
```
