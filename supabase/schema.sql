-- ============================================================
-- Ace Medical Wholesale — Supabase Database Schema
-- Run this in the Supabase SQL Editor (in order, top to bottom)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  first_name  text,
  last_name   text,
  company     text,
  phone       text,
  license_number text,
  role        text not null default 'customer', -- 'customer' | 'admin'
  -- Contact
  prefix          text,
  middle_name     text,
  -- Medical license
  license_holder_name text,
  profession      text,
  specialty       text,
  license_expiry  date,
  license_state   text,
  license_country text,
  -- Business
  business_phone  text,
  website         text,
  -- Delivery address
  address_line1   text,
  city            text,
  state           text,
  postal_code     text,
  country         text,
  -- Account area
  avatar_url      text,
  notification_preferences jsonb not null default '{}',
  privacy_preferences      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, company, phone, license_number,
    prefix, middle_name, license_holder_name, profession, specialty, license_expiry, license_state, license_country,
    business_phone, website, address_line1, city, state, postal_code, country
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'license_number',
    new.raw_user_meta_data->>'prefix',
    new.raw_user_meta_data->>'middle_name',
    new.raw_user_meta_data->>'license_holder_name',
    new.raw_user_meta_data->>'profession',
    new.raw_user_meta_data->>'specialty',
    nullif(new.raw_user_meta_data->>'license_expiry', '')::date,
    new.raw_user_meta_data->>'license_state',
    new.raw_user_meta_data->>'license_country',
    new.raw_user_meta_data->>'business_phone',
    new.raw_user_meta_data->>'website',
    new.raw_user_meta_data->>'address_line1',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'postal_code',
    new.raw_user_meta_data->>'country'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references public.categories(id) on delete set null,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BRANDS
-- ============================================================
create table if not exists public.brands (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,
  description       text,
  short_description text,
  price             numeric(12,2) not null default 0,
  sale_price        numeric(12,2),
  sku               text,
  stock_quantity    int,
  is_in_stock       boolean not null default true,
  category_id       uuid references public.categories(id) on delete set null,
  brand_id          uuid references public.brands(id) on delete set null,
  images            text[] not null default '{}',
  -- Spec sheet shown on the product card, as an ordered array of
  -- {label, value} pairs (jsonb objects don't preserve key order, which
  -- would scramble the spec-grid display) e.g.
  -- [{"label":"Volume","value":"2 × 1.0 mL"},{"label":"HA conc.","value":"20 mg/mL"}]
  specs             jsonb not null default '[]',
  featured          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_featured_idx on public.products(featured);
create index if not exists products_name_idx on public.products using gin(to_tsvector('english', name));

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete set null,
  reference_number text not null unique,
  status           text not null default 'pending',
  subtotal         numeric(12,2) not null,
  total            numeric(12,2) not null,
  shipping_address jsonb not null default '{}',
  customer_name    text,
  customer_email   text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_reference_idx on public.orders(reference_number);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  product_image text,
  quantity      int not null,
  unit_price    numeric(12,2) not null,
  total_price   numeric(12,2) not null
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- ============================================================
-- WISHLIST ITEMS
-- ============================================================
create table if not exists public.wishlist_items (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
create table if not exists public.contact_messages (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TRADE ACCOUNT APPLICATIONS (license verification for wholesale pricing)
-- ============================================================
create table if not exists public.trade_applications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete set null,
  practice_name   text not null,
  license_number  text not null,
  license_file_url text,
  status          text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Admin check as a SECURITY DEFINER function, not a raw subquery on
-- profiles inline in each policy. A policy on `profiles` that queries
-- `profiles` again forces Postgres to re-evaluate that same policy to
-- answer the subquery — infinite recursion (error 42P17). Every other
-- table's "admin" policy has the same problem transitively, since it
-- queries profiles too. SECURITY DEFINER runs with the function
-- owner's privileges, bypassing RLS on the query inside it, breaking
-- the recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());

-- Products (public read, admin write)
alter table public.products enable row level security;
create policy "Anyone can view products" on public.products for select using (true);
create policy "Admins can manage products" on public.products for all using (public.is_admin());

-- Categories (public read, admin write)
alter table public.categories enable row level security;
create policy "Anyone can view categories" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all using (public.is_admin());

-- Brands (public read, admin write)
alter table public.brands enable row level security;
create policy "Anyone can view brands" on public.brands for select using (true);
create policy "Admins can manage brands" on public.brands for all using (public.is_admin());

-- Orders (users see own, admins see all)
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Anyone can insert order" on public.orders for insert with check (true);
create policy "Admins can manage orders" on public.orders for all using (public.is_admin());

-- Order items
alter table public.order_items enable row level security;
create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "Anyone can insert order items" on public.order_items for insert with check (true);
create policy "Admins can manage order items" on public.order_items for all using (public.is_admin());

-- Wishlist
alter table public.wishlist_items enable row level security;
create policy "Users manage own wishlist" on public.wishlist_items for all using (auth.uid() = user_id);

-- Contact messages (insert only from public, admins can read)
alter table public.contact_messages enable row level security;
create policy "Anyone can submit contact" on public.contact_messages for insert with check (true);
create policy "Admins can read messages" on public.contact_messages for select using (public.is_admin());

-- Trade applications (users manage their own, admins review all)
alter table public.trade_applications enable row level security;
create policy "Users can view own application" on public.trade_applications for select using (auth.uid() = user_id);
create policy "Users can submit application" on public.trade_applications for insert with check (true);
create policy "Admins can manage applications" on public.trade_applications for all using (public.is_admin());

-- ============================================================
-- ACCOUNT AREA: saved addresses, saved cards, avatars bucket
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

-- ============================================================
-- SEED: Categories
-- ============================================================
insert into public.categories (name, slug, sort_order) values
  ('Rheumatology',           'rheumatology',           10),
  ('Ophthalmology',          'ophthalmology',          20),
  ('Skincare',                'skincare',                30),
  ('Peels and Masks',        'peels-and-masks',        40),
  ('Dermal Fillers',          'dermal-fillers',          50),
  ('Botulinum Toxins',        'botulinum-toxins',        60),
  ('Gynecology',              'gynecology',              70),
  ('Body Sculpting',          'body-sculpting',          80),
  ('Osteoporosis',            'osteoporosis',            90),
  ('Fat Removal',             'fat-removal',            100),
  ('Mesotherapy',             'mesotherapy',            110),
  ('Orthopedic Injections',   'orthopedic-injections',  120),
  ('Peptides',                'peptides',               125),
  ('Dermal Filler Removal',   'dermal-filler-removal',  130),
  ('Anaesthetics',            'anaesthetics',           140),
  ('Weight Loss',             'weight-loss',            150),
  ('Cannulas and Needles',    'cannulas-and-needles',   160),
  ('Asthma',                  'asthma',                 170),
  ('Threads',                 'threads',                180),
  ('Eyelash Enhancers',       'eyelash-enhancers',      190),
  ('PRP Kits',                'prp-kits',               200),
  ('Other',                   'other',                  999)
on conflict (slug) do nothing;

-- ============================================================
-- SEED: Brands
-- ============================================================
-- Brands are not a bootstrap concern here — they're derived from product
-- titles (anything marked with ® or ™) by scripts/migrate-from-peakmedical.mjs
-- and inserted programmatically alongside the products that reference them.
