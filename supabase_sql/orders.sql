-- Sprint 0: table minimal + RLS
-- Objectif: permettre à anon d'INSERER une commande (pas de lecture publique)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  entree text not null,
  plat text not null,
  dessert text not null,
  notes text null
);

alter table public.orders enable row level security;

drop policy if exists "anon_insert_orders" on public.orders;
create policy "anon_insert_orders"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "auth_select_orders" on public.orders;
create policy "auth_select_orders"
on public.orders
for select
to authenticated
using (true);
