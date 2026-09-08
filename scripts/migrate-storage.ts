import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { list } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, r2PublicUrl } from "../src/server/services/image-storage";

type Row = { id: string; body_html: string; image_urls: string[]; image_blob_paths: string[]; updated_at: string };
type FileRecord = { pathname: string; url: string; size: number; sha256: string; localFile: string; contentType: string };
type Manifest = { preparedAt: string; rows: Row[]; files: FileRecord[] };

const mode = process.argv[2] ?? "prepare";
const directory = resolve(process.env.MIGRATION_BACKUP_DIR ?? ".migration");
const manifestPath = resolve(directory, "manifest.json");
const sql = neon(process.env.DATABASE_URL!);
const digest = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");

async function prepare() {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const rows = await sql`SELECT id, body_html, image_urls, image_blob_paths, updated_at FROM announcements ORDER BY id` as Row[];
  const files: FileRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const referenced = rows.some(row => row.image_urls.includes(blob.url) || row.image_blob_paths.includes(blob.pathname) || row.image_blob_paths.includes(blob.url) || row.body_html.includes(blob.url));
      if (!referenced) continue;
      const url = new URL(blob.url);
      if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) throw new Error("Unexpected source host");
      const response = await fetch(url, { redirect: "error" });
      if (!response.ok) throw new Error(`Source download failed (${response.status})`);
      const data = new Uint8Array(await response.arrayBuffer());
      if (data.length !== blob.size) throw new Error("Source size mismatch");
      const sha256 = digest(data);
      const localFile = sha256 + ".bin";
      await writeFile(resolve(directory, localFile), data, { mode: 0o600 });
      files.push({ pathname: blob.pathname, url: blob.url, size: data.length, sha256, localFile, contentType: response.headers.get("content-type") ?? "application/octet-stream" });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  await writeFile(manifestPath, JSON.stringify({ preparedAt: new Date().toISOString(), rows, files } satisfies Manifest, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ mode, rows: rows.length, files: files.length, bytes: files.reduce((sum, file) => sum + file.size, 0) }));
}

async function readManifest(): Promise<Manifest> { return JSON.parse(await readFile(manifestPath, "utf8")); }

async function copy() {
  const manifest = await readManifest();
  const client = r2Client();
  const Bucket = process.env.R2_BUCKET_NAME;
  if (!Bucket) throw new Error("R2_BUCKET_NAME is required");
  for (const file of manifest.files) {
    const data = await readFile(resolve(directory, file.localFile));
    if (digest(data) !== file.sha256) throw new Error("Backup checksum mismatch");
    await client.send(new PutObjectCommand({ Bucket, Key: file.pathname, Body: data, ContentType: file.contentType, CacheControl: "public, max-age=31536000, immutable" }));
    const remote = await client.send(new GetObjectCommand({ Bucket, Key: file.pathname }));
    if (!remote.Body || digest(await remote.Body.transformToByteArray()) !== file.sha256) throw new Error("R2 checksum mismatch");
  }
  await writeFile(resolve(directory, "verified.json"), JSON.stringify({ manifestSha256: digest(await readFile(manifestPath)), verifiedAt: new Date().toISOString() }), { mode: 0o600 });
  console.log(JSON.stringify({ mode, verifiedFiles: manifest.files.length }));
}

async function rewrite() {
  if (process.env.MIGRATION_WRITES_PAUSED !== "1") throw new Error("Pause announcement writes on both deployments before setting MIGRATION_WRITES_PAUSED=1");
  const manifest = await readManifest();
  const verification = JSON.parse(await readFile(resolve(directory, "verified.json"), "utf8"));
  if (verification.manifestSha256 !== digest(await readFile(manifestPath))) throw new Error("Copy and verify this exact manifest first");
  const urls = new Map(manifest.files.map(file => [file.url, r2PublicUrl(file.pathname)]));
  const paths = new Map(manifest.files.map(file => [file.pathname, `r2:${file.pathname}`]));
  const current = await sql`SELECT id, body_html, image_urls, image_blob_paths, updated_at FROM announcements ORDER BY id` as Row[];
  if (JSON.stringify(current) !== JSON.stringify(manifest.rows)) throw new Error("Announcements changed. Pause writes, prepare a fresh snapshot and copy again.");
  const queries = manifest.rows.map(row => {
    let body = row.body_html;
    for (const [before, after] of urls) body = body.split(before).join(after);
    const imageUrls = row.image_urls.map(url => urls.get(url) ?? url);
    const imagePaths = row.image_blob_paths.map(path => paths.get(path) ?? (urls.has(path) ? `r2:${manifest.files.find(file => file.url === path)!.pathname}` : path));
    return sql`UPDATE announcements SET body_html=${body}, image_urls=${imageUrls}, image_blob_paths=${imagePaths} WHERE id=${row.id}`;
  });
  // Lock before checking the snapshot so a concurrent edit cannot be overwritten.
  // Any changed, added or deleted row aborts the entire transaction.
  const guards = manifest.rows.map(row => sql`
    SELECT 1 / CASE WHEN EXISTS (
      SELECT 1 FROM announcements WHERE id=${row.id}
      AND body_html IS NOT DISTINCT FROM ${row.body_html}
      AND image_urls IS NOT DISTINCT FROM ${row.image_urls}
      AND image_blob_paths IS NOT DISTINCT FROM ${row.image_blob_paths}
      AND updated_at IS NOT DISTINCT FROM ${row.updated_at}::timestamptz
    ) THEN 1 ELSE 0 END AS snapshot_matches`);
  await sql.transaction([
    sql`LOCK TABLE announcements IN EXCLUSIVE MODE`,
    sql`SELECT 1 / CASE WHEN count(*)=${manifest.rows.length} THEN 1 ELSE 0 END AS row_count_matches FROM announcements`,
    ...guards,
    ...queries,
  ]);
  console.log(JSON.stringify({ mode, updatedRows: queries.length, sourceDeleted: false }));
}

if (mode === "prepare") await prepare();
else if (mode === "copy") await copy();
else if (mode === "rewrite") await rewrite();
else throw new Error("Usage: tsx scripts/migrate-storage.ts prepare|copy|rewrite");
