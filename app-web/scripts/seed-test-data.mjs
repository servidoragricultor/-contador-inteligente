import { Client } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Falta DIRECT_URL o DATABASE_URL en .env");
  }

  const client = new Client({ connectionString });
  await client.connect();

  const now = new Date();
  const passwordHash = await bcrypt.hash("admin", 12);
  const adminId = "test_admin";
  const clientId = "test_client";
  const companyId = "test_company";

  await client.query("BEGIN");

  await client.query(
    `INSERT INTO "User" ("id", "name", "email", "passwordHash", "globalRole", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("email") DO UPDATE SET
       "name" = EXCLUDED."name",
       "passwordHash" = EXCLUDED."passwordHash",
       "updatedAt" = EXCLUDED."updatedAt"`,
    [adminId, "Contador de prueba", "admin", passwordHash, "accountant", now, now],
  );

  await client.query(
    `INSERT INTO "User" ("id", "name", "email", "passwordHash", "globalRole", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("email") DO UPDATE SET
       "name" = EXCLUDED."name",
       "passwordHash" = EXCLUDED."passwordHash",
       "updatedAt" = EXCLUDED."updatedAt"`,
    [clientId, "Cliente de prueba", "cliente", passwordHash, "client", now, now],
  );

  await client.query(
    `INSERT INTO "Company" ("id", "legalName", "tradeName", "rfc", "createdById", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ("id") DO UPDATE SET
       "legalName" = EXCLUDED."legalName",
       "tradeName" = EXCLUDED."tradeName",
       "updatedAt" = EXCLUDED."updatedAt"`,
    [companyId, "Cliente de prueba", "Demo Cliente", null, adminId, now, now],
  );

  await client.query(
    `INSERT INTO "CompanyMember" ("id", "companyId", "userId", "role", "status", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("companyId", "userId") DO UPDATE SET
       "role" = EXCLUDED."role",
       "status" = EXCLUDED."status"`,
    ["test_member_admin", companyId, adminId, "accountant", "active", now],
  );

  await client.query(
    `INSERT INTO "CompanyMember" ("id", "companyId", "userId", "role", "status", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("companyId", "userId") DO UPDATE SET
       "role" = EXCLUDED."role",
       "status" = EXCLUDED."status"`,
    ["test_member_client", companyId, clientId, "client", "active", now],
  );

  const categories = [
    "Sin clasificar",
    "Renta",
    "Servicios",
    "Combustible",
    "Nomina",
    "Honorarios",
    "Oficina",
    "Transporte",
    "Publicidad",
    "Inventario",
    "Impuestos",
    "Otro",
  ];

  for (const name of categories) {
    await client.query(
      `INSERT INTO "Category" ("id", "companyId", "name", "type", "isDefault", "createdAt")
       SELECT $1, $2, $3, $4, $5, $6
       WHERE NOT EXISTS (
         SELECT 1 FROM "Category" WHERE "companyId" = $2 AND "name" = $3
       )`,
      [randomUUID(), companyId, name, "both", true, now],
    );
  }

  await client.query("COMMIT");
  await client.end();

  console.log("Datos de prueba creados:");
  console.log("Contador: admin / admin");
  console.log("Cliente: cliente / admin");
  console.log("Empresa: Cliente de prueba");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
