import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { guessMime } from "../util/mime.js";

describe("guessMime", () => {
  it("maps txt to text/plain", () => {
    assert.equal(guessMime("txt"), "text/plain");
  });

  it("maps pdf to application/pdf", () => {
    assert.equal(guessMime("pdf"), "application/pdf");
  });

  it("maps png to image/png", () => {
    assert.equal(guessMime("png"), "image/png");
  });

  it("maps jpg to image/jpeg", () => {
    assert.equal(guessMime("jpg"), "image/jpeg");
  });

  it("maps jpeg to image/jpeg", () => {
    assert.equal(guessMime("jpeg"), "image/jpeg");
  });

  it("maps gif to image/gif", () => {
    assert.equal(guessMime("gif"), "image/gif");
  });

  it("maps json to application/json", () => {
    assert.equal(guessMime("json"), "application/json");
  });

  it("maps xml to application/xml", () => {
    assert.equal(guessMime("xml"), "application/xml");
  });

  it("maps csv to text/csv", () => {
    assert.equal(guessMime("csv"), "text/csv");
  });

  it("maps zip to application/zip", () => {
    assert.equal(guessMime("zip"), "application/zip");
  });

  it("is case-insensitive", () => {
    assert.equal(guessMime("PNG"), "image/png");
    assert.equal(guessMime("Jpg"), "image/jpeg");
    assert.equal(guessMime("PDF"), "application/pdf");
  });

  it("returns application/octet-stream for unknown extensions", () => {
    assert.equal(guessMime("docx"), "application/octet-stream");
    assert.equal(guessMime("exe"), "application/octet-stream");
    assert.equal(guessMime("bin"), "application/octet-stream");
  });

  it("returns application/octet-stream for empty string", () => {
    assert.equal(guessMime(""), "application/octet-stream");
  });
});
