import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { FarcasterProvider } from "@/lib/farcaster/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "bLOK CHaiN — $bLOkz puzzle",
      },
      {
        name: "description",
        content:
          "Compile random crypto blocks into one solid chain. Timed ranked play, top 50 leaderboards, stake $bLOkz, Farcaster mini app.",
      },
      { name: "theme-color", content: "#e8eae8" },
      { name: "color-scheme", content: "light" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "bLOK" },
      { name: "application-name", content: "bLOK CHaiN" },
      // Farcaster / mini app discovery helpers
      { name: "fc:frame", content: "vNext" },
      {
        property: "og:title",
        content: "bLOK CHaiN — forge · stake · $bLOkz",
      },
      {
        property: "og:description",
        content:
          "Puzzle forge mini app on Farcaster. Solidify the chain, climb the top 50, stake $bLOkz on Solana.",
      },
      { property: "og:image", content: "/logo-blok-192.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/logo-blok-mark.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/logo-blok-32.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/logo-blok-192.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-[var(--color-bg)] text-[var(--color-fg)] antialiased">
        <AuthProvider>
          <FarcasterProvider>
            <Outlet />
          </FarcasterProvider>
        </AuthProvider>
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
