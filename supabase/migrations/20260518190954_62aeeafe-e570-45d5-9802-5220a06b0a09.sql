
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- instruments catalog
create table public.instruments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  price numeric(12,2) not null,
  expected_return numeric(5,2) not null,
  risk_level text not null check (risk_level in ('Low','Medium','High')),
  created_at timestamptz not null default now()
);
alter table public.instruments enable row level security;
create policy "Instruments are viewable by authenticated users"
  on public.instruments for select
  to authenticated
  using (true);

insert into public.instruments (name, category, description, price, expected_return, risk_level) values
('SmartCore ETF', 'ETFs', 'Diversified Top 40 SA equities for steady long-term growth.', 250.00, 8.5, 'Medium'),
('Global Tech Equity', 'Equities', 'Exposure to leading global technology companies.', 1850.00, 14.2, 'High'),
('SA Government Bond', 'Unit Trusts', 'Stable income-generating government bond fund.', 500.00, 6.0, 'Low'),
('Crypto Index 10', 'Crypto Assets', 'Top 10 crypto market-cap weighted index.', 4200.00, 22.0, 'High'),
('Property Trust REIT', 'Unit Trusts', 'Income from commercial property portfolios.', 320.00, 7.4, 'Medium'),
('AI Growth Portfolio', 'Equities', 'AI-curated basket of high-momentum growth stocks.', 1200.00, 18.5, 'High');

-- purchases
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instrument_id uuid not null references public.instruments(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  units numeric(12,4) not null check (units > 0),
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;
create policy "Users can view own purchases" on public.purchases for select using (auth.uid() = user_id);
create policy "Users can insert own purchases" on public.purchases for insert with check (auth.uid() = user_id);
create index on public.purchases(user_id, created_at desc);
