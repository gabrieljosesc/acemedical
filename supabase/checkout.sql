-- ============================================================
-- Checkout: shipping + card-on-file columns
-- Run this in the Supabase SQL Editor after schema.sql.
-- ============================================================

alter table public.orders
  add column if not exists shipping_amount numeric(12,2) not null default 0,
  add column if not exists payment_card_snapshot jsonb;

comment on column public.orders.payment_card_snapshot is
  'Encrypted card-on-file snapshot for manual/admin processing — never a live charge. '
  'Shape: {brand, last4, exp_month, exp_year, name_on_card, pan_encrypted, cvv_encrypted}.';
