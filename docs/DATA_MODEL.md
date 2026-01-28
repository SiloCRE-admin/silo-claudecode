# Silo — Data Model Specification

Version: 1.1  
Status: Living Document  
Last Updated: YYYY-MM-DD

---

## 1. Purpose

This document defines:

- All database entities (tables)
- Key fields and types
- Relationships
- Ownership rules
- Multi-tenant boundaries
- Guest access model
- Spatial data model
- Audit, provenance, and export tracking
- Data lifecycle enforcement

The PRD defines *what exists*.  
This document defines *how it is structured in the database*.

Supabase (Postgres + PostGIS) is the authoritative datastore.

---

## 2. Core Principles

- Team = tenant
- Users belong to exactly one team
- All team-owned data contains `team_id`
- Row Level Security (RLS) enforced on all CRUD operations
- No cross-team visibility except:
  - shared building specs
  - reference tables
- Asset management data always belongs to owner’s team
- Guest access never uses team membership
- Spatial data stored using PostGIS geography
- All primary keys use UUID v7
- Currency stored as integer cents
- Percentages stored as integer basis points
- Soft delete by default
- Immutable audit logs

---

## 3. Identity & Tenancy

### profiles

| Field | Type |
|------|------|
| user_id | uuid (v7) PK |
| team_id | uuid (v7) |
| email | text |
| role | enum(team_owner, team_admin, team_member, billing_contact) |
| created_at | timestamptz |
| updated_at | timestamptz |
| created_by | uuid (v7) |
| updated_by | uuid (v7) |

---

### teams

| Field | Type |
|------|------|
| id | uuid (v7) PK |
| name | text |
| created_at | timestamptz |
| updated_at | timestamptz |
| created_by | uuid (v7) |
| updated_by | uuid (v7) |

---

## 4. Reference Data (System)

### markets

| Field | Type |
|------|------|
| id | uuid (v7) |
| name | text |

---

### submarkets

| Field | Type |
|------|------|
| id | uuid (v7) |
| market_id | uuid (v7) |
| name | text |

---

## 5. Buildings (Shared Layer + Crowdsourcing)

### buildings

| Field | Type |
|------|------|
| id | uuid (v7) |
| name | text |
| full_address_raw | text |
| address_components | jsonb |
| address_full_normalized | text |
| city | text |
| county | text |
| state | text |
| postal_code | text |
| market_id | uuid (v7) |
| submarket_id | uuid (v7) |
| latitude | numeric(9,6) |
| longitude | numeric(9,6) |
| location_geog | geography(Point,4326) |
| coordinate_source | enum(admin, user, google) |
| coordinate_confirmed | boolean |
| created_at | timestamptz |
| updated_at | timestamptz |
| created_by | uuid (v7) |
| updated_by | uuid (v7) |

---

### building_attributes

| Field | Type |
|------|------|
| id | uuid (v7) |
| building_id | uuid (v7) |
| field_name | text |
| value_json | jsonb |
| value_text | text |
| is_current | boolean |
| created_at | timestamptz |
| created_by | uuid (v7) |

---

### building_attribute_provenance

| Field | Type |
|------|------|
| id | uuid (v7) |
| building_attribute_id | uuid (v7) |
| source_type | enum(admin, user, ai, import) |
| source_reference_id | uuid (v7) |
| confidence_score | integer |
| confirmed | boolean |
| extracted_at | timestamptz |
| created_at | timestamptz |

---

### building_flags

| Field | Type |
|------|------|
| id | uuid (v7) |
| building_id | uuid (v7) |
| flagged_by_user_id | uuid (v7) |
| field_name | text |
| reason | text |
| status | enum(open, resolved, rejected) |
| created_at | timestamptz |
| resolved_at | timestamptz |
| resolved_by | uuid (v7) |

---

### admin_review_queue

| Field | Type |
|------|------|
| id | uuid (v7) |
| building_id | uuid (v7) |
| flag_id | uuid (v7) |
| field_name | text |
| proposed_building_attribute_id | uuid (v7) |
| status | enum(pending, approved, rejected) |
| decision_notes | text |
| decided_at | timestamptz |
| decided_by | uuid (v7) |
| created_at | timestamptz |

---

### locked_building_fields

| Field | Type |
|------|------|
| id | uuid (v7) |
| building_id | uuid (v7) |
| field_name | text |
| locked_value_json | jsonb |
| locked_by | uuid (v7) |
| locked_at | timestamptz |
| is_active | boolean |

---

### team_building_presence

| Field | Type |
|------|------|
| team_id | uuid (v7) |
| building_id | uuid (v7) |
| has_any_data | boolean |
| last_activity_at | timestamptz |
| created_at | timestamptz |

---

## 6. Transactional Comps (Team Private)

### lease_comps

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| building_id | uuid (v7) |
| tenant_name_raw | text |
| tenant_name_normalized | text |
| lease_sf | integer |
| signed_date | date |
| lease_start_date | date |
| lease_end_date | date |
| lease_term_months | integer |
| rent_psf_cents | integer |
| ti_allowance_cents | integer |
| free_rent_months | integer |
| status | enum(draft, active) |
| is_deleted | boolean |
| deleted_at | timestamptz |
| created_at | timestamptz |
| updated_at | timestamptz |
| created_by | uuid (v7) |
| updated_by | uuid (v7) |

---

### sale_comps / land_comps

Same structure pattern as lease_comps.

---

## 7. Development Tracker (Team Private)

### developments

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| building_id | uuid (v7) |
| status | enum(planned, under_construction, delivering, delivered, stalled, cancelled) |
| estimated_delivery_date | date |
| developer | text |
| size_sf | integer |
| notes | text |
| source | text |
| active | boolean |
| is_deleted | boolean |
| deleted_at | timestamptz |
| created_at | timestamptz |
| updated_at | timestamptz |
| created_by | uuid (v7) |
| updated_by | uuid (v7) |

---

## 8. Market Chatter (Team Private)

### market_chatter

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| author_user_id | uuid (v7) |
| body_text | text |
| is_deleted | boolean |
| deleted_at | timestamptz |
| created_at | timestamptz |
| updated_at | timestamptz |

---

### market_chatter_flags

category enum values:

`lease, sale, development, tenant_movement, debt, ownership_change, distress, capital_markets, other`

| Field | Type |
|------|------|
| chatter_id | uuid (v7) |
| category | enum |

---

### market_chatter_buildings / contacts / markets / submarkets

| Field | Type |
|------|------|
| chatter_id | uuid (v7) |
| related_id | uuid (v7) |

---

## 9. CRM

### contacts

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| name_raw | text |
| email | text |
| company_raw | text |
| company_normalized | text |
| is_deleted | boolean |
| deleted_at | timestamptz |
| created_at | timestamptz |
| updated_at | timestamptz |

---

## 10. Asset Management

### portfolios

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| name | text |

---

### assets

| Field | Type |
|------|------|
| id | uuid (v7) |
| portfolio_id | uuid (v7) |
| building_id | uuid (v7) |

---

### suites

| Field | Type |
|------|------|
| id | uuid (v7) |
| asset_id | uuid (v7) |
| suite_name | text |
| square_feet | integer |
| status | enum(occupied, vacant, off_market) |

---

### vacancies / prospects / tours / lois / suite_budgets / make_ready_projects

Follow same ownership pattern with team resolution via portfolio.

Monetary fields stored as `_cents`.

---

## 11. Guest Access

### guest_users

| Field | Type |
|------|------|
| id | uuid (v7) |
| email | text |

---

### guest_access

| Field | Type |
|------|------|
| guest_user_id | uuid (v7) |
| portfolio_id | uuid (v7) |
| asset_id | uuid (v7) |
| suite_id | uuid (v7) |
| permission | enum(owner, broker, property_manager) |

---

## 12. Documents

### documents

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| storage_bucket | text |
| storage_path | text |
| file_name | text |
| mime_type | text |
| file_size_bytes | bigint |
| sha256 | text |
| capture_source | enum(upload, email, bulk_import, voice, photo_ocr) |
| status | enum(active, processing, failed) |
| is_deleted | boolean |
| deleted_at | timestamptz |
| created_at | timestamptz |
| updated_at | timestamptz |
| created_by | uuid (v7) |
| updated_by | uuid (v7) |

---

### document_links

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| document_id | uuid (v7) |
| entity_type | text |
| entity_id | uuid (v7) |
| created_at | timestamptz |

---

## 13. Extraction & Bulk Import

### extraction_jobs

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| job_type | enum(single_document, bulk_batch, email_ingest, voice, ocr) |
| status | enum(queued, running, needs_review, committed, failed, cancelled) |
| source_document_id | uuid (v7) |
| source_hash | text |
| error_message | text |
| created_at | timestamptz |
| updated_at | timestamptz |

---

### extraction_job_items

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| extraction_job_id | uuid (v7) |
| entity_type | text |
| status | enum(draft, accepted, rejected) |
| duplicate_of_entity_id | uuid (v7) |
| draft_payload | jsonb |
| created_at | timestamptz |

---

### entity_field_provenance

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| entity_type | text |
| entity_id | uuid (v7) |
| field_name | text |
| source_type | enum(user, ai, import, document, system) |
| source_reference_id | uuid (v7) |
| confidence_score | integer |
| overridden_by_user | boolean |
| extracted_at | timestamptz |
| created_at | timestamptz |

---

## 14. Audit & Export Governance

### audit_log

| Field | Type |
|------|------|
| id | uuid (v7) |
| team_id | uuid (v7) |
| actor_user_id | uuid (v7) |
| entity_type | text |
| entity_id | uuid (v7) |
| action | enum(insert, update, delete, restore, export) |
| before_json | jsonb |
| after_json | jsonb |
| created_at | timestamptz |

---

### export_requests / export_approvals / export_artifacts / export_log

As defined in architecture section.

---

## 15. Spatial Indexing

- buildings.location_geog → GIST
- team_building_presence(team_id, building_id)
- comps(team_id, building_id)
- address_full_normalized
- tenant_name_normalized

---

## 16. RLS Expectations (Summary)

| Table | Rule |
|-------|------|
| lease_comps | team_id = auth.team |
| developments | team_id |
| market_chatter | team_id |
| contacts | team_id |
| documents | team_id |
| portfolios | team_id |
| buildings | shared read; admin write |
| building_attributes | shared read; admin controlled |
| locked_building_fields | admin only |
| team_building_presence | team scoped |
| audit_log | team scoped |
| export_* | team scoped |

God Admin has access only to:

- buildings
- building_attributes
- building_flags
- admin_review_queue
- locked_building_fields
- markets/submarkets

---

## 17. Naming & Formatting Standards

- snake_case tables and columns
- enums lowercase_snake_case
- UUID v7 primary keys
- currency: integer cents
- percentages: integer basis points
- ISO dates
- audit fields on all mutable tables:
  - created_at, updated_at, created_by, updated_by
- soft delete fields:
  - is_deleted, deleted_at

---

End of document.
