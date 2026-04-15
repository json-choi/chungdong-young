import { db } from "../src/server/db/client";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

async function main() {
  const newPassword = "123";
  const hash = await hashPassword(newPassword);

  await db.execute(
    sql`UPDATE account SET password = ${hash} WHERE provider_id = 'credential'`
  );

  console.log("Password updated successfully");
  console.log("Email: admin@chungdong.church");
  console.log("Password: jungdong");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
