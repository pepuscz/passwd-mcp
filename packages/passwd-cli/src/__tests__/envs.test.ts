import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanTokenFiles, resolveEnv } from "../util/envs.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "passwd-test-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("scanTokenFiles", () => {
  it("reads valid token files", async () => {
    await writeFile(
      join(tmpDir, "tokens-abc.json"),
      JSON.stringify({ origin: "https://dev.passwd.team", saved_at: 1000 }),
    );
    const results = await scanTokenFiles(tmpDir);
    assert.equal(results.length, 1);
    assert.equal(results[0].origin, "https://dev.passwd.team");
    assert.equal(results[0].savedAt, 1000);
  });

  it("skips non-token files", async () => {
    await writeFile(join(tmpDir, "other.json"), "{}");
    await writeFile(join(tmpDir, "tokens-a.json"), JSON.stringify({ origin: "https://a.passwd.team" }));
    const results = await scanTokenFiles(tmpDir);
    assert.equal(results.length, 1);
  });

  it("skips corrupt JSON", async () => {
    await writeFile(join(tmpDir, "tokens-bad.json"), "not json{{{");
    await writeFile(join(tmpDir, "tokens-ok.json"), JSON.stringify({ origin: "https://ok.passwd.team" }));
    const results = await scanTokenFiles(tmpDir);
    assert.equal(results.length, 1);
    assert.equal(results[0].origin, "https://ok.passwd.team");
  });

  it("skips token files without origin", async () => {
    await writeFile(join(tmpDir, "tokens-nope.json"), JSON.stringify({ access_token: "abc" }));
    const results = await scanTokenFiles(tmpDir);
    assert.equal(results.length, 0);
  });

  it("returns empty for nonexistent directory", async () => {
    const results = await scanTokenFiles("/nonexistent/path");
    assert.equal(results.length, 0);
  });
});

describe("resolveEnv", () => {
  beforeEach(async () => {
    await writeFile(
      join(tmpDir, "tokens-1.json"),
      JSON.stringify({ origin: "https://dev.passwd.team" }),
    );
    await writeFile(
      join(tmpDir, "tokens-2.json"),
      JSON.stringify({ origin: "https://staging.passwd.team" }),
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
