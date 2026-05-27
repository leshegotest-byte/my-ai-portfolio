import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Target, TrendingUp, Clock, Droplets, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTORS, type Preferences } from "@/lib/recommendations";

export const Route = createFileRoute("/_authenticated/preferences")({
  head: () => ({ meta: [{ title: "Investment Preferences — SmartInVest" }] }),
  component: PreferencesPage,
});

const RISK = [
  { v: "low", label: "Low", desc: "Stable, capital preservation" },
  { v: "medium", label: "Medium", desc: "Balanced growth" },
  { v: "high", label: "High", desc: "Aggressive, tech & emerging" },
] as const;

const GOAL = [
  { v: "growth", label: "Growth", desc: "Maximize long-term value" },
  { v: "income", label: "Income", desc: "Regular dividends" },
  { v: "preservation", label: "Preservation", desc: "Protect capital" },
  { v: "speculation", label: "Speculation", desc: "High risk, high reward" },
] as const;

const TYPE = [
  { v: "short-term", label: "Short-term", desc: "<1 year" },
  { v: "medium-term", label: "Medium", desc: "1–5 years" },
  { v: "long-term", label: "Long-term", desc: "5+ years" },
] as const;

const LIQ = [
  { v: "low", label: "Low", desc: "Locked in" },
  { v: "medium", label: "Medium", desc: "Some flexibility" },
  { v: "high", label: "High", desc: "Easy access" },
] as const;

const STEPS = ["Risk", "Goal", "Horizon", "Amount", "Liquidity", "Sectors"] as const;

function PreferencesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [step, setStep] = useState(0);

  const [prefs, setPrefs] = useState<Preferences>({
    risk_appetite: "medium",
    investment_goal: "growth",
    investment_type: "long-term",
    investment_amount: 1000,
    liquidity: "medium",
    sectors: [],
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (data) {
        setIsNew(false);
        setPrefs({
          risk_appetite: data.risk_appetite as any,
          investment_goal: data.investment_goal as any,
          investment_type: data.investment_type as any,
          investment_amount: Number(data.investment_amount),
          liquidity: data.liquidity as any,
          sectors: data.sectors ?? [],
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: u.user.id, ...prefs }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Preferences saved");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <div className="px-5 pt-6 pb-6 bg-[var(--gradient-hero)]">
        <div className="mx-auto max-w-xl flex items-center justify-between">
          <Link to="/" className="rounded-full p-2 bg-secondary hover:bg-muted transition" aria-label="Back">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-lg font-semibold">{isNew ? "Set up preferences" : "Edit preferences"}</h1>
          <div className="size-8 rounded-xl bg-primary/15 grid place-items-center">
            <Sparkles className="size-4 text-primary" />
          </div>
        </div>

        <div className="mx-auto max-w-xl mt-6">
          <div className="h-1.5 w-full bg-background/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">
            {STEPS.map((s, i) => (
              <span key={s} className={cn(i === step && "text-primary font-semibold")}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-5 -mt-2">
        <div className="bg-card rounded-3xl p-6 shadow-[var(--shadow-glow)]">
          {step === 0 && (
            <Section icon={<TrendingUp className="size-5" />} title="Risk appetite" subtitle="How much volatility are you comfortable with?">
              {RISK.map((o) => (
                <Option key={o.v} active={prefs.risk_appetite === o.v} label={o.label} desc={o.desc}
                  onClick={() => setPrefs({ ...prefs, risk_appetite: o.v })} />
              ))}
            </Section>
          )}
          {step === 1 && (
            <Section icon={<Target className="size-5" />} title="Investment goal" subtitle="What outcome matters most?">
              {GOAL.map((o) => (
                <Option key={o.v} active={prefs.investment_goal === o.v} label={o.label} desc={o.desc}
                  onClick={() => setPrefs({ ...prefs, investment_goal: o.v })} />
              ))}
            </Section>
          )}
          {step === 2 && (
            <Section icon={<Clock className="size-5" />} title="Investment horizon" subtitle="How long can you stay invested?">
              {TYPE.map((o) => (
                <Option key={o.v} active={prefs.investment_type === o.v} label={o.label} desc={o.desc}
                  onClick={() => setPrefs({ ...prefs, investment_type: o.v })} />
              ))}
            </Section>
          )}
          {step === 3 && (
            <Section icon={<Sparkles className="size-5" />} title="Investment amount" subtitle="Initial amount you plan to invest (ZAR).">
              <input
                type="range" min={100} max={500000} step={100}
                value={prefs.investment_amount}
                onChange={(e) => setPrefs({ ...prefs, investment_amount: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="text-center mt-3">
                <p className="text-3xl font-bold">R{prefs.investment_amount.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 mt-4">
                {[1000, 5000, 30000, 100000].map((v) => (
                  <button key={v} onClick={() => setPrefs({ ...prefs, investment_amount: v })}
                    className="flex-1 text-xs py-2 rounded-full bg-secondary hover:bg-muted transition">
                    R{v.toLocaleString()}
                  </button>
                ))}
              </div>
            </Section>
          )}
          {step === 4 && (
            <Section icon={<Droplets className="size-5" />} title="Liquidity need" subtitle="How quickly might you need access to funds?">
              {LIQ.map((o) => (
                <Option key={o.v} active={prefs.liquidity === o.v} label={o.label} desc={o.desc}
                  onClick={() => setPrefs({ ...prefs, liquidity: o.v })} />
              ))}
            </Section>
          )}
          {step === 5 && (
            <Section icon={<Target className="size-5" />} title="Preferred sectors" subtitle="Optional — pick any that interest you.">
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => {
                  const active = prefs.sectors.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          sectors: active ? prefs.sectors.filter((x) => x !== s) : [...prefs.sectors, s],
                        })
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-background/40 hover:border-primary/50"
                      )}
                    >
                      {active && <Check className="size-3 inline mr-1" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex-1 rounded-full py-3 bg-secondary font-semibold hover:bg-muted transition disabled:opacity-40"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="flex-1 rounded-full py-3 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
                Next
              </button>
            ) : (
              <button onClick={save} disabled={saving} className="flex-1 rounded-full py-3 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isNew ? "Get started" : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-2xl bg-primary/15 text-primary grid place-items-center shrink-0">{icon}</div>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Option({ active, label, desc, onClick }: { active: boolean; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-4 border transition flex items-center justify-between",
        active ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/50"
      )}
    >
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {active && <Check className="size-4 text-primary" />}
    </button>
  );
}
