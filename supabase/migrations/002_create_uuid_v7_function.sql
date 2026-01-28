-- UUID v7 Generator Function
-- Implements time-ordered UUIDs per draft RFC spec
-- Format: 48-bit timestamp + version/variant bits + 74 random bits
--
-- Structure:
-- - unix_ts_ms (48 bits): milliseconds since Unix epoch
-- - ver (4 bits): version = 7
-- - rand_a (12 bits): random data
-- - var (2 bits): variant = 10
-- - rand_b (62 bits): random data

CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  unix_ts_ms BYTEA;
  uuid_bytes BYTEA;
BEGIN
  -- Get current timestamp in milliseconds as 6 bytes (48 bits)
  unix_ts_ms := substring(
    int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint),
    3, 6
  );

  -- Generate 10 random bytes
  uuid_bytes := unix_ts_ms || gen_random_bytes(10);

  -- Set version (4 bits) to 7: byte 6, top 4 bits = 0111
  uuid_bytes := set_byte(
    uuid_bytes,
    6,
    (b'0111' || substring(get_byte(uuid_bytes, 6)::bit(8), 5, 4))::bit(8)::int
  );

  -- Set variant (2 bits) to RFC 4122: byte 8, top 2 bits = 10
  uuid_bytes := set_byte(
    uuid_bytes,
    8,
    (b'10' || substring(get_byte(uuid_bytes, 8)::bit(8), 3, 6))::bit(8)::int
  );

  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;

COMMENT ON FUNCTION public.uuid_generate_v7() IS 'Generate time-ordered UUID v7 per draft RFC specification';
