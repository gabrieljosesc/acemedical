-- ============================================================
-- Store completeness: volume pricing + product-images bucket
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Quantity-tier pricing, e.g. [{"minQ":1,"maxQ":3,"price":599},{"minQ":4,"maxQ":10,"price":499}]
alter table public.products
  add column if not exists price_tiers jsonb not null default '[]';

-- Product images bucket (public read, admin write)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for all using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
