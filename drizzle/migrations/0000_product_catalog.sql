create type public.app_role as enum ('admin', 'user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique (user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;

create table public.categories (id uuid primary key default gen_random_uuid(), name_uk text not null, name_en text not null, slug text unique not null, description_uk text, description_en text, is_active boolean not null default true, is_demo boolean not null default false, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid references public.categories(id), sku text unique, name_uk text not null, name_en text, description_uk text, description_en text, brand text, unit text not null check (unit in ('piece','kg','bag','meter','m2','m3','liter','pack','roll','sheet','set','ton')), specifications jsonb not null default '{}', is_active boolean not null default true, is_demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index products_category_idx on public.products(category_id);
create table public.product_prices (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, price numeric(12,2) not null check (price >= 0), currency text not null check (currency ~ '^[A-Z]{3}$'), valid_from timestamptz not null default now(), valid_until timestamptz, source text, is_demo boolean not null default false, updated_at timestamptz not null default now(), check (valid_until is null or valid_until > valid_from));
create index product_prices_product_idx on public.product_prices(product_id, valid_from desc);
create table public.product_inventory (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, availability_status text not null default 'unknown' check (availability_status in ('in_stock','out_of_stock','on_order','unknown')), quantity numeric(12,3), unit text, source text, updated_at timestamptz not null default now());
create index product_inventory_product_idx on public.product_inventory(product_id, updated_at desc);
create table public.store_knowledge (id uuid primary key default gen_random_uuid(), topic text not null, question_uk text, answer_uk text, question_en text, answer_en text, is_verified boolean not null default false, updated_at timestamptz not null default now());
create table public.product_faq (id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade, category_id uuid references public.categories(id) on delete cascade, question_uk text not null, answer_uk text not null, question_en text, answer_en text, is_verified boolean not null default false, updated_at timestamptz not null default now(), check (product_id is not null or category_id is not null));

do $$ declare t text; begin foreach t in array array['categories','products','product_prices','product_inventory','store_knowledge','product_faq'] loop
  execute format('grant select on public.%I to anon, authenticated', t);
  execute format('grant insert, update, delete on public.%I to authenticated', t);
  execute format('grant all on public.%I to service_role', t);
  execute format('alter table public.%I enable row level security', t);
  execute format('create trigger touch_%I before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  execute format('create policy "Admins manage %s" on public.%I for all to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t, t);
end loop; end $$;

create policy "Public reads active categories" on public.categories for select to anon, authenticated using (is_active and not is_demo);
create policy "Public reads active products" on public.products for select to anon, authenticated using (is_active and not is_demo and exists (select 1 from public.categories c where c.id = category_id and c.is_active and not c.is_demo));
create policy "Public reads current prices" on public.product_prices for select to anon, authenticated using (not is_demo and valid_from <= now() and (valid_until is null or valid_until > now()) and exists (select 1 from public.products p where p.id = product_id and p.is_active and not p.is_demo));
create policy "Public reads inventory" on public.product_inventory for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.is_active and not p.is_demo));
create policy "Public reads verified knowledge" on public.store_knowledge for select to anon, authenticated using (is_verified);
create policy "Public reads verified faq" on public.product_faq for select to anon, authenticated using (is_verified);