-- ============================================================
-- Admin order management: admin notes, customer-visible note,
-- and the payment-update-request flow.
-- Run this in the Supabase SQL Editor.
-- ============================================================

alter table public.orders
  add column if not exists admin_notes text,
  add column if not exists customer_visible_note text,
  add column if not exists payment_update_requested_at timestamptz;

comment on column public.orders.admin_notes is
  'Internal notes, visible to admins only.';
comment on column public.orders.customer_visible_note is
  'Admin-authored message shown to the customer on their order page.';
comment on column public.orders.payment_update_requested_at is
  'Set when an admin requests new card details (e.g. the manual charge failed); '
  'cleared when the customer resubmits payment on the update-payment page.';
