-- Documents - team-private document storage tracking
-- Tracks files in Supabase Storage with metadata and provenance
-- Supports multiple capture sources (upload, email, voice, OCR, etc.)

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  storage_bucket text,
  storage_path text,
  file_path text,
  file_name text NOT NULL,
  mime_type text,
  file_size_bytes bigint,
  sha256 text,
  capture_source public.document_capture_source NOT NULL,
  status public.document_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_documents_team_id ON public.documents(team_id);
CREATE INDEX idx_documents_sha256 ON public.documents(sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_team_not_deleted ON public.documents(team_id, is_deleted);

-- Document links - generic many-to-many linking between documents and entities
-- Allows one document to link to many entities (comps, contacts, etc.) and vice versa
CREATE TABLE public.document_links (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_document_links_team_id ON public.document_links(team_id);
CREATE INDEX idx_document_links_document_id ON public.document_links(team_id, document_id);
CREATE INDEX idx_document_links_entity ON public.document_links(team_id, entity_type, entity_id);

COMMENT ON TABLE public.documents IS 'Team-private document storage tracking with multi-source capture';
COMMENT ON COLUMN public.documents.storage_bucket IS 'Supabase Storage bucket name';
COMMENT ON COLUMN public.documents.storage_path IS 'Path within bucket';
COMMENT ON COLUMN public.documents.file_path IS 'Legacy file path (optional)';
COMMENT ON COLUMN public.documents.sha256 IS 'SHA-256 hash for deduplication';
COMMENT ON COLUMN public.documents.capture_source IS 'How document was captured (upload, email, voice, etc.)';

COMMENT ON TABLE public.document_links IS 'Generic document-to-entity linking (many-to-many)';
COMMENT ON COLUMN public.document_links.entity_type IS 'Entity table name (e.g., lease_comps, contacts)';
COMMENT ON COLUMN public.document_links.entity_id IS 'Entity primary key';
