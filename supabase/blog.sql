-- ============================================================
-- Blog posts — run in the Supabase SQL editor.
-- Public reads published posts; admins manage everything.
-- ============================================================

create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  body         text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  author_id    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (is_published, published_at desc);

alter table public.blog_posts enable row level security;

drop policy if exists "blog_select_published" on public.blog_posts;
create policy "blog_select_published" on public.blog_posts
  for select using (is_published = true or public.is_admin());

drop policy if exists "blog_admin_manage" on public.blog_posts;
create policy "blog_admin_manage" on public.blog_posts
  for all using (public.is_admin());
