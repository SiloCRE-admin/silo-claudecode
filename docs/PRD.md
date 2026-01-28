
Silo CRE Platform — Database & Platform Architecture PRD
Version: 1.1
Status: Final
Scope: Database architecture, data ownership, lifecycle, asset management, maps, exports, security, and platform standards

Table of Contents
Product Overview
Goals & Non-Goals
Property Type Scope
Core Entities
Source of Truth Rules
Access Model & Roles
Data Sharing & Export
Data Lifecycle
Asset Management Module
Map & Geolocation System
Scale Requirements
External Integrations
Security Model
Deletion & Data Removal Policy
Indexing & Query Performance Requirements
Bulk Import Transaction Model
Database Formatting & Data Standards
System Glossary

1. Product Overview
Silo is a private market-intelligence platform for commercial real estate professionals. It transforms proprietary deal data into a structured, searchable database with AI-powered extraction, team collaboration, CRM, asset management, and controlled sharing.
Silo is designed to preserve data sovereignty while enabling powerful internal analysis and selective external distribution.

2. Goals & Non-Goals
Top 3 Goals
Transform proprietary deal data into searchable, actionable market intelligence.
Eliminate manual data entry friction using AI extraction and bulk imports with duplicate detection and conflict resolution.
Enable collaboration while maintaining strict confidentiality controls and auditability.
Non-Goals
Not a public marketplace for deal data
Not a marketing automation platform
Not a standalone document management system
Not an automated valuation or pricing engine

3. Property Type Scope
Initial supported asset classes:
Industrial
Flex
Indoor / Outdoor Storage (IOS)

4. Core Entities
Physical Assets
Building (shared, crowdsourced specs)
Land Parcel
Market
Submarket

Transactions & Market Intelligence
Lease Comp (team-private)
Sale Comp (team-private)
Land Comp (team-private)
Development Tracker — team-private records tracking construction and planned projects with lifecycle status, update history, and multiple sources
Market Chatter — team-private unstructured market intelligence linked to buildings, contacts, markets, and submarkets via tagging, searchable and exportable

Prospecting & Deals
Lead / Prospect
Offer
Pipeline Stage / Deal Status

People & Organizations
User
Team
Tenant
Owner / Landlord
Contact
Broker Rep

Documents & Files
Document
Bulk Import Job / Extraction Batch

Activity & Collaboration
Activity Log Entry
Task
Reminder

Financial
Rent Schedule
Commission
Lease Option

System / Admin
Building Flag / Review Queue
Export Log
Export Request

5. Source of Truth Rules
Buildings & Markets
Building specs are crowdsourced across users.
Users may flag incorrect attributes.
Flags enter admin review queue.
God Admin may confirm/reject and lock values.
Markets and submarkets are system-defined.
Transaction Data
Fully team-owned.
User edits override AI.
Field-level source + confidence tracking.
Documents
Raw document is source of truth.
Extracted fields are derived and overridable.
People & Companies
Team-owned.
No cross-team sharing.
Owner name at signing may appear in shared building history.
Deals / Pipeline
Fully team-private.
Bulk Extracted Data
No data commits until user confirms.
Duplicate detection before commit.
Ownership rules apply post-confirmation.

6. Access Model & Roles
Roles
God Admin
Team Owner
Team Admin
Team Member
Billing Contact
Guest (free)

God Admin Scope
God Admin access is limited to system-wide administration and building moderation:
Allowed access:
Account metadata (teams, profiles)
Shared reference data (markets, submarkets)
Building layer (buildings, attributes, flags, review queue, locked fields)
Denied access:
All team-private business data (comps, CRM, market chatter, developments, documents, asset management, extraction jobs, exports, audit logs, provenance)

Core Rules
Users belong to one team.
Guests are outside team structure.
Guests have no comp database access.
Suite-level permissions for asset management.
Guests may delete only records they created.
Export approval thresholds enforced.

7. Data Sharing & Export
Export Types
PDF
Excel
CSV
Email / Word
Expiring Silo Link
Silo File (structured, no documents)
Restrictions
Approval required for:
50 comps per export OR
3 reports per 24h
Field-level selection
Optional watermarking
Tenant anonymization
Full export logging
Pending exports canceled on account removal
Shareable Data
Comps ✔
Building data ✔
Aggregates ✔
Documents ✔ (not in Silo file)
Pipeline data ✘
Activity logs ✘
Market chatter ✔ (subject to export governance)
Development tracker ✔ (active projects)

8. Data Lifecycle
Creation Methods
Manual entry
Single-document extraction
Bulk extraction
Silo file import
Email capture
Voice capture
Photo / OCR
Business card scan
Status
Draft (creator only)
Active (team)
Minimum active fields:
Building address
Tenant name
Lease SF
Lease start date (actual or estimated)
Audit
Immutable edit history
Export logs
Building contribution logs
Retention
Active while subscribed
Soft deletes retained 90 days
Cancelled subscriptions: 12 months read-only then purge
Audit logs retained indefinitely

9. Asset Management Module
Ownership
Owned by paying customer’s team.
Guests contribute but data belongs to suite/building.
Hierarchy
Owner → Portfolio → Building → Suite

Suite Status
Occupied:
Stable
Known Vacate
Renewal Likely
Renewal Unlikely
Renewal Pending
Renewal Unknown (auto-flag at 12 months)
Vacant:
Available
Signed LOI
Leased Not Commenced
Other:
Off Market

Leasing & Vacancies
Prospects linked to CRM contacts.
Suite-level visibility.
All users with access see all prospects.

LOIs & Negotiation
Status tracking
Direction tracking
AI extraction
Auto summaries
Proposal/counter tracking
Lease negotiation stage

Budgets & Make Ready
Suite-level budget assumptions
Make-ready projects tracked historically

Vacancy → Comp Conversion
Auto-creates comp upon lease execution.
Ownership:
Scenario
Result
Owner paying, broker guest
Owner comp
Broker paying, owner guest
Broker comp
Both paying
Owner primary + broker copy

Analytics:
Delta to budget
Delta to asking
TI variance
Downtime variance

10. Map & Geolocation System
Pins
One pin per building.
Displayed only when team has data.
Two modes:
Market Intelligence
Asset Management / Leasing
Layers
Lease comps
Sale comps
Land comps
Development tracker
Market chatter
Portfolio buildings
Privacy
Team-private visibility only.
No signal of other teams’ data.

Pin Detail Cards
Market Intelligence Mode
Building name
Address
Owner
Building SF
Clear height
Year built
Total lease comps
Most recent lease comp
Total sale comps
Most recent sale comp
Market chatter count
Land comps
Quick actions
Asset Management Mode
Building name
Address
Portfolio
Building SF
Clear height
Year built
% occupied
WALT
Purchase price ($ + $/SF)
Acquisition date
Top 3 tenants
Quick actions

Coordinates
Initial: Google Places
User may drag to override
Admin override allowed
Precedence:
Admin > User > Google
Fields:
latitude (6 decimals)
longitude (6 decimals)
location_geog (PostGIS)
coordinate_source
coordinate_confirmed

Market Chatter Map Behavior
Displayed per building when linked via building tags.
Chatter without building tags appears only in filtered lists.
Filters:
Category flags
Market
Submarket

11. Scale Requirements
(As previously defined.)

12. External Integrations
Supabase Auth
Supabase Storage
Mapbox
Google Places
Anthropic Claude
Stripe
Inbound email processor
(Future) Google Drive / Dropbox backups

13. Security Model
AES-256 at rest
TLS in transit
Row-Level Security for tenant isolation
DB-level role enforcement
God Admin boundary:
May access: account metadata (teams/profiles), shared reference data (markets/submarkets), building moderation
Cannot access: team-private business data (comps, CRM, chatter, developments, documents, assets, extraction, exports, audit logs)
Immutable audit logs
Export tracking

14. Deletion & Data Removal Policy
Soft Delete Default
Team-scoped:
Comps → soft delete + 90 days
CRM entities → soft delete
Documents → soft delete
Asset management records → soft delete only
Export & audit logs → never deleted
System:
Buildings → never hard deleted
Markets → never deleted
Cascade rules apply.
Hard deletes only via retention expiry or owner request.

15. Indexing & Query Performance
Mandatory Indexes
team_id
(team_id, building_id)
portfolio_id
lease_end_date
tenant_name_normalized
address_full_normalized
location_geog (GIST)
Performance Targets
Map viewport: <300ms
Building detail: <200ms
Comp filters: <400ms
Portfolio view: <500ms

16. Bulk Import Transaction Model
Atomic by default
Optional partial commit
Duplicate detection before commit
Import job id + source hash
Idempotent
Field confidence defaults to estimated

17. Database Formatting & Data Standards
Currency
Stored as integer cents.
Percentages
Stored as basis points.
Dates
Stored ISO.
Lease Dates
Term stored as integer months.
If start date missing, estimate 2–3 months post signed date.
Lease end date always last day of month.
Square Feet
Integer.
Enums
lowercase_snake_case.
Text Storage
Addresses: raw + normalized + components (incl. county)
Company names: raw + normalized
Person names: raw
Notes: trimmed only
IDs
UUID v7.
Audit Fields
created_at, updated_at, created_by, updated_by, team_id, is_deleted
Geolocation
As defined in Map section.
Utilities
formatCurrency, formatSquareFeet, formatPercentage, formatDate, parseFormattedNumber, liveFormatWithCommas
Safe Division
Always guarded.
Null Display
Em dash.
Unit Tests
Required for:
Formatting utilities
Parsing utilities
Rent equivalents
TI equivalents
Free rent equivalents
Safe division

18. Market Chatter Entity Specification
Purpose
Unstructured team-private intelligence not classified as a transaction or development record.
Examples:
Pending sales
Tenant movement
Debt issues
Ownership changes
Distress
Portfolio strategies

Ownership
Team-private
Never shared
Never crowdsourced

Core Fields
id
team_id
author_user_id
body_text
created_at
updated_at

Category Flags (Multi-Select)
Enum values:
lease
sale
development
tenant_movement
debt
ownership_change
distress
capital_markets
other
Multiple flags allowed.

Tagging
@building
@contact
Creates relational links.

Market & Submarket Association
Multi-select
Many-to-many

Search & Filtering
Full text
By flags
By building
By contact
By market/submarket
By author
By date range

Exporting
CSV / Excel / PDF
Subject to export governance

Logical Schema
market_chatter
market_chatter_flags
market_chatter_buildings
market_chatter_contacts
market_chatter_markets
market_chatter_submarkets

19. Development Tracker Entity Specification
Ownership
Team-private only
Capabilities
Multiple updates over time
Multiple sources per update
Appears in map filters and building pages
Exportable (current projects)
Logical Fields
building_id
status (planned / under_construction / delivering / delivered / stalled / cancelled)
estimated_delivery_date
developer
size
notes
source
active
created_at
updated_at

20. System Glossary
Team – billing + data boundary
Guest – external user with scoped access
Comp – lease/sale/land record
Portfolio – owner grouping
Suite – leasable unit
Vacancy – vacant suite
Silo file – structured data transfer format


