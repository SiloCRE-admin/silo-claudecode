#!/usr/bin/env node

/**
 * Architecture Documentation Validator
 *
 * Validates consistency between PRD.md, DATA_MODEL.md, RLS_POLICIES.md, and ARCHITECTURE.md
 * to catch drift and violations early.
 *
 * Usage: node scripts/validate-architecture-docs.js
 * Exit code: 0 = all checks pass, non-zero = violations found
 */

const fs = require('fs');
const path = require('path');

// File paths
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const FILES = {
  PRD: path.join(DOCS_DIR, 'PRD.md'),
  DATA_MODEL: path.join(DOCS_DIR, 'DATA_MODEL.md'),
  RLS_POLICIES: path.join(DOCS_DIR, 'RLS_POLICIES.md'),
  ARCHITECTURE: path.join(DOCS_DIR, 'ARCHITECTURE.md')
};

// Results tracking
const results = [];
let hasFailures = false;

/**
 * Read file content or return null if file doesn't exist
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Check if text contains phrase (case-insensitive)
 */
function contains(text, phrase) {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

/**
 * Check if text contains any of the phrases (case-insensitive)
 */
function containsAny(text, phrases) {
  return phrases.some(phrase => contains(text, phrase));
}

/**
 * Log check result
 */
function check(name, passed, details = '') {
  results.push({ name, passed, details });
  if (!passed) hasFailures = true;

  const status = passed ? '✓ PASS' : '✗ FAIL';
  const message = details ? `${status}: ${name} - ${details}` : `${status}: ${name}`;
  console.log(message);
}

/**
 * Main validation logic
 */
function validate() {
  console.log('=== Architecture Documentation Validator ===\n');

  // Load all files
  const contents = {};
  for (const [key, filePath] of Object.entries(FILES)) {
    contents[key] = readFile(filePath);
    if (!contents[key]) {
      check(`File exists: ${path.basename(filePath)}`, false, 'File not found');
      console.error(`\nERROR: Required file not found: ${filePath}`);
      return false;
    } else {
      check(`File exists: ${path.basename(filePath)}`, true);
    }
  }

  console.log('');

  // Check 1: "Users belong to one team"
  const hasOneTeamRule = containsAny(contents.PRD, [
    'users belong to one team',
    'user belongs to one team',
    'one user belongs to exactly one team'
  ]);
  const hasMultiTeamImplication = containsAny(contents.ARCHITECTURE, [
    'switch team',
    'change team',
    'multiple teams per user',
    'users can belong to multiple'
  ]);
  check(
    'Check 1: Users belong to one team',
    hasOneTeamRule && !hasMultiTeamImplication,
    hasOneTeamRule ?
      (hasMultiTeamImplication ? 'ARCHITECTURE implies multi-team membership' : '') :
      'PRD missing "users belong to one team" rule'
  );

  // Check 2: "Guests are outside team structure"
  const hasGuestRule = containsAny(contents.PRD, [
    'guests are outside team structure',
    'guest users exist outside team',
    'guests have no team membership'
  ]);
  const hasGuestAsTeamMember = containsAny(contents.ARCHITECTURE, [
    'guest team member',
    'guests join team',
    'guest user is a team member'
  ]);
  check(
    'Check 2: Guests outside team structure',
    hasGuestRule && !hasGuestAsTeamMember,
    hasGuestRule ?
      (hasGuestAsTeamMember ? 'ARCHITECTURE implies guests are team members' : '') :
      'PRD missing guest access model rule'
  );

  // Check 3: God Admin boundary
  const prdHasGodAdminRules = containsAny(contents.PRD, [
    'god admin',
    'god_admin',
    'system administrator'
  ]) && containsAny(contents.PRD, [
    'cannot access',
    'blocked from',
    'denied access'
  ]);

  const archHasGodAdminBoundary = containsAny(contents.ARCHITECTURE, [
    'god admin cannot access team',
    'admin cannot access private',
    'no team data access'
  ]);

  const rlsHasGodAdminDeny = containsAny(contents.RLS_POLICIES, [
    'god admin',
    'god_admin'
  ]) && containsAny(contents.RLS_POLICIES, [
    'cannot',
    'blocked',
    'denied',
    'must not access'
  ]);

  check(
    'Check 3a: God Admin boundary in PRD',
    prdHasGodAdminRules,
    'PRD must define God Admin allowed/denied access'
  );

  check(
    'Check 3b: God Admin boundary in ARCHITECTURE',
    archHasGodAdminBoundary,
    'ARCHITECTURE must state God Admin cannot access team-private data'
  );

  check(
    'Check 3c: God Admin RLS policies documented',
    rlsHasGodAdminDeny,
    'RLS_POLICIES must include God Admin deny rules'
  );

  // Check 4: Tenant terminology
  const hasBadTenantWording = contains(contents.ARCHITECTURE, 'tenant = team') ||
                               contains(contents.ARCHITECTURE, 'tenant=team');
  const hasGoodIsolationWording = containsAny(contents.ARCHITECTURE, [
    'isolation unit = team',
    'isolation unit: team',
    'team (billing + data boundary)'
  ]);

  check(
    'Check 4: Tenant terminology',
    !hasBadTenantWording && hasGoodIsolationWording,
    hasBadTenantWording ?
      'ARCHITECTURE says "Tenant = Team" (ambiguous, use "Isolation unit = Team")' :
      (!hasGoodIsolationWording ? 'Missing clear isolation unit terminology' : '')
  );

  // Check 5: Map privacy rules
  const prdHasMapPrivacy = containsAny(contents.PRD, [
    'displayed only when team has data',
    'no signal of other teams',
    'team-private visibility only'
  ]);

  const archHasMapPrivacy = containsAny(contents.ARCHITECTURE, [
    'no leakage',
    'no cross-team',
    'team-visible data',
    'no signal of activity'
  ]);

  check(
    'Check 5: Map privacy rules',
    prdHasMapPrivacy && archHasMapPrivacy,
    prdHasMapPrivacy ?
      (archHasMapPrivacy ? '' : 'ARCHITECTURE missing map privacy section') :
      'PRD missing map visibility rules'
  );

  // Check 6: Export governance thresholds
  const hasExportThresholds = containsAny(contents.PRD, [
    '50 comps',
    '3 reports',
    'export approval',
    'approval required'
  ]);

  const archAcknowledgesExportGov = containsAny(contents.ARCHITECTURE, [
    'export approval',
    'export governance',
    'export workflow',
    'export security'
  ]);

  check(
    'Check 6a: Export thresholds in PRD',
    hasExportThresholds,
    'PRD must define export approval thresholds'
  );

  check(
    'Check 6b: Export governance acknowledged',
    archAcknowledgesExportGov,
    'ARCHITECTURE should acknowledge export approval workflows'
  );

  // Check 7: Draft vs Active lifecycle
  const prdHasDraftRules = containsAny(contents.PRD, [
    'draft',
    'creator only',
    'active (team)'
  ]) && containsAny(contents.PRD, [
    'user confirms',
    'user review',
    'before commit'
  ]);

  const archHasDraftRules = containsAny(contents.ARCHITECTURE, [
    'draft',
    'no auto-commit',
    'user confirmation',
    'no visibility before activation'
  ]);

  check(
    'Check 7: Draft vs Active lifecycle',
    prdHasDraftRules && archHasDraftRules,
    prdHasDraftRules ?
      (archHasDraftRules ? '' : 'ARCHITECTURE missing draft visibility rules') :
      'PRD missing draft/active lifecycle rules'
  );

  // Check 8: Table name drift guard (heuristic)
  // Count snake_case identifiers that look like table names
  const tableNamePattern = /\b[a-z]+(?:_[a-z0-9]+)+\b/g;
  const commonNonTables = new Set([
    'team_id', 'user_id', 'building_id', 'created_at', 'updated_at',
    'created_by', 'updated_by', 'is_deleted', 'deleted_at',
    'source_type', 'entity_type', 'entity_id', 'field_name',
    'app_metadata', 'god_admin', 'team_owner', 'team_admin', 'team_member'
  ]);

  const matches = contents.ARCHITECTURE.match(tableNamePattern) || [];
  const uniqueMatches = [...new Set(matches)];
  const likelyTableNames = uniqueMatches.filter(m =>
    !commonNonTables.has(m) &&
    m.length > 4 && // Ignore very short tokens
    !m.endsWith('_id') && // Ignore FK columns
    !m.endsWith('_at') && // Ignore timestamp columns
    !m.endsWith('_by') // Ignore audit columns
  );

  const tableNameThreshold = 10;
  const tooManyTableNames = likelyTableNames.length > tableNameThreshold;

  check(
    'Check 8: Table name drift guard',
    !tooManyTableNames,
    tooManyTableNames ?
      `Found ${likelyTableNames.length} likely table names (threshold: ${tableNameThreshold}). Suggest referencing DATA_MODEL.md instead. Found: ${likelyTableNames.slice(0, 5).join(', ')}...` :
      ''
  );

  // Check 9: Required cross-links
  const hasDataModelRef = contains(contents.ARCHITECTURE, 'DATA_MODEL.md') ||
                           contains(contents.ARCHITECTURE, 'docs/DATA_MODEL');
  const hasRlsRef = contains(contents.ARCHITECTURE, 'RLS_POLICIES.md') ||
                    contains(contents.ARCHITECTURE, 'docs/RLS_POLICIES');

  check(
    'Check 9a: References DATA_MODEL.md',
    hasDataModelRef,
    'ARCHITECTURE must reference docs/DATA_MODEL.md'
  );

  check(
    'Check 9b: References RLS_POLICIES.md',
    hasRlsRef,
    'ARCHITECTURE must reference docs/RLS_POLICIES.md'
  );

  return !hasFailures;
}

// Run validation
console.log('');
const success = validate();

console.log('\n=== Summary ===');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`Passed: ${passed}/${results.length}`);
console.log(`Failed: ${failed}/${results.length}`);

if (success) {
  console.log('\n✓ All architecture documentation checks passed!\n');
  process.exit(0);
} else {
  console.log('\n✗ Architecture documentation validation failed. Fix violations above.\n');
  process.exit(1);
}
