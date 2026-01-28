-- God Admin Boundary Smoke Test (Fixed JWT claims)

BEGIN;

DO $$ BEGIN RAISE NOTICE '=== God Admin Boundary Test ==='; RAISE NOTICE ''; END $$;

-- Create test teams
INSERT INTO public.teams (id, name, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Team Alpha', now(), now()),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Team Beta', now(), now());

INSERT INTO public.markets (id, name) VALUES ('20000000-0000-0000-0000-000000000001'::uuid, 'Test Market');
INSERT INTO public.buildings (id, name, full_address_raw, city, state, latitude, longitude, location_geog, created_at, updated_at)
VALUES (
  '30000000-0000-0000-0000-000000000001'::uuid, 'Test Building', '123 Test St', 'Test City', 'CA',
  34.0522, -118.2437, ST_GeogFromText('POINT(-118.2437 34.0522)'), now(), now()
);

DO $$ BEGIN RAISE NOTICE 'Test data created'; RAISE NOTICE ''; END $$;

-- Simulate God Admin JWT - set full JWT claims as JSON
SET LOCAL request.jwt.claims TO '{"sub": "aaaaaaaa-0000-0000-0000-000000000000", "role": "authenticated", "app_metadata": {"role": "god_admin"}}';
SET LOCAL role TO authenticated;

DO $$ BEGIN RAISE NOTICE '=== Test 1: Helper Functions ==='; END $$;

-- Test: app.is_god_admin()
DO $$
DECLARE is_god BOOLEAN;
BEGIN
  SELECT app.is_god_admin() INTO is_god;
  RAISE NOTICE 'app.is_god_admin() = %', is_god;
  IF is_god = true THEN
    RAISE NOTICE 'PASS: app.is_god_admin() returns true';
  ELSE
    RAISE NOTICE 'FAIL: app.is_god_admin() returns % (expected true)', is_god;
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE '=== Test 2: God Admin Allowed Access ==='; END $$;

-- Test: teams
DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM public.teams;
  IF c >= 2 THEN
    RAISE NOTICE 'PASS: God Admin can read teams (found %)', c;
  ELSE
    RAISE NOTICE 'FAIL: God Admin blocked from teams (found %)', c;
  END IF;
END $$;

-- Test: markets
DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM public.markets;
  IF c >= 1 THEN
    RAISE NOTICE 'PASS: God Admin can read markets (found %)', c;
  ELSE
    RAISE NOTICE 'FAIL: God Admin blocked from markets (found %)', c;
  END IF;
END $$;

-- Test: buildings
DO $$
DECLARE c INTEGER;
BEGIN
  SELECT COUNT(*) INTO c FROM public.buildings;
  IF c >= 1 THEN
    RAISE NOTICE 'PASS: God Admin can read buildings (found %)', c;
  ELSE
    RAISE NOTICE 'FAIL: God Admin blocked from buildings (found %)', c;
  END IF;
END $$;

DO $$ BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SUMMARY ===';
  RAISE NOTICE 'Expected: 4 PASS, 0 FAIL';
  RAISE NOTICE '';
END $$;

ROLLBACK;
