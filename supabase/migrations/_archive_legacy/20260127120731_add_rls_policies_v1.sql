-- =========================================================
-- RLS v1 for multi-tenant org access
-- Tables:
--   organizations
--   organization_members
--   parcels
-- =========================================================

-- Helper: get the current user's role in an org (or null if not a member)
create or replace function public.org_role(org_id uuid)
returns text
language sql
stable
as $$
  select om.role
  from public.organization_members om
  where om.organization_id = org_id
    and om.user_id = auth.uid()
  limit 1
$$;

-- Helper: is current user a member of an org?
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
as $$
  select public.org_role(org_id) is not null
$$;

-- Helper: does current user have one of the allowed roles in an org?
create or replace function public.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
as $$
  select public.org_role(org_id) = any(allowed_roles)
$$;

-- ---------------------------------------------------------
-- Remove "no access" placeholder policies
-- ---------------------------------------------------------
drop policy if exists "no_access_by_default" on public.organizations;
drop policy if exists "no_access_by_default" on public.organization_members;
drop policy if exists "no_access_by_default" on public.parcels;

-- ---------------------------------------------------------
-- organizations policies
-- ---------------------------------------------------------

-- Members can read their org
create policy "org_select_if_member"
on public.organizations
for select
to authenticated
using (
  public.is_org_member(id)
);

-- Only owners/admins can update their org
create policy "org_update_if_admin_or_owner"
on public.organizations
for update
to authenticated
using (
  public.has_org_role(id, array['owner','admin'])
)
with check (
  public.has_org_role(id, array['owner','admin'])
);

-- Only owners/admins can delete their org
create policy "org_delete_if_admin_or_owner"
on public.organizations
for delete
to authenticated
using (
  public.has_org_role(id, array['owner','admin'])
);

-- NOTE: No INSERT policy yet.
-- That means regular users cannot create orgs via client-side API.
-- We'll add "org creation flow" next (safe + automatic membership).

-- ---------------------------------------------------------
-- organization_members policies
-- ---------------------------------------------------------

-- Any member of an org can see the membership list for that org
create policy "org_members_select_if_member_of_org"
on public.organization_members
for select
to authenticated
using (
  public.is_org_member(organization_id)
);

-- Only owners/admins can add members to their org
create policy "org_members_insert_if_admin_or_owner"
on public.organization_members
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['owner','admin'])
);

-- Only owners/admins can change roles / membership
create policy "org_members_update_if_admin_or_owner"
on public.organization_members
for update
to authenticated
using (
  public.has_org_role(organization_id, array['owner','admin'])
)
with check (
  public.has_org_role(organization_id, array['owner','admin'])
);

-- Only owners/admins can remove members
create policy "org_members_delete_if_admin_or_owner"
on public.organization_members
for delete
to authenticated
using (
  public.has_org_role(organization_id, array['owner','admin'])
);

-- ---------------------------------------------------------
-- parcels policies
-- ---------------------------------------------------------

-- Members can read parcels in their org
create policy "parcels_select_if_member"
on public.parcels
for select
to authenticated
using (
  public.is_org_member(organization_id)
);

-- Only owners/admins can create parcels in their org
create policy "parcels_insert_if_admin_or_owner"
on public.parcels
for insert
to authenticated
with check (
  public.has_org_role(organization_id, array['owner','admin'])
);

-- Only owners/admins can update parcels in their org
create policy "parcels_update_if_admin_or_owner"
on public.parcels
for update
to authenticated
using (
  public.has_org_role(organization_id, array['owner','admin'])
)
with check (
  public.has_org_role(organization_id, array['owner','admin'])
);

-- Only owners/admins can delete parcels in their org
create policy "parcels_delete_if_admin_or_owner"
on public.parcels
for delete
to authenticated
using (
  public.has_org_role(organization_id, array['owner','admin'])
);
