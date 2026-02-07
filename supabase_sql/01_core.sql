-- Core tables + RLS for "real minimal" version
-- 1) profiles: role-based access (admin/employee) for authenticated users
-- 2) orders + order_days: public (anon) can INSERT, but only staff can SELECT/UPDATE
-- 3) storage bucket "proofs" is handled in UI; create in dashboard and set public for MVP

-- EXTENSIONS (usually already enabled in Supabase)
create extension if not exists pgcrypto;

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name text null,
  role text not null default 'employee' check (role in ('admin','employee'))
);

alter table public.profiles enable row level security;

-- Helper: current role
create or replace function public.auth_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Profiles policies
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Admin can select/update any profile (for role management)
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.auth_role() = 'admin')
with check (public.auth_role() = 'admin');

-- Auto-create profile on signup (default role: employee)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null), 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ORDERS (global)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company text not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  stand text not null
);

alter table public.orders enable row level security;

-- ORDER_DAYS (per day tracking)
create table if not exists public.order_days (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_id uuid not null references public.orders(id) on delete cascade,

  day_date date not null,
  day_label text not null,

  entree text not null,
  plat text not null,
  dessert text not null,

  options jsonb not null default '{}'::jsonb,
  delivery jsonb not null default '{}'::jsonb,

  status text not null default 'CONFIRMED',
  employee_name text null,
  proof_url text null
);

alter table public.order_days enable row level security;

-- PUBLIC (anon) can INSERT orders + order_days (MVP). No select for anon.
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "order_days_anon_insert" on public.order_days;
create policy "order_days_anon_insert"
on public.order_days
for insert
to anon
with check (true);

-- STAFF: authenticated can SELECT if role is admin/employee
drop policy if exists "orders_staff_select" on public.orders;
create policy "orders_staff_select"
on public.orders
for select
to authenticated
using (public.auth_role() in ('admin','employee'));

drop policy if exists "order_days_staff_select" on public.order_days;
create policy "order_days_staff_select"
on public.order_days
for select
to authenticated
using (public.auth_role() in ('admin','employee'));

-- STAFF: authenticated can UPDATE order_days (status, employee, proof)
drop policy if exists "order_days_staff_update" on public.order_days;
create policy "order_days_staff_update"
on public.order_days
for update
to authenticated
using (public.auth_role() in ('admin','employee'))
with check (public.auth_role() in ('admin','employee'));

-- OPTIONAL: admin can DELETE (cleanup)
drop policy if exists "order_days_admin_delete" on public.order_days;
create policy "order_days_admin_delete"
on public.order_days
for delete
to authenticated
using (public.auth_role() = 'admin');

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
on public.orders
for delete
to authenticated
using (public.auth_role() = 'admin');
