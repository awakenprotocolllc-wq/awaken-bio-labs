/** Returns true only when v is a non-empty string within the length limit. */
export function isStr(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

/** Returns true when v is a finite number within [min, max]. */
export function isNum(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}

/** Returns true when v is one of the allowed string enum values. */
export function isEnum<T extends string>(v: unknown, values: readonly T[]): v is T {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Attack pattern detection
// ---------------------------------------------------------------------------

const ATTACK_PATTERNS: RegExp[] = [
  // XSS — script tags and inline event handlers
  /<script[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /on(?:error|load|click|mouse\w+|key\w+|focus|blur|change|submit|reset|input|drag\w*|touch\w*|pointer\w*)\s*=/i,
  /eval\s*\(/i,
  /document\.(cookie|location|write\b|domain)/i,
  /<\s*i?frame[\s>]/i,
  /expression\s*\(/i,
  // SQL injection
  /'\s*(or|and)\s*['"\d]/i,
  /\bunion\s+(?:all\s+)?select\b/i,
  /;\s*(drop|alter|truncate)\s+\w/i,
  /\bxp_\w+/i,
  /\bexec\s*\(/i,
  // Template / server-side injection
  /\$\{[^}]+\}/,
  /\{\{[^}]+\}\}/,
];

/** Returns true if the value matches any known attack pattern. */
export function containsAttack(value: string): boolean {
  return ATTACK_PATTERNS.some((p) => p.test(value));
}

/**
 * Scans a named map of string fields for attack patterns.
 * Returns the field name of the first suspicious value, or null if all clean.
 */
export function findAttack(fields: Record<string, string | undefined | null>): string | null {
  for (const [field, value] of Object.entries(fields)) {
    if (value && containsAttack(value)) return field;
  }
  return null;
}
