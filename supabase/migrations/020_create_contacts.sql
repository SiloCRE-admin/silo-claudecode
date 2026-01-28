-- Contacts - team-private CRM contact management
-- Supports company normalization for deduplication and soft delete

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v7(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name_raw text,
  email text,
  company_raw text,
  company_normalized text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE INDEX idx_contacts_team_id ON public.contacts(team_id);
CREATE INDEX idx_contacts_company_normalized ON public.contacts(company_normalized) WHERE company_normalized IS NOT NULL;
CREATE INDEX idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_team_not_deleted ON public.contacts(team_id, is_deleted);

-- Now add the FK constraint to market_chatter_contacts
ALTER TABLE public.market_chatter_contacts
  ADD CONSTRAINT market_chatter_contacts_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

COMMENT ON TABLE public.contacts IS 'Team-private CRM contacts with company normalization';
COMMENT ON COLUMN public.contacts.company_normalized IS 'Normalized company name for deduplication and search';
