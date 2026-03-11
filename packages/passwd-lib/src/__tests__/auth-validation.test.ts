import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requireHttps } from "../auth.js";

describe("requireHttps", () => {
  it("accepts HTTPS URLs", () => {
    assert.doesNotThrow(() => requireHttps("https://example.com", "test"));
    assert.doesNotThrow(() => requireHttps("https://my.passwd.team", "test"));
    assert.doesNotThrow(() => requireHttps("https://localhost:3000", "test"));
  });

  it("accepts http://localhost for development", () => {
    assert.doesNotThrow(() => requireHttps("http://localhost", "test"));
    assert.doesNotThrow(() => requireHttps("http://localhost:3000", "test"));
    assert.doesNotThrow(() => requireHttps("http://localhost:8080/path", "test"));
  });

  it("accepts http://127.0.0.1 for development", () => {
    assert.doesNotThrow(() => requireHttps("http://127.0.0.1", "test"));
    assert.doesNotThrow(() => requireHttps("http://127.0.0.1:3000", "test"));
    assert.doesNotThrow(() => requireHttps("http://127.0.0.1:8080/path", "test"));
  });

  it("rejects plain HTTP URLs", () => {
    assert.throws(
      () => requireHttps("http://example.com", "MY_VAR"),
      { message: /MY_VAR must use HTTPS/ },
    );
  });

  it("rejects HTTP with non-localhost hostnames", () => {
    assert.throws(
      () => requireHttps("http://my-server.com", "Origin"),
      { message: /Origin must use HTTPS/ },
    );
  });

  it("includes the offending URL in error message", () => {
    assert.throws(
      () => requireHttps("http://bad.example.com", "test"),
      { message: /http:\/\/bad\.example\.com/ },
    );
  });

  it("rejects non-HTTP protocols", () => {
    assert.throws(
      () => requireHttps("ftp://example.com", "test"),
      { message: /must use HTTPS/ },
    );
  });

  it("rejects empty string", () => {
    assert.throws(
      () => requireHttps("", "test"),
      { message: /must use HTTPS/ },
    );
  });
});
