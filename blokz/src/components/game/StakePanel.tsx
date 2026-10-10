import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { WalletConnectModal } from "./WalletConnectModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  canUnstake,
  claimStatus,
  estimateDailyYield,
  formatDuration,
  STAKE_LOCK_MS,
} from "@/lib/game/rewards";
import {
  formatTokenAmount,
  isEmbeddedFrame,
  shortAddress,
  SOLANA_TOKEN,
} from "@/lib/game/solana";
import { useGameStore } from "@/lib/game/store";
import {
  ExternalLink,
  Gift,
  Lock,
  RefreshCw,
  Unlock,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

export function StakePanel() {
  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const balance = useGameStore((s) => s.balance);
  const staked = useGameStore((s) => s.staked);
  const stakedAt = useGameStore((s) => s.stakedAt);
  const pendingStakeRewards = useGameStore((s) => s.pendingStakeRewards);
  const lastAccrualAt = useGameStore((s) => s.lastAccrualAt);
  const lastMonthlyClaimAt = useGameStore((s) => s.lastMonthlyClaimAt);
  const totalRewardsClaimed = useGameStore((s) => s.totalRewardsClaimed);
  const walletStartedAt = useGameStore((s) => s.walletStartedAt);
  const walletAddress = useGameStore((s) => s.walletAddress);
  const walletMethod = useGameStore((s) => s.walletMethod);
  const tokenBalance = useGameStore((s) => s.tokenBalance);
  const tokenLoading = useGameStore((s) => s.tokenLoading);
  const tokenError = useGameStore((s) => s.tokenError);
  const lastTokenSyncAt = useGameStore((s) => s.lastTokenSyncAt);
  const stake = useGameStore((s) => s.stake);
  const unstake = useGameStore((s) => s.unstake);
  const claimRewards = useGameStore((s) => s.claimRewards);
  const disconnectWallet = useGameStore((s) => s.disconnectWallet);
  const refreshTokenBalance = useGameStore((s) => s.refreshTokenBalance);

  const [amount, setAmount] = useState("100");
  const [now, setNow] = useState(0);
  const [walletModal, setWalletModal] = useState(false);
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    setEmbedded(isEmbeddedFrame());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!walletAddress || !hasHydrated) return;
    void refreshTokenBalance();
    const id = window.setInterval(() => void refreshTokenBalance(), 20_000);
    return () => window.clearInterval(id);
  }, [walletAddress, refreshTokenBalance, hasHydrated]);

  if (!hasHydrated || now === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-[var(--color-muted)]">
          Loading stake…
        </CardContent>
      </Card>
    );
  }

  const n = Math.floor(Number(amount) || 0);
  const freeOnChain = Math.floor(tokenBalance);
  const lock = canUnstake(staked, stakedAt, now);
  const status = claimStatus(
    staked,
    stakedAt,
    pendingStakeRewards,
    lastAccrualAt,
    lastMonthlyClaimAt,
    walletStartedAt,
    now,
  );
  const claimWaitMs =
    status.nextAt != null ? Math.max(0, status.nextAt - now) : 0;
  const dailyEst = estimateDailyYield(staked);

  const openFullPage = () => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href;
        return;
      }
    } catch {
      /* ignore */
    }
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrandLogo size={28} />
          Stake $bLOkz
        </CardTitle>
        <CardDescription>
          Token-2022 mint {SOLANA_TOKEN.shortMint}. Site:{" "}
          <a
            className="text-[var(--color-primary)] underline-offset-2 hover:underline"
            href={SOLANA_TOKEN.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SOLANA_TOKEN.website.replace("https://", "")}
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-[var(--color-primary)]" />
              Solana · $bLOkz
            </div>
            <Badge variant="success">Token-2022</Badge>
          </div>
          <code className="block break-all text-[11px] text-[var(--color-muted)]">
            {SOLANA_TOKEN.mint}
          </code>
          {embedded && !walletAddress ? (
            <Button size="sm" onClick={openFullPage}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open full page
            </Button>
          ) : null}
          {!walletAddress ? (
            <Button className="w-full" onClick={() => setWalletModal(true)}>
              <Wallet className="h-4 w-4" />
              Connect wallet
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted" className="font-mono">
                  {shortAddress(walletAddress, 6)}
                </Badge>
                <Badge variant={walletMethod === "manual" ? "warn" : "success"}>
                  {walletMethod === "manual" ? "pasted" : "extension"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={tokenLoading}
                  onClick={() => void refreshTokenBalance()}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${tokenLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void disconnectWallet()}
                >
                  Disconnect
                </Button>
              </div>
              <p className="break-all font-mono text-[11px] text-[var(--color-subtle)]">
                {walletAddress}
              </p>
              {tokenError ? (
                <p className="text-xs text-[var(--color-danger)]">{tokenError}</p>
              ) : (
                <p className="text-xs text-[var(--color-muted)]">
                  On-chain:{" "}
                  <span className="font-semibold text-[var(--color-primary)]">
                    {formatTokenAmount(tokenBalance)} $bLOkz
                  </span>
                  {lastTokenSyncAt
                    ? ` · ${Math.max(0, Math.round((now - lastTokenSyncAt) / 1000))}s ago`
                    : null}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                window.open(SOLANA_TOKEN.tradeUrl, "_blank", "noopener")
              }
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(SOLANA_TOKEN.website, "_blank", "noopener")
              }
            >
              Website
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="On-chain free"
            value={
              walletAddress
                ? `${formatTokenAmount(tokenBalance)} $bLOkz`
                : "—"
            }
            accent
          />
          <Metric
            label="Staked"
            value={`${formatTokenAmount(staked)} $bLOkz`}
            accent
          />
          <Metric
            label="Forge credits"
            value={`${formatTokenAmount(balance)} $bLOkz`}
          />
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gift className="h-4 w-4 text-[var(--color-primary)]" />
              Rewards
            </div>
            {staked > 0 ? (
              <Badge variant="success">Staker</Badge>
            ) : (
              <Badge variant="warn">Non-staker</Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {staked > 0
              ? `Pending ~${status.pendingPreview.toFixed(2)} · ~${dailyEst}/day`
              : `Monthly drip: ${status.amount} $bLOkz`}
          </p>
          <Button className="w-full" onClick={() => {
            const res = claimRewards();
            if (!res.ok) toast.error(res.error);
            else if (res.amount != null) toast.success(`+${res.amount} $bLOkz`);
          }} disabled={!status.ready}>
            <Gift className="h-4 w-4" />
            {status.ready
              ? `Claim ${status.amount}`
              : formatDuration(claimWaitMs)}
          </Button>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
            Amount
          </label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              disabled={!walletAddress || freeOnChain <= 0}
              onClick={() => {
                const res = stake(n);
                if (!res.ok) toast.error(res.error);
                else toast.success(`Staked ${n}`);
              }}
            >
              <Lock className="h-4 w-4" />
              Stake
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              disabled={staked > 0 && !lock.ok}
              onClick={() => {
                const res = unstake(n);
                if (!res.ok) toast.error(res.error);
                else toast.success(`Unstaked ${n}`);
              }}
            >
              <Unlock className="h-4 w-4" />
              Unstake
            </Button>
          </div>
          {staked > 0 && !lock.ok ? (
            <p className="text-xs text-[var(--color-muted)]">
              12h lock · {formatDuration(lock.waitMs)} left (top-up restarts{" "}
              {Math.round(STAKE_LOCK_MS / 3_600_000)}h)
            </p>
          ) : null}
        </div>
      </CardContent>
      <WalletConnectModal
        open={walletModal}
        onClose={() => setWalletModal(false)}
      />
    </Card>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
      <div className="mb-1 text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
        {label}
      </div>
      <div
        className={`text-base font-semibold tabular ${
          accent ? "text-[var(--color-primary)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
