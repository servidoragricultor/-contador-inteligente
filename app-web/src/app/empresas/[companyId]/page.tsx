import Link from "next/link";
import { requireCompanyAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency, shortDate } from "@/lib/format";
import { AppSidebar } from "@/components/app-sidebar";
import { AccountantMovementsTable } from "@/components/accountant-movements-table";
import { RegisterTransactionsBubble, RegisterTransactionsPanel } from "@/components/register-transactions-bubble";
import { ClientMovementsTable } from "@/components/client-movements-table";
import { ClientFinancialHome } from "@/components/client-financial-home";
import { MovementFiltersBubble } from "@/components/movement-filters-bubble";

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ captura?: string; mes?: string; tipo?: string; vista?: string }>;
}) {
  const { companyId } = await params;
  const { captura, mes, tipo, vista } = await searchParams;
  const { user, membership } = await requireCompanyAccess(companyId);

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
  const grossMargin = income > 0 ? `${(((income - expense) / income) * 100).toFixed(1)}%` : "0.0%";
  const pendingReview = company.transactions.filter((item) => item.reviewStatus === "unreviewed").length;
  const corrections = company.transactions.filter((item) => item.reviewStatus === "correction_required").length;
  const movementFilter = tipo === "income" || tipo === "expense" ? tipo : "all";
  const visibleTransactions = company.transactions.filter((item) => movementFilter === "all" || item.type === movementFilter);
  const categories = company.categories.map((item) => item.name);

  if (membership.role === "client") {
    const isMovementsView = vista === "movimientos";
    const captureMode: "income" | "expense" | "xml" | null = captura === "income" || captura === "expense" || captura === "xml" ? captura : null;
    const clientTransactions = company.transactions.filter((item) => movementFilter === "all" || item.type === movementFilter);
    const captureTitles: Record<NonNullable<typeof captureMode>, string> = {
      income: "Registrar ingreso",
      expense: "Registrar gasto",
      xml: "Importar XML",
    };
    const selectedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes ?? "") ? mes! : new Date().toISOString().slice(0, 7);
    const { end, previousEnd, previousStart, start } = getMonthBounds(selectedMonth);
    const periodTransactions = company.transactions.filter((item) => item.date >= start && item.date < end);
    const previousTransactions = company.transactions.filter((item) => item.date >= previousStart && item.date < previousEnd);
    const periodIncome = totalByType(periodTransactions, "income");
    const periodExpense = totalByType(periodTransactions, "expense");
    const previousIncome = totalByType(previousTransactions, "income");
    const previousExpense = totalByType(previousTransactions, "expense");
    const grossProfit = periodIncome - periodExpense;
    const periodGrossMargin = periodIncome > 0 ? `${((grossProfit / periodIncome) * 100).toFixed(1)}%` : "0.0%";
    const periodPending = periodTransactions.filter((item) => item.reviewStatus === "unreviewed").length;
    const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC", year: "numeric" }).format(start);
    const topIncomes = rankCounterparties(periodTransactions.filter((item) => item.type === "income"));
    const topExpenses = rankCounterparties(periodTransactions.filter((item) => item.type === "expense"));
    const recentMovements = periodTransactions.slice(0, 5).map((item) => ({
      date: shortDate(item.date),
      description: item.description,
      id: item.id,
      total: item.total,
      type: item.type,
    }));

    return (
      <div className="ledger-layout">
        <AppSidebar companyId={company.id} variant="client" workspaceName={company.tradeName || company.legalName} />
        <main className="ledger-main max-w-6xl">
        <header className="border-b border-slate-200 pb-8">
           <div>
            <p className="calm-eyebrow">Portal del cliente</p>
            <h1 className="calm-title">{company.tradeName || company.legalName}</h1>
            <p className="calm-subtitle">
              {isMovementsView
                ? "Consulta los movimientos registrados."
                : captureMode
                  ? "Registra ingresos, gastos o XML para tu contador."
                  : "Consulta el resumen financiero de tu negocio."}
            </p>
          </div>
        </header>

        {isMovementsView ? (
          <section className="calm-panel mt-8">
            <p className="calm-eyebrow">Historial</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Registros enviados</h2>
            <p className="calm-muted mt-1 text-sm leading-6">Selecciona una fila para editarla o eliminarla.</p>
            <ClientMovementsTable
              categories={categories}
              currentUserId={user.id}
                transactions={clientTransactions.map((item) => ({
                id: item.id,
                companyId: item.companyId,
                date: item.date.toISOString().slice(0, 10),
                displayDate: shortDate(item.date),
                type: item.type,
                source: item.source,
                description: item.description,
                counterpartyName: item.counterpartyName,
                total: item.total,
                paymentStatus: item.paymentStatus,
                createdById: item.createdById,
              }))}
            />
          </section>
        ) : captureMode ? (
          <section className="calm-panel mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                  <p className="calm-eyebrow">Accion principal</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{captureTitles[captureMode]}</h2>
              </div>
              <p className="calm-muted max-w-xl text-sm leading-6">
                Captura solo lo necesario. El contador revisara y validara la informacion despues.
              </p>
            </div>
              <RegisterTransactionsPanel categories={categories} companyId={company.id} mode={captureMode} />
          </section>
        ) : (
          <ClientFinancialHome
            companyId={company.id}
            expenseChange={changeLabel(periodExpense, previousExpense)}
            expenses={periodExpense}
            grossMargin={periodGrossMargin}
            grossProfit={grossProfit}
            incomeChange={changeLabel(periodIncome, previousIncome)}
            incomes={periodIncome}
            month={selectedMonth}
            monthLabel={monthLabel}
            pendingReview={periodPending}
            recentMovements={recentMovements}
            topExpenses={topExpenses}
            topIncomes={topIncomes}
          />
        )}
        </main>
      </div>
    );
  }

  return (
    <div className="ledger-layout">
      <AppSidebar workspaceName={company.tradeName || company.legalName} />
      <main className="ledger-main">
      <header className="relative flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/empresas" className="calm-muted text-sm font-medium transition hover:text-slate-950">Clientes / {company.tradeName || company.legalName}</Link>
          <h1 className="calm-title">{company.tradeName || company.legalName}</h1>
          <p className="calm-subtitle">RFC {company.rfc || "pendiente"}. Revisa movimientos, estados y pendientes sin ruido.</p>
        </div>
      </header>

      <section className="calm-panel mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="calm-eyebrow">Resumen del cliente</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Movimientos y revision</h2>
          </div>
          <p className="calm-muted max-w-xl text-sm leading-6">
            Vista principal del contador para revisar ingresos, gastos, pendientes y movimientos que requieren atencion.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-5">
        <Metric label="Ingresos" value={currency(income)} tone="emerald" />
        <Metric label="Gastos" value={currency(expense)} tone="rose" />
        <Metric label="Margen bruto" value={grossMargin} tone="slate" />
        <Metric label="Sin revisar" value={String(pendingReview)} tone="amber" />
        <Metric label="Requieren correccion" value={String(corrections)} tone="blue" />
      </section>

      <section className="mt-8">
        <div className="calm-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <MovementFiltersBubble companyId={company.id} movementFilter={movementFilter} />
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em]">Movimientos</h2>
            </div>
            <div className="w-full sm:w-[220px]">
              <RegisterTransactionsBubble companyId={company.id} categories={categories} />
            </div>
          </div>
          <AccountantMovementsTable
            categories={categories}
            transactions={visibleTransactions.map((item) => ({
              id: item.id,
              companyId: item.companyId,
              date: item.date.toISOString().slice(0, 10),
              displayDate: shortDate(item.date),
              type: item.type,
              source: item.source,
              description: item.description,
              counterpartyName: item.counterpartyName,
              fiscalUuid: item.fiscalDocument?.uuid ?? null,
              total: item.total,
              paymentStatus: item.paymentStatus,
              reviewStatus: item.reviewStatus,
              reviewNote: item.reviewNote,
            }))}
          />
        </div>
      </section>
      </main>
    </div>
  );
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "Sin cambios vs mes anterior" : "Nuevo vs mes anterior";

  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs mes anterior`;
}

function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const previousStart = new Date(Date.UTC(year, monthNumber - 2, 1));

  return { end, previousEnd: start, previousStart, start };
}

function rankCounterparties(transactions: { counterpartyName: string | null; total: number }[]) {
  const grouped = new Map<string, { count: number; name: string; total: number }>();

  for (const transaction of transactions) {
    const name = transaction.counterpartyName?.trim() || "Sin contraparte";
    const current = grouped.get(name) ?? { count: 0, name, total: 0 };
    current.count += 1;
    current.total += transaction.total;
    grouped.set(name, current);
  }

  return [...grouped.values()].sort((left, right) => right.total - left.total).slice(0, 5);
}

function totalByType(transactions: { total: number; type: string }[], type: string) {
  return transactions.filter((item) => item.type === type).reduce((sum, item) => sum + item.total, 0);
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "amber" | "blue" | "slate" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
    rose: "border-rose-100 bg-rose-50 text-rose-900",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
    blue: "border-blue-100 bg-blue-50 text-blue-900",
    slate: "border-slate-200 bg-white text-slate-950",
  };

  return <div className={`calm-card p-5 ${tones[tone]}`}><p className="text-sm opacity-70">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em]">{value}</p></div>;
}
