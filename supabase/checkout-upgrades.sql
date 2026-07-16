-- ============================================================
-- Checkout upgrades: coupons, billing address, policy acknowledgement
-- Run this in the Supabase SQL Editor.
-- ============================================================

create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  kind          text not null default 'percent', -- 'percent' | 'fixed'
  value         numeric(12,2) not null,
  min_subtotal  numeric(12,2) not null default 0,
  max_uses      int,
  used_count    int not null default 0,
  expires_at    timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create unique index if not exists coupons_code_upper_idx on public.coupons (upper(code));

-- Admin-only: customers never read the coupons table directly —
-- validation happens through a service-role server action.
alter table public.coupons enable row level security;
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- Atomic usage counter
create or replace function public.increment_coupon_use(p_code text)
returns void language sql security definer set search_path = public as $$
  update public.coupons set used_count = used_count + 1 where upper(code) = upper(p_code);
$$;

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists billing_address jsonb,
  add column if not exists policy_acknowledged_at timestamptz;
