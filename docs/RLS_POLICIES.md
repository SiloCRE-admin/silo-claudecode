# Silo — RLS Policies & Enforcement

Version: 1.0  
Status: Living Document  
Last Updated: 2025-01-28

---

## 0. Goals

- Enforce **team isolation** for all team-owned tables.
- Enforce **guest access** via explicit asset-scoped permissions (never via team membership).
- Enforce **draft visibility** (creator-only until activation).
- Enforce **soft deletes** (hidden by default).
- Enforce **God Admin boundary**:
  - Can operate on shared/reference tables only.
  - Cannot read or modify private team data (comps, CRM, assets, chatter, exports, docs, etc).
- Keep enforcement **database-native** via RLS (frontend checks are defensive only).

---

## 1. Conventions

### 1.1 Standard columns expected on team-owned tables

| Column | Type | Purpose |
|--------|------|---------|
| `team_id` | `uuid` | Team ownership |
| `created_by` | `uuid` | Creator reference |
| `updated_by` | `uuid` | Last editor |
| `created_at` | `timestamptz` | Creation timestamp |
| `updated_at` | `timestamptz` | Last update timestamp |
| `status` | `enum('draft','active')` | Record lifecycle (where applicable) |
| `is_deleted` | `boolean default false` | Soft delete flag |
| `deleted_at` | `timestamptz` | Soft delete timestamp |

---

## 2. Helper Functions (SQL)

> Implement these as **SECURITY DEFINER** functions in schema `app`, with strict `search_path`.

### 2.1 Schema baseline

```sql
CREATE SCHEMA IF NOT EXISTS app;
```

### 2.2 Current team + roles

```sql
CREATE OR REPLACE FUNCTION app.current_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.team_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION app.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role::text
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION app.is_team_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role::text = role_name
  )
$$;
```

### 2.3 God Admin check

Recommended approach: set `app_metadata.role = "god_admin"` on the auth user.

```sql
CREATE OR REPLACE FUNCTION app.is_god_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'god_admin', false)
$$;
```

### 2.4 Guest checks

Assumes `guest_users.user_id` exists and refers to the authenticated user.
If you currently store only email, migrate to `user_id`.

```sql
CREATE OR REPLACE FUNCTION app.is_guest()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_users gu
    WHERE gu.user_id = auth.uid()
  )
$$;
```

### 2.5 Guest access helpers (portfolio / asset / suite)

```sql
CREATE OR REPLACE FUNCTION app.has_portfolio_access(portfolio uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_access ga
    WHERE ga.guest_user_id = auth.uid()
      AND ga.portfolio_id = portfolio
  )
$$;

CREATE OR REPLACE FUNCTION app.has_asset_access(asset uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_access ga
    WHERE ga.guest_user_id = auth.uid()
      AND (
        ga.asset_id = asset
        OR ga.portfolio_id = (
          SELECT a.portfolio_id
          FROM public.assets a
          WHERE a.id = asset
        )
      )
  )
$$;

CREATE OR REPLACE FUNCTION app.has_suite_access(suite uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guest_access ga
    WHERE ga.guest_user_id = auth.uid()
      AND (
        ga.suite_id = suite
        OR ga.asset_id = (SELECT s.asset_id FROM public.suites s WHERE s.id = suite)
        OR ga.portfolio_id = (
          SELECT a.portfolio_id
          FROM public.suites s
          JOIN public.assets a ON a.id = s.asset_id
          WHERE s.id = suite
        )
      )
  )
$$;
```

---

## 3. Base RLS Policy Patterns

### 3.1 Team-owned rows (draft + soft delete)

Conceptual predicate:

```sql
team_id = app.current_team_id()
AND is_deleted = false
AND (status <> 'draft' OR created_by = auth.uid())
```

### 3.2 INSERT

- **Team users:** may insert rows for their team.
- **Guests:** only within explicit asset scope and must set `created_by = auth.uid()`.

### 3.3 UPDATE / DELETE

- **Team users:** may update their team's rows.
- **Guests:** may update/delete only rows they created and only within their scope.
- **Hard deletes discouraged** → use soft delete.

---

## 4. RLS Enablement Checklist

For each table:

```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.<table> FORCE ROW LEVEL SECURITY;
```

---

## 5. Shared & Reference Tables

| Table | Read | Write |
|-------|------|-------|
| `markets` | Authenticated users | God Admin only |
| `submarkets` | Authenticated users | God Admin only |
| `buildings` | Authenticated users | God Admin only |

**Building moderation tables** (`building_attributes`, `building_attribute_provenance`, `building_flags`, `admin_review_queue`, `locked_building_fields`):
- Writable only by God Admin
- Exception: `building_flags` insertable by users

---

## 6. Team-Owned Tables (Core)

Applies to:
- **Comps:** `lease_comps`, `sale_comps`, `land_comps`
- `contacts`
- `market_chatter` (+ joins)
- `developments`
- `documents`
- Extraction tables
- Export tables

**Pattern:**
- Team-scoped SELECT
- Soft delete enforced
- No hard delete
- Draft visibility enforced (creator-only until active)

---

## 7. Asset Management + Guest Access

**Tables:**
- `portfolios`, `assets`, `suites`, `vacancies`, `prospects`, `tours`, `lois`, `suite_budgets`, `make_ready_projects`

**Rules:**
- Team access via portfolio ownership
- Guest access via `app.has_*_access(...)` functions
- Guest delete only if `created_by = auth.uid()`

---

## 8. Documents / Extraction / Exports

Same team-scoped pattern:
- `team_id` match
- Not deleted (`is_deleted = false`)
- Creator-only drafts
- No hard deletes

---

## 9. Map Privacy Support

- `team_building_presence` is team-scoped and **never shared**.

---

## 10. Audit Log (Append-Only)

| Operation | Allowed |
|-----------|---------|
| INSERT | ✅ Yes |
| SELECT | Team scoped only |
| UPDATE | ❌ Never |
| DELETE | ❌ Never |

---

## 11. God Admin Boundary (Non-Negotiable)

God Admin permissions apply **only** to:
- `markets` / `submarkets`
- `buildings` + moderation tables

**God Admin must NOT access team-owned data.**

---

## 12. Delegation Plan

### Claude Code Responsibilities:
- [ ] Create helper functions
- [ ] Enable + FORCE RLS on all tables
- [ ] Generate all policies
- [ ] Implement soft delete protections

### Your Responsibilities:
- [ ] Verify JWT `app_metadata.role` configuration
- [ ] Spot-check RLS in Supabase dashboard
- [ ] Validate guest access boundaries

---

*End of document.*
