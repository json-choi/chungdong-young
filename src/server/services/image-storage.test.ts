import { test } from "node:test";
import assert from "node:assert/strict";
import { r2KeyFromReference, r2PublicUrl } from "./image-storage";

process.env.R2_PUBLIC_URL = "https://images.example.test";

test("encodes object paths and resolves owned public image URLs", () => {
  assert.equal(r2PublicUrl("announcements/한글 image.png"), "https://images.example.test/announcements/%ED%95%9C%EA%B8%80%20image.png");
  assert.equal(r2KeyFromReference("https://images.example.test/announcements/a%20b.png"), "announcements/a b.png");
  assert.equal(r2KeyFromReference("r2:announcements/a.png"), "announcements/a.png");
});

test("does not treat a foreign host or Blob URL as an R2 delete target", () => {
  assert.equal(r2KeyFromReference("https://images.example.test.evil.test/announcements/a.png"), null);
  assert.equal(r2KeyFromReference("https://store.public.blob.vercel-storage.com/announcements/a.png"), null);
});

test("rejects traversal and keys outside the announcement prefix", () => {
  for (const ref of ["r2:private/a.png", "r2:announcements/../a.png", "r2:announcements/a?x", "https://images.example.test/announcements/%2e%2e/a.png"]) {
    assert.throws(() => r2KeyFromReference(ref));
  }
});
