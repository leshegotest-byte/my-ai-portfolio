import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callLovableAI(prompt: string, system: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (res.status === 429) throw new Error("AI is rate-limited, please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted — please top up.");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
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
    const message = await callLovableAI(prompt, sys);
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
    const raw = await callLovableAI(prompt, sys);
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
