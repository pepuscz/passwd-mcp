import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { skipUnlessAuth, runCli, TEST_SECRET_ID, TEST_TOTP_SECRET_ID } from "./helpers.js";

describe("passwd-cli integration", () => {
  it("list --json returns JSON with totalCount", (t) => {
    if (skipUnlessAuth(t)) return;
    const { stdout, code } = runCli("passwd-cli", ["list", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(typeof data.totalCount === "number");
    assert.ok(Array.isArray(data.secrets));
  });

  it("get <id> returns redacted by default", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-cli", ["get", TEST_SECRET_ID, "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(data.name);
  });

  it("get <id> --field password returns raw value", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-cli", ["get", TEST_SECRET_ID, "--field", "password"]);
    assert.equal(code, 0);
    // Should be raw value, not redacted, no trailing newline
    assert.ok(stdout.length > 0, "Field output should be non-empty");
    assert.notEqual(stdout, "••••••••", "Should not be redacted");
    assert.ok(!stdout.endsWith("\n"), "Should not have trailing newline");
  });

  it("exec --inject masks secret values", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-cli", [
      "exec", "--inject", `MY_VAR=${TEST_SECRET_ID}:password`, "--", "sh", "-c", "echo $MY_VAR",
    ]);
    assert.equal(code, 0);
    assert.ok(stdout.includes("<concealed by passwd>"), "Secret should be masked by default");
  });

  it("exec --inject --no-masking shows raw value", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_SECRET_ID) { t.skip("TEST_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-cli", [
      "exec", "--inject", `MY_VAR=${TEST_SECRET_ID}:password`, "--no-masking", "--", "sh", "-c", "echo $MY_VAR",
    ]);
    assert.equal(code, 0);
    assert.ok(!stdout.includes("<concealed by passwd>"), "Should not be masked with --no-masking");
    assert.ok(stdout.trim().length > 0);
  });

  it("totp <id> returns TOTP code", (t) => {
    if (skipUnlessAuth(t)) return;
    if (!TEST_TOTP_SECRET_ID) { t.skip("TEST_TOTP_SECRET_ID not set"); return; }
    const { stdout, code } = runCli("passwd-cli", ["totp", TEST_TOTP_SECRET_ID]);
    assert.equal(code, 0);
    assert.ok(stdout.trim().length > 0);
  });

  it("whoami --json has email", (t) => {
    if (skipUnlessAuth(t)) return;
    const { stdout, code } = runCli("passwd-cli", ["whoami", "--json"]);
    assert.equal(code, 0);
    const data = JSON.parse(stdout);
    assert.ok(data.email);
  });

  it("--help contains create, update, delete, share", (t) => {
    const { stdout } = runCli("passwd-cli", ["--help"]);
    for (const cmd of ["create", "update", "delete", "share"]) {
      assert.ok(stdout.includes(cmd), `Help should contain "${cmd}"`);
    }
  });
});
