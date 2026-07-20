import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type ChatMsg = { role: "user" | "assistant"; content: string };

async function callGemini(system: string, messages: ChatMsg[]): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not configured");

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
    }),
  });

  if (res.status === 429) throw new Error("AI is rate-limited, please try again in a moment.");
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}) ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("").trim();
  return text ?? "";
}

async function callGeminiSingle(prompt: string, system: string): Promise<string> {
  return callGemini(system, [{ role: "user", content: prompt }]);
}

const suitabilityInput = z.object({
  instrument: z.object({
    name: z.string().max(120),
    category: z.string().max(60),
    risk_level: z.enum(["Low", "Medium", "High"]),
    sector: z.string().max(60),
    expected_return: z.number(),
    dividend_yield: z.number(),
    volatility: z.number(),
  }),
  preferences: z.object({
    risk_appetite: z.enum(["low", "medium", "high"]),
    investment_goal: z.enum(["growth", "income", "preservation", "speculation"]),
    investment_type: z.enum(["short-term", "medium-term", "long-term"]),
    investment_amount: z.number(),
    liquidity: z.enum(["low", "medium", "high"]),
  }),
});

export const getSuitability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => suitabilityInput.parse(d))
  .handler(async ({ data }) => {
    const sys =
      "You are a concise investment assistant for the SmartInVest app. Speak in 2 short sentences. Never give legal or definitive financial advice — frame suggestions as informational and remind the user to do their own research only if asked.";
    const prompt = `Investor profile: ${data.preferences.risk_appetite} risk, ${data.preferences.investment_goal} goal, ${data.preferences.investment_type} horizon, R${data.preferences.investment_amount} amount, ${data.preferences.liquidity} liquidity.
Instrument: ${data.instrument.name} (${data.instrument.category}, ${data.instrument.sector}), risk ${data.instrument.risk_level}, expected return ${data.instrument.expected_return}%, dividend ${data.instrument.dividend_yield}%, volatility ${data.instrument.volatility}.
Write a brief suitability message (2 sentences) explaining how well this instrument aligns with the profile.`;
    const message = await callGeminiSingle(prompt, sys);
    return { message };
  });

const insightsInput = z.object({
  preferences: z.object({
    risk_appetite: z.enum(["low", "medium", "high"]),
    investment_goal: z.enum(["growth", "income", "preservation", "speculation"]),
    investment_type: z.enum(["short-term", "medium-term", "long-term"]),
    investment_amount: z.number(),
    liquidity: z.enum(["low", "medium", "high"]),
  }),
  allocation: z
    .array(z.object({ name: z.string().max(80), amount: z.number() }))
    .max(50),
});

export const getPortfolioInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => insightsInput.parse(d))
  .handler(async ({ data }) => {
    const sys =
      "You are a portfolio analytics assistant for SmartInVest. Return STRICT JSON only, no prose, in the format {\"insights\":[{\"title\":string,\"body\":string}]} with exactly 3 items. Each title ≤ 6 words, body ≤ 30 words. No legal or definitive financial advice.";
    const allocText = data.allocation.length
      ? data.allocation.map((a) => `${a.name}: R${a.amount}`).join(", ")
      : "No holdings yet";
    const prompt = `Investor: ${data.preferences.risk_appetite} risk, ${data.preferences.investment_goal} goal, ${data.preferences.investment_type} horizon, ${data.preferences.liquidity} liquidity.
Current allocation: ${allocText}.
Generate 3 personalized insights (rebalance, opportunity, or risk warning) as JSON only.`;
    const raw = await callGeminiSingle(prompt, sys);
    try {
      // Strip code fences if present
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed?.insights) ? parsed.insights : [];
      return {
        insights: arr.slice(0, 3).map((i: any) => ({
          title: String(i.title ?? "").slice(0, 60),
          body: String(i.body ?? "").slice(0, 240),
        })),
      };
    } catch {
      return { insights: [] };
    }
  });

/* ------------------------------------------------------------------ */
/* Tutor chat — general education + portfolio-aware answers            */
/* ------------------------------------------------------------------ */

const tutorInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .min(1)
    .max(20),
});

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tutorInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load user portfolio context server-side (RLS scoped)
    const [prefRes, pRes, wRes] = await Promise.all([
      supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("purchases")
        .select("amount, units, created_at, instrument_id, instruments(name, category, expected_return, sector, risk_level)")
        .order("created_at", { ascending: false }),
      (supabase as any)
        .from("withdrawals")
        .select("amount, units, instrument_id"),
    ]);

    type Row = { amount: number; units: number; instrument_id: string; instruments: any };
    const purchases = (pRes.data ?? []) as Row[];
    const withdrawals = ((wRes.data ?? []) as { amount: number; units: number; instrument_id: string }[]);

    const map = new Map<string, { name: string; category: string; sector: string; risk: string; er: number; invested: number; units: number }>();
    for (const p of purchases) {
      if (!p.instruments) continue;
      const cur = map.get(p.instrument_id) ?? {
        name: p.instruments.name,
        category: p.instruments.category,
        sector: p.instruments.sector,
        risk: p.instruments.risk_level,
        er: Number(p.instruments.expected_return ?? 0),
        invested: 0,
        units: 0,
      };
      cur.invested += Number(p.amount);
      cur.units += Number(p.units);
      map.set(p.instrument_id, cur);
    }
    for (const w of withdrawals) {
      const cur = map.get(w.instrument_id);
      if (!cur) continue;
      cur.invested -= Number(w.amount);
      cur.units -= Number(w.units);
    }
    const holdings = Array.from(map.values())
      .filter((h) => h.invested > 0.01)
      .map((h) => ({ ...h, projected: h.invested * (1 + h.er / 100), pl: h.invested * (h.er / 100) }))
      .sort((a, b) => b.pl - a.pl);

    const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
    const totalValue = holdings.reduce((s, h) => s + h.projected, 0);
    const totalWithdrawn = withdrawals.reduce((s, w) => s + Number(w.amount), 0);
    const best = holdings[0];
    const worst = holdings[holdings.length - 1];

    const prefs = prefRes.data as any;
    const profileLine = prefs
      ? `Investor profile — risk: ${prefs.risk_appetite}, goal: ${prefs.investment_goal}, horizon: ${prefs.investment_type}, liquidity: ${prefs.liquidity}, amount preference: R${prefs.investment_amount}.`
      : "Investor profile — not set yet.";

    const holdingLines = holdings.length
      ? holdings
          .map(
            (h) =>
              `• ${h.name} (${h.category}, ${h.sector}, ${h.risk} risk): invested R${h.invested.toFixed(0)}, ${h.units.toFixed(4)} shares, expected return ${h.er}% (projected R${h.projected.toFixed(0)}, P&L R${h.pl.toFixed(0)}).`
          )
          .join("\n")
      : "No active holdings.";

    const summary = `PORTFOLIO SNAPSHOT
Total invested: R${totalInvested.toFixed(0)}
Total projected value: R${totalValue.toFixed(0)}
Total withdrawn (lifetime, simulated): R${totalWithdrawn.toFixed(0)}
Number of holdings: ${holdings.length}
Best performer: ${best ? `${best.name} (+R${best.pl.toFixed(0)})` : "n/a"}
Weakest performer: ${worst && worst !== best ? `${worst.name} (P&L R${worst.pl.toFixed(0)})` : "n/a"}

HOLDINGS
${holdingLines}

${profileLine}`;

    const system = `You are the SmartInVest tutor — a friendly, plain-English guide who helps South African users learn about investing AND understand their own portfolio.

Rules:
- Keep answers short (2–4 sentences unless the user asks for detail).
- Explain jargon simply (e.g. "fractional trading means buying a slice of a share instead of a whole one").
- When the user asks about THEIR portfolio, use ONLY the snapshot below — never invent numbers.
- All amounts are in South African Rand (R). Use "R" not "$".
- Never give definitive financial advice. Frame ideas as educational and remind the user to do their own research when it matters.
- If the snapshot has no holdings and the user asks about their portfolio, gently suggest making a first investment (from R50 with fractional shares).

${summary}`;

    const message = await callGemini(system, data.messages);
    return { message };
  });
