import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatError, formatJson, formatSecretRow } from "../util/format.js";
import type { SecretListItem } from "@passwd/passwd-lib";

describe("formatError", () => {
  it("extracts message from Error instance", () => {
    assert.equal(formatError(new Error("oops")), "oops");
  });

  it("converts string to string", () => {
    assert.equal(formatError("plain string"), "plain string");
  });

  it("converts other types via String()", () => {
    assert.equal(formatError(42), "42");
    assert.equal(formatError(null), "null");
  });
});

describe("formatJson", () => {
  it("pretty-prints object with 2-space indent", () => {
    const result = formatJson({ a: 1, b: "two" });
    assert.equal(result, JSON.stringify({ a: 1, b: "two" }, null, 2));
  });

  it("handles arrays", () => {
    const result = formatJson([1, 2, 3]);
    assert.equal(result, JSON.stringify([1, 2, 3], null, 2));
  });
});

describe("formatSecretRow", () => {
  it("formats tab-separated row with all fields", () => {
    const s: SecretListItem = { id: "abc", type: "password", name: "GitHub", username: "user", web: "https://gh.com" };
    assert.equal(formatSecretRow(s), "abc\tpassword\tGitHub\tuser\thttps://gh.com");
  });

  it("omits missing username and web", () => {
    const s: SecretListItem = { id: "xyz", type: "sshKey", name: "Key" };
    assert.equal(formatSecretRow(s), "xyz\tsshKey\tKey");
  });

  it("includes username but omits web", () => {
    const s: SecretListItem = { id: "1", type: "password", name: "Test", username: "admin" };
    assert.equal(formatSecretRow(s), "1\tpassword\tTest\tadmin");
  });
});
