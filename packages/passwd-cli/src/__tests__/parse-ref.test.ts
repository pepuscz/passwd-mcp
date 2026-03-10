import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseRefFlag } from "../util/parse-ref.js";

describe("parseRefFlag", () => {
  it("parses ID with multiple permissions", () => {
    const result = parseRefFlag("abc123:read,write");
    assert.deepEqual(result, { id: "abc123", accessPermissions: ["read", "write"] });
  });

  it("parses ID with single permission", () => {
    const result = parseRefFlag("xyz:autofillOnly");
    assert.deepEqual(result, { id: "xyz", accessPermissions: ["autofillOnly"] });
  });

  it("trims whitespace around permissions", () => {
    const result = parseRefFlag("id1: read , write ");
    assert.deepEqual(result, { id: "id1", accessPermissions: ["read", "write"] });
  });

  it("throws on missing colon", () => {
    assert.throws(() => parseRefFlag("nocolon"), { message: /Invalid ref format/ });
  });

  it("throws on invalid permission name", () => {
    assert.throws(() => parseRefFlag("id:read,admin"), { message: /Invalid permission "admin"/ });
  });
});
