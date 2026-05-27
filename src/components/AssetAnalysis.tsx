import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, Loader2, TrendingUp, Shield, Zap, Activity, DollarSign, Building2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getSuitability } from "@/lib/ai.functions";
import { suitabilityScore, type InstrumentLite, type Preferences } from "@/lib/recommendations";
import { cn } from "@/lib/utils";
import { WatchlistButton } from "./WatchlistButton";

function gen(n: number, start: number, vol: number) {
  let v = start;
  return Array.from({ length: n }, (_, i) => {
    v = v * (1 + (Math.sin(i / 4) * 0.3 + 0.5) * vol * 0.3 + (Math.random() - 0.45) * vol * 0.25);
    return { label: `${i}`, v: Math.round(v) };
  });
}

type Range = "1m" | "3m" | "1y" | "5y";

interface Props {
  instrument: InstrumentLite;
  preferences: Preferences | null;
  onClose: () => void;
  onBuy: () => void;
}

const riskMeta = {
  Low: { icon: Shield, tone: "text-[oklch(0.75_0.15_200)]" },
  Medium: { icon: TrendingUp, tone: "text-primary" },
  High: { icon: Zap, tone: "text-destructive" },
} as const;

export function AssetAnalysis({ instrument, preferences, onClose, onBuy }: Props) {
  const [range, setRange] = useState<Range>("1y");
  const data = useMemo(() => {
    const cfg = { "1m": [30, 0.04], "3m": [90, 0.06], "1y": [180, 0.1], "5y": [260, 0.18] } as const;
    const [n, vol] = cfg[range];
    return gen(n, instrument.price, vol);
  }, [range, instrument.price]);

  const callSuit = useServerFn(getSuitability);
  const [aiMsg, setAiMsg] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  const score = preferences ? suitabilityScore(instrument, preferences) : null;
  const Meta = riskMeta[instrument.risk_level] ?? riskMeta.Medium;
  const RIcon = Meta.icon;

  useEffect(() => {
    let cancelled = false;
    if (!preferences) return;
    setAiLoading(true);
    callSuit({
      data: {
        instrument: {
          name: instrument.name,
          category: instrument.category,
          risk_level: instrument.risk_level,
          sector: instrument.sector,
          expected_return: Number(instrument.expected_return),
          dividend_yield: Number(instrument.dividend_yield),
          volatility: Number(instrument.volatility),
        },
        preferences: {
          risk_appetite: preferences.risk_appetite,
          investment_goal: preferences.investment_goal,
          investment_type: preferences.investment_type,
          investment_amount: Number(preferences.investment_amount),
          liquidity: preferences.liquidity,
        },
      },
    })
      .then((r) => !cancelled && setAiMsg(r.message))
      .catch(() => !cancelled && setAiMsg(""))
      .finally(() => !cancelled && setAiLoading(false));
    return () => {
      cancelled = true;
    };
  }, [instrument.id, preferences, callSuit, instrument.name, instrument.category, instrument.risk_level, instrument.sector, instrument.expected_return, instrument.dividend_yield, instrument.volatility]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div
        className="min-h-full sm:py-8 px-0 sm:px-5 flex justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-xl bg-card sm:rounded-3xl shadow-[var(--shadow-glow)] my-0 sm:my-auto">
          <div className="sticky top-0 bg-card/95 backdrop-blur z-10 px-5 py-4 border-b border-border flex items-center justify-between rounded-t-3xl">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{instrument.ticker ?? instrument.category} · {instrument.sector}</p>
              <h2 className="text-lg font-bold truncate">{instrument.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <WatchlistButton instrumentId={instrument.id} />
              <button onClick={onClose} className="size-8 grid place-items-center rounded-full hover:bg-background/50" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Price + range */}
            <div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">R{Number(instrument.price).toLocaleString()}</p>
                  <p className="text-sm text-primary flex items-center gap-1">
                    <TrendingUp className="size-3.5" /> +{instrument.expected_return}% expected
                  </p>
                </div>
                <div className={cn("flex items-center gap-1 text-sm font-semibold", Meta.tone)}>
                  <RIcon className="size-4" /> {instrument.risk_level} risk
                </div>
              </div>

              <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.19 150)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.72 0.19 150)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.23 0.035 260)", border: "1px solid oklch(0.3 0.04 260)", borderRadius: 12, color: "white" }}
                      labelFormatter={() => ""}
                      formatter={(v: number) => [`R${v.toLocaleString()}`, "Price"]}
                    />
                    <Area type="monotone" dataKey="v" stroke="oklch(0.72 0.19 150)" strokeWidth={2} fill="url(#ag)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center justify-between bg-background/40 rounded-full p-1">
                {(["1m", "3m", "1y", "5y"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={cn(
                      "flex-1 text-sm py-2 rounded-full transition font-medium",
                      range === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* AI suitability */}
            {preferences && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="font-semibold text-sm">AI suitability</p>
                  {score !== null && (
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {score}/100 match
                    </span>
                  )}
                </div>
                {aiLoading ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" /> Analyzing fit with your profile…
                  </p>
                ) : aiMsg ? (
                  <p className="text-sm leading-relaxed text-foreground">{aiMsg}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Suitability based on your risk profile and goals.</p>
                )}
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <Stat icon={<Activity className="size-4" />} label="Volatility" value={`${(instrument.volatility * 100).toFixed(0)}%`} />
              <Stat icon={<DollarSign className="size-4" />} label="Dividend" value={`${instrument.dividend_yield}%`} />
              <Stat icon={<Building2 className="size-4" />} label="Market cap" value={`R${(instrument.market_cap / 1e9).toFixed(1)}B`} />
              <Stat icon={<TrendingUp className="size-4" />} label="Sector" value={instrument.sector} />
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-semibold mb-1">About</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{instrument.description}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 rounded-full py-3 bg-secondary font-semibold hover:bg-muted transition">
                Close
              </button>
              <button onClick={onBuy} className="flex-1 rounded-full py-3 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
                Buy now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-bold mt-1 text-sm">{value}</p>
    </div>
  );
}
