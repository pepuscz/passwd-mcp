import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = resolve(__dirname, "../../dist/index.js");

function run(...args: string[]): string {
  return execFileSync("node", [bin, ...args], {
    encoding: "utf-8",
    env: { ...process.env, PASSWD_ORIGIN: "https://test.passwd.team" },
    timeout: 5000,
  });
}

describe("agent-cli security boundaries", () => {
  it("help lists only safe commands", () => {
    const help = run("--help");
    // Must have these
    for (const cmd of ["login", "whoami", "list", "get", "totp", "exec", "envs"]) {
      assert.ok(help.includes(cmd), `Expected command "${cmd}" in help`);
    }
    // Must NOT have these
    for (const cmd of ["create", "update", "delete", "share", "groups", "contacts"]) {
      assert.ok(!help.includes(cmd), `Dangerous command "${cmd}" should not appear in help`);
    }
  });

  it("get command has no --field option", () => {
    const help = run("get", "--help");
    assert.ok(!help.includes("--field"), "get should not have --field option");
  });

  it("exec command has no --no-masking option", () => {
    const help = run("exec", "--help");
    assert.ok(!help.includes("--no-masking"), "exec should not have --no-masking option");
    assert.ok(!help.includes("--masking"), "exec should not have --masking option");
  });
});
