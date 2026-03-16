-- =============================================
-- Migration 003: User Settings
-- Run in Supabase SQL Editor
-- =============================================

create table if not exists user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  currency   text not null default 'USD',
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create settings row on signup
create or replace function public.create_default_settings()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer SET search_path = public;

create or replace trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute function public.create_default_settings();
