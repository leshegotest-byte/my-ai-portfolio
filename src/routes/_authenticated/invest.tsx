import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles, Loader2, TrendingUp, Shield, Zap, Search, SlidersHorizontal, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { initiateVodaPayPayment } from "@/lib/vodapay";
import { AssetAnalysis } from "@/components/AssetAnalysis";
import { WatchlistButton } from "@/components/WatchlistButton";
import { rankInstruments, SECTORS, type InstrumentLite, type Preferences } from "@/lib/recommendations";

export const Route = createFileRoute("/_authenticated/invest")({
  head: () => ({ meta: [{ title: "Invest — SmartInVest" }] }),
  component: InvestPage,
});

const riskMeta: Record<string, { icon: typeof Shield; tone: string }> = {
  Low: { icon: Shield, tone: "text-[oklch(0.75_0.15_200)]" },
  Medium: { icon: TrendingUp, tone: "text-primary" },
  High: { icon: Zap, tone: "text-destructive" },
};

type View = "browse" | "watchlist";

function InvestPage() {
  const [instruments, setInstruments] = useState<InstrumentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("browse");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string | null>(null);
  const [filterSector, setFilterSector] = useState<string | null>(null);
  const [minReturn, setMinReturn] = useState(0);
  const [minDividend, setMinDividend] = useState(0);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  const [analyzing, setAnalyzing] = useState<InstrumentLite | null>(null);
  const [buying, setBuying] = useState<InstrumentLite | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const [instRes, watchRes, prefRes] = await Promise.all([
        supabase.from("instruments").select("*").order("category"),
        u.user ? supabase.from("watchlist").select("instrument_id").eq("user_id", u.user.id) : Promise.resolve({ data: [] as any[] }),
        u.user ? supabase.from("user_preferences").select("*").eq("user_id", u.user.id).maybeSingle() : Promise.resolve({ data: null as any }),
      ]);
      if (instRes.error) toast.error(instRes.error.message);
      else setInstruments((instRes.data ?? []) as InstrumentLite[]);
      setWatchlistIds(new Set(((watchRes as any).data ?? []).map((w: any) => w.instrument_id)));
      const p = (prefRes as any).data;
      if (p) {
        setPreferences({
          risk_appetite: p.risk_appetite,
          investment_goal: p.investment_goal,
          investment_type: p.investment_type,
          investment_amount: Number(p.investment_amount),
          liquidity: p.liquidity,
          sectors: p.sectors ?? [],
        });
      }
      setLoading(false);
    })();
  }, []);

  const refreshWatchlist = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from("watchlist").select("instrument_id").eq("user_id", u.user.id);
    setWatchlistIds(new Set((data ?? []).map((w) => w.instrument_id)));
  };

  const filtered = useMemo(() => {
    let list = instruments;
    if (view === "watchlist") list = list.filter((i) => watchlistIds.has(i.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sector.toLowerCase().includes(q) ||
          (i.ticker ?? "").toLowerCase().includes(q)
      );
    }
    if (filterRisk) list = list.filter((i) => i.risk_level === filterRisk);
    if (filterSector) list = list.filter((i) => i.sector === filterSector);
    if (minReturn > 0) list = list.filter((i) => Number(i.expected_return) >= minReturn);
    if (minDividend > 0) list = list.filter((i) => Number(i.dividend_yield) >= minDividend);
    if (preferences) list = rankInstruments(list, preferences);
    return list;
  }, [instruments, view, watchlistIds, search, filterRisk, filterSector, minReturn, minDividend, preferences]);

  const activeFilters = [filterRisk, filterSector, minReturn > 0 ? `≥${minReturn}%` : null, minDividend > 0 ? `≥${minDividend}% div` : null].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <div className="px-5 pt-6 pb-6 bg-[var(--gradient-hero)]">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          <Link to="/" className="rounded-full p-2 bg-secondary hover:bg-muted transition" aria-label="Back">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">Invest</h1>
          <div className="size-8 rounded-xl bg-primary/15 grid place-items-center">
            <Sparkles className="size-4 text-primary" />
          </div>
        </div>

        <div className="mx-auto max-w-xl mt-5">
          <div className="relative">
            <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, sector, ticker…"
              className="w-full bg-card border border-border rounded-full pl-11 pr-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setView("browse")}
              className={cn("text-sm px-4 py-1.5 rounded-full transition whitespace-nowrap", view === "browse" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
            >
              All
            </button>
            <button
              onClick={() => setView("watchlist")}
              className={cn("text-sm px-4 py-1.5 rounded-full transition whitespace-nowrap inline-flex items-center gap-1", view === "watchlist" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
            >
              <Star className="size-3" /> Watchlist ({watchlistIds.size})
            </button>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn("text-sm px-4 py-1.5 rounded-full transition whitespace-nowrap inline-flex items-center gap-1 ml-auto", activeFilters.length > 0 || filtersOpen ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary text-muted-foreground")}
            >
              <SlidersHorizontal className="size-3" /> Filters{activeFilters.length > 0 && ` · ${activeFilters.length}`}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 -mt-2 space-y-4">
        {filtersOpen && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Risk</p>
              <div className="flex gap-2">
                {["Low", "Medium", "High"].map((r) => (
                  <button key={r}
                    onClick={() => setFilterRisk(filterRisk === r ? null : r)}
                    className={cn("flex-1 text-xs py-2 rounded-full border transition", filterRisk === r ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Sector</p>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map((s) => (
                  <button key={s}
                    onClick={() => setFilterSector(filterSector === s ? null : s)}
                    className={cn("text-xs px-3 py-1.5 rounded-full border transition", filterSector === s ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Min return: {minReturn}%</p>
                <input type="range" min={0} max={20} value={minReturn} onChange={(e) => setMinReturn(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Min dividend: {minDividend}%</p>
                <input type="range" min={0} max={10} value={minDividend} onChange={(e) => setMinDividend(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>
            <button onClick={() => { setFilterRisk(null); setFilterSector(null); setMinReturn(0); setMinDividend(0); }}
              className="text-xs text-muted-foreground hover:text-foreground underline">
              Clear all filters
            </button>
          </div>
        )}

        {!preferences && !loading && (
          <Link to="/preferences" className="block rounded-2xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Personalize your recommendations
            </p>
            <p className="text-xs text-muted-foreground mt-1">Set your investment preferences to see AI-ranked picks tailored to you.</p>
          </Link>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <p className="font-semibold">No instruments found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((i: any) => {
              const Meta = riskMeta[i.risk_level] ?? riskMeta.Medium;
              const Icon = Meta.icon;
              const score: number | undefined = i._score;
              return (
                <button
                  key={i.id}
                  onClick={() => setAnalyzing(i)}
                  className="w-full text-left bg-card rounded-2xl p-5 hover:ring-2 hover:ring-primary/30 transition relative"
                >
                  <div className="absolute top-3 right-3">
                    <WatchlistButton instrumentId={i.id} />
                  </div>
                  <div className="pr-9">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{i.name}</p>
                      {score !== undefined && score >= 70 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {score}% match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{i.sector} · {i.ticker ?? i.category}</p>
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{i.description}</p>
                  </div>
                  <div className="grid grid-cols-3 mt-4 pt-4 border-t border-border gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Price</p>
                      <p className="font-bold text-sm mt-0.5">R{Number(i.price).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Return</p>
                      <p className="font-bold text-sm mt-0.5 text-primary">+{i.expected_return}%</p>
                    </div>
                    <div className={cn("flex items-center justify-end gap-1 text-xs font-semibold", Meta.tone)}>
                      <Icon className="size-3.5" /> {i.risk_level}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {analyzing && (
        <AssetAnalysis
          instrument={analyzing}
          preferences={preferences}
          onClose={() => { setAnalyzing(null); refreshWatchlist(); }}
          onBuy={() => { setBuying(analyzing); setAnalyzing(null); }}
        />
      )}
      {buying && <PurchaseSheet instrument={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}

const amountSchema = z
  .number({ invalid_type_error: "Enter an amount" })
  .min(50, "Minimum R50")
  .max(10_000_000, "Amount too large");

function PurchaseSheet({ instrument, onClose }: { instrument: InstrumentLite; onClose: () => void }) {
  const [mode, setMode] = useState<"zar" | "shares">("zar");
  const [amount, setAmount] = useState<string>("1000");
  const [sharesInput, setSharesInput] = useState<string>("1");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const price = Number(instrument.price);
  const num = mode === "zar" ? (parseFloat(amount) || 0) : (parseFloat(sharesInput) || 0) * price;
  const units = num / price;
  const projected = num * (1 + Number(instrument.expected_return) / 100);
  const isFractional = units > 0 && units < 1;

  const buy = async () => {
    const parsed = amountSchema.safeParse(num);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const amountInCents = Math.round(num * 100);
      const myBridge = typeof window !== "undefined" ? window.my : undefined;
      if (myBridge && typeof myBridge.postMessage === "function") {
        toast.info("Sending payment to VodaPay...");
        await initiateVodaPayPayment(amountInCents);
      }

      const { error } = await supabase.from("purchases").insert({
        user_id: u.user.id,
        instrument_id: instrument.id,
        amount: num,
        units: Number(units.toFixed(6)),
      });
      if (error) throw error;

      toast.success(`Purchased ${units.toFixed(4)} shares of ${instrument.name}`);
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-[var(--shadow-glow)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-12 bg-border rounded-full mx-auto mb-4 sm:hidden" />
        <h3 className="text-xl font-bold">{instrument.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{instrument.description}</p>

        <div className="grid grid-cols-3 gap-2 mt-5">
          <Stat label="Share price" value={`R${price.toLocaleString()}`} />
          <Stat label="Return" value={`+${instrument.expected_return}%`} accent />
          <Stat label="Risk" value={instrument.risk_level} />
        </div>

        <div className="mt-5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary">
          <Sparkles className="size-3" /> Fractional shares supported — invest from R50
        </div>

        <div className="mt-4 flex bg-background/40 rounded-full p-1">
          <button
            onClick={() => setMode("zar")}
            className={cn("flex-1 text-xs py-2 rounded-full font-medium transition", mode === "zar" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            By amount (ZAR)
          </button>
          <button
            onClick={() => setMode("shares")}
            className={cn("flex-1 text-xs py-2 rounded-full font-medium transition", mode === "shares" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            By shares
          </button>
        </div>

        {mode === "zar" ? (
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground ml-3">Amount (ZAR)</label>
            <input
              type="number"
              value={amount}
              min={50}
              step="50"
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 bg-transparent border border-border rounded-full px-4 py-3 text-lg font-semibold outline-none focus:border-primary"
            />
            <div className="flex gap-2 mt-3">
              {[50, 500, 1000, 5000].map((v) => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className="flex-1 text-xs py-2 rounded-full bg-secondary hover:bg-muted transition">
                  R{v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground ml-3">Shares (fractions allowed)</label>
            <input
              type="number"
              value={sharesInput}
              min={0}
              step="0.0001"
              onChange={(e) => setSharesInput(e.target.value)}
              className="w-full mt-1 bg-transparent border border-border rounded-full px-4 py-3 text-lg font-semibold outline-none focus:border-primary"
            />
            <div className="flex gap-2 mt-3">
              {[0.1, 0.5, 1, 5].map((v) => (
                <button key={v} onClick={() => setSharesInput(String(v))}
                  className="flex-1 text-xs py-2 rounded-full bg-secondary hover:bg-muted transition">
                  {v} {v < 1 && "share"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-background/40 border border-border p-4 space-y-2 text-sm">
          <Row label={mode === "zar" ? "Shares you'll own" : "Cost"} value={mode === "zar" ? `${units.toFixed(4)} shares` : `R${num.toFixed(2)}`} />
          {isFractional && (
            <Row label="Ownership" value={`${(units * 100).toFixed(2)}% of 1 share`} />
          )}
          <Row label="Projected value (1y)" value={`R${Math.round(projected).toLocaleString()}`} accent />
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full py-3 bg-secondary font-semibold hover:bg-muted transition">
            Cancel
          </button>
          <button
            onClick={buy}
            disabled={submitting}
            className="flex-1 rounded-full py-3 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Confirm purchase
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-3">Payments processed securely via VodaPay.</p>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border p-3 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("font-bold mt-1 text-sm", accent && "text-primary")}>{value}</p>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", accent && "text-primary")}>{value}</span>
    </div>
  );
}
