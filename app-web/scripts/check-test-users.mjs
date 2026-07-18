import { Client } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

await client.connect();

const result = await client.query(
  `SELECT id, name, email, "passwordHash" FROM "User" WHERE email IN ($1, $2) ORDER BY email`,
  ["admin", "cliente"],
);

for (const user of result.rows) {
  const isValid = await bcrypt.compare("admin", user.passwordHash);
  console.log(`${user.email} | ${user.name} | password admin: ${isValid}`);
}

await client.end();
