-- ============================================================
-- Multiple COAs per product (e.g. separate lab-batch/lot
-- certificates for the same item). Run in the Supabase SQL editor.
-- products.coa_url (from coa.sql) remains the primary/default COA;
-- rows here are additional labeled certificates shown alongside it.
-- ============================================================

create table if not exists public.product_coas (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  label       text not null,
  file_url    text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists product_coas_product_id_idx on public.product_coas (product_id);

alter table public.product_coas enable row level security;

drop policy if exists "product_coas_select" on public.product_coas;
create policy "product_coas_select" on public.product_coas
  for select using (true);

drop policy if exists "product_coas_admin_write" on public.product_coas;
create policy "product_coas_admin_write" on public.product_coas
  for all using (public.is_admin()) with check (public.is_admin());
