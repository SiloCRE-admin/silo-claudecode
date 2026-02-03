/**
 * Compute field-level diffs between two objects.
 * Returns only changed fields. Both values are stringified for storage.
 */
export function computeDiffs(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fieldLabels: Record<string, string>
): { field_label: string; old_value: string | null; new_value: string | null }[] {
  const diffs: { field_label: string; old_value: string | null; new_value: string | null }[] = []

  for (const key of Object.keys(fieldLabels)) {
    const oldVal = before[key]
    const newVal = after[key]
    const oldStr = oldVal == null ? null : String(oldVal)
    const newStr = newVal == null ? null : String(newVal)

    if (oldStr !== newStr) {
      diffs.push({
        field_label: fieldLabels[key],
        old_value: oldStr,
        new_value: newStr,
      })
    }
  }

  return diffs
}
