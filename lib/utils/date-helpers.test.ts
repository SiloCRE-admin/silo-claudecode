import { describe, it, expect } from 'vitest'
import {
  normalizeYear,
  endOfMonth,
  addMonthsToDate,
  deriveLeaseEndDate,
} from './date-helpers'

// ---------------------------------------------------------------------------
// normalizeYear
// ---------------------------------------------------------------------------

describe('normalizeYear', () => {
  it('expands 2-digit years 00-49 to 2000s', () => {
    expect(normalizeYear('25')).toBe('2025')
    expect(normalizeYear('0')).toBe('2000')
    expect(normalizeYear('00')).toBe('2000')
    expect(normalizeYear('01')).toBe('2001')
    expect(normalizeYear('49')).toBe('2049')
  })

  it('expands 2-digit years 50-99 to 1900s', () => {
    expect(normalizeYear('50')).toBe('1950')
    expect(normalizeYear('75')).toBe('1975')
    expect(normalizeYear('99')).toBe('1999')
  })

  it('returns 4-digit years as-is', () => {
    expect(normalizeYear('2025')).toBe('2025')
    expect(normalizeYear('1987')).toBe('1987')
    expect(normalizeYear('2000')).toBe('2000')
  })

  it('returns empty string for empty/invalid input', () => {
    expect(normalizeYear('')).toBe('')
    expect(normalizeYear('   ')).toBe('')
    expect(normalizeYear('abc')).toBe('')
    expect(normalizeYear('-1')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// endOfMonth
// ---------------------------------------------------------------------------

describe('endOfMonth', () => {
  it('snaps to last day of 31-day months', () => {
    expect(endOfMonth('2025-01-15')).toBe('2025-01-31')
    expect(endOfMonth('2025-03-01')).toBe('2025-03-31')
    expect(endOfMonth('2025-12-05')).toBe('2025-12-31')
  })

  it('snaps to last day of 30-day months', () => {
    expect(endOfMonth('2025-04-01')).toBe('2025-04-30')
    expect(endOfMonth('2025-06-15')).toBe('2025-06-30')
    expect(endOfMonth('2025-09-28')).toBe('2025-09-30')
  })

  it('handles February (non-leap year)', () => {
    expect(endOfMonth('2025-02-10')).toBe('2025-02-28')
  })

  it('handles February (leap year)', () => {
    expect(endOfMonth('2024-02-10')).toBe('2024-02-29')
  })

  it('works when input is already end of month', () => {
    expect(endOfMonth('2025-01-31')).toBe('2025-01-31')
    expect(endOfMonth('2024-02-29')).toBe('2024-02-29')
  })
})

// ---------------------------------------------------------------------------
// addMonthsToDate
// ---------------------------------------------------------------------------

describe('addMonthsToDate', () => {
  it('adds months within the same year', () => {
    expect(addMonthsToDate('2025-01-15', 1)).toBe('2025-02-15')
    expect(addMonthsToDate('2025-01-15', 3)).toBe('2025-04-15')
  })

  it('rolls over to the next year', () => {
    expect(addMonthsToDate('2025-11-15', 2)).toBe('2026-01-15')
    expect(addMonthsToDate('2025-12-01', 1)).toBe('2026-01-01')
  })

  it('clamps day when target month has fewer days', () => {
    expect(addMonthsToDate('2025-01-31', 1)).toBe('2025-02-28')
    expect(addMonthsToDate('2025-01-29', 1)).toBe('2025-02-28')
    expect(addMonthsToDate('2025-03-31', 1)).toBe('2025-04-30')
  })

  it('handles leap year Feb correctly', () => {
    expect(addMonthsToDate('2024-01-31', 1)).toBe('2024-02-29')
  })

  it('handles large month additions', () => {
    expect(addMonthsToDate('2025-01-15', 12)).toBe('2026-01-15')
    expect(addMonthsToDate('2025-01-15', 60)).toBe('2030-01-15')
  })
})

// ---------------------------------------------------------------------------
// deriveLeaseEndDate
// ---------------------------------------------------------------------------

describe('deriveLeaseEndDate', () => {
  it('computes start + term months, snapped to end of month', () => {
    // 2025-01-01 + 60 months = 2030-01-01 → end of Jan 2030
    expect(deriveLeaseEndDate('2025-01-01', 60)).toBe('2030-01-31')
  })

  it('snaps mid-month start dates to end of target month', () => {
    // 2025-03-15 + 12 months = 2026-03-15 → end of Mar 2026
    expect(deriveLeaseEndDate('2025-03-15', 12)).toBe('2026-03-31')
  })

  it('handles leap year to non-leap year transition', () => {
    // 2024-02-29 + 12 months = 2025-02-28 → end of Feb 2025
    expect(deriveLeaseEndDate('2024-02-29', 12)).toBe('2025-02-28')
  })

  it('handles short terms', () => {
    // 2025-06-01 + 3 months = 2025-09-01 → end of Sep 2025
    expect(deriveLeaseEndDate('2025-06-01', 3)).toBe('2025-09-30')
  })

  it('handles year boundary', () => {
    // 2025-10-15 + 6 months = 2026-04-15 → end of Apr 2026
    expect(deriveLeaseEndDate('2025-10-15', 6)).toBe('2026-04-30')
  })
})
