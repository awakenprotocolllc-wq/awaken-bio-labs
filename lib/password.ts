import { createHash } from "crypto";

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/** Returns an error string, or null if the password passes all checks. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
  if (password.length > MAX_LENGTH) return "Password is too long.";
  return null;
}

/**
 * Checks the password against HaveIBeenPwned using k-anonymity:
 * only the first 5 characters of the SHA-1 hash are sent to the API.
 * Returns true if the password appears in a known data breach.
 * Returns false on network errors — we don't block users for API outages.
 */
export async function checkBreachedPassword(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;

    const text = await res.text();
    return text.split("\r\n").some((line) => line.toUpperCase().startsWith(suffix));
  } catch {
    return false;
  }
}
