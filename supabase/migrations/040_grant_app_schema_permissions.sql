-- Grant EXECUTE permission on app schema functions to authenticated role
-- Required for RLS policies to work correctly since they call app.* functions

-- Grant usage on app schema
GRANT USAGE ON SCHEMA app TO authenticated;

-- Grant execute on all functions in app schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;

-- Ensure future functions also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT EXECUTE ON FUNCTIONS TO authenticated;

COMMENT ON SCHEMA app IS 'RLS helper functions - authenticated role must have EXECUTE access';
