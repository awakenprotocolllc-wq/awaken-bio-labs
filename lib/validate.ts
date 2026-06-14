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
