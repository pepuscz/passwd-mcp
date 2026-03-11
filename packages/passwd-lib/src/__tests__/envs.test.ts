import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { listEnvironments, resolveEnv } from "../envs.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "passwd-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("listEnvironments", () => {
  it("reads environments.json", async () => {
    await writeFile(
      join(tmpDir, "environments.json"),
      JSON.stringify([
        { origin: "https://dev.passwd.team", savedAt: 1000 },
        { origin: "https://staging.passwd.team", savedAt: 2000 },
      ]),
    );
    const results = await listEnvironments(tmpDir);
    assert.equal(results.length, 2);
    assert.equal(results[0].origin, "https://dev.passwd.team");
    assert.equal(results[0].savedAt, 1000);
  });

  it("returns empty for missing file", async () => {
    const results = await listEnvironments(tmpDir);
    assert.equal(results.length, 0);
  });

  it("returns empty for corrupt JSON", async () => {
    await writeFile(join(tmpDir, "environments.json"), "not json{{{");
    const results = await listEnvironments(tmpDir);
    assert.equal(results.length, 0);
  });

  it("returns empty for nonexistent directory", async () => {
    const results = await listEnvironments("/nonexistent/path");
    assert.equal(results.length, 0);
  });
});

describe("resolveEnv", () => {
  beforeEach(async () => {
    await writeFile(
      join(tmpDir, "environments.json"),
      JSON.stringify([
        { origin: "https://dev.passwd.team" },
        { origin: "https://staging.passwd.team" },
      ]),
    );
  });

  it("resolves unique substring match", async () => {
    const result = await resolveEnv("dev", tmpDir);
    assert.equal(result, "https://dev.passwd.team");
  });

  it("resolves case-insensitively", async () => {
    const result = await resolveEnv("STAGING", tmpDir);
    assert.equal(result, "https://staging.passwd.team");
  });

  it("throws on zero matches", async () => {
    await assert.rejects(() => resolveEnv("prod", tmpDir), { message: /No environment matching "prod"/ });
  });

  it("throws on ambiguous matches", async () => {
    await assert.rejects(() => resolveEnv("passwd", tmpDir), { message: /Ambiguous match/ });
  });

  it("throws when no environments exist", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "passwd-empty-"));
    try {
      await assert.rejects(() => resolveEnv("anything", emptyDir), { message: /No known environments/ });
    } finally {
      await rm(emptyDir, { recursive: true, force: true });
    }
  });
});
