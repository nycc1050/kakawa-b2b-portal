-- Kakawa B2B Portal — initial schema
-- Run via Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

-- ============ ENUM-ish check constraints kept as text for simplicity ============

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

-- auto-create profile row on new auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ tiers ============
create table public.tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_discount_percent numeric not null default 0 check (base_discount_percent >= 0 and base_discount_percent < 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.volume_discounts (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.tiers(id) on delete cascade,
  min_quantity int not null check (min_quantity > 0),
  additional_discount_percent numeric not null check (additional_discount_percent >= 0 and additional_discount_percent < 1),
  created_at timestamptz not null default now(),
  unique (tier_id, min_quantity)
);

-- ============ customers ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  company_name text not null,
  phone text,
  tier_id uuid references public.tiers(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ products / product_variants ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shopify_product_id bigint,
  title text not null,
  handle text,
  category text,
  description text,
  image_url text,
  tags text[] default '{}',
  is_b2b_visible boolean not null default true,
  source text not null default 'manual' check (source in ('scraped','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index products_shopify_id_uidx on public.products(shopify_product_id) where shopify_product_id is not null;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  shopify_variant_id bigint,
  variant_title text,
  sku text,
  b2c_price numeric not null check (b2c_price >= 0),
  weight_grams int,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index variants_shopify_id_uidx on public.product_variants(shopify_variant_id) where shopify_variant_id is not null;

-- ============ customization_requests ============
create table public.customization_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid references public.product_variants(id),
  estimated_quantity int,
  color_preferences text,
  logo_file_url text,
  embossing_details text,
  special_instructions text,
  status text not null default 'submitted' check (status in ('submitted','in-review','approved','ready-to-order')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ helper: is current user an admin ============
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_customer_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select id from public.customers where profile_id = auth.uid();
$$;

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.tiers enable row level security;
alter table public.volume_discounts enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customization_requests enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- tiers: customer sees only their own tier; admin sees/writes all
create policy "tiers_select_own_or_admin" on public.tiers
  for select using (
    public.is_admin()
    or id = (select tier_id from public.customers where profile_id = auth.uid())
  );
create policy "tiers_admin_write" on public.tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- volume_discounts: mirror tiers visibility
create policy "volume_discounts_select_own_or_admin" on public.volume_discounts
  for select using (
    public.is_admin()
    or tier_id = (select tier_id from public.customers where profile_id = auth.uid())
  );
create policy "volume_discounts_admin_write" on public.volume_discounts
  for all using (public.is_admin()) with check (public.is_admin());

-- customers: own row or admin
create policy "customers_select_own_or_admin" on public.customers
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "customers_admin_write" on public.customers
  for all using (public.is_admin()) with check (public.is_admin());

-- products / variants: any authenticated user sees b2b-visible; admin sees/writes all
create policy "products_select_visible_or_admin" on public.products
  for select using (is_b2b_visible = true or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "variants_select_visible_or_admin" on public.product_variants
  for select using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.is_b2b_visible = true)
  );
create policy "variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- customization_requests: own rows or admin
create policy "requests_select_own_or_admin" on public.customization_requests
  for select using (
    customer_id = public.current_customer_id() or public.is_admin()
  );
create policy "requests_insert_own" on public.customization_requests
  for insert with check (customer_id = public.current_customer_id());
create policy "requests_update_own_or_admin" on public.customization_requests
  for update using (
    customer_id = public.current_customer_id() or public.is_admin()
  );

-- ============ Storage: customization logos ============
insert into storage.buckets (id, name, public)
values ('customization-logos', 'customization-logos', false)
on conflict (id) do nothing;

create policy "logo_upload_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'customization-logos'
    and (storage.foldername(name))[1] = public.current_customer_id()::text
  );
create policy "logo_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'customization-logos'
    and ((storage.foldername(name))[1] = public.current_customer_id()::text or public.is_admin())
  );
