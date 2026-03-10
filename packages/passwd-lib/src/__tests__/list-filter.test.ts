import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterAndPaginate } from "../api.js";
import type { SecretListItem } from "../types.js";

const secrets: SecretListItem[] = [
  { id: "1", name: "GitHub", type: "password", username: "alice", web: "https://github.com" },
  { id: "2", name: "AWS Console", type: "apiCredentials", username: "bob" },
  { id: "3", name: "Stripe API", type: "apiCredentials", username: "charlie", web: "https://stripe.com" },
  { id: "4", name: "Production DB", type: "databaseCredentials" },
  { id: "5", name: "Deploy Key", type: "sshKey" },
];

describe("filterAndPaginate", () => {
  it("returns all secrets with no filters", () => {
    const result = filterAndPaginate(secrets);
    assert.equal(result.totalCount, 5);
    assert.equal(result.secrets.length, 5);
  });

  it("filters by query (case-insensitive match on name)", () => {
    const result = filterAndPaginate(secrets, { query: "github" });
    assert.equal(result.totalCount, 1);
    assert.equal(result.secrets[0].id, "1");
  });

  it("filters by query matching username", () => {
    const result = filterAndPaginate(secrets, { query: "ALICE" });
    assert.equal(result.totalCount, 1);
    assert.equal(result.secrets[0].id, "1");
  });

  it("filters by query matching web", () => {
    const result = filterAndPaginate(secrets, { query: "stripe.com" });
    assert.equal(result.totalCount, 1);
    assert.equal(result.secrets[0].id, "3");
  });

  it("filters by secretType", () => {
    const result = filterAndPaginate(secrets, { secretType: "apiCredentials" });
    assert.equal(result.totalCount, 2);
    assert.deepEqual(result.secrets.map((s) => s.id), ["2", "3"]);
  });

  it("combines query + secretType", () => {
    const result = filterAndPaginate(secrets, { query: "stripe", secretType: "apiCredentials" });
    assert.equal(result.totalCount, 1);
    assert.equal(result.secrets[0].id, "3");
  });

  it("paginates with limit", () => {
    const result = filterAndPaginate(secrets, { limit: 2 });
    assert.equal(result.totalCount, 5);
    assert.equal(result.secrets.length, 2);
    assert.deepEqual(result.secrets.map((s) => s.id), ["1", "2"]);
  });

  it("paginates with offset", () => {
    const result = filterAndPaginate(secrets, { offset: 3 });
    assert.equal(result.totalCount, 5);
    assert.equal(result.secrets.length, 2);
    assert.deepEqual(result.secrets.map((s) => s.id), ["4", "5"]);
  });

  it("paginates with offset + limit", () => {
    const result = filterAndPaginate(secrets, { offset: 1, limit: 2 });
    assert.equal(result.totalCount, 5);
    assert.equal(result.secrets.length, 2);
    assert.deepEqual(result.secrets.map((s) => s.id), ["2", "3"]);
  });

  it("returns empty when nothing matches", () => {
    const result = filterAndPaginate(secrets, { query: "nonexistent" });
    assert.equal(result.totalCount, 0);
    assert.equal(result.secrets.length, 0);
  });

  it("handles empty input array", () => {
    const result = filterAndPaginate([]);
    assert.equal(result.totalCount, 0);
    assert.equal(result.secrets.length, 0);
  });
});
