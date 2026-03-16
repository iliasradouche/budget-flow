-- =============================================
-- BudgetFlow Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- CATEGORIES
-- =============================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#22c55e',
  icon text not null default 'tag',
  type text not null check (type in ('income', 'expense')),
  budget_limit numeric(12, 2),
  created_at timestamptz default now() not null
);

alter table categories enable row level security;

create policy "Users can manage own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- TRANSACTIONS
-- =============================================
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid references categories(id) on delete set null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now() not null
);

alter table transactions enable row level security;

create policy "Users can manage own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- GOALS
-- =============================================
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  color text not null default '#22c55e',
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz default now() not null
);

alter table goals enable row level security;

create policy "Users can manage own goals"
  on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================
create index if not exists transactions_user_id_date_idx on transactions(user_id, date desc);
create index if not exists transactions_category_id_idx on transactions(category_id);
create index if not exists categories_user_id_idx on categories(user_id);
create index if not exists goals_user_id_idx on goals(user_id);

-- =============================================
-- DEFAULT CATEGORIES (inserted on first sign-up via trigger)
-- =============================================
create or replace function create_default_categories()
returns trigger as $$
begin
  insert into categories (user_id, name, color, icon, type) values
    (new.id, 'Salary',       '#22c55e', 'briefcase',   'income'),
    (new.id, 'Freelance',    '#3b82f6', 'laptop',       'income'),
    (new.id, 'Food',         '#f97316', 'utensils',     'expense'),
    (new.id, 'Transport',    '#8b5cf6', 'car',          'expense'),
    (new.id, 'Housing',      '#ef4444', 'home',         'expense'),
    (new.id, 'Health',       '#06b6d4', 'heart',        'expense'),
    (new.id, 'Shopping',     '#ec4899', 'shopping-bag', 'expense'),
    (new.id, 'Entertainment','#f59e0b', 'tv',           'expense');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_default_categories();
