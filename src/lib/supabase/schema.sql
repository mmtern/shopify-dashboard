-- ==========================================================================
-- Shopify Production Dashboard — Complete Database Schema
-- Run this in the Supabase SQL Editor to bootstrap the project.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. STAFF TABLE
-- Maps Supabase Auth users to application-level staff records.
-- --------------------------------------------------------------------------

create table if not exists public.staff (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  display_name text,
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  locale      text not null default 'en',
  created_at  timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "Staff are viewable by authenticated users"
  on public.staff for select
  to authenticated
  using (true);

create policy "Users can update own staff record"
  on public.staff for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can update any staff record"
  on public.staff for update
  to authenticated
  using (
    exists (
      select 1 from public.staff s where s.id = auth.uid() and s.role = 'admin'
    )
  );

create policy "Admins can insert staff records"
  on public.staff for insert
  to authenticated
  with check (
    id = auth.uid()
    or exists (
      select 1 from public.staff s where s.id = auth.uid() and s.role = 'admin'
    )
  );

-- --------------------------------------------------------------------------
-- 2. ORDERS TABLE
-- Stores Shopify order header data.
-- --------------------------------------------------------------------------

create table if not exists public.orders (
  id                  text primary key,
  order_number        text not null,
  created_at          timestamptz not null,
  customer_name       text,
  customer_email      text,
  customer_phone      text,
  financial_status    text,
  fulfillment_status  text,
  shipping_method     text,
  subtotal            numeric(12,2),
  total_tax           numeric(12,2),
  total_discounts     numeric(12,2),
  total_price         numeric(12,2),
  currency            text not null default 'USD',
  note                text,
  tags                text[] not null default '{}',
  shipping_address    jsonb,
  synced_at           timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Orders are viewable by authenticated users"
  on public.orders for select
  to authenticated
  using (true);

create policy "Orders are insertable by authenticated users"
  on public.orders for insert
  to authenticated
  with check (true);

create policy "Orders are updatable by authenticated users"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

-- Index for common queries
create index if not exists idx_orders_order_number on public.orders (order_number);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_financial_status on public.orders (financial_status);
create index if not exists idx_orders_fulfillment_status on public.orders (fulfillment_status);

-- --------------------------------------------------------------------------
-- 3. LINE ITEMS TABLE
-- Stores individual products/variants within each order.
-- --------------------------------------------------------------------------

create table if not exists public.line_items (
  id                text primary key,
  order_id          text not null references public.orders(id) on delete cascade,
  title             text not null,
  variant_title     text,
  sku               text,
  quantity          integer not null default 1,
  unit_price        numeric(12,2),
  discounted_price  numeric(12,2),
  total_discount    numeric(12,2),
  tax_lines         jsonb,
  custom_attributes jsonb,
  image_url         text,
  synced_at         timestamptz not null default now()
);

alter table public.line_items enable row level security;

create policy "Line items are viewable by authenticated users"
  on public.line_items for select
  to authenticated
  using (true);

create policy "Line items are insertable by authenticated users"
  on public.line_items for insert
  to authenticated
  with check (true);

create policy "Line items are updatable by authenticated users"
  on public.line_items for update
  to authenticated
  using (true)
  with check (true);

create index if not exists idx_line_items_order_id on public.line_items (order_id);
create index if not exists idx_line_items_sku on public.line_items (sku);

-- --------------------------------------------------------------------------
-- 4. PRODUCTION STATUS TABLE
-- Tracks the production pipeline state for each order.
-- --------------------------------------------------------------------------

create table public.production_status (
  id uuid default gen_random_uuid() primary key,
  order_id text not null,
  stage text default 'new_order' not null,
  stage_updated_at timestamp with time zone default timezone('utc'::text, now()),
  assigned_staff_id uuid references public.staff(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(order_id)
);

alter table public.production_status enable row level security;

create policy "Production status is viewable by authenticated users"
  on public.production_status for select
  to authenticated
  using (true);

create policy "Production status is insertable by authenticated users"
  on public.production_status for insert
  to authenticated
  with check (true);

create policy "Production status is updatable by authenticated users"
  on public.production_status for update
  to authenticated
  using (true)
  with check (true);

create index if not exists idx_production_status_order_id on public.production_status (order_id);
create index if not exists idx_production_status_assigned_staff on public.production_status (assigned_staff_id);

-- --------------------------------------------------------------------------
-- 5. INTERNAL NOTES TABLE
-- Staff-authored notes on orders, visible only to the team.
-- --------------------------------------------------------------------------

create table if not exists public.internal_notes (
  id          uuid primary key default gen_random_uuid(),
  order_id    text not null,
  staff_id    uuid not null references public.staff(id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.internal_notes enable row level security;

create policy "Internal notes are viewable by authenticated users"
  on public.internal_notes for select
  to authenticated
  using (true);

create policy "Internal notes are insertable by authenticated users"
  on public.internal_notes for insert
  to authenticated
  with check (staff_id = auth.uid());

create policy "Authors can update own notes"
  on public.internal_notes for update
  to authenticated
  using (staff_id = auth.uid())
  with check (staff_id = auth.uid());

create policy "Authors can delete own notes"
  on public.internal_notes for delete
  to authenticated
  using (staff_id = auth.uid());

create policy "Admins can delete any note"
  on public.internal_notes for delete
  to authenticated
  using (
    exists (
      select 1 from public.staff s where s.id = auth.uid() and s.role = 'admin'
    )
  );

create index if not exists idx_internal_notes_order_id on public.internal_notes (order_id);
create index if not exists idx_internal_notes_staff_id on public.internal_notes (staff_id);

-- --------------------------------------------------------------------------
-- 6. STATUS HISTORY TABLE
-- Audit log of every production-status toggle.
-- --------------------------------------------------------------------------

create table if not exists public.status_history (
  id            uuid primary key default gen_random_uuid(),
  order_id      text not null,
  staff_id      uuid not null references public.staff(id) on delete cascade,
  status_field  text not null,
  old_value     text not null,
  new_value     text not null,
  changed_at    timestamptz not null default now()
);

alter table public.status_history enable row level security;

create policy "Status history is viewable by authenticated users"
  on public.status_history for select
  to authenticated
  using (true);

create policy "Status history is insertable by authenticated users"
  on public.status_history for insert
  to authenticated
  with check (staff_id = auth.uid());

create index if not exists idx_status_history_order_id on public.status_history (order_id);
create index if not exists idx_status_history_staff_id on public.status_history (staff_id);
create index if not exists idx_status_history_changed_at on public.status_history (changed_at desc);

-- --------------------------------------------------------------------------
-- 7. TRIGGER: Auto-create staff record on new auth user signup
-- --------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.staff (id, username, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', new.email),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'staff')
  );
  return new;
end;
$$;

-- Drop existing trigger if it exists, then recreate
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- 8. TRIGGER: Auto-update updated_at on production_status changes
-- --------------------------------------------------------------------------

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_production_status_updated_at
  before update on public.production_status
  for each row
  execute function public.update_updated_at();

create trigger set_internal_notes_updated_at
  before update on public.internal_notes
  for each row
  execute function public.update_updated_at();
