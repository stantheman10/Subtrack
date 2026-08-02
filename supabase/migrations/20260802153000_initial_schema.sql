
-- Budget Tracker - Initial Schema (Production)
-- Generated migration template

create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '💰',
  color text not null default '#6b7280',
  type text not null check (type in ('expense','income')),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check(amount>0),
  category_id uuid references public.categories(id) on delete set null,
  billing_cycle text not null check (billing_cycle in ('weekly','monthly','yearly')),
  next_billing_date date not null,
  start_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12,2) not null check(amount>0),
  description text not null default '',
  transaction_date date not null default current_date,
  type text not null check(type in ('expense','income')),
  source text not null default 'manual' check(source in ('manual','subscription')),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check(target_amount>0),
  current_amount numeric(12,2) not null default 0 check(current_amount>=0),
  target_date date not null,
  created_at timestamptz not null default now()
);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(12,2) not null check(amount>0),
  contributed_at timestamptz not null default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  monthly_budget numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_categories_user on public.categories(user_id);
create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index idx_transactions_category on public.transactions(category_id);
create index idx_transactions_subscription on public.transactions(subscription_id);
create index idx_goals_user on public.savings_goals(user_id);
create index idx_goal_contributions_goal on public.goal_contributions(goal_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.categories enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.settings enable row level security;

-- Categories
create policy categories_select on public.categories for select to authenticated using (auth.uid()=user_id);
create policy categories_insert on public.categories for insert to authenticated with check (auth.uid()=user_id);
create policy categories_update on public.categories for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy categories_delete on public.categories for delete to authenticated using (auth.uid()=user_id);

-- Subscriptions
create policy subscriptions_select on public.subscriptions for select to authenticated using (auth.uid()=user_id);
create policy subscriptions_insert on public.subscriptions for insert to authenticated with check (auth.uid()=user_id);
create policy subscriptions_update on public.subscriptions for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy subscriptions_delete on public.subscriptions for delete to authenticated using (auth.uid()=user_id);

-- Transactions
create policy transactions_select on public.transactions for select to authenticated using (auth.uid()=user_id);
create policy transactions_insert on public.transactions for insert to authenticated with check (auth.uid()=user_id);
create policy transactions_update on public.transactions for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy transactions_delete on public.transactions for delete to authenticated using (auth.uid()=user_id);

-- Savings goals
create policy savings_goals_select on public.savings_goals for select to authenticated using (auth.uid()=user_id);
create policy savings_goals_insert on public.savings_goals for insert to authenticated with check (auth.uid()=user_id);
create policy savings_goals_update on public.savings_goals for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy savings_goals_delete on public.savings_goals for delete to authenticated using (auth.uid()=user_id);

-- Goal contributions
create policy goal_contributions_select on public.goal_contributions
for select to authenticated
using (exists(select 1 from public.savings_goals g where g.id=goal_id and g.user_id=auth.uid()));
create policy goal_contributions_insert on public.goal_contributions
for insert to authenticated
with check (exists(select 1 from public.savings_goals g where g.id=goal_id and g.user_id=auth.uid()));
create policy goal_contributions_update on public.goal_contributions
for update to authenticated
using (exists(select 1 from public.savings_goals g where g.id=goal_id and g.user_id=auth.uid()))
with check (exists(select 1 from public.savings_goals g where g.id=goal_id and g.user_id=auth.uid()));
create policy goal_contributions_delete on public.goal_contributions
for delete to authenticated
using (exists(select 1 from public.savings_goals g where g.id=goal_id and g.user_id=auth.uid()));

-- Settings
create policy settings_select on public.settings for select to authenticated using (auth.uid()=user_id);
create policy settings_insert on public.settings for insert to authenticated with check (auth.uid()=user_id);
create policy settings_update on public.settings for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy settings_delete on public.settings for delete to authenticated using (auth.uid()=user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
insert into public.categories(user_id,name,icon,color,type) values
(p_user_id,'Food & Dining','🍽️','#f97316','expense'),
(p_user_id,'Transportation','🚗','#3b82f6','expense'),
(p_user_id,'Housing','🏠','#8b5cf6','expense'),
(p_user_id,'Entertainment','🎬','#ec4899','expense'),
(p_user_id,'Health & Fitness','💪','#10b981','expense'),
(p_user_id,'Shopping','🛍️','#f59e0b','expense'),
(p_user_id,'Utilities','💡','#6366f1','expense'),
(p_user_id,'Education','📚','#0ea5e9','expense'),
(p_user_id,'Personal Care','🪥','#14b8a6','expense'),
(p_user_id,'Other','📦','#6b7280','expense'),
(p_user_id,'Salary','💼','#22c55e','income'),
(p_user_id,'Freelance','💻','#a3e635','income'),
(p_user_id,'Investment Returns','📈','#34d399','income'),
(p_user_id,'Other Income','💵','#4ade80','income');
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.settings(user_id,monthly_budget) values(new.id,0);
  perform public.seed_default_categories(new.id);
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
