export function cn(...classes: Array<unknown>): string {
  return classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ')
}

/**
 * BUG-9: Parse companion names from a comma-separated string.
 * Splits on ',', trims each part, filters out empties.
 */
export function parseCompanions(s: string | undefined | null): string[] {
  if (!s) return []
  return s.split(',').map((c) => c.trim()).filter((c) => c.length > 0)
}

/**
 * BUG-10: Validate email format with edge-case guards.
 * Base regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 * Plus reject: consecutive dots ('..'), domain part ending in '.', more than one '@'.
 */
export function isValidEmail(s: string): boolean {
  const trimmed = s.trim()
  if (!trimmed) return false

  // Base regex: user@domain.tld
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return false
  }

  // Reject consecutive dots anywhere
  if (trimmed.includes('..')) {
    return false
  }

  // Reject more than one '@'
  if ((trimmed.match(/@/g) || []).length !== 1) {
    return false
  }

  // Reject domain part ending in '.'
  const [, domain] = trimmed.split('@')
  if (domain && domain.endsWith('.')) {
    return false
  }

  return true
}
