import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, MoreHorizontal, RefreshCw, ArrowUp, ArrowDown, Sparkles, TrendingUp, Bot, Send } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartInVest — AI-Powered Portfolio" },
      { name: "description", content: "Track investments and get AI insights on your portfolio performance." },
    ],
  }),
  component: Index,
});

type Range = "1m" | "2m" | "3m" | "1y" | "max";

const seriesByRange: Record<Range, { label: string; v: number }[]> = {
  "1m": gen(30, 140000, 0.02),
  "2m": gen(60, 130000, 0.025),
  "3m": gen(90, 120000, 0.03),
  "1y": gen(52, 90000, 0.04),
  max: gen(60, 50000, 0.06),
};

function gen(n: number, start: number, vol: number) {
  let v = start;
  return Array.from({ length: n }, (_, i) => {
    v = v * (1 + (Math.sin(i / 3) * 0.4 + 0.6) * vol * 0.4 + (Math.random() - 0.3) * vol * 0.2);
    return { label: `${i}`, v: Math.round(v) };
  });
}

const investments = [
  { name: "Portfolio Investment", value: "R100 000", pct: 2, pl: "R2 000" },
  { name: "Unit Trusts", value: "R80 000", pct: -2, pl: "-R1 500" },
  { name: "ETFs", value: "R0", pct: 0, pl: "R0" },
  { name: "Equities", value: "R25 000", pct: 15, pl: "R5 500" },
  { name: "Crypto Assets", value: "R16 500", pct: 65, pl: "R6 500" },
];

const aiInsights = [
  { title: "Rebalance opportunity", body: "Your Crypto allocation is up 65%. Consider taking partial profits to rebalance toward Unit Trusts which are underweight." },
  { title: "Risk alert", body: "Unit Trusts down 2% this month. Top holding fees are above category median — review for lower-cost alternatives." },
  { title: "Tax-smart move", body: "You have R8.5k of TFSA room left this tax year. Allocating now could shield future Equities gains." },
];

function Index() {
  const [range, setRange] = useState<Range>("1m");
  const data = useMemo(() => seriesByRange[range], [range]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      {/* Hero */}
      <div className="px-5 pt-6 pb-10 bg-[var(--gradient-hero)]">
        <div className="mx-auto max-w-xl">
          <header className="flex items-center justify-between">
            <button className="rounded-full p-2 hover:bg-secondary transition" aria-label="Back">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-lg font-semibold">SmartInVest</h1>
            <div className="flex items-center gap-1 bg-secondary rounded-full px-1 py-1">
              <button className="p-1.5 rounded-full hover:bg-muted" aria-label="More"><MoreHorizontal className="size-4" /></button>
              <div className="w-px h-4 bg-border" />
              <button className="p-1.5 rounded-full hover:bg-muted" aria-label="Refresh"><RefreshCw className="size-4" /></button>
            </div>
          </header>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <h2 className="text-5xl font-bold tracking-tight">R221 500</h2>
              <ArrowUp className="size-7 text-[oklch(var(--success))] text-primary" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 divide-x divide-border">
            <div className="pr-4">
              <p className="text-xs text-muted-foreground">Profit &amp; Loss</p>
              <p className="text-xl font-bold mt-1">65<span className="text-sm">%</span></p>
            </div>
            <div className="pl-4 text-right">
              <p className="text-xs text-muted-foreground">Profit &amp; Loss Value</p>
              <p className="text-xl font-bold mt-1">R80 500</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 -mt-6 space-y-5">
        {/* Chart card */}
        <section className="bg-card rounded-3xl p-5 shadow-[var(--shadow-glow)]">
          <h3 className="font-semibold">SmartInVest Value Over Time</h3>
          <div className="mt-4 grid grid-cols-2 divide-x divide-border">
            <div className="pr-4">
              <p className="text-xs text-muted-foreground">1 m change</p>
              <p className="mt-1 flex items-center gap-1 font-bold text-primary"><ArrowUp className="size-4" />3.5%</p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground">daily change</p>
              <p className="mt-1 font-bold">0.7%</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-5">Growth in Rand</p>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 150)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 150)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <Tooltip
                  contentStyle={{ background: "oklch(0.23 0.035 260)", border: "1px solid oklch(0.3 0.04 260)", borderRadius: 12, color: "white" }}
                  labelFormatter={() => ""}
                  formatter={(v: number) => [`R${v.toLocaleString()}`, "Value"]}
                />
                <Area type="monotone" dataKey="v" stroke="oklch(0.72 0.19 150)" strokeWidth={2} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>13 Jul</span><span>28 Jul</span><span>13 Aug</span>
          </div>

          <div className="mt-5 flex items-center justify-between bg-background/40 rounded-full p-1">
            {(["1m", "2m", "3m", "1y", "max"] as Range[]).map((r) => (
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

        {/* Investments */}
        <section>
          <h3 className="text-xl font-bold mb-3">Your investments</h3>
          <div className="space-y-3">
            {investments.map((it) => {
              const positive = it.pct > 0;
              const neutral = it.pct === 0;
              return (
                <div key={it.name} className="bg-card rounded-2xl p-5">
                  <p className="font-semibold">{it.name}</p>
                  <div className="grid grid-cols-2 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Value</p>
                      <p className="font-bold mt-1">{it.value}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Profit &amp; Loss Value</p>
                      <p className="font-bold mt-1">
                        <span className={cn(neutral ? "text-foreground" : positive ? "text-primary" : "text-destructive")}>
                          {neutral ? "0%" : `${positive ? "+" : ""}${it.pct}%`}
                        </span>
                        <span className="text-muted-foreground"> | </span>
                        <span>{it.pl}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
  return "Your portfolio is +65% YTD at R221.5k. Strongest: Crypto +65%. Weakest: Unit Trusts -2%. Want a rebalancing plan?";
}
