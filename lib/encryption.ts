import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM: authenticated encryption — any tampering with the ciphertext
// causes decryption to throw, which prevents padding-oracle and bit-flip attacks.
const ALGORITHM = "aes-256-gcm";
const IV_BYTES  = 12; // 96-bit IV — standard for GCM
const TAG_BYTES = 16; // 128-bit auth tag — GCM default

// Encrypted field wire format (all components hex-encoded):
//   v1:<iv>:<authtag>:<ciphertext>
//
// The "v1:" prefix lets us add a v2 format for key rotation without breaking
// reads of existing records — decryptField checks the prefix and routes accordingly.
const PREFIX = "v1:";

function getKey(): Buffer {
  const hex = process.env.PAYOUT_ENCRYPTION_KEY ?? "";
  if (hex.length !== 64 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new Error(
      "PAYOUT_ENCRYPTION_KEY must be a 64-hex-character (32-byte) AES-256 key. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypts a string value with AES-256-GCM.
 * Each call produces a unique ciphertext because the IV is randomly generated.
 * Returns a versioned string safe to store directly in KV.
 */
export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv  = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body   = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${body.toString("hex")}`;
}

/**
 * Decrypts a value previously encrypted by encryptField.
 *
 * Legacy-safe: if the value does not start with the "v1:" prefix it is
 * assumed to be a plaintext value written before encryption was introduced
 * and is returned as-is. Those records will be re-encrypted the next time
 * the affiliate updates their payout info.
 *
 * Throws if the PAYOUT_ENCRYPTION_KEY is wrong or the ciphertext is tampered.
 */
export function decryptField(value: string): string {
  if (!value.startsWith(PREFIX)) return value; // legacy plaintext — pass through

  const hex = process.env.PAYOUT_ENCRYPTION_KEY ?? "";
  if (hex.length !== 64) {
    throw new Error("PAYOUT_ENCRYPTION_KEY is required to decrypt payout information.");
  }

  const key   = Buffer.from(hex, "hex");
  const parts = value.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted field — expected v1:<iv>:<tag>:<ct>");

  const [ivHex, tagHex, ctHex] = parts;
  const iv         = Buffer.from(ivHex,  "hex");
  const tag        = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ctHex,  "hex");

  if (iv.length !== IV_BYTES) throw new Error("Malformed encrypted field — bad IV length");
  if (tag.length !== TAG_BYTES) throw new Error("Malformed encrypted field — bad tag length");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** Returns true when a field value was written by encryptField. */
export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}
