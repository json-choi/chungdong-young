// Verify the actual HTML and its CSS/JS after a production deployment.
import assert from "node:assert/strict";

const pageUrl = new URL(process.argv[2]);
assert.equal(pageUrl.protocol, "https:");
const request = (url) => fetch(url, {
  signal: AbortSignal.timeout(30_000),
  headers: { "Cache-Control": "no-cache" },
});
const page = await request(pageUrl);
assert.equal(page.status, 200, "Homepage must respond successfully");
assert.match(page.headers.get("content-type") ?? "", /text\/html/);
const html = await page.text();
const assets = [...new Set(
  [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1].replaceAll("&amp;", "&"), pageUrl))
    .filter((url) => url.origin === pageUrl.origin &&
      url.pathname.startsWith("/_next/static/") &&
      /\.(?:css|m?js)$/.test(url.pathname))
    .map((url) => url.href),
)];
assert(assets.some((url) => new URL(url).pathname.endsWith(".css")), "No stylesheet found");
assert(assets.some((url) => /\.m?js$/.test(new URL(url).pathname)), "No JavaScript found");

const results = await Promise.allSettled(assets.map(async (url) => {
  const response = await request(url);
  assert.equal(response.status, 200, `Asset failed: ${url}`);
  const mime = response.headers.get("content-type") ?? "";
  assert.match(mime, new URL(url).pathname.endsWith(".css")
    ? /text\/css/ : /(?:application|text)\/(?:java|ecma)script/,
    `Incorrect asset content type: ${url}`);
  assert((await response.arrayBuffer()).byteLength > 0, `Empty asset: ${url}`);
}));
const failures = results.filter((result) => result.status === "rejected");
for (const failure of failures) console.error(failure.reason.message);
assert.equal(failures.length, 0, "Production CSS/JavaScript verification failed");
console.log(`Verified ${pageUrl.origin}: HTML and ${assets.length} CSS/JavaScript assets`);
