import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { skipUnlessAuth, runCli, TEST_SECRET_ID, TEST_TOTP_SECRET_ID } from "./helpers.js";

describe("passwd-agent-cli integration", () => {
  it("list --json returns JSON with totalCount", (t) => {
    if (skipUnlessAuth(t)) return;
    const { stdout, code } = runCli("passwd-agent-cli", ["list", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(typeof data.totalCount === "number");
    assert.ok(Array.isArray(data.secrets));
  });

  it("list -q filters results", (t) => {
    if (skipUnlessAuth(t)) return;
    const { stdout, code } = runCli("passwd-agent-cli", ["list", "-q", "nonexistent_query_xyz", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.equal(data.totalCount, 0);
  });

  it("get <id> --json returns redacted secret", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-agent-cli", ["get", TEST_SECRET_ID, "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(data.name);
    // All sensitive fields that are present should be redacted
    const sensitive = ["password", "cardNumber", "cvvCode", "credentials", "privateKey", "secureNote"];
    for (const field of sensitive) {
      if (field in data && data[field] != null) {
        assert.equal(data[field], "••••••••", `${field} should be redacted`);
      }
    }
  });

  it("get <id> without --json still outputs redacted JSON", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-agent-cli", ["get", TEST_SECRET_ID]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(data.name);
  });

  it("totp <id> returns code and validity window", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_TOTP_SECRET_ID) { t.skip("TEST_TOTP_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-agent-cli", ["totp", TEST_TOTP_SECRET_ID]);
    assert.equal(code, 0);
    assert.ok(stdout.trim().length > 0);
  });

  it("whoami --json returns email and name", (t) => {
    if (skipUnlessAuth(t)) return;
    const { stdout, code } = runCli("passwd-agent-cli", ["whoami", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(data.email);
    assert.ok(data.name);
  });

  it("envs --json returns array", (t) => {
    if (skipUnlessAuth(t)) return;
    const { stdout, code } = runCli("passwd-agent-cli", ["envs", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(Array.isArray(data));
  });

  it("exec --inject masks secret values in stdout", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-agent-cli", [
      "exec", "--inject", `MY_VAR=${TEST_SECRET_ID}:password`, "--", "sh", "-c", "echo $MY_VAR",
    ]);
    assert.equal(code, 0);
    assert.ok(stdout.includes("<concealed by passwd>"), "Secret should be masked");
  });

  it("exec --inject masks even non-sensitive field values", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-agent-cli", [
      "exec", "--inject", `MY_VAR=${TEST_SECRET_ID}:name`, "--", "sh", "-c", "echo $MY_VAR",
    ]);
    assert.equal(code, 0);
    assert.ok(stdout.includes("<concealed by passwd>"), "Agent CLI should mask all injected values");
  });

  it("--help does NOT contain dangerous commands", (t) => {
    const { stdout } = runCli("passwd-agent-cli", ["--help"]);
    for (const cmd of ["create", "update", "delete", "share"]) {
      assert.ok(!stdout.includes(cmd), `Help should not contain "${cmd}"`);
    }
  });

  it("get --help does NOT contain --field", (t) => {
    const { stdout } = runCli("passwd-agent-cli", ["get", "--help"]);
    assert.ok(!stdout.includes("--field"), "get help should not contain --field");
  });

  it("exec --help does NOT contain --no-masking", (t) => {
    const { stdout } = runCli("passwd-agent-cli", ["exec", "--help"]);
    assert.ok(!stdout.includes("--no-masking"), "exec help should not contain --no-masking");
  });
});
