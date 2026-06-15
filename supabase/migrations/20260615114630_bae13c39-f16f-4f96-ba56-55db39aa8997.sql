CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instrument_id uuid NOT NULL REFERENCES public.instruments(id),
  amount numeric NOT NULL CHECK (amount > 0),
  units numeric NOT NULL CHECK (units > 0),
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);