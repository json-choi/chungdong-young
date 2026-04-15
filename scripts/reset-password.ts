import { db } from "../src/server/db/client";
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

async function main() {
  const newPassword = process.env.RESET_PW ?? "admin1234";

  if (newPassword.length < 8) {
    console.error(
      `Password must be at least 8 characters (got ${newPassword.length}). better-auth rejects shorter passwords at sign-in.`
    );
    process.exit(1);
  }

  const hash = await hashPassword(newPassword);

  await db.execute(
    sql`UPDATE account SET password = ${hash} WHERE provider_id = 'credential'`
  );

  console.log("Password updated successfully");
  console.log("Email: admin@chungdong.church");
  console.log(`Password: ${newPassword}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
