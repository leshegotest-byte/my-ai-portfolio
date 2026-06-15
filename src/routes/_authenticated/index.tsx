import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUp, Sparkles, TrendingUp, Bot, Send, LogOut, Plus, Wallet, Settings, Layers, ArrowDownToLine, History } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "SmartInVest — AI-Powered Portfolio" },
      { name: "description", content: "Track investments and get AI insights on your portfolio performance." },
    ],
  }),
  component: Index,
});

type Range = "1D" | "1W" | "1M" | "3M" | "1Y";

const rangeConfig: Record<Range, { points: number; vol: number; label: string }> = {
  "1D": { points: 24, vol: 0.004, label: "today" },
  "1W": { points: 28, vol: 0.012, label: "this week" },
  "1M": { points: 30, vol: 0.025, label: "this month" },
  "3M": { points: 60, vol: 0.04, label: "last 3 months" },
  "1Y": { points: 52, vol: 0.08, label: "this year" },
};

function gen(n: number, end: number, vol: number, seed: number) {
  // walk backwards from current value so the line ends at `end`
  const out: { label: string; v: number }[] = [];
  let v = end;
  for (let i = 0; i < n; i++) {
    out.push({ label: `${i}`, v: Math.round(v) });
    const r = Math.sin((i + seed) * 1.3) * 0.5 + (((i * 9301 + 49297) % 233280) / 233280 - 0.5);
    v = v / (1 + r * vol);
  }
  return out.reverse();
}

type Purchase = {
  id: string;
  amount: number;
  units: number;
  created_at: string;
  status: string;
  instrument_id: string;
  instruments: { id: string; name: string; category: string; expected_return: number; price: number } | null;
};

const aiInsights = [
  { title: "Rebalance opportunity", body: "Your Crypto allocation is up 65%. Consider taking partial profits to rebalance toward Unit Trusts which are underweight." },
  { title: "Risk alert", body: "Unit Trusts down 2% this month. Top holding fees are above category median — review for lower-cost alternatives." },
  { title: "Tax-smart move", body: "You have R8.5k of TFSA room left this tax year. Allocating now could shield future Equities gains." },
];

const PIE_COLORS = [
  "oklch(0.72 0.19 150)",
  "oklch(0.68 0.18 250)",
  "oklch(0.75 0.17 60)",
  "oklch(0.7 0.2 320)",
  "oklch(0.72 0.18 20)",
  "oklch(0.7 0.15 190)",
  "oklch(0.75 0.16 110)",
];

function Index() {
  const [range, setRange] = useState<Range>("1M");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, amount, units, created_at, instruments(id, name, category, expected_return, price)")
        .order("created_at", { ascending: false });
      if (!error && data) setPurchases(data as unknown as Purchase[]);
      setLoadingP(false);
    })();
  }, []);

  const totalInvested = purchases.reduce((s, p) => s + Number(p.amount), 0);
  const baseValue = totalInvested > 0 ? 0 : 0;
  const totalValue = baseValue + totalInvested * 1.05;

  const cfg = rangeConfig[range];
  const data = useMemo(() => gen(cfg.points, Math.max(totalValue, 1000), cfg.vol, range.charCodeAt(0)), [range, totalValue, cfg.points, cfg.vol]);
  const periodStart = data[0]?.v ?? totalValue;
  const periodEnd = data[data.length - 1]?.v ?? totalValue;
  const periodChange = periodEnd - periodStart;
  const periodPct = periodStart > 0 ? (periodChange / periodStart) * 100 : 0;
  const positive = periodChange >= 0;

  // Allocation by instrument (current value = amount * (1 + expected_return/100))
  const allocation = useMemo(() => {
    const map = new Map<string, { name: string; value: number; invested: number }>();
    for (const p of purchases) {
      const name = p.instruments?.name ?? "Other";
      const val = Number(p.amount) * (1 + Number(p.instruments?.expected_return ?? 0) / 100);
      const cur = map.get(name) ?? { name, value: 0, invested: 0 };
      cur.value += val;
      cur.invested += Number(p.amount);
      map.set(name, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [purchases]);
  const allocTotal = allocation.reduce((s, a) => s + a.value, 0);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login", search: { redirect: "/" } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <div className="px-5 pt-6 pb-10 bg-[var(--gradient-hero)]">
        <div className="mx-auto max-w-xl">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/15 grid place-items-center">
                <Sparkles className="size-4 text-primary" />
              </div>
              <h1 className="text-lg font-semibold">SmartInVest</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/basket" className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-1 hover:bg-muted transition" aria-label="Build basket">
                <Layers className="size-4" /> Basket
              </Link>
              <Link to="/invest" className="rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold inline-flex items-center gap-1 hover:opacity-90 transition">
                <Plus className="size-4" /> Invest
              </Link>
              <Link to="/preferences" className="rounded-full p-2 bg-secondary hover:bg-muted transition" aria-label="Preferences">
                <Settings className="size-4" />
              </Link>
              <button onClick={logout} className="rounded-full p-2 bg-secondary hover:bg-muted transition" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </div>
          </header>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <h2 className="text-5xl font-bold tracking-tight">R{Math.round(totalValue).toLocaleString()}</h2>
              <ArrowUp className={cn("size-7", positive ? "text-primary" : "text-destructive rotate-180")} />
            </div>
            <p className={cn("text-sm mt-2 font-medium", positive ? "text-primary" : "text-destructive")}>
              {positive ? "+" : ""}R{Math.round(periodChange).toLocaleString()} ({positive ? "+" : ""}{periodPct.toFixed(2)}%) {cfg.label}
            </p>
          </div>

          <div className="mt-6 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mx-auto">
            <Sparkles className="size-3" /> Fractional shares from R50 — own a piece of any stock
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 -mt-6 space-y-5">
        {/* Performance chart */}
        <section className="bg-card rounded-3xl p-5 shadow-[var(--shadow-glow)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Portfolio performance</h3>
            <span className={cn("text-xs font-semibold", positive ? "text-primary" : "text-destructive")}>
              {positive ? "▲" : "▼"} {Math.abs(periodPct).toFixed(2)}%
            </span>
          </div>

          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={positive ? "oklch(0.72 0.19 150)" : "oklch(0.65 0.22 25)"} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={positive ? "oklch(0.72 0.19 150)" : "oklch(0.65 0.22 25)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <Tooltip
                  contentStyle={{ background: "oklch(0.23 0.035 260)", border: "1px solid oklch(0.3 0.04 260)", borderRadius: 12, color: "white" }}
                  labelFormatter={() => ""}
                  formatter={(v: number) => [`R${v.toLocaleString()}`, "Value"]}
                />
                <Area type="monotone" dataKey="v" stroke={positive ? "oklch(0.72 0.19 150)" : "oklch(0.65 0.22 25)"} strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center justify-between bg-background/40 rounded-full p-1">
            {(["1D", "1W", "1M", "3M", "1Y"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={cn(
                  "flex-1 text-sm py-2 rounded-full transition font-medium",
                  range === r ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </section>

        {/* Allocation pie */}
        <section className="bg-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Portfolio allocation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How your money is split across holdings</p>
            </div>
            <Link to="/basket" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
              <Layers className="size-3" /> Diversify
            </Link>
          </div>

          {loadingP ? (
            <div className="h-56 mt-4 animate-pulse rounded-2xl bg-background/40" />
          ) : allocation.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Make your first investment to see your allocation breakdown.</p>
            </div>
          ) : (
            <>
              <div className="h-56 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      onClick={(d: any) => setActiveSlice(activeSlice === d.name ? null : d.name)}
                    >
                      {allocation.map((a, i) => (
                        <Cell
                          key={a.name}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                          stroke="transparent"
                          opacity={activeSlice && activeSlice !== a.name ? 0.35 : 1}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "oklch(0.23 0.035 260)", border: "1px solid oklch(0.3 0.04 260)", borderRadius: 12, color: "white" }}
                      formatter={(v: number, _n, p: any) => [`R${Math.round(v).toLocaleString()} (${((v / allocTotal) * 100).toFixed(1)}%)`, p.payload.name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11, color: "oklch(0.7 0.02 260)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-2">
                {allocation.map((a, i) => {
                  const pct = (a.value / allocTotal) * 100;
                  const isActive = activeSlice === a.name;
                  return (
                    <li
                      key={a.name}
                      onClick={() => setActiveSlice(isActive ? null : a.name)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition",
                        isActive ? "bg-primary/10 border border-primary/30" : "bg-background/30 hover:bg-background/50"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-sm font-medium truncate">{a.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold">R{Math.round(a.value).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}% · invested R{Math.round(a.invested).toLocaleString()}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        {/* AI Insights */}
        <section className="bg-card rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/15 grid place-items-center">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Personalized for your portfolio</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {aiInsights.map((i) => (
              <li key={i.title} className="rounded-2xl border border-border p-4 bg-background/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <p className="font-medium text-sm">{i.title}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{i.body}</p>
              </li>
            ))}
          </ul>
          <AIChat />
        </section>

        {/* Investments list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold">Your investments</h3>
            <Link to="/invest" className="text-sm text-primary font-medium hover:underline">Browse +</Link>
          </div>

          {loadingP ? (
            <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : purchases.length === 0 ? (
            <Link to="/invest" className="block bg-card rounded-2xl p-6 text-center border border-dashed border-border hover:border-primary transition">
              <Wallet className="size-6 text-primary mx-auto mb-2" />
              <p className="font-semibold">No investments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start with as little as R50 — fractional shares supported</p>
            </Link>
          ) : (
            <div className="space-y-3">
              {purchases.map((p) => {
                const projected = Number(p.amount) * (1 + Number(p.instruments?.expected_return ?? 0) / 100);
                const pl = projected - Number(p.amount);
                const positive = pl >= 0;
                return (
                  <div key={p.id} className="bg-card rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{p.instruments?.name ?? "Investment"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.instruments?.category}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-2 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Invested</p>
                        <p className="font-bold mt-1">R{Number(p.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{Number(p.units).toFixed(4)} shares</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Projected P&amp;L</p>
                        <p className="font-bold mt-1">
                          <span className={cn(positive ? "text-primary" : "text-destructive")}>
                            {positive ? "+" : ""}R{Math.round(pl).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AIChat() {
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "ai", text: respond(q) }]);
    }, 400);
  };

  return (
    <div className="mt-4 rounded-2xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-2 px-1 pb-2">
        <Bot className="size-4 text-primary" />
        <p className="text-xs text-muted-foreground">Ask about your portfolio</p>
      </div>
      {msgs.length > 0 && (
        <div className="space-y-2 mb-3 max-h-56 overflow-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={cn("text-sm rounded-xl px-3 py-2", m.role === "user" ? "bg-secondary ml-6" : "bg-primary/10 mr-6 text-foreground")}>
              {m.text}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Should I rebalance crypto?"
          className="flex-1 bg-transparent border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={send} className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center hover:opacity-90 transition" aria-label="Send">
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}

function respond(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("crypto")) return "Crypto is +65% (R6.5k). Trimming ~20% would lock in gains and bring allocation back near your 10% target.";
  if (s.includes("risk")) return "Portfolio risk is moderate-high. Crypto and Equities drive 78% of volatility. Diversifying into ETFs would lower drawdown.";
  if (s.includes("buy") || s.includes("invest")) return "Based on momentum and your gaps, broad-market ETFs (e.g. Top 40) look attractive for new contributions.";
  return "Your portfolio is +65% YTD. Strongest: Crypto. Weakest: Unit Trusts. Want a rebalancing plan?";
}
