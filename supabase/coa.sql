-- ============================================================
-- COA (Certificate of Analysis) downloads on products
-- Run this in the Supabase SQL Editor.
-- ============================================================

alter table public.products
  add column if not exists coa_url text;

insert into storage.buckets (id, name, public)
values ('product-coas', 'product-coas', true)
on conflict (id) do nothing;

drop policy if exists "product_coas_public_read" on storage.objects;
create policy "product_coas_public_read" on storage.objects
  for select using (bucket_id = 'product-coas');

drop policy if exists "product_coas_admin_write" on storage.objects;
create policy "product_coas_admin_write" on storage.objects
  for all using (bucket_id = 'product-coas' and public.is_admin())
  with check (bucket_id = 'product-coas' and public.is_admin());
