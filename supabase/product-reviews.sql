-- ============================================================
-- Product reviews — run in the Supabase SQL editor.
-- Adds a reviews table (one per user per product), keeps
-- products.rating / review_count in sync via trigger.
-- ============================================================

alter table public.products add column if not exists rating numeric;
alter table public.products add column if not exists review_count int not null default 0;

create table if not exists public.product_reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  rating      int not null check (rating between 1 and 5),
  title       text,
  body        text not null,
  is_verified boolean not null default false,  -- reviewer purchased the product
  is_approved boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_id_idx on public.product_reviews (product_id);

alter table public.product_reviews enable row level security;

drop policy if exists "reviews_select" on public.product_reviews;
create policy "reviews_select" on public.product_reviews
  for select using (is_approved = true or user_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_insert_own" on public.product_reviews;
create policy "reviews_insert_own" on public.product_reviews
  for insert with check (user_id = auth.uid());

drop policy if exists "reviews_update_own" on public.product_reviews;
create policy "reviews_update_own" on public.product_reviews
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_delete_own" on public.product_reviews;
create policy "reviews_delete_own" on public.product_reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- Keep products.rating / review_count in sync with approved reviews
create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := coalesce(new.product_id, old.product_id);
  update public.products p set
    rating = (select round(avg(r.rating)::numeric, 2) from public.product_reviews r
      where r.product_id = pid and r.is_approved),
    review_count = (select count(*) from public.product_reviews r
      where r.product_id = pid and r.is_approved)
  where p.id = pid;
  return null;
end;
$$;

drop trigger if exists product_reviews_refresh on public.product_reviews;
create trigger product_reviews_refresh
  after insert or update or delete on public.product_reviews
  for each row execute function public.refresh_product_rating();
