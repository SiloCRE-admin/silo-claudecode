# Silo — System Architecture

Version: 1.0
Status: Living Document
Last Updated: 2026-01-28

---

## 1. Purpose of This Document

This document describes **how Silo is built** at a system level:

- Major components
- Data flow
- Security boundaries
- Multi-tenant model
- Integration points
- Non-functional requirements (scale, performance, reliability)

The PRD defines *what* Silo does.  
This document defines *how* it is implemented.

Any architectural changes must remain consistent with the PRD.

---

## 2. High-Level Architecture Overview

### 2.1 Architecture Diagram (conceptual)
Browser (Next.js)
|
v
Frontend (App Router, React, Tailwind)
|
v
Supabase API Layer
├── Auth
├── Postgres (PostGIS)
├── Storage
└── RLS Policies
|
v
AI Services (Claude API)
|
v
External Services
(Mapbox, Google Places, Stripe, Email Ingest)
---

## 3. Frontend Architecture

### 3.1 Framework

- Next.js (App Router)
- TypeScript
- Tailwind CSS

### 3.2 Key Responsibilities

- Authentication UI
- Team & role-aware navigation
- CRUD interfaces (comps, CRM, asset management)
- Map views
- Bulk import review flows
- Export workflows

### 3.3 State Management

- Server Components where possible
- Client state for:
  - filters
  - map view
  - form drafts
  - bulk import review sessions

### 3.4 Authorization Strategy (Frontend)

- Role-aware UI rendering
- Permission checks are **defensive only**
- All real enforcement occurs via RLS in the database

---

## 4. Backend Architecture (Supabase)

### 4.1 Core Services Used

- Supabase Auth
- Postgres (primary database)
- PostGIS extension
- Supabase Storage
- Row Level Security (RLS)
- Database functions & triggers (limited use)

---

## 5. Multi-Tenant Data Model

### 5.1 Isolation Unit

- **Isolation unit = Team** (billing + data boundary)
- **Note**: The PRD uses "Tenant" to refer to a business entity (lease tenant). To avoid confusion in architecture discussions, we use "Team" for the multi-tenancy isolation boundary.

### 5.2 Isolation Strategy

- Every team-owned table contains `team_id`
- RLS enforced on:
  - SELECT
  - INSERT
  - UPDATE
  - DELETE

### 5.3 Exceptions

- Shared tables:
  - buildings
  - markets / submarkets

- Guest access:
  - mediated through guest access control tables (see `docs/DATA_MODEL.md`)
  - never via team membership

---

## 6. Asset Management Access Model

- Portfolio data owned by owner’s team
- Guest users exist outside team structure
- Access scoped to:
  - portfolio
  - building
  - suite

**Implementation**: See `docs/DATA_MODEL.md` for exact tables (guest users, guest access grants) and `docs/RLS_POLICIES.md` for suite-level access enforcement.

6.5 Source of Truth & Field Provenance Architecture
This section defines how Silo enforces the PRD source-of-truth rules for buildings, transactions, documents, and AI-extracted data.
6.5.1 Field-Level Provenance Model
All AI-extracted and manually edited structured fields support provenance tracking.
Each tracked field stores:
source_type

 (user, ai, import, document, system)


source_reference_id (document_id, import_job_id, etc.)


confidence_score (0–100)


extracted_at


overridden_by_user (boolean)


**Implementation**: Separate provenance table with polymorphic references (`entity_type`, `entity_id`, `field_name`). See `docs/DATA_MODEL.md` for exact schema.


Rules:
User edits always override AI values.


AI writes always create provenance records.


Manual edits update provenance with source_type = user.


RLS:
Enforced via parent entity ownership.


No direct access for guests unless entity is shared via asset access.



6.5.2 Draft vs Active State Enforcement
Entities created via extraction or bulk import enter draft state.
Mechanism:
status enum: draft | active


Draft visibility:


creator only


Activation:


explicit user confirmation


transactional promotion


Applies to:
comps


CRM entities


development tracker entries


asset management records (if extracted)


RLS ensures:
Non-creators cannot access drafts.


Draft rows cannot appear in maps, exports, analytics, or aggregates.



6.5.3 Building Crowdsourcing & Admin Review Flow
Building data is shared across teams but controlled.

**Tables**: See `docs/DATA_MODEL.md` for building attributes, provenance, flags, review queue, and locked fields.


Flow
User submits building edit


System creates:


new attribute record


provenance entry


Other users see latest unlocked value


User may flag incorrect data:


record added to building_flags


Flag enters admin_review_queue


God Admin may:


approve change


reject change


lock field


Locked Fields
Stored in locked_building_fields


Enforced via:


RLS policies


update triggers


Precedence:
locked field (admin) > user override > AI > external sources
God Admin access is limited to:
building attributes


markets / submarkets


review queues


No access to:
team-owned entities


transactions


CRM


asset management



6.5.4 Document Source of Truth Enforcement
Documents are immutable sources.
Rules:
Raw file stored in Supabase Storage


Structured fields reference document_id


Deleting structured data does not delete documents


Deleting documents invalidates derived fields


**Tables**: See `docs/DATA_MODEL.md` for documents and document linking schema.



6.5.5 Bulk Import & Extraction Confirmation Model
Extraction pipeline:
Upload → Storage → Import Job → AI → Draft Rows → User Review → Commit
**Tables**: See `docs/DATA_MODEL.md` for extraction job schema (extraction_jobs, extraction_job_items).


Guarantees:
Idempotent by source hash


Atomic by default


Optional partial commit


No visibility before activation


Full provenance per field



6.5.6 Transaction & Team-Owned Data Rules
For:
comps


deals


pipeline


market chatter


development tracker


CRM


Rules:
Team is sole owner


No cross-team reads


User edits override AI


Field-level provenance required


Export governance enforced downstream



6.5.7 Audit Logging
**Immutable audit log table**: See `docs/DATA_MODEL.md` for audit_log schema.
Tracks:
entity_type


entity_id


action


actor_user_id


timestamp


before / after snapshot


Retention:
Never deleted




---

## 7. Spatial / Map Architecture

### 7.1 Storage

- latitude (numeric)
- longitude (numeric)
- geography(Point, 4326) via PostGIS

### 7.2 Indexing

- GIST index on geography field

### 7.3 Pin Visibility Rules

- Only buildings with team-visible data appear
- No leakage of other teams’ building activity
- Shared building specs do NOT imply activity presence

### 7.4 Map Layers

- Lease comps
- Sale comps
- Land comps
- Development tracker
- Market chatter
- Portfolio assets

---

## 8. AI / Extraction Architecture

### 8.1 Services

- Claude API

### 8.2 Data Flow
Upload → Storage → Job record → Claude → Parsed fields → Draft state → User confirmation → Commit
### 8.3 Job Types

- Single document
- Bulk import batch
- Email ingestion
- Voice transcription
- OCR images

### 8.4 Guarantees

- No auto-commit
- Field-level source tracking
- User override precedence

---

## 9. Security Architecture

### 9.1 Encryption

- AES-256 at rest
- TLS 1.3 in transit

### 9.2 Access Control

- Database-level RLS enforcement
- Role based UI gating
- Export approval workflows

### 9.3 Admin Boundaries

- God admin:
  - building data only
  - reference data only
  - no team data access

---

## 10. External Integrations

| Service | Purpose |
|--------|---------|
| Supabase Auth | Authentication |
| Mapbox | Map rendering |
| Google Places | Address autocomplete |
| Claude | AI extraction |
| Stripe | Billing |
| SendGrid/Postmark | Email ingestion |

---

## 11. Environments

### 11.1 Local

- Next.js dev server
- Supabase cloud project
- Local migrations

### 11.2 Staging (future)

- Separate Supabase project
- Isolated Stripe test keys

### 11.3 Production

- Hardened RLS
- Backups enabled
- Monitoring enabled

---

## 12. Performance Targets

- P95 API response < 300ms
- Map tile load < 1s
- Bulk import up to 1,000 comps
- Concurrent users: 5,000+

---

## 13. Scalability Strategy

- Vertical DB scaling first
- Read replicas later
- PostGIS indexes
- Background jobs for AI
- Paginated APIs
- Cursor-based pagination

---

## 14. Observability (Future)

- Error tracking (Sentry or similar)
- Query performance logs
- Export audit logs
- AI job failure tracking

---

## 15. Architecture Decisions Log

Reference `docs/DECISIONS.md` for:

- Map tech choice
- Supabase selection
- PostGIS usage
- Guest access model
- Export security thresholds

---

## 16. Out of Scope (For Now)

- Public APIs
- Webhooks
- Data warehouse
- Predictive analytics
- Offline support

---

End of document.

