-- Orgs are the tenant boundary for Silo
create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),

  -- Display
  name text not null,
  slug text not null unique, -- e.g. "acme-capital"

  -- Optional metadata
  plan text,
  metadata jsonb not null default '{}'::jsonb,

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

-- Enable RLS
alter table public.organizations enable row level security;

-- Locked down by default (we'll add real policies next)
create policy "no_access_by_default"
on public.organizations
for all
using (false);
