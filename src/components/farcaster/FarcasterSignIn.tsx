import { useFarcaster } from "@/lib/farcaster/provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogOut, Sparkles } from "lucide-react";

type Props = {
  /** Compact header chip vs full home CTA */
  variant?: "header" | "panel";
  className?: string;
};

export function FarcasterSignIn({ variant = "header", className }: Props) {
  const {
    user,
    mode,
    neynarConfigured,
    isInMiniApp,
    loading,
    signingIn,
    error,
    signIn,
    signOut,
  } = useFarcaster();

  if (loading) {
    return (
      <Badge variant="muted" className={cn("animate-pulse", className)}>
        FC…
      </Badge>
    );
  }

  if (user) {
    const label = user.username
      ? `@${user.username}`
      : user.displayName || `fid:${user.fid}`;

    if (variant === "header") {
      return (
        <div className={cn("flex items-center gap-1.5", className)}>
          <div className="flex max-w-[10rem] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 pl-1 pr-2.5 sm:max-w-[12rem]">
            {user.pfpUrl ? (
              <img
                src={user.pfpUrl}
                alt=""
                className="h-6 w-6 shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[10px] font-bold text-[var(--color-primary)]">
                FC
              </span>
            )}
            <span className="truncate text-xs font-semibold text-[var(--color-fg)]">
              {label}
            </span>
            {mode === "demo" || mode === "context" ? (
              <span
                className="hidden text-[9px] uppercase tracking-wide text-[var(--color-subtle)] sm:inline"
                title={
                  mode === "demo"
                    ? "Demo mode — configure NEYNAR_API_KEY"
                    : "From mini-app context (unverified)"
                }
              >
                {mode === "demo" ? "demo" : "fc"}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={signOut}
            title="Sign out of Farcaster"
            aria-label="Sign out of Farcaster"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          {user.pfpUrl ? (
            <img
              src={user.pfpUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-sm font-bold text-[var(--color-primary)]">
              FC
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate font-semibold">{label}</div>
            <div className="text-xs text-[var(--color-muted)]">
              fid {user.fid}
              {mode === "verified"
                ? " · verified via Neynar"
                : mode === "demo"
                  ? " · demo (configure Neynar)"
                  : " · mini-app context"}
            </div>
          </div>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  // Not signed in
  if (variant === "header") {
    return (
      <div className={cn("flex flex-col items-end gap-0.5", className)}>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => void signIn()}
          disabled={signingIn}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          {signingIn ? "Signing…" : "Farcaster"}
        </Button>
        {!neynarConfigured ? (
          <span className="hidden text-[9px] text-[var(--color-subtle)] sm:inline">
            Neynar optional
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Sign in with Farcaster</div>
          <p className="text-xs text-[var(--color-muted)]">
            {isInMiniApp
              ? "You’re in a Farcaster client — one tap to link your FID."
              : "Works best inside Warpcast. Solana stake stays available either way."}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void signIn()}
          disabled={signingIn}
          className="gap-1.5 shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {signingIn ? "Signing…" : "Sign in"}
        </Button>
      </div>
      {!neynarConfigured ? (
        <p className="text-[11px] text-[var(--color-warn)]">
          Demo mode: set <code className="font-mono">NEYNAR_API_KEY</code> on
          the server for verified SIWF + profile enrichment. UI shell works
          without it.
        </p>
      ) : null}
      {error ? (
        <p className="text-[11px] text-[var(--color-danger)]">{error}</p>
      ) : null}
    </div>
  );
}
