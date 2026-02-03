/**
 * Shared date and year normalization utilities.
 *
 * All date strings use YYYY-MM-DD format (ISO date-only).
 * No external dependencies — pure native Date arithmetic.
 */

/**
 * Expand a 1-2 digit year string into a 4-digit year.
 *
 * Pivot: 00-49 → 2000-2049, 50-99 → 1950-1999.
 * 4-digit years returned as-is. Empty/invalid → ''.
 */
export function normalizeYear(input: string): string {
  const trimmed = input.trim()
  if (trimmed === '') return ''

  const n = parseInt(trimmed, 10)
  if (isNaN(n) || n < 0) return ''

  // Already 4 digits
  if (trimmed.length >= 4) return n.toString()

  // 1-2 digit expansion
  if (n <= 49) return (2000 + n).toString()
  return (1900 + n).toString()
}

/**
 * Snap a YYYY-MM-DD date to the last day of its month.
 *
 * E.g. "2025-03-15" → "2025-03-31", "2024-02-10" → "2024-02-29".
 */
export function endOfMonth(dateStr: string): string {
  const [yearStr, monthStr] = dateStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) // 1-based

  // Day 0 of the next month = last day of current month
  const lastDay = new Date(year, month, 0).getDate()

  const mm = month.toString().padStart(2, '0')
  const dd = lastDay.toString().padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/**
 * Add months to a YYYY-MM-DD date. Returns YYYY-MM-DD.
 *
 * Handles month overflow by clamping to the last day of the target month
 * (e.g. Jan 31 + 1 month → Feb 28).
 *
 * Does NOT enforce end-of-month — caller decides.
 */
export function addMonthsToDate(dateStr: string, months: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // 0-based for Date
  const day = parseInt(dayStr, 10)

  const target = new Date(year, month + months, 1) // 1st of target month
  const targetYear = target.getFullYear()
  const targetMonth = target.getMonth() // 0-based
  const maxDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const clampedDay = Math.min(day, maxDay)

  const mm = (targetMonth + 1).toString().padStart(2, '0')
  const dd = clampedDay.toString().padStart(2, '0')
  return `${targetYear}-${mm}-${dd}`
}

/**
 * Derive lease end date from start date + term in months.
 *
 * Per DATA_MODEL.md: lease_end_date is always the last day of the month.
 * Computes start + termMonths, then snaps to end of month.
 */
export function deriveLeaseEndDate(startDate: string, termMonths: number): string {
  const raw = addMonthsToDate(startDate, termMonths)
  return endOfMonth(raw)
}
