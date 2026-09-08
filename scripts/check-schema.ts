import { db, dispose } from "./d1-client";
import { sql } from "drizzle-orm";
try { console.log(await db.all(sql`PRAGMA table_info(announcements)`)); }
finally { await dispose(); }
