import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMapping, shellQuote, buildMcpCommand } from "../commands/mcp-wrap.js";

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

describe("shellQuote", () => {
  it("wraps simple strings in single quotes", () => {
    assert.equal(shellQuote("hello"), "'hello'");
  });

  it("escapes single quotes", () => {
    assert.equal(shellQuote("it's"), "'it'\\''s'");
  });

  it("handles empty string", () => {
    assert.equal(shellQuote(""), "''");
  });

  it("preserves special characters inside single quotes", () => {
    assert.equal(shellQuote("$HOME & ; | `cmd`"), "'$HOME & ; | `cmd`'");
  });
});

describe("buildMcpCommand", () => {
  it("puts credentials in env vars, not in the command string", () => {
    const { cmd, envVars } = buildMcpCommand(
      "https://mcp.example.com/mcp",
      ["x-api-key", "x-secret"],
      ["supersecretvalue123", "anothersecret456"],
    );
    // Command must NOT contain actual credential values
    assert.ok(!cmd.includes("supersecretvalue123"), "credential 1 must not appear in cmd");
    assert.ok(!cmd.includes("anothersecret456"), "credential 2 must not appear in cmd");
    // Command should reference env vars instead
    assert.ok(cmd.includes("$_PASSWD_HDR_0"), "cmd should reference $_PASSWD_HDR_0");
    assert.ok(cmd.includes("$_PASSWD_HDR_1"), "cmd should reference $_PASSWD_HDR_1");
    // Env vars should contain the actual values
    assert.equal(envVars._PASSWD_HDR_0, "supersecretvalue123");
    assert.equal(envVars._PASSWD_HDR_1, "anothersecret456");
  });

  it("includes URL and header names in command", () => {
    const { cmd } = buildMcpCommand(
      "https://mcp.example.com/mcp",
      ["x-api-key"],
      ["secret"],
    );
    assert.ok(cmd.includes("mcp.example.com/mcp"), "cmd should include URL");
    assert.ok(cmd.includes("x-api-key"), "cmd should include header name");
    assert.ok(cmd.includes("mcp-remote"), "cmd should invoke mcp-remote");
  });

  it("shell-quotes the URL", () => {
    const { cmd } = buildMcpCommand(
      "https://mcp.example.com/path with spaces",
      ["h"],
      ["v"],
    );
    assert.ok(cmd.includes("'https://mcp.example.com/path with spaces'"));
  });

  it("handles single header", () => {
    const { cmd, envVars } = buildMcpCommand("https://u", ["h"], ["v"]);
    assert.ok(cmd.includes("$_PASSWD_HDR_0"));
    assert.equal(Object.keys(envVars).length, 1);
  });
});
