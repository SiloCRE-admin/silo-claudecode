-- Additional performance indexes beyond those created inline with tables
-- Focuses on common query patterns per PRD requirements

-- Note: Many indexes already created inline with table definitions
-- This file adds supplementary indexes for specific query patterns

-- Additional team_id composite indexes for filtering deleted records
-- (These supplement existing team_id indexes)

-- Market chatter lookups by team + created date
CREATE INDEX idx_market_chatter_team_created
  ON public.market_chatter(team_id, created_at DESC)
  WHERE is_deleted = false;

-- Document lookups by team + created date
CREATE INDEX idx_documents_team_created
  ON public.documents(team_id, created_at DESC)
  WHERE is_deleted = false;

-- Development tracker by team + status + delivery date
CREATE INDEX idx_developments_team_status_delivery
  ON public.developments(team_id, status, estimated_delivery_date)
  WHERE is_deleted = false;

-- Lease comps by signed date for timeline analysis
CREATE INDEX idx_lease_comps_team_signed_date
  ON public.lease_comps(team_id, signed_date DESC)
  WHERE is_deleted = false AND signed_date IS NOT NULL;

-- Sale comps by sale date for timeline analysis
CREATE INDEX idx_sale_comps_team_sale_date
  ON public.sale_comps(team_id, sale_date DESC)
  WHERE is_deleted = false AND sale_date IS NOT NULL;

-- Asset hierarchy navigation (portfolio → assets → suites)
CREATE INDEX idx_assets_portfolio_building
  ON public.assets(portfolio_id, building_id)
  WHERE is_deleted = false;

-- Suite status filtering for vacancy analysis
CREATE INDEX idx_suites_asset_status
  ON public.suites(asset_id, status)
  WHERE is_deleted = false;

-- Extraction job tracking by team + status + updated timestamp
CREATE INDEX idx_extraction_jobs_team_status_updated
  ON public.extraction_jobs(team_id, status, updated_at DESC);

COMMENT ON INDEX idx_market_chatter_team_created IS 'Team chatter timeline queries';
COMMENT ON INDEX idx_documents_team_created IS 'Team document timeline queries';
COMMENT ON INDEX idx_developments_team_status_delivery IS 'Development pipeline filtering and sorting';
COMMENT ON INDEX idx_lease_comps_team_signed_date IS 'Lease comp timeline analysis';
COMMENT ON INDEX idx_sale_comps_team_sale_date IS 'Sale comp timeline analysis';
COMMENT ON INDEX idx_assets_portfolio_building IS 'Asset hierarchy navigation';
COMMENT ON INDEX idx_suites_asset_status IS 'Vacancy analysis by suite status';
COMMENT ON INDEX idx_extraction_jobs_team_status_updated IS 'Extraction job queue management';
