import { db } from "../src/server/db/client";
import { user } from "../src/server/db/schema";

async function main() {
  const users = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user);
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

main();
