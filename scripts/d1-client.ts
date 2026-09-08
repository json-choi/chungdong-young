import { getPlatformProxy } from "wrangler";
import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "../src/server/db/schema";

// Maintenance scripts use local D1 only. Production migrations use Wrangler's
// explicit --remote command with an independently verified account.
const platform = await getPlatformProxy<{ DB: D1Database }>({ configPath: "wrangler.jsonc" });
export const db = drizzle(platform.env.DB, { schema });
export const dispose = platform.dispose;
