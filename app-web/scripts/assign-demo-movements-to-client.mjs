import { Client } from "pg";
import "dotenv/config";

const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await client.connect();

await client.query(
  `UPDATE "Transaction"
   SET "createdById" = $1
   WHERE "companyId" = $2 AND id LIKE $3`,
  ["test_client", "test_company", "demo_%"],
);

const result = await client.query(
  `SELECT COUNT(*)::int AS count
   FROM "Transaction"
   WHERE "companyId" = $1 AND "createdById" = $2 AND id LIKE $3`,
  ["test_company", "test_client", "demo_%"],
);

await client.end();

console.log(`Movimientos demo asignados al cliente: ${result.rows[0].count}`);
