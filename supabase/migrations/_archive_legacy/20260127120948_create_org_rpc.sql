-- Secure RPC to create an organization + add current user as owner
-- This bypasses RLS safely because it's SECURITY DEFINER and uses auth.uid()

create or replace function public.create_organization(
  p_name text,
  p_slug text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_slug text;
  v_org public.organizations;
begin
  -- Must be logged in
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Validate name
  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'invalid_name';
  end if;

  -- Generate or normalize slug
  if p_slug is null or length(trim(p_slug)) = 0 then
    v_slug := lower(trim(p_name));
  else
    v_slug := lower(trim(p_slug));
  end if;

  -- Slugify: keep alphanumerics, convert spaces/underscores to hyphens, remove other chars
  v_slug := regexp_replace(v_slug, '[\s_]+', '-', 'g');
  v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '', 'g');
  v_slug := regexp_replace(v_slug, '-{2,}', '-', 'g');
  v_slug := trim(both '-' from v_slug);

  if length(v_slug) < 2 then
    raise exception 'invalid_slug';
  end if;

  -- Create org
  insert into public.organizations (name, slug)
  values (trim(p_name), v_slug)
  returning * into v_org;

  -- Add creator as owner
  insert into public.organization_members (organization_id, user_id, role)
  values (v_org.id, v_user_id, 'owner');

  return v_org;

exception
  when unique_violation then
    -- Usually slug conflict
    raise exception 'slug_already_exists';
end;
$$;

-- Lock down function privileges, then allow authenticated users to call it
revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

comment on function public.create_organization(text, text)
is 'Creates an organization and adds the calling user as owner. Requires auth.';
