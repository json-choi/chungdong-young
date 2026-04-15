/**
 * Generic migration runner for a raw SQL file.
 *
 * Usage:
 *   pnpm tsx --env-file=.env scripts/run-sql.ts drizzle/0002_image_display_settings.sql
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "../src/server/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const [, , file] = process.argv;
  if (!file) {
    console.error("Usage: pnpm tsx scripts/run-sql.ts <path-to-sql>");
    process.exit(1);
  }

  const raw = readFileSync(resolve(file), "utf8");

  const cleaned = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Running ${statements.length} statement(s) from ${file}...`);

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
