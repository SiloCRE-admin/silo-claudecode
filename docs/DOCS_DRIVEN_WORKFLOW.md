# Docs-Driven Workflow

**Version**: 1.0
**Last Updated**: 2026-01-28

---

## Hierarchy of Truth

### 1. Product Requirements Document (PRD)
- **Source of truth for**: Product behavior, business rules, user experience
- **Location**: `docs/PRD.md`
- **Examples**: What features exist, access model rules, export thresholds, God Admin boundaries

### 2. Implementation Specs
- **Source of truth for**: Database schema, security policies, system architecture
- **Files**:
  - `docs/DATA_MODEL.md` - Tables, columns, relationships, constraints
  - `docs/RLS_POLICIES.md` - Row-level security rules, policy logic
  - `docs/ARCHITECTURE.md` - System design, components, data flow

### 3. Database Migrations
- **Source of truth for**: Actual schema state
- **Location**: `supabase/migrations/*.sql`
- **Note**: Migrations must match DATA_MODEL.md and RLS_POLICIES.md specs

---

## Workflow Rules

### Rule 1: PRD Changes Come First
**Before** implementing any behavior change:
1. Update `docs/PRD.md` with the new requirement
2. Get stakeholder approval on the PRD change
3. Then update implementation docs (DATA_MODEL, RLS_POLICIES, ARCHITECTURE)
4. Finally implement via migrations and code

**Why**: The PRD defines *what* the product does. Implementation docs define *how*. Never build "how" without knowing "what".

### Rule 2: Implementation Docs Must Align
When updating implementation specs:
- **DATA_MODEL.md** changes → Create matching migration
- **RLS_POLICIES.md** changes → Update RLS in migrations
- **ARCHITECTURE.md** changes → Verify against DATA_MODEL and RLS_POLICIES

Use cross-references: "See `docs/DATA_MODEL.md` for schema" instead of duplicating table definitions.

### Rule 3: Validate Consistency
Run validation before committing doc changes:
```bash
npm run validate:arch
```

This catches:
- PRD-to-implementation drift
- Terminology violations (Tenant vs Team)
- Missing cross-references
- God Admin boundary violations

### Rule 4: Migrations Are Final Authority
If docs and migrations conflict:
1. The migration state is reality
2. Update docs to match migrations
3. If docs were correct, write a new migration to fix the schema

Never edit old migrations. Always create new ones.

---

## Decision Flow

```
┌─────────────────────────┐
│ Feature Request         │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Update PRD              │ ← Stakeholder approval required
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Update Implementation   │
│ Docs (DATA_MODEL, RLS)  │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Run validate:arch       │ ← Must pass
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Write Migration         │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Implement Code          │
└─────────────────────────┘
```

---

## Common Scenarios

### Scenario A: New Feature
1. Add feature to PRD (section describing user-facing behavior)
2. Add tables/fields to DATA_MODEL.md
3. Add RLS policies to RLS_POLICIES.md
4. Update ARCHITECTURE.md if new components/flows are introduced
5. Run `npm run validate:arch`
6. Write migration(s)
7. Implement frontend/backend code

### Scenario B: Security Boundary Change
1. Update PRD with new access rules
2. Update RLS_POLICIES.md with policy changes
3. Update ARCHITECTURE.md security section
4. Run `npm run validate:arch`
5. Write RLS policy migration
6. Write test script (like `scripts/god_admin_smoke_test.sql`)
7. Update code if needed

### Scenario C: Schema Refactor (No Behavior Change)
1. Confirm PRD behavior unchanged
2. Update DATA_MODEL.md with new schema
3. Update RLS_POLICIES.md if table names change
4. Run `npm run validate:arch`
5. Write migration with safe ALTER statements
6. Update code references

---

## Anti-Patterns (Don't Do This)

❌ **Writing migrations before updating docs**
→ Docs are stale immediately

❌ **Updating ARCHITECTURE.md with hardcoded table names**
→ Creates duplication and drift. Use "See DATA_MODEL.md" instead.

❌ **Implementing features not in PRD**
→ Product direction becomes unclear

❌ **Skipping `npm run validate:arch`**
→ Terminology and consistency violations slip through

❌ **Editing old migrations to fix mistakes**
→ Breaks migration history. Write a new migration instead.

---

## Enforcement

- **Pre-commit**: Run `npm run check` (lint + validate:arch)
- **PR reviews**: Verify PRD changes accompany behavior changes
- **CI**: Run `npm run validate:arch` in CI workflows (when added)

---

**Maintainer Note**: This workflow ensures documentation remains the single source of truth, preventing implementation drift and maintaining product clarity.
