-- Add profile fields to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;
