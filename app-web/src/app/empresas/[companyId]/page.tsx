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

      <section className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200">Acciones principales</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Registra ingresos y gastos</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Esta es la tarea principal del cliente: capturar rapidamente lo que entra y lo que sale. El XML queda como apoyo automatico cuando exista comprobante.
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <TransactionForm companyId={company.id} type="income" categories={company.categories.map((item) => item.name)} />
          <TransactionForm companyId={company.id} type="expense" categories={company.categories.map((item) => item.name)} />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric label="Ingresos" value={currency(income)} tone="emerald" />
        <Metric label="Gastos" value={currency(expense)} tone="rose" />
        <Metric label="Sin revisar" value={String(pendingReview)} tone="amber" />
        <Metric label="Requieren correccion" value={String(corrections)} tone="blue" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[340px_1fr]">
        <div>
          <form action={importXml} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Importar XML</h2>
            <p className="mt-2 text-sm text-slate-500">Opcional. Si el cliente tiene XML, el sistema crea el registro automaticamente.</p>
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
  const tone = isIncome
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : "border-rose-200 bg-rose-50 text-rose-950";
  const buttonTone = isIncome ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700";

  return (
    <form action={createTransaction} className={`rounded-3xl border p-6 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium opacity-70">{isIncome ? "Dinero que entra" : "Dinero que sale"}</p>
          <h2 className="mt-1 text-3xl font-semibold">{isIncome ? "Registrar ingreso" : "Registrar gasto"}</h2>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold shadow-sm">
          {isIncome ? "+" : "-"}
        </span>
      </div>
      <p className="mt-3 text-sm opacity-70">Captura rapida: monto, fecha y descripcion.</p>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <div className="mt-5 grid gap-3">
        <input className="rounded-xl border border-white/70 bg-white px-4 py-4 text-lg font-semibold shadow-sm" name="total" type="number" step="0.01" min="0" placeholder="Monto" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm" name="date" type="date" defaultValue={today} required />
          <select className="rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm" name="paymentStatus" defaultValue={isIncome ? "collected" : "paid"}>
            <option value={isIncome ? "collected" : "paid"}>{isIncome ? "Cobrado" : "Pagado"}</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
        <input className="rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm" name="description" placeholder={isIncome ? "Cliente o descripcion" : "Proveedor o descripcion"} required />
        <input className="rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm" name="counterpartyName" placeholder={isIncome ? "Cliente opcional" : "Proveedor opcional"} />
        {!isIncome ? (
          <select className="rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm" name="categoryName" defaultValue="Sin clasificar">
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        <button className={`rounded-xl px-4 py-4 text-lg font-semibold text-white transition ${buttonTone}`} type="submit">
          {isIncome ? "Guardar ingreso" : "Guardar gasto"}
        </button>
      </div>
    </form>
  );
}
