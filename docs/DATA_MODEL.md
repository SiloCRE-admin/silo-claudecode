# Silo — Data Model Specification

Version: 1.1  
Status: Living Document  
Last Updated: 2026-01-28

---

## 1. Purpose

This document defines:

- Database entities (tables)
- Key fields + relationships
- Ownership + tenancy boundaries
- Guest access model (asset-scoped)
- Spatial / map data model
- Document linking
- Extraction + provenance
- Audit + export tracking

The PRD defines *what exists*.  
This document defines *how it is structured in the database*.

Supabase (Postgres + PostGIS) is the authoritative datastore.

---

## 2. Core Principles

- Team = the isolation unit (billing + data boundary)
- All team-owned data includes `team_id`
- Row Level Security (RLS) enforced everywhere
- No cross-team visibility except:
  - shared building layer
  - reference data (markets/submarkets)
- Asset management data belongs to owner’s team
- Guest users exist outside team membership and only access explicitly granted assets/suites
- Spatial data stored in PostGIS using geography(Point, 4326)
- Soft delete by default for team-owned entities (90-day retention per PRD)

---

## 3. Identity & Tenancy

### teams

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | DEFAULT uuid_v7() |
| name | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| created_by | uuid (v7) | references auth.users.id (or null for system) |
| updated_by | uuid (v7) | references auth.users.id |

---

### profiles (canonical membership + role)

**Canonical rule (PRD):** one user belongs to exactly one team.

| Field | Type | Notes |
|------|------|------|
| user_id | uuid PK | references auth.users.id |
| team_id | uuid (v7) | references teams.id |
| email | text | convenience cache |
| role | enum(team_owner, team_admin, team_member, billing_contact) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| created_by | uuid (v7) | references auth.users.id |
| updated_by | uuid (v7) | references auth.users.id |

Constraints:
- PK = user_id (one row per user)
- profiles.team_id required (one team per user)

---

## 4. Reference Data (System)

### markets

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| name | text | system-defined |

### submarkets

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| market_id | uuid (v7) | FK → markets.id |
| name | text | system-defined |

---

## 5. Buildings (Shared Layer)

### buildings (shared)

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| name | text | |
| full_address_raw | text | |
| address_normalized | jsonb | |
| address_components | jsonb | city/county/state/postal/etc |
| city | text | |
| county | text | |
| state | text | |
| postal_code | text | |
| latitude | numeric(9,6) | |
| longitude | numeric(9,6) | |
| location_geog | geography(Point,4326) | PostGIS |
| coordinate_source | enum(admin, user, google) | precedence handled by app/admin process |
| coordinate_confirmed | boolean | |
| building_sf | integer | |
| clear_height | integer | |
| year_built | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes:
- GIST(location_geog)

Notes:
- Buildings are shared/crowdsourced but moderated; never hard deleted.

---

### building_attributes (shared “current value” per field)

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| building_id | uuid (v7) | FK → buildings.id |
| field_name | text | e.g., clear_height |
| value_json | jsonb | typed value stored as json |
| created_at | timestamptz | |
| created_by | uuid | references auth.users.id |

---

### building_attribute_provenance

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| building_attribute_id | uuid (v7) | FK → building_attributes.id |
| source_type | enum(admin, user, ai, import) | |
| source_reference_id | uuid | optional (doc/extraction/etc) |
| confidence_score | integer | 0–100 optional |
| created_at | timestamptz | |

---

### building_flags

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| building_id | uuid (v7) | FK → buildings.id |
| flagged_by_user_id | uuid | references auth.users.id |
| field_name | text | |
| reason | text | |
| status | enum(open, resolved, rejected) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### admin_review_queue

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| building_id | uuid (v7) | FK → buildings.id |
| field_name | text | |
| proposed_value_json | jsonb | |
| status | enum(pending, approved, rejected) | |
| decided_by | uuid | auth.users.id |
| decided_at | timestamptz | |
| created_at | timestamptz | |

---

### locked_building_fields

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| building_id | uuid (v7) | FK → buildings.id |
| field_name | text | |
| is_active | boolean | |
| locked_by | uuid | auth.users.id |
| locked_at | timestamptz | |

---

### team_building_presence (map privacy)

Purpose: prevent map leakage by ensuring pins only exist where a team has data.

| Field | Type | Notes |
|------|------|------|
| team_id | uuid (v7) | FK → teams.id |
| building_id | uuid (v7) | FK → buildings.id |
| created_at | timestamptz | |

PK:
- (team_id, building_id)

---

## 6. Transactional Comps (Team Private)

Common columns on comps:
- team_id, building_id
- status: draft/active
- soft delete fields
- created_by/updated_by + timestamps

### lease_comps

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | FK → teams.id |
| building_id | uuid (v7) | FK → buildings.id |
| status | enum(draft, active) | |
| tenant_name_raw | text | |
| tenant_name_normalized | text | indexed |
| lease_sf | integer | |
| signed_date | date | |
| lease_start_date | date | actual or estimated |
| lease_end_date | date | last day of month |
| lease_term_months | integer | |
| rent_psf_cents | integer | currency cents |
| ti_allowance_cents | integer | currency cents |
| free_rent_months | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| created_by | uuid | auth.users.id |
| updated_by | uuid | auth.users.id |
| is_deleted | boolean | default false |
| deleted_at | timestamptz | |

---

### sale_comps

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| building_id | uuid (v7) | |
| status | enum(draft, active) | |
| sale_date | date | |
| sale_price_cents | bigint | currency cents |
| sale_price_psf_cents | integer | |
| cap_rate_bps | integer | basis points |
| buyer_name_raw | text | |
| seller_name_raw | text | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### land_comps

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| parcel_id | uuid (v7) | optional future FK |
| status | enum(draft, active) | |
| sale_date | date | |
| sale_price_cents | bigint | |
| acres | numeric(12,2) | Land area in decimal acres |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

## 7. Development Tracker (Team Private)

### developments

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | FK → teams.id |
| building_id | uuid (v7) | FK → buildings.id |
| status | enum(planned, under_construction, delivering, delivered, stalled, cancelled) | |
| estimated_delivery_date | date | nullable |
| developer | text | |
| size_sf | integer | nullable |
| notes | text | |
| active | boolean | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

## 8. Market Chatter (Team Private)

### market_chatter

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| author_user_id | uuid | auth.users.id |
| body_text | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| created_by | uuid | auth.users.id |
| updated_by | uuid | auth.users.id |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### market_chatter_flags

| Field | Type | Notes |
|------|------|------|
| chatter_id | uuid (v7) | FK → market_chatter.id |
| category | enum(lease, sale, development, tenant_movement, debt, ownership_change, distress, capital_markets, other) | |

PK:
- (chatter_id, category)

---

### market_chatter_buildings

| Field | Type | Notes |
|------|------|------|
| chatter_id | uuid (v7) | FK → market_chatter.id |
| building_id | uuid (v7) | FK → buildings.id |

PK:
- (chatter_id, building_id)

---

### market_chatter_contacts

| Field | Type | Notes |
|------|------|------|
| chatter_id | uuid (v7) | FK → market_chatter.id |
| contact_id | uuid (v7) | FK → contacts.id |

PK:
- (chatter_id, contact_id)

---

### market_chatter_markets / market_chatter_submarkets

| Field | Type | Notes |
|------|------|------|
| chatter_id | uuid (v7) | FK → market_chatter.id |
| market_id | uuid (v7) | FK → markets.id |

and

| Field | Type | Notes |
|------|------|------|
| chatter_id | uuid (v7) | FK → market_chatter.id |
| submarket_id | uuid (v7) | FK → submarkets.id |

PKs:
- (chatter_id, market_id)
- (chatter_id, submarket_id)

---

## 9. CRM (Team Private)

### contacts

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| name_raw | text | |
| email | text | |
| company_raw | text | |
| company_normalized | text | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

## 10. Asset Management (Owned by Team; Guests by Grant)

Hierarchy: Portfolio → Asset(Building) → Suite → Vacancy/LOI/etc

### portfolios

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| name | text | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### assets (building in a portfolio)

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| portfolio_id | uuid (v7) | FK → portfolios.id |
| building_id | uuid (v7) | FK → buildings.id |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### suites

Suite status per PRD (detailed).

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| asset_id | uuid (v7) | FK → assets.id |
| suite_name | text | |
| square_feet | integer | |
| status | enum(occupied_stable, occupied_known_vacate, occupied_renewal_likely, occupied_renewal_unlikely, occupied_renewal_pending, occupied_renewal_unknown, vacant_available, vacant_signed_loi, vacant_leased_not_commenced, other_off_market) | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### vacancies

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| suite_id | uuid (v7) | FK → suites.id |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### prospects

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| vacancy_id | uuid (v7) | FK → vacancies.id |
| contact_id | uuid (v7) | FK → contacts.id |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### tours

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| prospect_id | uuid (v7) | FK → prospects.id |
| tour_date | date | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### lois

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| vacancy_id | uuid (v7) | FK → vacancies.id |
| status | text | PRD-defined lifecycle (enum later) |
| direction | text | proposal/counter/etc (enum later) |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### suite_budgets

| Field | Type | Notes |
|------|------|------|
| suite_id | uuid (v7) PK | FK → suites.id |
| budget_rent_psf_cents | integer | |
| budget_ti_cents | integer | |
| downtime_months | integer | |
| created_at/updated_at/created_by/updated_by | | |

---

### make_ready_projects

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| suite_id | uuid (v7) | FK → suites.id |
| description | text | |
| cost_cents | integer | |
| status | text | enum later |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

## 11. Guest Access (Asset-Scoped; No Team Membership)

### guest_users

| Field | Type | Notes |
|------|------|------|
| user_id | uuid PK | references auth.users.id |
| email | text | |
| created_at | timestamptz | |

---

### guest_access

Purpose: grant guest access at portfolio, asset, or suite scope.

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| guest_user_id | uuid | FK → guest_users.user_id |
| portfolio_id | uuid (v7) nullable | FK → portfolios.id |
| asset_id | uuid (v7) nullable | FK → assets.id |
| suite_id | uuid (v7) nullable | FK → suites.id |
| permission | enum(owner, broker, property_manager) | |
| created_at | timestamptz | |
| created_by | uuid | auth.users.id |

Constraints:
- At least one of (portfolio_id, asset_id, suite_id) must be non-null
- Uniqueness recommended on (guest_user_id, portfolio_id, asset_id, suite_id)

---

## 12. Documents

### documents

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| storage_bucket | text | optional |
| storage_path | text | optional |
| file_path | text | optional legacy path |
| file_name | text | |
| mime_type | text | |
| file_size_bytes | bigint | |
| sha256 | text | |
| capture_source | enum(upload, email, bulk_import, voice, photo_ocr) | |
| status | enum(active, processing, failed) | |
| created_at/updated_at/created_by/updated_by | | |
| is_deleted | boolean | |
| deleted_at | timestamptz | |

---

### document_links (generic document ↔ entity linking)

Allows one document to link to many entities and vice versa.

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| document_id | uuid (v7) | FK → documents.id |
| entity_type | text | e.g., lease_comps |
| entity_id | uuid (v7) | |
| created_at | timestamptz | |
| created_by | uuid | auth.users.id |

Indexes:
- (team_id, entity_type, entity_id)
- (team_id, document_id)

---

## 13. Extraction (Team Private)

### extraction_jobs

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| job_type | enum(single_document, bulk_batch, email_ingest, voice, ocr) | |
| status | enum(queued, running, needs_review, committed, failed, cancelled) | |
| source_document_id | uuid (v7) nullable | FK → documents.id |
| source_hash | text | idempotency |
| error_message | text | |
| created_at/updated_at/created_by/updated_by | | |

---

### extraction_job_items

Draft extracted payloads (no auto-commit).

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| extraction_job_id | uuid (v7) | FK → extraction_jobs.id |
| entity_type | text | e.g., lease_comps |
| status | enum(draft, accepted, rejected) | |
| duplicate_of_entity_id | uuid (v7) nullable | |
| draft_payload | jsonb | |
| created_at | timestamptz | |
| created_by | uuid | auth.users.id |

---

## 14. Entity Field Provenance (Team Private)

### entity_field_provenance

Tracks field-level lineage and confidence across entities.

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| entity_type | text | |
| entity_id | uuid (v7) | |
| field_name | text | |
| source_type | enum(user, ai, import, document, system) | |
| source_reference_id | uuid (v7) nullable | e.g., documents.id or extraction_job_items.id |
| confidence_score | integer nullable | 0–100 |
| overridden_by_user | boolean | default false |
| extracted_at | timestamptz nullable | |
| created_at | timestamptz | |

Indexes:
- (team_id, entity_type, entity_id)
- (team_id, source_type, source_reference_id)

---

## 15. Audit & Export

### audit_log (append-only)

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| actor_user_id | uuid | auth.users.id |
| table_name | text | |
| record_id | uuid (v7) | |
| action | enum(insert, update, delete, restore, export) | |
| old_value | jsonb | |
| new_value | jsonb | |
| created_at | timestamptz | |

Notes:
- No UPDATE/DELETE allowed on audit_log.

---

### export_log

| Field | Type | Notes |
|------|------|------|
| id | uuid (v7) PK | |
| team_id | uuid (v7) | |
| user_id | uuid | auth.users.id |
| export_type | text | pdf/excel/csv/link/etc |
| record_count | integer | |
| created_at | timestamptz | |

---

## 16. Indexing & Performance (Minimum Required)

Mandatory indexes (per PRD):
- team_id on all team-owned tables
- (team_id, building_id) where applicable (comps, developments, chatter joins)
- tenant_name_normalized on lease comps
- address normalization indexes as needed
- GIST(location_geog) on buildings
- portfolio_id on assets
- lease_end_date on lease comps

---

## 17. Formatting & Data Standards

- Currency: integer cents
- Percentages: basis points (integer)
- Dates: ISO date (date)
- SF: integer
- Enums: lowercase_snake_case
- IDs: UUID v7 (default uuid_v7() function in migrations)
- Audit columns for team-owned tables:
  - created_at, updated_at, created_by, updated_by, team_id, is_deleted, deleted_at

---

End of document.
