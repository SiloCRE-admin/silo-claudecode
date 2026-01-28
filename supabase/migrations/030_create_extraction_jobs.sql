-- Extraction jobs - AI/OCR extraction pipeline tracking
-- Supports multiple extraction types (document, bulk, email, voice, OCR)
-- No auto-commit: all extracted data goes to draft status for review

CREATE TABLE public.extraction_jobs (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  job_type public.extraction_job_type NOT NULL,
  status public.extraction_job_status NOT NULL DEFAULT 'queued',
  source_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  source_hash text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_extraction_jobs_team_id ON public.extraction_jobs(team_id);
CREATE INDEX idx_extraction_jobs_status ON public.extraction_jobs(status);
CREATE INDEX idx_extraction_jobs_source_doc ON public.extraction_jobs(source_document_id) WHERE source_document_id IS NOT NULL;
CREATE INDEX idx_extraction_jobs_source_hash ON public.extraction_jobs(source_hash) WHERE source_hash IS NOT NULL;

-- Extraction job items - individual extracted entities (draft payloads)
-- User must review and accept/reject each item before committing to database
CREATE TABLE public.extraction_job_items (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  extraction_job_id uuid NOT NULL REFERENCES public.extraction_jobs(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  status public.extraction_item_status NOT NULL DEFAULT 'draft',
  duplicate_of_entity_id uuid,
  draft_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_extraction_items_team_id ON public.extraction_job_items(team_id);
CREATE INDEX idx_extraction_items_job_id ON public.extraction_job_items(extraction_job_id);
CREATE INDEX idx_extraction_items_status ON public.extraction_job_items(status);
CREATE INDEX idx_extraction_items_entity_type ON public.extraction_job_items(entity_type);

COMMENT ON TABLE public.extraction_jobs IS 'AI/OCR extraction pipeline jobs - no auto-commit, review required';
COMMENT ON COLUMN public.extraction_jobs.source_hash IS 'Idempotency key to prevent duplicate processing';
COMMENT ON COLUMN public.extraction_jobs.job_type IS 'Extraction source type (document, bulk, email, voice, OCR)';

COMMENT ON TABLE public.extraction_job_items IS 'Individual extracted entities in draft form - must be reviewed';
COMMENT ON COLUMN public.extraction_job_items.draft_payload IS 'Extracted data as JSONB (not yet committed to tables)';
COMMENT ON COLUMN public.extraction_job_items.duplicate_of_entity_id IS 'Reference to existing entity if duplicate detected';
COMMENT ON COLUMN public.extraction_job_items.status IS 'draft (pending review), accepted (committed), or rejected';
