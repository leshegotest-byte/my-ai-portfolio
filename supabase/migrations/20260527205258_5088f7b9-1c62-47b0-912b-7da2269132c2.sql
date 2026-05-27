
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY,
  risk_appetite TEXT NOT NULL DEFAULT 'medium' CHECK (risk_appetite IN ('low','medium','high')),
  investment_goal TEXT NOT NULL DEFAULT 'growth' CHECK (investment_goal IN ('growth','income','preservation','speculation')),
  investment_type TEXT NOT NULL DEFAULT 'long-term' CHECK (investment_type IN ('short-term','medium-term','long-term')),
  investment_amount NUMERIC NOT NULL DEFAULT 1000 CHECK (investment_amount >= 0),
  liquidity TEXT NOT NULL DEFAULT 'medium' CHECK (liquidity IN ('low','medium','high')),
  sectors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own preferences" ON public.user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own preferences" ON public.user_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instrument_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, instrument_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own watchlist" ON public.watchlist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own watchlist" ON public.watchlist
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own watchlist" ON public.watchlist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.instruments
  ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'Diversified',
  ADD COLUMN IF NOT EXISTS dividend_yield NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS volatility NUMERIC NOT NULL DEFAULT 0.15,
  ADD COLUMN IF NOT EXISTS market_cap NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ticker TEXT;
