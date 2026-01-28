-- Enable required extensions (safe if already enabled)
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- Parcels table (core spatial entity)
create table public.parcels (
  id uuid primary key default gen_random_uuid(),

  -- Multi-tenant ownership
  organization_id uuid not null,

  -- Identifiers
  parcel_number text,
  address text,
  city text,
  state text,
  postal_code text,
  country text default 'US',

  -- Spatial geometry (WGS84)
  geom geometry(Polygon, 4326) not null,

  -- Metadata
  area_sq_m numeric,
  centroid geometry(Point, 4326),

  -- Audit fields
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Spatial index for fast map queries
create index parcels_geom_gix on public.parcels using gist (geom);

-- Org lookup index
create index parcels_org_idx on public.parcels (organization_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_parcels_updated_at
before update on public.parcels
for each row
execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.parcels enable row level security;

-- Locked down by default (we'll add real org-based policies next)
create policy "no_access_by_default"
on public.parcels
for all
using (false);
