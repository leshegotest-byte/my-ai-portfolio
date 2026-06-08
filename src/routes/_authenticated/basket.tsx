import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Layers, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { initiateVodaPayPayment } from "@/lib/vodapay";

export const Route = createFileRoute("/_authenticated/basket")({
  head: () => ({ meta: [{ title: "Build a Basket — SmartInVest" }] }),
  component: BasketPage,
});

type Instrument = {
  id: string;
  name: string;
  ticker: string | null;
  sector: string;
  category: string;
  price: number;
  expected_return: number;
  risk_level: string;
};

type Allocation = { instrument: Instrument; amount: string };

function BasketPage() {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<string>("500");
  const [items, setItems] = useState<Allocation[]>([]);
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("instruments")
        .select("id, name, ticker, sector, category, price, expected_return, risk_level")
        .order("name");
      if (error) toast.error(error.message);
      else setInstruments((data ?? []) as Instrument[]);
      setLoading(false);
    })();
  }, []);

  const budgetNum = parseFloat(budget) || 0;
  const totalAllocated = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const remaining = budgetNum - totalAllocated;
  const overBudget = remaining < -0.0001;

  const addItem = (inst: Instrument) => {
    if (items.find((i) => i.instrument.id === inst.id)) {
      toast.info("Already in basket");
      return;
    }
    setItems((prev) => [...prev, { instrument: inst, amount: "" }]);
    setPicker(false);
    setSearch("");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.instrument.id !== id));
  const setAmount = (id: string, v: string) =>
    setItems((prev) => prev.map((i) => (i.instrument.id === id ? { ...i, amount: v } : i)));

  const splitEvenly = () => {
    if (items.length === 0 || budgetNum <= 0) return;
    const each = (budgetNum / items.length).toFixed(2);
    setItems((prev) => prev.map((i) => ({ ...i, amount: each })));
  };

  const available = useMemo(
    () =>
      instruments.filter(
        (i) =>
          !items.find((x) => x.instrument.id === i.id) &&
          (search.trim() === "" ||
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            (i.ticker ?? "").toLowerCase().includes(search.toLowerCase()) ||
            i.sector.toLowerCase().includes(search.toLowerCase()))
      ),
    [instruments, items, search]
  );

  const confirm = async () => {
    if (budgetNum < 50) return toast.error("Minimum total budget is R50");
    const filled = items.filter((i) => (parseFloat(i.amount) || 0) > 0);
    if (filled.length < 2) return toast.error("Add at least 2 stocks with allocations");
    if (overBudget) return toast.error("Allocations exceed your budget");
    for (const f of filled) {
      const a = parseFloat(f.amount);
      if (a < 10) return toast.error(`${f.instrument.name}: minimum R10 per allocation`);
    }

    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");

      const totalCents = Math.round(totalAllocated * 100);
      const myBridge = typeof window !== "undefined" ? window.my : undefined;
      if (myBridge && typeof myBridge.postMessage === "function") {
        toast.info("Sending payment to VodaPay...");
        await initiateVodaPayPayment(totalCents);
      }

      const rows = filled.map((f) => {
        const amt = parseFloat(f.amount);
        return {
          user_id: u.user!.id,
          instrument_id: f.instrument.id,
          amount: amt,
          units: Number((amt / Number(f.instrument.price)).toFixed(6)),
        };
      });
      const { error } = await supabase.from("purchases").insert(rows);
      if (error) throw error;

      toast.success(`Invested R${totalAllocated.toLocaleString()} across ${filled.length} stocks`);
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <div className="px-5 pt-6 pb-6 bg-[var(--gradient-hero)]">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          <Link to="/" className="rounded-full p-2 bg-secondary hover:bg-muted transition" aria-label="Back">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">Build a basket</h1>
          <div className="size-8 rounded-xl bg-primary/15 grid place-items-center">
            <Layers className="size-4 text-primary" />
          </div>
        </div>
        <p className="mx-auto max-w-xl text-center text-sm text-muted-foreground mt-3">
          Spread one amount across multiple stocks in a single transaction. Fractional shares included.
        </p>
      </div>

      <div className="mx-auto max-w-xl px-5 -mt-2 space-y-4">
        {/* Budget */}
        <section className="bg-card rounded-3xl p-5">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Total budget (ZAR)</label>
          <input
            type="number"
            min={50}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full mt-1 bg-transparent border-b-2 border-border focus:border-primary outline-none text-3xl font-bold py-2"
          />
          <div className="flex gap-2 mt-3">
            {[100, 500, 1000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setBudget(String(v))}
                className="flex-1 text-xs py-2 rounded-full bg-secondary hover:bg-muted transition"
              >
                R{v.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <Stat label="Allocated" value={`R${totalAllocated.toFixed(2)}`} />
            <Stat label="Remaining" value={`R${remaining.toFixed(2)}`} tone={overBudget ? "danger" : remaining < 0.01 ? "ok" : "muted"} />
            <Stat label="Stocks" value={`${items.length}`} />
          </div>
        </section>

        {/* Allocations */}
        <section className="bg-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your basket</h3>
            <button
              onClick={splitEvenly}
              disabled={items.length === 0}
              className="text-xs text-primary font-medium hover:underline disabled:opacity-30"
            >
              Split evenly
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4 text-center py-6">
              No stocks yet. Add at least 2 to diversify.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {items.map((it) => {
                const amt = parseFloat(it.amount) || 0;
                const units = amt / Number(it.instrument.price);
                const pct = budgetNum > 0 ? (amt / budgetNum) * 100 : 0;
                return (
                  <li key={it.instrument.id} className="rounded-2xl bg-background/40 border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{it.instrument.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {it.instrument.ticker ?? it.instrument.sector} · R{Number(it.instrument.price).toLocaleString()}/share
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(it.instrument.id)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition"
                        aria-label="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R</span>
                        <input
                          type="number"
                          min={0}
                          step="10"
                          value={it.amount}
                          onChange={(e) => setAmount(it.instrument.id, e.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent border border-border rounded-full pl-7 pr-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground min-w-[80px]">
                        <p>{units.toFixed(4)} shares</p>
                        <p className="text-primary font-semibold">{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    {pct > 0 && (
                      <div className="mt-2 h-1 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <button
            onClick={() => setPicker(true)}
            className="mt-3 w-full rounded-full py-3 border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition inline-flex items-center justify-center gap-2"
          >
            <Plus className="size-4" /> Add stock
          </button>
        </section>

        {overBudget && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            Allocations exceed your budget by R{Math.abs(remaining).toFixed(2)}.
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur p-4">
        <div className="mx-auto max-w-xl flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground uppercase">Total</p>
            <p className="font-bold">R{totalAllocated.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">/ R{budgetNum.toFixed(2)}</span></p>
          </div>
          <button
            onClick={confirm}
            disabled={submitting || items.length < 2 || totalAllocated <= 0 || overBudget}
            className="rounded-full px-6 py-3 bg-primary text-primary-foreground font-semibold disabled:opacity-40 inline-flex items-center gap-2 hover:opacity-90 transition"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Invest now
          </button>
        </div>
      </div>

      {/* Picker */}
      {picker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setPicker(false)}>
          <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="h-1 w-12 bg-border rounded-full mx-auto mb-3 sm:hidden" />
            <h3 className="font-bold mb-3 inline-flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Add to basket</h3>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ticker, sector…"
              className="w-full bg-background/40 border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:border-primary mb-3"
            />
            <div className="overflow-y-auto -mx-2 px-2 flex-1">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
              ) : available.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No matches.</p>
              ) : (
                <ul className="space-y-1.5">
                  {available.map((inst) => (
                    <li key={inst.id}>
                      <button
                        onClick={() => addItem(inst)}
                        className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-background/40 transition flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{inst.name}</p>
                          <p className="text-[10px] text-muted-foreground">{inst.ticker ?? inst.sector} · R{Number(inst.price).toLocaleString()}</p>
                        </div>
                        <span className="text-[10px] text-primary font-semibold ml-2">+{inst.expected_return}%</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" | "ok" | "muted" }) {
  return (
    <div className="rounded-xl bg-background/40 border border-border p-2">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p
        className={cn(
          "font-bold text-sm mt-0.5",
          tone === "danger" && "text-destructive",
          tone === "ok" && "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}
