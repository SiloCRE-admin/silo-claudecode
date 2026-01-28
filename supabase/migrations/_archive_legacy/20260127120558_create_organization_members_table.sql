-- org_membership connects Supabase users to organizations (tenant boundary)
create extension if not exists pgcrypto;

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Basic roles for now (we can expand later)
  role text not null check (role in ('owner','admin','member','viewer')) default 'member',

  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A user can only appear once per org
  unique (organization_id, user_id)
);

create index organization_members_org_idx on public.organization_members (organization_id);
create index organization_members_user_idx on public.organization_members (user_id);

-- Keep updated_at current (reuses the same function you already created)
create trigger set_organization_members_updated_at
before update on public.organization_members
for each row
execute function public.set_updated_at();

-- Enable RLS
alter table public.organization_members enable row level security;

-- Locked down by default (we’ll add real policies next)
create policy "no_access_by_default"
on public.organization_members
for all
using (false);
