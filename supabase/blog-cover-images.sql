-- ============================================================
-- Blog post cover images. Run in the Supabase SQL editor.
-- ============================================================

alter table public.blog_posts add column if not exists cover_image_url text;

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "blog_images_admin_write" on storage.objects;
create policy "blog_images_admin_write" on storage.objects
  for all using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());
