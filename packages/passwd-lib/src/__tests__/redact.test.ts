import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { redactSecret } from "../api.js";
import type { Secret } from "../types.js";

const REDACTED = "••••••••";

describe("redactSecret", () => {
  it("redacts password field on password secret", () => {
    const secret: Secret = {
      type: "password",
      name: "GitHub",
      username: "user1",
      password: "s3cret",
    };
    const result = redactSecret(secret);
    assert.equal(result.name, "GitHub");
    assert.equal(result.username, "user1");
    assert.equal((result as any).password, REDACTED);
  });

  it("redacts cardNumber and cvvCode on paymentCard", () => {
    const secret: Secret = {
      type: "paymentCard",
      name: "Visa",
      cardNumber: "4111111111111111",
      cvvCode: "123",
    };
    const result = redactSecret(secret);
    assert.equal(result.name, "Visa");
    assert.equal((result as any).cardNumber, REDACTED);
    assert.equal((result as any).cvvCode, REDACTED);
  });

  it("redacts credentials on apiCredentials", () => {
    const secret: Secret = {
      type: "apiCredentials",
      name: "Stripe",
      credentials: "sk_test_123",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).credentials, REDACTED);
  });

  it("redacts password on databaseCredentials", () => {
    const secret: Secret = {
      type: "databaseCredentials",
      name: "Postgres",
      password: "host=localhost password=abc",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).password, REDACTED);
  });

  it("redacts privateKey on sshKey", () => {
    const secret: Secret = {
      type: "sshKey",
      name: "Deploy Key",
      privateKey: "-----BEGIN RSA PRIVATE KEY-----\n...",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).privateKey, REDACTED);
  });

  it("redacts secureNote on secureNote", () => {
    const secret: Secret = {
      type: "secureNote",
      name: "Notes",
      secureNote: "top secret content",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).secureNote, REDACTED);
  });

  it("redacts TOTP field", () => {
    const secret: Secret = {
      type: "password",
      name: "With TOTP",
      password: "pw",
      TOTP: "JBSWY3DPEHPK3PXP",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).password, REDACTED);
    assert.equal((result as any).TOTP, REDACTED);
  });

  it("preserves non-sensitive fields", () => {
    const secret: Secret = {
      id: "abc123",
      type: "password",
      name: "Test",
      username: "admin",
      web: "https://example.com",
      password: "pw",
    };
    const result = redactSecret(secret);
    assert.equal(result.id, "abc123");
    assert.equal(result.name, "Test");
    assert.equal(result.username, "admin");
    assert.equal(result.web, "https://example.com");
    assert.equal(result.type, "password");
  });

  it("preserves non-sensitive paymentCard fields (expirationDate, cardholderName)", () => {
    const secret: Secret = {
      type: "paymentCard",
      name: "Visa",
      cardNumber: "4111111111111111",
      cvvCode: "123",
      expirationDate: "12/30",
      cardholderName: "Test Holder",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).expirationDate, "12/30");
    assert.equal((result as any).cardholderName, "Test Holder");
    assert.equal((result as any).cardNumber, REDACTED);
    assert.equal((result as any).cvvCode, REDACTED);
  });

  it("preserves non-sensitive apiCredentials fields (hostname)", () => {
    const secret: Secret = {
      type: "apiCredentials",
      name: "API",
      credentials: "sk_test_123",
      hostname: "api.example.com",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).hostname, "api.example.com");
    assert.equal((result as any).credentials, REDACTED);
  });

  it("preserves non-sensitive databaseCredentials fields (databaseName, databaseType, server, port)", () => {
    const secret: Secret = {
      type: "databaseCredentials",
      name: "DB",
      password: "secret",
      databaseName: "mydb",
      databaseType: "postgresql",
      server: "db.example.com",
      port: "5432",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).databaseName, "mydb");
    assert.equal((result as any).databaseType, "postgresql");
    assert.equal((result as any).server, "db.example.com");
    assert.equal((result as any).port, "5432");
    assert.equal((result as any).password, REDACTED);
  });

  it("preserves non-sensitive sshKey fields (publicKey)", () => {
    const secret: Secret = {
      type: "sshKey",
      name: "Key",
      privateKey: "-----BEGIN RSA PRIVATE KEY-----\n...",
      publicKey: "ssh-ed25519 AAAAC3 test@test",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).publicKey, "ssh-ed25519 AAAAC3 test@test");
    assert.equal((result as any).privateKey, REDACTED);
  });

  it("leaves null/undefined sensitive fields as-is", () => {
    const secret: Secret = {
      type: "password",
      name: "No Password",
      // password not set
    };
    const result = redactSecret(secret);
    assert.equal((result as any).password, undefined);
  });

  it("redacts empty string sensitive field", () => {
    const secret: Secret = {
      type: "password",
      name: "Empty PW",
      password: "",
    };
    const result = redactSecret(secret);
    assert.equal((result as any).password, REDACTED);
  });
});
