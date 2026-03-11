import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseInjection } from "../util/parse-injection.js";

describe("parseInjection", () => {
  it("parses standard VAR=ID:FIELD format", () => {
    const result = parseInjection("DB_PASS=abc123:password");
    assert.deepEqual(result, {
      varName: "DB_PASS",
      secretId: "abc123",
      field: "password",
    });
  });

  it("handles secret IDs with hyphens and underscores", () => {
    const result = parseInjection("TOKEN=my-secret_id-123:credentials");
    assert.deepEqual(result, {
      varName: "TOKEN",
      secretId: "my-secret_id-123",
      field: "credentials",
    });
  });

  it("handles field names with camelCase", () => {
    const result = parseInjection("CARD=id1:cardNumber");
    assert.equal(result.field, "cardNumber");
  });

  it("handles values with multiple colons (uses first colon)", () => {
    const result = parseInjection("VAR=id:field:extra");
    assert.equal(result.secretId, "id");
    assert.equal(result.field, "field:extra");
  });

  it("handles values with multiple equals (uses first equals)", () => {
    const result = parseInjection("VAR=id=extra:field");
    assert.equal(result.varName, "VAR");
    assert.equal(result.secretId, "id=extra");
    assert.equal(result.field, "field");
  });

  it("throws on missing equals sign", () => {
    assert.throws(
      () => parseInjection("NOEQUALSSIGN"),
      { message: /Invalid --inject format.*NOEQUALSSIGN.*Expected VAR=SECRET_ID:FIELD/ },
    );
  });

  it("throws on missing colon after equals", () => {
    assert.throws(
      () => parseInjection("VAR=secretid_no_colon"),
      { message: /Invalid --inject format.*secretid_no_colon.*Expected VAR=SECRET_ID:FIELD/ },
    );
  });

  it("allows empty varName (edge case)", () => {
    const result = parseInjection("=id:field");
    assert.equal(result.varName, "");
    assert.equal(result.secretId, "id");
    assert.equal(result.field, "field");
  });

  it("allows empty field (edge case)", () => {
    const result = parseInjection("VAR=id:");
    assert.equal(result.varName, "VAR");
    assert.equal(result.secretId, "id");
    assert.equal(result.field, "");
  });

  it("allows empty secretId (edge case)", () => {
    const result = parseInjection("VAR=:field");
    assert.equal(result.varName, "VAR");
    assert.equal(result.secretId, "");
    assert.equal(result.field, "field");
  });
});
