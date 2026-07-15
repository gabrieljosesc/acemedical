-- ============================================================
-- Expand profiles with full trade-registration fields (matches the
-- signup form: contact, delivery address, business, medical license).
-- Run this in the Supabase SQL Editor.
-- ============================================================

alter table public.profiles
  add column if not exists prefix          text,
  add column if not exists middle_name     text,
  add column if not exists license_holder_name text,
  add column if not exists profession      text,
  add column if not exists specialty       text,
  add column if not exists license_expiry  date,
  add column if not exists license_state   text,
  add column if not exists license_country text,
  add column if not exists business_phone  text,
  add column if not exists website         text,
  add column if not exists address_line1   text,
  add column if not exists city            text,
  add column if not exists state           text,
  add column if not exists postal_code     text,
  add column if not exists country         text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, first_name, last_name, company, phone, license_number,
    prefix, middle_name, license_holder_name, profession, specialty, license_expiry, license_state, license_country,
    business_phone, website, address_line1, city, state, postal_code, country
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'license_number',
    new.raw_user_meta_data->>'prefix',
    new.raw_user_meta_data->>'middle_name',
    new.raw_user_meta_data->>'license_holder_name',
    new.raw_user_meta_data->>'profession',
    new.raw_user_meta_data->>'specialty',
    nullif(new.raw_user_meta_data->>'license_expiry', '')::date,
    new.raw_user_meta_data->>'license_state',
    new.raw_user_meta_data->>'license_country',
    new.raw_user_meta_data->>'business_phone',
    new.raw_user_meta_data->>'website',
    new.raw_user_meta_data->>'address_line1',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'postal_code',
    new.raw_user_meta_data->>'country'
  );
  return new;
end;
$$;
