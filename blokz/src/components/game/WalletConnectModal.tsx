import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSolanaProvider,
  isEmbeddedFrame,
  isValidSolanaAddress,
  SOLANA_TOKEN,
  waitForSolanaProvider,
} from "@/lib/game/solana";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { ExternalLink, Link2, Wallet, X } from "lucide-react";
import { toast } from "sonner";

type Props = { open: boolean; onClose: () => void };
type WalletKind = "phantom" | "solflare" | "any";

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function phantomBrowseUrl(appUrl: string) {
  return `https://phantom.app/ul/browse/${encodeURIComponent(appUrl)}?ref=${encodeURIComponent(appUrl)}`;
}

export function WalletConnectModal({ open, onClose }: Props) {
  const linkWalletAddress = useGameStore((s) => s.linkWalletAddress);
  const connectWallet = useGameStore((s) => s.connectWallet);
  const refreshTokenBalance = useGameStore((s) => s.refreshTokenBalance);
  const [busy, setBusy] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [embedded, setEmbedded] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmbedded(isEmbeddedFrame());
    void waitForSolanaProvider(1000).then((p) => setHasInjected(!!p));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const appUrl =
    typeof window !== "undefined" ? window.location.href.split("#")[0]! : "";

  const breakOut = () => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href;
        return;
      }
    } catch {
      /* cross-origin */
    }
    window.open(window.location.href, "_blank", "noopener,noreferrer");
    toast.message("Opened full page — connect there");
  };

  const finish = async (address: string, method: "extension" | "manual") => {
    useGameStore.setState({
      walletAddress: address,
      walletMethod: method,
      tokenError: null,
    });
    await refreshTokenBalance();
    toast.success(
      method === "extension" ? "Wallet connected" : "Address linked",
    );
    onClose();
  };

  const run = async (kind: WalletKind) => {
    setBusy(kind);
    try {
      if (embedded) {
        breakOut();
        return;
      }
      if (kind === "phantom") {
        const w = window as unknown as {
          phantom?: {
            solana?: {
              connect: (o?: {
                onlyIfTrusted?: boolean;
              }) => Promise<{ publicKey: { toString(): string } }>;
            };
          };
        };
        if (w.phantom?.solana?.connect) {
          const res = await w.phantom.solana.connect({ onlyIfTrusted: false });
          await finish(res.publicKey.toString(), "extension");
          return;
        }
        if (isMobile()) {
          window.location.href = phantomBrowseUrl(appUrl);
          return;
        }
        window.open("https://phantom.app/download", "_blank", "noopener");
        toast.error("Install / unlock Phantom, refresh, connect again");
        return;
      }
      if (kind === "solflare") {
        const w = window as unknown as {
          solflare?: {
            connect: () => Promise<{ publicKey: { toString(): string } }>;
          };
        };
        if (w.solflare?.connect) {
          const res = await w.solflare.connect();
          await finish(res.publicKey.toString(), "extension");
          return;
        }
        window.open("https://solflare.com/download", "_blank", "noopener");
        toast.error("Install Solflare, refresh, connect again");
        return;
      }
      const res = await connectWallet();
      if (!res.ok) {
        if (!getSolanaProvider() && isMobile()) {
          window.location.href = phantomBrowseUrl(appUrl);
          return;
        }
        toast.error(res.error ?? "Connect failed");
        return;
      }
      toast.success("Wallet connected");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connect failed";
      toast.error(
        /reject|denied|cancel/i.test(msg)
          ? "You rejected the request in the wallet"
          : msg,
      );
    } finally {
      setBusy(null);
    }
  };

  const onPaste = async () => {
    if (!isValidSolanaAddress(paste)) {
      toast.error("Invalid Solana address");
      return;
    }
    setBusy("paste");
    const res = await linkWalletAddress(paste.trim());
    setBusy(null);
    if (!res.ok) toast.error(res.error ?? "Link failed");
    else {
      toast.success("Address linked · balance loaded");
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Connect wallet
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              $bLOkz · {SOLANA_TOKEN.shortMint}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {embedded ? (
          <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs">
            <p className="mb-2 font-medium">Popups blocked in this embed.</p>
            <Button size="sm" className="w-full" onClick={breakOut}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open full page
            </Button>
          </div>
        ) : null}

        {!hasInjected && !embedded ? (
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            No extension detected — install Phantom or paste address.
          </p>
        ) : null}

        <div className="space-y-2">
          {(
            [
              ["phantom", "Phantom", "Recommended"],
              ["solflare", "Solflare", "Browser or mobile"],
              ["any", "Other injected", "Any Solana wallet"],
            ] as const
          ).map(([id, name, hint]) => (
            <button
              key={id}
              type="button"
              disabled={!!busy}
              onClick={() => void run(id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)]",
                "bg-[var(--color-elevated)] px-3 py-3 text-left hover:border-[var(--color-primary)]/40",
                "disabled:opacity-60",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                  <Wallet className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="text-xs text-[var(--color-muted)]">{hint}</div>
                </div>
              </div>
              <Badge variant={busy === id ? "muted" : "success"}>
                {busy === id ? "…" : "Connect"}
              </Badge>
            </button>
          ))}
        </div>

        <div className="my-4 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          or paste
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Solana address…"
            className="font-mono text-xs"
          />
          <Button
            variant="secondary"
            disabled={!!busy || !paste.trim()}
            onClick={() => void onPaste()}
          >
            <Link2 className="h-4 w-4" />
            Link
          </Button>
        </div>
      </div>
    </div>
  );
}
