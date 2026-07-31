import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
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
import { shortAddress, SOLANA_TOKEN } from "@/lib/game/solana";
import { useGameStore } from "@/lib/game/store";
import { formatNumber } from "@/lib/utils";
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
  const tokenBalance = useGameStore((s) => s.tokenBalance);
  const tokenLoading = useGameStore((s) => s.tokenLoading);
  const tokenError = useGameStore((s) => s.tokenError);
  const stake = useGameStore((s) => s.stake);
  const unstake = useGameStore((s) => s.unstake);
  const claimRewards = useGameStore((s) => s.claimRewards);
  const connectWallet = useGameStore((s) => s.connectWallet);
  const disconnectWallet = useGameStore((s) => s.disconnectWallet);
  const refreshTokenBalance = useGameStore((s) => s.refreshTokenBalance);

  const [amount, setAmount] = useState("100");
  const [now, setNow] = useState(0);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!walletAddress || !hasHydrated) return;
    void refreshTokenBalance();
    const id = window.setInterval(() => void refreshTokenBalance(), 30_000);
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

  const onConnect = async () => {
    setConnecting(true);
    const res = await connectWallet();
    setConnecting(false);
    if (!res.ok) toast.error(res.error);
    else toast.success("Wallet connected · $bLOkz mint synced");
  };

  const onStake = () => {
    const res = stake(n);
    if (!res.ok) toast.error(res.error);
    else
      toast.success(
        `Staked ${formatNumber(n)} $bLOkz · 12h lock · mint ${SOLANA_TOKEN.shortMint}`,
      );
  };

  const onUnstake = () => {
    const res = unstake(n);
    if (!res.ok) toast.error(res.error);
    else toast.success(`Unstaked ${formatNumber(n)} $bLOkz`);
  };

  const onClaim = () => {
    const res = claimRewards();
    if (!res.ok) toast.error(res.error);
    else if (res.amount != null) {
      toast.success(
        res.tier === "staker"
          ? `Claimed ${formatNumber(res.amount)} accrued $bLOkz`
          : `Monthly drip +${formatNumber(res.amount)} $bLOkz`,
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrandLogo size={28} />
          Stake $bLOkz
        </CardTitle>
        <CardDescription>
          Staking is tied to the Solana mint{" "}
          <a
            href={SOLANA_TOKEN.solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            {SOLANA_TOKEN.shortMint}
          </a>
          . Connect Phantom, hold free tokens, stake → 12h lock · daily accrual.
          Non-stakers get a monthly drip.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-[var(--color-primary)]" />
              Solana wallet · $bLOkz
            </div>
            <Badge variant="success">Mint live</Badge>
          </div>
          <code className="block break-all text-[11px] text-[var(--color-muted)]">
            {SOLANA_TOKEN.mint}
          </code>
          {!walletAddress ? (
            <Button
              className="w-full"
              disabled={connecting}
              onClick={() => void onConnect()}
            >
              <Wallet className="h-4 w-4" />
              {connecting ? "Connecting…" : "Connect Phantom"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{shortAddress(walletAddress)}</Badge>
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
              {tokenError ? (
                <p className="text-xs text-[var(--color-danger)]">{tokenError}</p>
              ) : null}
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
              Buy $bLOkz
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(SOLANA_TOKEN.solscanUrl, "_blank", "noopener")
              }
            >
              Solscan
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="On-chain free"
            value={
              walletAddress ? `${formatNumber(freeOnChain)} $bLOkz` : "—"
            }
            accent
          />
          <Metric
            label="Staked"
            value={`${formatNumber(staked)} $bLOkz`}
            accent
          />
          <Metric
            label="Forge credits"
            value={`${formatNumber(balance)} $bLOkz`}
          />
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Gift className="h-4 w-4 text-[var(--color-primary)]" />
              Rewards
            </div>
            {staked > 0 ? (
              <Badge variant="success">Staker · accruing</Badge>
            ) : (
              <Badge variant="warn">Non-staker · monthly</Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            {staked > 0
              ? `Pending ~${status.pendingPreview.toFixed(2)} · ~${formatNumber(dailyEst)}/day at 2% of stake. First claim after 12h lock.`
              : `Monthly community drip: ${formatNumber(status.amount)} $bLOkz when unstaked (after wait).`}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Metric
              label={status.ready ? "Claimable now" : "Next / status"}
              value={
                status.ready
                  ? `${formatNumber(status.amount)} $bLOkz`
                  : formatDuration(claimWaitMs)
              }
              accent={status.ready}
            />
            <Metric
              label="Lifetime claimed"
              value={`${formatNumber(totalRewardsClaimed)} $bLOkz`}
            />
          </div>
          <Button className="w-full" onClick={onClaim} disabled={!status.ready}>
            <Gift className="h-4 w-4" />
            {status.ready
              ? `Claim ${formatNumber(status.amount)} $bLOkz`
              : (status.reason ?? `Wait ${formatDuration(claimWaitMs)}`)}
          </Button>
        </div>

        <div className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
          <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
            Amount ($bLOkz mint)
          </label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
          />
          <div className="flex flex-wrap gap-2">
            {[50, 100, 250, 500].map((q) => (
              <Button
                key={q}
                size="sm"
                variant="ghost"
                onClick={() => setAmount(String(q))}
              >
                {q}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAmount(String(Math.max(0, freeOnChain)))}
            >
              Max free
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={onStake}
              disabled={!walletAddress}
            >
              <Lock className="h-4 w-4" />
              Stake mint
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={onUnstake}
              disabled={staked > 0 && !lock.ok}
            >
              <Unlock className="h-4 w-4" />
              Unstake
            </Button>
          </div>
          {staked > 0 && (
            <p className="text-xs text-[var(--color-muted)]">
              {lock.ok ? (
                <>Minimum 12h lock complete — unstake available.</>
              ) : (
                <>
                  12h lock · unlocks in{" "}
                  <span className="font-semibold text-[var(--color-fg)]">
                    {formatDuration(lock.waitMs)}
                  </span>
                  . Top-up restarts the{" "}
                  {Math.round(STAKE_LOCK_MS / 3_600_000)}h timer.
                </>
              )}
            </p>
          )}
          {!walletAddress && (
            <p className="text-xs text-[var(--color-muted)]">
              Connect a wallet that holds {SOLANA_TOKEN.shortMint} to stake.
            </p>
          )}
        </div>
      </CardContent>
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
          accent ? "text-[var(--color-primary)]" : "text-[var(--color-fg)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
