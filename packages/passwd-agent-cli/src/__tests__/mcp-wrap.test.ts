import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMapping } from "../commands/mcp-wrap.js";

describe("parseMapping", () => {
  it("parses standard header=SECRET_ID:field format", () => {
    const result = parseMapping("x-api-key=abc123:password");
    assert.deepStrictEqual(result, {
      headerName: "x-api-key",
      secretId: "abc123",
      field: "password",
    });
  });

  it("handles header names with multiple hyphens", () => {
    const result = parseMapping("x-custom-auth-token=id:credentials");
    assert.equal(result.headerName, "x-custom-auth-token");
    assert.equal(result.secretId, "id");
    assert.equal(result.field, "credentials");
  });

  it("handles secret IDs with special characters", () => {
    const result = parseMapping("auth=Q7hX-qSC_7rZ:username");
    assert.equal(result.secretId, "Q7hX-qSC_7rZ");
    assert.equal(result.field, "username");
  });

  it("uses first = for split (secret ID can contain =)", () => {
    const result = parseMapping("header=abc=def:password");
    assert.equal(result.headerName, "header");
    assert.equal(result.secretId, "abc=def");
    assert.equal(result.field, "password");
  });

  it("uses first : after = for split (field can't contain :)", () => {
    const result = parseMapping("h=id:field:extra");
    assert.equal(result.secretId, "id");
    assert.equal(result.field, "field:extra");
  });

  it("throws on missing =", () => {
    assert.throws(() => parseMapping("no-equals"), /expected header=SECRET_ID:field/);
  });

  it("throws on missing : after =", () => {
    assert.throws(() => parseMapping("header=no-colon"), /expected header=SECRET_ID:field/);
  });
});
