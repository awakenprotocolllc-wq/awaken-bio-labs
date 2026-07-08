import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret-with-enough-length-123456";
});

// Import after env setup — module reads env at call time, so static import is fine
import { createUnsubscribeToken, verifyUnsubscribeToken } from "../lib/unsubscribe-token";

describe("unsubscribe token", () => {
  it("round-trips a valid token", () => {
    const token = createUnsubscribeToken("Person@Example.COM");
    expect(token).toBeTruthy();
    const result = verifyUnsubscribeToken(token!);
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.email).toBe("person@example.com"); // normalized
  });

  it("rejects a tampered token (different email, same signature)", () => {
    const token = createUnsubscribeToken("victim@example.com")!;
    const parts = token.split(".");
    // Swap in a different email payload
    parts[1] = Buffer.from("attacker@example.com", "utf8").toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const result = verifyUnsubscribeToken(parts.join("."));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("bad_signature");
  });

  it("rejects a tampered timestamp", () => {
    const token = createUnsubscribeToken("a@b.com")!;
    const parts = token.split(".");
    parts[2] = String(parseInt(parts[2], 10) + 1);
    const result = verifyUnsubscribeToken(parts.join("."));
    expect(result.valid).toBe(false);
  });

  it("rejects malformed tokens safely", () => {
    for (const bad of ["", "garbage", "v1.only.three", "v2.a.1.b", "v1...."]) {
      const result = verifyUnsubscribeToken(bad);
      expect(result.valid).toBe(false);
    }
  });

  it("rejects expired tokens (older than 400 days)", () => {
    // Build a token manually with an old issuedAt using the same scheme
    const { createHmac } = require("crypto");
    const email = "old@example.com";
    const issuedAt = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 401;
    const sig = createHmac("sha256", process.env.UNSUBSCRIBE_TOKEN_SECRET!)
      .update(`unsub.${email}.${issuedAt}`).digest("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const payload = Buffer.from(email, "utf8").toString("base64")
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const result = verifyUnsubscribeToken(`v1.${payload}.${issuedAt}.${sig}`);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });

  it("purpose binding: a confirm token cannot be used to unsubscribe (and vice versa)", () => {
    const confirmToken = createUnsubscribeToken("a@b.com", "confirm")!;
    expect(verifyUnsubscribeToken(confirmToken, "confirm").valid).toBe(true);
    expect(verifyUnsubscribeToken(confirmToken, "unsub").valid).toBe(false);

    const unsubToken = createUnsubscribeToken("a@b.com", "unsub")!;
    expect(verifyUnsubscribeToken(unsubToken, "unsub").valid).toBe(true);
    expect(verifyUnsubscribeToken(unsubToken, "confirm").valid).toBe(false);
  });

  it("fails closed when secret is not configured", () => {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
    expect(createUnsubscribeToken("a@b.com")).toBeNull();
    const result = verifyUnsubscribeToken("v1.YQ.1.Zm9v");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("not_configured");
  });
});
