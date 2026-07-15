-- ============================================================
-- Account area: avatar + preferences on profiles, saved addresses,
-- saved cards, and the public avatars storage bucket.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Profile additions
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists notification_preferences jsonb not null default '{}',
  add column if not exists privacy_preferences jsonb not null default '{}';

-- ============================================================
-- SAVED ADDRESSES
-- ============================================================
create table if not exists public.user_addresses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  label          text,
  recipient_name text not null,
  phone          text,
  line1          text not null,
  line2          text,
  city           text,
  state          text,
  postal_code    text,
  country        text,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists user_addresses_user_id_idx on public.user_addresses(user_id);

alter table public.user_addresses enable row level security;
create policy "Users manage own addresses" on public.user_addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- SAVED CARDS (card-on-file for manual/admin processing — never charged here)
-- ============================================================
create table if not exists public.user_saved_cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name_on_card  text not null,
  brand         text,
  last4         text not null,
  exp_month     int not null,
  exp_year      int not null,
  pan_encrypted text not null, -- AES-256-GCM via PAYMENT_CARD_SECRET
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists user_saved_cards_user_id_idx on public.user_saved_cards(user_id);

alter table public.user_saved_cards enable row level security;
create policy "Users manage own cards" on public.user_saved_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- AVATARS STORAGE BUCKET (public read, owner-folder write)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for all using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
