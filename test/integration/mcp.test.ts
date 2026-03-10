import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { skipUnlessAuth, mcpCall, TEST_SECRET_ID, TEST_TOTP_SECRET_ID } from "./helpers.js";

describe("passwd-mcp integration", () => {
  it("list_secrets returns totalCount and secrets array", (t) => {
    if (skipUnlessAuth(t)) return;
    const result = mcpCall("list_secrets", {});
    assert.ok(result.content, "Should have content");
    const text = result.content[0].text;
    const data = JSON.parse(text);
    assert.ok(typeof data.totalCount === "number");
    assert.ok(Array.isArray(data.secrets));
  });

  it("list_secrets with query filters results", (t) => {
    if (skipUnlessAuth(t)) return;
    const result = mcpCall("list_secrets", { query: "nonexistent_query_xyz" });
    const data = JSON.parse(result.content[0].text);
    assert.equal(data.totalCount, 0);
  });

  it("get_secret redacts sensitive fields", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const result = mcpCall("get_secret", { id: TEST_SECRET_ID });
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.name);
    const sensitive = ["password", "cardNumber", "cvvCode", "credentials", "privateKey", "secureNote"];
    for (const field of sensitive) {
      if (field in data && data[field] != null) {
        assert.equal(data[field], "••••••••", `${field} should be redacted`);
      }
    }
  });

  it("get_totp_code returns code and validity", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_TOTP_SECRET_ID) { t.skip("TEST_TOTP_SECRET_ID not set"); return; }
    const result = mcpCall("get_totp_code", { id: TEST_TOTP_SECRET_ID });
    const data = JSON.parse(result.content[0].text);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.ok(data[0].code);
    assert.ok(typeof data[0].validityStart === "number");
    assert.ok(typeof data[0].validityEnd === "number");
  });

  it("get_current_user returns user with email", (t) => {
    if (skipUnlessAuth(t)) return;
    const result = mcpCall("get_current_user", {});
    const data = JSON.parse(result.content[0].text);
    assert.ok(data.email);
  });
});
