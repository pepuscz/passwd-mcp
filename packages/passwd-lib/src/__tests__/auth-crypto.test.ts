import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt } from "../auth.js";

describe("encrypt / decrypt (AES-256-GCM)", () => {
  const key = randomBytes(32);

  it("round-trips plaintext", () => {
    const plaintext = JSON.stringify({ access_token: "ya29.test", origin: "https://app.passwd.team" });
    const blob = encrypt(plaintext, key);
    const result = decrypt(blob, key);
    assert.equal(result, plaintext);
  });

  it("decrypt with wrong key throws", () => {
    const blob = encrypt("secret data", key);
    const wrongKey = randomBytes(32);
    assert.throws(() => decrypt(blob, wrongKey));
  });

  it("decrypt with tampered ciphertext throws", () => {
    const blob = encrypt("secret data", key);
    const parsed = JSON.parse(blob);
    // Flip a byte in the encrypted data
    const dataBytes = Buffer.from(parsed.data, "hex");
    dataBytes[0] ^= 0xff;
    parsed.data = dataBytes.toString("hex");
    assert.throws(() => decrypt(JSON.stringify(parsed), key));
  });

  it("decrypt with tampered IV throws", () => {
    const blob = encrypt("secret data", key);
    const parsed = JSON.parse(blob);
    // Flip a byte in the IV
    const ivBytes = Buffer.from(parsed.iv, "hex");
    ivBytes[0] ^= 0xff;
    parsed.iv = ivBytes.toString("hex");
    assert.throws(() => decrypt(JSON.stringify(parsed), key));
  });

  it("each encrypt call produces different output (random IV)", () => {
    const plaintext = "same input";
    const blob1 = encrypt(plaintext, key);
    const blob2 = encrypt(plaintext, key);
    assert.notEqual(blob1, blob2);
    // But both decrypt to the same plaintext
    assert.equal(decrypt(blob1, key), plaintext);
    assert.equal(decrypt(blob2, key), plaintext);
  });

  it("rejects unsupported version", () => {
    const blob = encrypt("data", key);
    const parsed = JSON.parse(blob);
    parsed.v = 2;
    assert.throws(() => decrypt(JSON.stringify(parsed), key), /Unsupported encryption version/);
  });
});
