import Link from "next/link";
import { createTransaction, importXml, updateReviewStatus } from "@/app/actions";
import { requireCompanyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency, paymentLabel, reviewLabel, shortDate } from "@/lib/format";

export default async function CompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  await requireCompanyAccess(companyId);

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: {
      categories: { orderBy: { name: "asc" } },
      transactions: {
        include: { category: true, fiscalDocument: true },
        orderBy: { date: "desc" },
      },
    },
  });

  const income = company.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
  const expense = company.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
  const pendingReview = company.transactions.filter((item) => item.reviewStatus === "unreviewed").length;
  const corrections = company.transactions.filter((item) => item.reviewStatus === "correction_required").length;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/empresas" className="text-sm font-medium text-blue-600">Volver a empresas</Link>
          <h1 className="mt-2 text-3xl font-semibold">{company.tradeName || company.legalName}</h1>
          <p className="mt-1 text-sm text-slate-500">RFC {company.rfc || "pendiente"}</p>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric label="Ingresos" value={currency(income)} tone="emerald" />
        <Metric label="Gastos" value={currency(expense)} tone="rose" />
        <Metric label="Sin revisar" value={String(pendingReview)} tone="amber" />
        <Metric label="Requieren correccion" value={String(corrections)} tone="blue" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-6">
          <TransactionForm companyId={company.id} type="income" categories={company.categories.map((item) => item.name)} />
          <TransactionForm companyId={company.id} type="expense" categories={company.categories.map((item) => item.name)} />
          <form action={importXml} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Importar XML</h2>
            <p className="mt-2 text-sm text-slate-500">Detecta ingreso o gasto por RFC de la empresa.</p>
            <input type="hidden" name="companyId" value={company.id} />
            <input className="mt-5 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm" name="xml" type="file" accept=".xml,text/xml,application/xml" required />
            <button className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white" type="submit">Subir XML</button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold">Movimientos</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-3">Fecha</th>
                  <th>Tipo</th>
                  <th>Descripcion</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Revision</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {company.transactions.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="py-4">{shortDate(item.date)}</td>
                    <td>{item.type === "income" ? "Ingreso" : "Gasto"}<br /><span className="text-xs text-slate-400">{item.source}</span></td>
                    <td>
                      <span className="font-medium">{item.description}</span><br />
                      <span className="text-xs text-slate-500">{item.counterpartyName || "Sin contraparte"}</span>
                      {item.fiscalDocument ? <span className="mt-1 block text-xs text-blue-600">UUID {item.fiscalDocument.uuid}</span> : null}
                    </td>
                    <td className="font-medium">{currency(item.total)}</td>
                    <td>{paymentLabel(item.paymentStatus, item.type)}</td>
                    <td>{reviewLabel(item.reviewStatus)}{item.reviewNote ? <span className="block max-w-48 text-xs text-amber-700">{item.reviewNote}</span> : null}</td>
                    <td>
                      <form action={updateReviewStatus} className="flex gap-2">
                        <input type="hidden" name="companyId" value={company.id} />
                        <input type="hidden" name="transactionId" value={item.id} />
                        <button className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700" name="reviewStatus" value="reviewed" type="submit">Revisar</button>
                        <button className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700" name="reviewStatus" value="correction_required" type="submit">Corregir</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "amber" | "blue" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-900",
    rose: "bg-rose-50 text-rose-900",
    amber: "bg-amber-50 text-amber-900",
    blue: "bg-blue-50 text-blue-900",
  };

  return <div className={`rounded-3xl p-5 shadow-sm ring-1 ring-slate-200 ${tones[tone]}`}><p className="text-sm opacity-70">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

function TransactionForm({ companyId, type, categories }: { companyId: string; type: "income" | "expense"; categories: string[] }) {
  const isIncome = type === "income";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createTransaction} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold">{isIncome ? "Registrar ingreso" : "Registrar gasto"}</h2>
      <p className="mt-2 text-sm text-slate-500">Captura manual rapida.</p>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <div className="mt-5 grid gap-3">
        <input className="rounded-xl border border-slate-200 px-4 py-3" name="total" type="number" step="0.01" min="0" placeholder="Monto" required />
        <input className="rounded-xl border border-slate-200 px-4 py-3" name="date" type="date" defaultValue={today} required />
        <input className="rounded-xl border border-slate-200 px-4 py-3" name="description" placeholder={isIncome ? "Cliente o descripcion" : "Proveedor o descripcion"} required />
        <input className="rounded-xl border border-slate-200 px-4 py-3" name="counterpartyName" placeholder={isIncome ? "Cliente opcional" : "Proveedor opcional"} />
        {!isIncome ? (
          <select className="rounded-xl border border-slate-200 px-4 py-3" name="categoryName" defaultValue="Sin clasificar">
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        <select className="rounded-xl border border-slate-200 px-4 py-3" name="paymentStatus" defaultValue={isIncome ? "collected" : "paid"}>
          <option value={isIncome ? "collected" : "paid"}>{isIncome ? "Cobrado" : "Pagado"}</option>
          <option value="pending">Pendiente</option>
        </select>
        <button className={`rounded-xl px-4 py-3 font-medium text-white ${isIncome ? "bg-emerald-600" : "bg-rose-600"}`} type="submit">
          {isIncome ? "Guardar ingreso" : "Guardar gasto"}
        </button>
      </div>
    </form>
  );
}
