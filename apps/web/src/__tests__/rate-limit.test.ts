import { describe, expect, it } from "vitest";
import { checkLoginRateLimit, lockoutIp, resetLoginRateLimit } from "../lib/rate-limit";

// Use unique IP prefixes per test to avoid state leakage
function ip(suffix: string) {
  return `192.168.99.${suffix}`;
}

describe("Login rate limiter (S7-02)", () => {
  it("allows first 10 attempts per window", () => {
    const testIp = ip("1");
    for (let i = 0; i < 10; i++) {
      const result = checkLoginRateLimit(testIp);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 11th attempt", () => {
    const testIp = ip("2");
    for (let i = 0; i < 10; i++) checkLoginRateLimit(testIp);
    const result = checkLoginRateLimit(testIp);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("lockoutIp extends the window", () => {
    const testIp = ip("3");
    lockoutIp(testIp);
    const result = checkLoginRateLimit(testIp);
    expect(result.allowed).toBe(false);
  });

  it("resetLoginRateLimit clears the bucket", () => {
    const testIp = ip("4");
    for (let i = 0; i < 10; i++) checkLoginRateLimit(testIp);
    expect(checkLoginRateLimit(testIp).allowed).toBe(false);
    resetLoginRateLimit(testIp);
    expect(checkLoginRateLimit(testIp).allowed).toBe(true);
  });

  it("remaining count decrements correctly", () => {
    const testIp = ip("5");
    const first = checkLoginRateLimit(testIp);
    expect(first.remaining).toBe(9);
    const second = checkLoginRateLimit(testIp);
    expect(second.remaining).toBe(8);
  });

  it("different IPs have independent buckets", () => {
    const ipA = ip("10");
    const ipB = ip("11");
    for (let i = 0; i < 10; i++) checkLoginRateLimit(ipA);
    expect(checkLoginRateLimit(ipA).allowed).toBe(false);
    expect(checkLoginRateLimit(ipB).allowed).toBe(true);
  });
});
