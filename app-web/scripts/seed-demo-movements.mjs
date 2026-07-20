import { Client } from "pg";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta DIRECT_URL o DATABASE_URL en .env");
}

const client = new Client({ connectionString });
await client.connect();

const now = new Date();
const companyId = "test_company";
const userId = "test_admin";

const incomeItems = [
  ["demo_income_1", "Venta mostrador semana 1", "Cliente general", 18500],
  ["demo_income_2", "Servicio mensual", "Comercial del Centro", 24000],
  ["demo_income_3", "Venta contado", "Cliente mostrador", 12750],
  ["demo_income_4", "Proyecto especial", "Constructora Norte", 31500],
  ["demo_income_5", "Venta recurrente", "Distribuidora Local", 19800],
];

const expenseItems = [
  ["demo_expense_1", "Renta del local", "Arrendadora Demo", 9500, "Renta"],
  ["demo_expense_2", "Compra de insumos", "Proveedor Insumos", 7800, "Inventario"],
  ["demo_expense_3", "Servicios de luz e internet", "Servicios", 3200, "Servicios"],
  ["demo_expense_4", "Combustible reparto", "Gasolinera Demo", 2600, "Combustible"],
  ["demo_expense_5", "Honorarios administrativos", "Asesor Administrativo", 6400, "Honorarios"],
];

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

await client.query("BEGIN");

for (const [index, item] of incomeItems.entries()) {
  const [id, description, counterpartyName, total] = item;
  await client.query(
    `INSERT INTO "Transaction" (
      "id", "companyId", "type", "source", "date", "description", "counterpartyName",
      "subtotal", "taxAmount", "withholdingAmount", "total", "currency", "paymentStatus",
      "reviewStatus", "createdById", "createdAt", "updatedAt"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    ON CONFLICT ("id") DO UPDATE SET
      "description" = EXCLUDED."description",
      "counterpartyName" = EXCLUDED."counterpartyName",
      "total" = EXCLUDED."total",
      "updatedAt" = EXCLUDED."updatedAt"`,
    [id, companyId, "income", "manual", daysAgo(10 - index), description, counterpartyName, total, 0, 0, total, "MXN", "collected", "unreviewed", userId, now, now],
  );
}

for (const [index, item] of expenseItems.entries()) {
  const [id, description, counterpartyName, total, categoryName] = item;
  const categoryResult = await client.query(
    `SELECT id FROM "Category" WHERE "companyId" = $1 AND "name" = $2 LIMIT 1`,
    [companyId, categoryName],
  );
  const categoryId = categoryResult.rows[0]?.id ?? null;

  await client.query(
    `INSERT INTO "Transaction" (
      "id", "companyId", "type", "source", "date", "description", "counterpartyName", "categoryId",
      "subtotal", "taxAmount", "withholdingAmount", "total", "currency", "paymentStatus",
      "reviewStatus", "createdById", "createdAt", "updatedAt"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT ("id") DO UPDATE SET
      "description" = EXCLUDED."description",
      "counterpartyName" = EXCLUDED."counterpartyName",
      "categoryId" = EXCLUDED."categoryId",
      "total" = EXCLUDED."total",
      "updatedAt" = EXCLUDED."updatedAt"`,
    [id, companyId, "expense", "manual", daysAgo(5 - index), description, counterpartyName, categoryId, total, 0, 0, total, "MXN", "paid", "unreviewed", userId, now, now],
  );
}

await client.query("COMMIT");
await client.end();

const totalIncome = incomeItems.reduce((sum, item) => sum + Number(item[3]), 0);
const totalExpense = expenseItems.reduce((sum, item) => sum + Number(item[3]), 0);

console.log("Movimientos demo creados para Demo Cliente");
console.log(`Ingresos: ${totalIncome}`);
console.log(`Gastos: ${totalExpense}`);
console.log(`Resultado: ${totalIncome - totalExpense}`);
