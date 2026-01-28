-- Create app schema for RLS helper functions and internal utilities
-- All SECURITY DEFINER functions will be placed here to separate concerns

CREATE SCHEMA IF NOT EXISTS app;

COMMENT ON SCHEMA app IS 'Application helper functions (RLS, utilities) with SECURITY DEFINER access';
