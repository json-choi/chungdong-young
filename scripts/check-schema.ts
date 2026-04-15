import { db } from "../src/server/db/client";
import { sql } from "drizzle-orm";

async function main() {
  const r = await db.execute(sql`
    SELECT column_name, data_type
      FROM information_schema.columns
     WHERE table_name = 'announcements'
     ORDER BY ordinal_position
  `);
  const rows = (r as unknown as { rows?: Array<{ column_name: string; data_type: string }> }).rows ?? (r as unknown as Array<{ column_name: string; data_type: string }>);
  for (const row of rows) {
    console.log(`  ${row.column_name.padEnd(24)} ${row.data_type}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
