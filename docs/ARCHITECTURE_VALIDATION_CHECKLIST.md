# Architecture Validation Checklist

**Version**: 1.0
**Last Updated**: 2026-01-28

---

## What This Checks

This checklist validates consistency between architectural documentation to catch drift early:
- Cross-references between PRD, DATA_MODEL, RLS_POLICIES, and ARCHITECTURE docs
- Alignment on security boundaries, multi-tenancy model, and God Admin rules
- Terminology consistency (Team vs Tenant, Draft vs Active)
- Architecture doc maintains conceptual clarity without hardcoding schema details

## What This Doesn't Check

- Database schema correctness (see migration tests)
- RLS policy implementation details (see god_admin_smoke_test.sql)
- Code implementation (use TypeScript compiler and tests)
- Formal verification of security properties

---

## How to Run

```bash
npm run validate:arch
```

Run this before:
- Merging PRs that touch docs/ files
- Making changes to auth, RLS, or multi-tenant architecture
- Updating security boundaries or God Admin rules

---

## Validation Checklist

### 1. Security Boundaries

**Rule**: Users belong to exactly one team
**Source**: PRD section 6 (Access Model & Roles), DATA_MODEL.md section 3 (profiles)
**Check**: PRD must state "Users belong to one team" and ARCHITECTURE must not imply multi-team membership or team switching UI

**Rule**: Team = billing + data isolation boundary
**Source**: PRD section 1 (Overview), ARCHITECTURE section 5 (Multi-Tenant Data Model)
**Check**: All team-owned tables include `team_id`, RLS enforced on SELECT/INSERT/UPDATE/DELETE

---

### 2. Multi-Tenancy Model

**Rule**: Isolation unit terminology
**Source**: ARCHITECTURE section 5.1, PRD section 6
**Check**: ARCHITECTURE must NOT say "Tenant = Team" (ambiguous). Must say "Isolation unit = Team (billing + data boundary)" or equivalent with note about PRD's use of "Tenant" for business entities

**Rule**: Shared layer exceptions
**Source**: DATA_MODEL.md sections 5 (Buildings), RLS_POLICIES.md section 5
**Check**: Buildings, markets, submarkets are shared across teams with God Admin-only writes

---

### 3. Guest Access Model

**Rule**: Guests exist outside team structure
**Source**: PRD section 6 (Core Rules), DATA_MODEL.md section 11, RLS_POLICIES.md section 7
**Check**: PRD includes "Guests are outside team structure" and ARCHITECTURE must not imply guests are team members

**Rule**: Guest access is asset-scoped
**Source**: PRD section 9 (Asset Management), DATA_MODEL.md guest_access table
**Check**: Access scoped to portfolio/asset/suite level, never via team membership

**Rule**: Guests cannot access comps database
**Source**: PRD section 6 (Core Rules), RLS_POLICIES.md team-owned tables
**Check**: PRD states "Guests have no comp database access"

---

### 4. God Admin Boundary

**Rule**: God Admin allowed access
**Source**: PRD section 6 (God Admin Scope), RLS_POLICIES.md section 11.1
**Check**: Can access account metadata (teams/profiles read-only), shared reference data (markets/submarkets), building layer (full CRUD)

**Rule**: God Admin denied access
**Source**: PRD section 6 (God Admin Scope), RLS_POLICIES.md section 11.2
**Check**: Cannot access team-private business data (comps, CRM, chatter, developments, documents, assets, extraction, exports, audit logs)

**Rule**: ARCHITECTURE acknowledges God Admin boundary
**Source**: ARCHITECTURE section 9.3, PRD section 13 (Security Model)
**Check**: ARCHITECTURE must state God Admin cannot access team-private business data

---

### 5. Draft vs Active State

**Rule**: Draft visibility is creator-only
**Source**: PRD section 8 (Data Lifecycle), RLS_POLICIES.md section 3.1
**Check**: Entities with status='draft' visible only to creator until activated

**Rule**: No auto-commit from extraction
**Source**: PRD section 5 (Source of Truth - Bulk Extracted Data), ARCHITECTURE section 8.4
**Check**: All extraction pipeline data enters draft state, requires user confirmation before commit

**Rule**: Draft exclusion from aggregates
**Source**: ARCHITECTURE section 6.5.2
**Check**: Draft rows cannot appear in maps, exports, analytics, or aggregates

---

### 6. Map Privacy

**Rule**: Pins displayed only when team has data
**Source**: PRD section 10 (Map & Geolocation - Privacy), ARCHITECTURE section 7.3
**Check**: No leakage of other teams' data, no signal of activity presence

**Rule**: Shared building specs don't imply activity
**Source**: PRD section 10, ARCHITECTURE section 7.3
**Check**: Building existence in shared layer doesn't reveal which teams are using it

---

### 7. Export Governance

**Rule**: Export thresholds defined
**Source**: PRD section 7 (Data Sharing & Export - Restrictions)
**Check**: 50 comps per export OR 3 reports per 24h requires approval

**Rule**: Export governance acknowledged
**Source**: ARCHITECTURE section 9.2, PRD section 7
**Check**: ARCHITECTURE or linked docs acknowledge export approval workflows exist

---

### 8. Data Lifecycle

**Rule**: Soft delete default for team-owned data
**Source**: PRD section 14 (Deletion & Data Removal Policy), DATA_MODEL.md audit columns
**Check**: Team-scoped tables use is_deleted/deleted_at, hard deletes via retention expiry only

**Rule**: Immutable audit logs
**Source**: PRD section 8 (Audit), DATA_MODEL.md section 15, RLS_POLICIES.md section 10
**Check**: audit_log is append-only, no UPDATE/DELETE allowed

---

### 9. Provenance & Auditability

**Rule**: Field-level source tracking
**Source**: PRD section 5 (Source of Truth - Transaction Data), ARCHITECTURE section 6.5.1
**Check**: Extracted fields track source_type, source_reference_id, confidence_score

**Rule**: User edits override AI
**Source**: PRD section 5, ARCHITECTURE section 6.5.1
**Check**: Manual user edits always take precedence over AI-extracted values

---

### 10. Documentation Cross-References

**Rule**: ARCHITECTURE references authoritative schema docs
**Source**: ARCHITECTURE sections 6, 7
**Check**: Must reference docs/DATA_MODEL.md and docs/RLS_POLICIES.md for implementation details

**Rule**: Minimal table name hardcoding
**Source**: This checklist (drift prevention)
**Check**: ARCHITECTURE should not hardcode excessive table names (threshold: ≤10); should defer to DATA_MODEL.md instead

---

## Automated Validation

Run `npm run validate:arch` to execute automated checks for most of these rules.

The validator script performs heuristic checks on doc file contents:
- Required files present (PRD, DATA_MODEL, RLS_POLICIES, ARCHITECTURE)
- Key phrases present ("Users belong to one team", "Guests are outside team structure", etc.)
- Terminology consistency ("Isolation unit = Team", not "Tenant = Team")
- God Admin boundary text present
- Cross-reference links to authoritative docs

**Exit code**: 0 = all checks pass, non-zero = violations found

---

## Manual Review Required

Some checks require human judgment:
- Semantic consistency across docs (automated checks are heuristic only)
- New features properly documented across all relevant docs
- Architectural changes don't violate PRD requirements
- Security model changes reviewed by security-aware engineer

---

**Maintainer Note**: Update this checklist when adding new security boundaries, access models, or architectural invariants.
