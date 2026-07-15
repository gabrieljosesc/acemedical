-- ============================================================
-- Fix: infinite recursion in "Admins can ..." RLS policies
--
-- Every admin-check policy queried public.profiles from inside a policy
-- ON public.profiles (directly, or transitively via profiles' own
-- "Admins can view all profiles" policy). Postgres has to re-evaluate
-- profiles' RLS to answer that subquery, which requires re-evaluating
-- the same admin check again — infinite recursion (error 42P17).
--
-- Since orders/order_items/etc. use a FOR ALL admin policy, Postgres
-- evaluates it (OR'd with the customer-facing policy) on every insert,
-- even for non-admins — so this silently broke checkout for everyone,
-- not just admin actions.
--
-- Fix: a SECURITY DEFINER function runs with the privileges of its
-- owner, bypassing RLS on the table it queries internally, breaking
-- the recursion. Every admin-check policy now calls this instead of
-- re-querying profiles directly.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

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

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products" on public.products for all using (public.is_admin());

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories" on public.categories for all using (public.is_admin());

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands" on public.brands for all using (public.is_admin());

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" on public.orders for all using (public.is_admin());

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items" on public.order_items for all using (public.is_admin());

drop policy if exists "Admins can read messages" on public.contact_messages;
create policy "Admins can read messages" on public.contact_messages for select using (public.is_admin());

drop policy if exists "Admins can manage applications" on public.trade_applications;
create policy "Admins can manage applications" on public.trade_applications for all using (public.is_admin());
