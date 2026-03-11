import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { skipUnlessAuth, runCli, mcpCall } from "./helpers.js";

/**
 * CRUD lifecycle integration tests — all 6 secret types.
 *
 * Tests the full tool round-trip: CLI create → CLI/agent-CLI/MCP read → CLI update → CLI delete.
 * Every test uses our tools (passwd-cli, passwd-agent-cli, MCP), never the API directly.
 *
 * Per-type fields tested (from passwd frontend Zod schemas):
 *   password:            username, web, password, TOTP, note, tags, groups, whitelistUsers
 *   paymentCard:         cardNumber, cvvCode, expirationDate, cardholderName
 *   apiCredentials:      username, credentials, hostname
 *   databaseCredentials: username, password, databaseName, databaseType, server, port
 *   sshKey:              privateKey, publicKey
 *   secureNote:          secureNote
 */

// IDs of secrets created during setup — one per type
let passwordId = "";
let cardId = "";
let apiCredId = "";
let dbCredId = "";
let sshKeyId = "";
let noteId = "";
let authAvailable = false;

// Discovered dynamically in before()
let groupId = "";
let contactId = "";

const TOTP_SEED = "JBSWY3DPEHPK3PXP";

describe("lifecycle: CRUD + TOTP", () => {
  before(async () => {
    if (!process.env.PASSWD_ORIGIN) return;
    authAvailable = true;

    // Discover a group ID and a contact ID for permission tests
    try {
      const gr = runCli("passwd-cli", ["groups", "--json"]);
      if (gr.code === 0) {
        const groups = JSON.parse(gr.stdout);
        if (groups.length > 0) groupId = groups[0].id;
      }
    } catch { /* skip group tests if discovery fails */ }

    try {
      const me = runCli("passwd-cli", ["whoami", "--json"]);
      const myId = me.code === 0 ? JSON.parse(me.stdout).id : "";
      const co = runCli("passwd-cli", ["contacts", "--json"]);
      if (co.code === 0) {
        const contacts = JSON.parse(co.stdout);
        const other = contacts.find((c: any) => c.id !== myId);
        if (other) contactId = other.id;
      }
    } catch { /* skip user tests if discovery fails */ }

    // 1. password — all CLI flags
    const pwArgs = [
      "create", "-t", "password",
      "-n", "Test Password Lifecycle",
      "--username", "testuser",
      "--password", "testpass123",
      "--web", "https://example.com",
      "--note", "test note",
      "--tags", "test", "ci",
      "--totp", TOTP_SEED,
    ];
    if (groupId) pwArgs.push("--group", `${groupId}:read`);
    if (contactId) pwArgs.push("--user", `${contactId}:read`);
    const pw = runCli("passwd-cli", pwArgs);
    assert.equal(pw.code, 0, `create password failed: ${pw.stderr}`);
    passwordId = JSON.parse(pw.stdout).id;
    assert.ok(passwordId);

    // 2. paymentCard — cardNumber + cvvCode + expirationDate + cardholderName
    const card = runCli("passwd-cli", [
      "create", "-t", "paymentCard",
      "-n", "Test Card Lifecycle",
      "--card-number", "4111111111111111",
      "--cvv-code", "123",
      "--expiration-date", "12/30",
      "--cardholder-name", "Test Holder",
      "--note", "card note",
    ]);
    assert.equal(card.code, 0, `create paymentCard failed: ${card.stderr}`);
    cardId = JSON.parse(card.stdout).id;
    assert.ok(cardId);

    // 3. apiCredentials — credentials + hostname
    const api = runCli("passwd-cli", [
      "create", "-t", "apiCredentials",
      "-n", "Test API Lifecycle",
      "--username", "apiuser",
      "--credentials", "sk_live_testapikey789",
      "--hostname", "api.example.com",
      "--note", "api note",
    ]);
    assert.equal(api.code, 0, `create apiCredentials failed: ${api.stderr}`);
    apiCredId = JSON.parse(api.stdout).id;
    assert.ok(apiCredId);

    // 4. databaseCredentials — password + databaseName + databaseType + server + port
    const db = runCli("passwd-cli", [
      "create", "-t", "databaseCredentials",
      "-n", "Test DB Lifecycle",
      "--username", "dbadmin",
      "--password", "dbpass456",
      "--database-name", "testdb",
      "--database-type", "postgresql",
      "--server", "db.example.com",
      "--port", "5432",
      "--note", "db note",
    ]);
    assert.equal(db.code, 0, `create databaseCredentials failed: ${db.stderr}`);
    dbCredId = JSON.parse(db.stdout).id;
    assert.ok(dbCredId);

    // 5. sshKey — privateKey + publicKey
    const ssh = runCli("passwd-cli", [
      "create", "-t", "sshKey",
      "-n", "Test SSH Lifecycle",
      "--private-key", "-----BEGIN OPENSSH PRIVATE KEY-----\ntestkey\n-----END OPENSSH PRIVATE KEY-----",
      "--public-key", "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest test@test",
      "--note", "ssh note",
    ]);
    assert.equal(ssh.code, 0, `create sshKey failed: ${ssh.stderr}`);
    sshKeyId = JSON.parse(ssh.stdout).id;
    assert.ok(sshKeyId);

    // 6. secureNote — secureNote
    const note = runCli("passwd-cli", [
      "create", "-t", "secureNote",
      "-n", "Test Note Lifecycle",
      "--secure-note", "confidential content",
    ]);
    assert.equal(note.code, 0, `create secureNote failed: ${note.stderr}`);
    noteId = JSON.parse(note.stdout).id;
    assert.ok(noteId);
  });

  after(() => {
    if (passwordId) runCli("passwd-cli", ["delete", passwordId, "-y"]);
    if (cardId) runCli("passwd-cli", ["delete", cardId, "-y"]);
    if (apiCredId) runCli("passwd-cli", ["delete", apiCredId, "-y"]);
    if (dbCredId) runCli("passwd-cli", ["delete", dbCredId, "-y"]);
    if (sshKeyId) runCli("passwd-cli", ["delete", sshKeyId, "-y"]);
    if (noteId) runCli("passwd-cli", ["delete", noteId, "-y"]);
  });

  // ── Helper: verify same read assertions across all 3 tools ────

  function verifyGet(
    secretId: () => string,
    expected: Record<string, unknown>,
    redactedFields: string[],
    label: string,
  ) {
    it(`full CLI: get ${label}`, (t) => {
      if (!authAvailable) { t.skip("No auth"); return; }
      const { stdout, code } = runCli("passwd-cli", ["get", secretId(), "--json"]);
      assert.equal(code, 0);
      const d = JSON.parse(stdout);
      for (const [k, v] of Object.entries(expected)) assert.equal(d[k], v, `${k} mismatch`);
      for (const f of redactedFields) assert.equal(d[f], "••••••••", `${f} should be redacted`);
    });

    it(`agent CLI: get ${label}`, (t) => {
      if (!authAvailable) { t.skip("No auth"); return; }
      const { stdout, code } = runCli("passwd-agent-cli", ["get", secretId(), "--json"]);
      assert.equal(code, 0);
      const d = JSON.parse(stdout);
      for (const [k, v] of Object.entries(expected)) assert.equal(d[k], v, `${k} mismatch`);
      for (const f of redactedFields) assert.equal(d[f], "••••••••", `${f} should be redacted`);
    });

    it(`MCP: get_secret ${label}`, (t) => {
      if (!authAvailable) { t.skip("No auth"); return; }
      const result = mcpCall("get_secret", { id: secretId() });
      const d = JSON.parse(result.content[0].text);
      for (const [k, v] of Object.entries(expected)) assert.equal(d[k], v, `${k} mismatch`);
      for (const f of redactedFields) assert.equal(d[f], "••••••••", `${f} should be redacted`);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. PASSWORD
  // ═══════════════════════════════════════════════════════════════

  verifyGet(
    () => passwordId,
    { name: "Test Password Lifecycle", username: "testuser", web: "https://example.com", note: "test note" },
    ["password"],
    "password secret",
  );

  it("password: tags round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const d = JSON.parse(runCli("passwd-cli", ["get", passwordId, "--json"]).stdout);
    assert.ok(d.tags.includes("test"));
    assert.ok(d.tags.includes("ci"));
  });

  it("password: groups round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    if (!groupId) { t.skip("No groups available"); return; }
    const d = JSON.parse(runCli("passwd-cli", ["get", passwordId, "--json"]).stdout);
    const match = d.groups.find((g: any) => g.id === groupId);
    assert.ok(match, `group ${groupId} should be present`);
    assert.ok(match.accessPermissions.includes("read"));
  });

  it("password: whitelistUsers round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    if (!contactId) { t.skip("No contacts available"); return; }
    const d = JSON.parse(runCli("passwd-cli", ["get", passwordId, "--json"]).stdout);
    const match = d.whitelistUsers.find((u: any) => u.id === contactId);
    assert.ok(match, `user ${contactId} should be present`);
    assert.ok(match.accessPermissions.includes("read"));
  });

  it("password: --field password returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", passwordId, "--field", "password"]).stdout, "testpass123");
  });

  it("password: --field username returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", passwordId, "--field", "username"]).stdout, "testuser");
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. PAYMENT CARD
  // ═══════════════════════════════════════════════════════════════

  verifyGet(
    () => cardId,
    { name: "Test Card Lifecycle", note: "card note", expirationDate: "12/30", cardholderName: "Test Holder" },
    ["cardNumber", "cvvCode"],
    "paymentCard secret",
  );

  it("paymentCard: --field cardNumber returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", cardId, "--field", "cardNumber"]).stdout, "4111111111111111");
  });

  it("paymentCard: --field cvvCode returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", cardId, "--field", "cvvCode"]).stdout, "123");
  });

  it("paymentCard: --field expirationDate returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", cardId, "--field", "expirationDate"]).stdout, "12/30");
  });

  it("paymentCard: --field cardholderName returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", cardId, "--field", "cardholderName"]).stdout, "Test Holder");
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. API CREDENTIALS
  // ═══════════════════════════════════════════════════════════════

  verifyGet(
    () => apiCredId,
    { name: "Test API Lifecycle", username: "apiuser", note: "api note", hostname: "api.example.com" },
    ["credentials"],
    "apiCredentials secret",
  );

  it("apiCredentials: --field credentials returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", apiCredId, "--field", "credentials"]).stdout, "sk_live_testapikey789");
  });

  it("apiCredentials: --field hostname returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", apiCredId, "--field", "hostname"]).stdout, "api.example.com");
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. DATABASE CREDENTIALS
  // ═══════════════════════════════════════════════════════════════

  verifyGet(
    () => dbCredId,
    { name: "Test DB Lifecycle", username: "dbadmin", note: "db note", databaseName: "testdb", databaseType: "postgresql", server: "db.example.com", port: "5432" },
    ["password"],
    "databaseCredentials secret",
  );

  it("databaseCredentials: --field password returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "password"]).stdout, "dbpass456");
  });

  it("databaseCredentials: --field databaseName returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "databaseName"]).stdout, "testdb");
  });

  it("databaseCredentials: --field databaseType returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "databaseType"]).stdout, "postgresql");
  });

  it("databaseCredentials: --field server returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "server"]).stdout, "db.example.com");
  });

  it("databaseCredentials: --field port returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "port"]).stdout, "5432");
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. SSH KEY
  // ═══════════════════════════════════════════════════════════════

  verifyGet(
    () => sshKeyId,
    { name: "Test SSH Lifecycle", note: "ssh note", publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest test@test" },
    ["privateKey"],
    "sshKey secret",
  );

  it("sshKey: --field privateKey returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const raw = runCli("passwd-cli", ["get", sshKeyId, "--field", "privateKey"]).stdout;
    assert.ok(raw.includes("BEGIN OPENSSH PRIVATE KEY"), "should contain PEM header");
    assert.ok(raw.includes("testkey"), "should contain key body");
  });

  it("sshKey: --field publicKey returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", sshKeyId, "--field", "publicKey"]).stdout, "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest test@test");
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. SECURE NOTE
  // ═══════════════════════════════════════════════════════════════

  verifyGet(
    () => noteId,
    { name: "Test Note Lifecycle" },
    ["secureNote"],
    "secureNote secret",
  );

  it("secureNote: --field secureNote returns exact value", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.equal(runCli("passwd-cli", ["get", noteId, "--field", "secureNote"]).stdout, "confidential content");
  });

  // ═══════════════════════════════════════════════════════════════
  // TOTP — verified across all 3 tools
  // ═══════════════════════════════════════════════════════════════

  it("full CLI: totp returns 6-digit code with validity window", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const codes = JSON.parse(runCli("passwd-cli", ["totp", passwordId, "--json"]).stdout);
    assert.ok(Array.isArray(codes) && codes.length > 0);
    assert.match(codes[0].code, /^\d{6}$/);
    assert.ok(typeof codes[0].validityStart === "number");
    assert.ok(typeof codes[0].validityEnd === "number");
  });

  it("agent CLI: totp returns valid 6-digit code", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    assert.ok(runCli("passwd-agent-cli", ["totp", passwordId]).stdout.match(/^\d{6}/));
  });

  it("MCP: get_totp_code returns valid 6-digit code", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const codes = JSON.parse(mcpCall("get_totp_code", { id: passwordId }).content[0].text);
    assert.ok(Array.isArray(codes) && codes.length > 0);
    assert.match(codes[0].code, /^\d{6}$/);
  });

  // ═══════════════════════════════════════════════════════════════
  // UPDATE — round-trip via CLI
  // ═══════════════════════════════════════════════════════════════

  it("update: note round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", passwordId, "--note", "updated note"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(JSON.parse(runCli("passwd-cli", ["get", passwordId, "--json"]).stdout).note, "updated note");
  });

  it("update: password round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", passwordId, "--password", "newpass999"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", passwordId, "--field", "password"]).stdout, "newpass999");
  });

  it("update: tags round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", passwordId, "--tags", "updated", "newtag"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    const d = JSON.parse(runCli("passwd-cli", ["get", passwordId, "--json"]).stdout);
    assert.ok(d.tags.includes("updated"));
    assert.ok(d.tags.includes("newtag"));
    assert.ok(!d.tags.includes("test"), "old tag should be replaced");
  });

  it("update: hostname round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", apiCredId, "--hostname", "updated.example.com"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", apiCredId, "--field", "hostname"]).stdout, "updated.example.com");
  });

  it("update: expirationDate round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", cardId, "--expiration-date", "06/28"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", cardId, "--field", "expirationDate"]).stdout, "06/28");
  });

  it("update: cardholderName round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", cardId, "--cardholder-name", "Updated Holder"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", cardId, "--field", "cardholderName"]).stdout, "Updated Holder");
  });

  it("update: databaseName round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", dbCredId, "--database-name", "updateddb"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "databaseName"]).stdout, "updateddb");
  });

  it("update: databaseType round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", dbCredId, "--database-type", "mysql"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "databaseType"]).stdout, "mysql");
  });

  it("update: server round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", dbCredId, "--server", "updated.db.example.com"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "server"]).stdout, "updated.db.example.com");
  });

  it("update: port round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", dbCredId, "--port", "3306"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", dbCredId, "--field", "port"]).stdout, "3306");
  });

  it("update: publicKey round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", sshKeyId, "--public-key", "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIUpdated updated@test"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(runCli("passwd-cli", ["get", sshKeyId, "--field", "publicKey"]).stdout, "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIUpdated updated@test");
  });

  it("update: web round-trip", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const upd = runCli("passwd-cli", ["update", passwordId, "--web", "https://updated.example.com"]);
    assert.equal(upd.code, 0, `update failed: ${upd.stderr}`);
    assert.equal(JSON.parse(runCli("passwd-cli", ["get", passwordId, "--json"]).stdout).web, "https://updated.example.com");
  });

  // ═══════════════════════════════════════════════════════════════
  // SHARE + REVOKE
  // ═══════════════════════════════════════════════════════════════

  it("share and then revoke", (t) => {
    if (!authAvailable) { t.skip("No auth"); return; }
    const share = runCli("passwd-cli", ["share", passwordId, "--json"]);
    if (share.code !== 0 && share.stderr.includes("403")) {
      t.skip("Sharing not authorized for this account");
      return;
    }
    assert.equal(share.code, 0, `share failed: ${share.stderr}`);
    assert.ok(JSON.parse(share.stdout).shareId, "Should return shareId");

    const revoke = runCli("passwd-cli", ["share", passwordId, "--revoke"]);
    assert.equal(revoke.code, 0, `revoke failed: ${revoke.stderr}`);
    assert.ok(revoke.stdout.includes("revoked"));
  });
});
