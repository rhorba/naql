/**
 * i18n parity test (S6-08)
 * Verifies that ar.json has every key present in fr.json.
 * Missing keys in AR = untranslated strings → guaranteed RTL gaps.
 */
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

type JsonObj = Record<string, unknown>;

function collectKeys(obj: JsonObj, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      keys.push(...collectKeys(v as JsonObj, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

describe("i18n key parity", () => {
  const frKeys = new Set(collectKeys(fr as JsonObj));
  const arKeys = new Set(collectKeys(ar as JsonObj));
  const enKeys = new Set(collectKeys(en as JsonObj));

  it("ar.json has all keys from fr.json", () => {
    const missing = [...frKeys].filter((k) => !arKeys.has(k));
    if (missing.length > 0) {
      console.error("Missing AR keys:", missing);
    }
    expect(missing).toHaveLength(0);
  });

  it("en.json has all keys from fr.json", () => {
    const missing = [...frKeys].filter((k) => !enKeys.has(k));
    if (missing.length > 0) {
      console.error("Missing EN keys:", missing);
    }
    expect(missing).toHaveLength(0);
  });

  it("no key in any locale is an empty string", () => {
    for (const [locale, obj] of [
      ["fr", fr],
      ["ar", ar],
      ["en", en],
    ] as const) {
      const keys = collectKeys(obj as JsonObj);
      for (const key of keys) {
        const parts = key.split(".");
        // biome-ignore lint/suspicious/noExplicitAny: test traversal
        let val: any = obj;
        for (const p of parts) val = val?.[p];
        expect(val, `${locale}.${key} must not be empty`).not.toBe("");
      }
    }
  });
});
