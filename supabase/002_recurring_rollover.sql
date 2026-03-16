-- =============================================
-- Migration 002: Recurring Transactions + Budget Rollover
-- Run this in Supabase SQL Editor AFTER 001 (schema.sql)
-- =============================================

-- =============================================
-- RECURRING TRANSACTION TEMPLATES
-- =============================================
create table if not exists recurring_transactions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  amount         numeric(12, 2) not null check (amount > 0),
  type           text not null check (type in ('income', 'expense')),
  category_id    uuid references categories(id) on delete set null,
  note           text,
  interval_type  text not null check (interval_type in ('weekly', 'monthly', 'yearly')),
  next_date      date not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table recurring_transactions enable row level security;

create policy "Users can manage own recurring transactions"
  on recurring_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists recurring_user_next_idx
  on recurring_transactions(user_id, next_date)
  where is_active = true;

-- =============================================
-- BUDGET ROLLOVER
-- =============================================

-- Add rollover flag to categories
alter table categories
  add column if not exists enable_rollover boolean not null default false;

-- Store computed rollover amounts per category per month
create table if not exists budget_rollovers (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  category_id     uuid references categories(id) on delete cascade not null,
  month           text not null,  -- 'YYYY-MM'
  rollover_amount numeric(12, 2) not null default 0,
  created_at      timestamptz not null default now(),
  unique (category_id, month)
);

alter table budget_rollovers enable row level security;

create policy "Users can manage own rollovers"
  on budget_rollovers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
