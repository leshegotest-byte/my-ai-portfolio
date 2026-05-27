import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Loader2, TrendingUp, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { initiateVodaPayPayment } from "@/lib/vodapay";

type Instrument = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  expected_return: number;
  risk_level: "Low" | "Medium" | "High";
};

export const Route = createFileRoute("/_authenticated/invest")({
  head: () => ({ meta: [{ title: "Invest — SmartInVest" }] }),
  component: InvestPage,
});

const riskMeta: Record<string, { icon: typeof Shield; tone: string }> = {
  Low: { icon: Shield, tone: "text-[oklch(0.75_0.15_200)]" },
  Medium: { icon: TrendingUp, tone: "text-primary" },
  High: { icon: Zap, tone: "text-destructive" },
};

function InvestPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Instrument | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("instruments")
        .select("*")
        .order("category", { ascending: true });
      if (error) toast.error(error.message);
      else setInstruments((data ?? []) as Instrument[]);
      setLoading(false);
    })();
  }, []);

  const grouped = instruments.reduce<Record<string, Instrument[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

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
        <div className="mx-auto max-w-xl mt-6 text-center">
          <p className="text-sm text-muted-foreground">Browse instruments curated for your portfolio</p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 -mt-2 space-y-6">
        {loading ? (
          <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading instruments…
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">{cat}</h2>
              <div className="space-y-3">
                {items.map((i) => {
                  const Meta = riskMeta[i.risk_level] ?? riskMeta.Medium;
                  const Icon = Meta.icon;
                  return (
                    <button
                      key={i.id}
                      onClick={() => setSelected(i)}
                      className="w-full text-left bg-card rounded-2xl p-5 hover:ring-2 hover:ring-primary/30 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold">{i.name}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{i.description}</p>
                        </div>
                        <div className={cn("flex items-center gap-1 text-xs font-semibold", Meta.tone)}>
                          <Icon className="size-3.5" /> {i.risk_level}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 mt-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Unit price</p>
                          <p className="font-bold mt-0.5">R{Number(i.price).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Expected return</p>
                          <p className="font-bold mt-0.5 text-primary">+{i.expected_return}%</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {selected && <PurchaseSheet instrument={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const amountSchema = z
  .number({ invalid_type_error: "Enter an amount" })
  .min(50, "Minimum R50")
  .max(10_000_000, "Amount too large");

function PurchaseSheet({ instrument, onClose }: { instrument: Instrument; onClose: () => void }) {
  const [amount, setAmount] = useState<string>("1000");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const num = parseFloat(amount) || 0;
  const units = num / Number(instrument.price);
  const projected = num * (1 + Number(instrument.expected_return) / 100);

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

      // Convert ZAR to cents for VodaPay (R1000 = 100000 cents)
      const amountInCents = Math.round(num * 100);

      // Initiate VodaPay payment — sends postMessage to mini-program
      // mini-program calls paymentUrl API, does tradePay, posts result back
      await initiateVodaPayPayment(amountInCents);

      // Only insert purchase record after successful payment
      const { error } = await supabase.from("purchases").insert({
        user_id: u.user.id,
        instrument_id: instrument.id,
        amount: num,
        units: Number(units.toFixed(4)),
      });
      if (error) throw error;

      toast.success(`Purchased R${num.toLocaleString()} of ${instrument.name}`);
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
        <div className="size-1 w-12 bg-border rounded-full mx-auto mb-4 sm:hidden" />
        <h3 className="text-xl font-bold">{instrument.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{instrument.description}</p>

        <div className="grid grid-cols-3 gap-2 mt-5">
          <Stat label="Unit price" value={`R${Number(instrument.price).toLocaleString()}`} />
          <Stat label="Return" value={`+${instrument.expected_return}%`} accent />
          <Stat label="Risk" value={instrument.risk_level} />
        </div>

        <div className="mt-6">
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
            {[500, 1000, 5000, 10000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="flex-1 text-xs py-2 rounded-full bg-secondary hover:bg-muted transition"
              >
                R{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-background/40 border border-border p-4 space-y-2 text-sm">
          <Row label="You'll receive" value={`${units.toFixed(4)} units`} />
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
      <p className={cn("text-sm font-bold mt-1", accent && "text-primary")}>{value}</p>
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