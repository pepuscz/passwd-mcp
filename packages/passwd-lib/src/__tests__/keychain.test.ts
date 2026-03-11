import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isKeychainAvailable, keychainLoad, keychainSave, resetKeychainCache } from "../keychain.js";

afterEach(() => {
  resetKeychainCache();
});

describe("keychain (unit)", () => {
  it("isKeychainAvailable returns boolean", async () => {
    const result = await isKeychainAvailable();
    assert.equal(typeof result, "boolean");
  });

  it("isKeychainAvailable caches result", async () => {
    const first = await isKeychainAvailable();
    const second = await isKeychainAvailable();
    assert.equal(first, second);
  });

  it("keychainLoad returns null for nonexistent entry", async () => {
    const result = await keychainLoad("https://nonexistent.example.com");
    // On macOS with keychain: null (not found). On CI/Linux: null (unavailable).
    assert.equal(result, null);
  });

  it("keychainSave returns false when keychain unavailable", async () => {
    if (process.platform === "darwin") return; // skip on macOS where keychain IS available
    const result = await keychainSave("https://test.example.com", "{}");
    assert.equal(result, false);
  });
});
