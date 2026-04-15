/**
 * One-shot migration runner for 0001_multi_image_gallery.sql.
 *
 * Usage:
 *   pnpm tsx --env-file=.env scripts/migrate-multi-image.ts
 *   DATABASE_URL="..." pnpm tsx scripts/migrate-multi-image.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "../src/server/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const file = resolve(__dirname, "../drizzle/0001_multi_image_gallery.sql");
  const raw = readFileSync(file, "utf8");

  // Strip line comments first, then split on semicolons
  const cleaned = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Running ${statements.length} statement(s)...`);

  for (const [i, stmt] of statements.entries()) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
    await db.execute(sql.raw(stmt));
  }

  console.log("Migration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
