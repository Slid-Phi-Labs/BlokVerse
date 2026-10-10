import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
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
import { SOLANA_TOKEN } from "@/lib/game/solana";
import {
  ALLOCATIONS,
  FLOW_STEPS,
  TOKEN_SYMBOL,
  TOTAL_SUPPLY,
  emissionTimeline,
  projectWallet,
  type AllocationBucket,
} from "@/lib/game/tokenomics";
import { useGameStore } from "@/lib/game/store";
import { formatNumber } from "@/lib/utils";
import { ExternalLink, Waves, ArrowDownUp, Calculator } from "lucide-react";

export function TokenomicsPanel() {
  const balance = useGameStore((s) => s.balance);
  const staked = useGameStore((s) => s.staked);
  const [stakeSim, setStakeSim] = useState(String(Math.max(staked, 100)));

  const pieData = useMemo(
    () =>
      ALLOCATIONS.map((b) => ({
        name: b.label,
        value: b.pct,
        amount: b.amount,
        color: b.color,
        id: b.id,
      })),
    [],
  );

  const timeline = useMemo(() => emissionTimeline(90), []);
  const simStake = Math.max(0, Math.floor(Number(stakeSim) || 0));
  const proj = projectWallet(simStake, balance);
  const live = projectWallet(staked, balance);

  return (
    <div className="space-y-4">
      <Card className="border-[var(--color-primary)]/25">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="success">Live on Solana</Badge>
              <Badge variant="muted">V2</Badge>
            </div>
            <div className="text-sm font-semibold">$bLOkz mint</div>
            <code className="mt-0.5 block break-all text-xs text-[var(--color-muted)]">
              {SOLANA_TOKEN.mint}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() =>
                window.open(SOLANA_TOKEN.tradeUrl, "_blank", "noopener")
              }
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Trade
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                window.open(SOLANA_TOKEN.chartUrl, "_blank", "noopener")
              }
            >
              Chart
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="mb-2">
            <BrandLogo size={52} />
          </div>
          <CardTitle className="text-xl tracking-tight">
            $bLOkz distribution model
          </CardTitle>
          <CardDescription className="max-w-2xl text-pretty">
            Model supply {formatNumber(TOTAL_SUPPLY)} {TOKEN_SYMBOL}. In-game
            rewards use these bucket ratios. On-chain mint:{" "}
            {SOLANA_TOKEN.shortMint}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="52%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((e) => (
                    <Cell key={e.id} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, String(name)]}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {ALLOCATIONS.map((b) => (
              <BucketRow key={b.id} bucket={b} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Waves className="h-4 w-4 text-[var(--color-primary)]" />
            Emission curve (model)
          </CardTitle>
          <CardDescription>
            Illustrative in-game release over 90 days — not the pump.fun curve.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
              />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="play"
                stackId="1"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.35}
                name="Forge"
              />
              <Area
                type="monotone"
                dataKey="staking"
                stackId="1"
                stroke="var(--color-chain)"
                fill="var(--color-chain)"
                fillOpacity={0.35}
                name="Staking"
              />
              <Area
                type="monotone"
                dataKey="community"
                stackId="1"
                stroke="var(--color-btc)"
                fill="var(--color-btc)"
                fillOpacity={0.35}
                name="Community"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownUp className="h-4 w-4 text-[var(--color-primary)]" />
              Token flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FLOW_STEPS.map((s) => (
              <div
                key={s.title}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5"
              >
                <div className="text-sm font-semibold">{s.title}</div>
                <p className="text-xs text-[var(--color-muted)]">{s.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4 text-[var(--color-primary)]" />
              Yield calculator (in-game)
            </CardTitle>
            <CardDescription>
              Uses stake balance in the game wallet, not Phantom.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                Simulated stake
              </label>
              <Input
                value={stakeSim}
                onChange={(e) => setStakeSim(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric
                label="Daily (sim)"
                value={formatNumber(proj.dailyIfStaked)}
              />
              <Metric
                label="Monthly unstaked"
                value={formatNumber(proj.monthlyIfUnstaked)}
              />
              <Metric label="Your stake" value={formatNumber(staked)} />
              <Metric
                label="Live daily"
                value={formatNumber(live.dailyIfStaked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BucketRow({ bucket }: { bucket: AllocationBucket }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2.5">
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: bucket.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{bucket.label}</span>
          <span className="text-sm font-semibold tabular text-[var(--color-primary)]">
            {bucket.pct}%
          </span>
        </div>
        <p className="text-xs text-[var(--color-muted)]">{bucket.description}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-elevated)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-subtle)]">
        {label}
      </div>
      <div className="font-semibold tabular">{value}</div>
    </div>
  );
}
