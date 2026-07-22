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
import { parseCfdiXml } from "@/lib/cfdi";
import { validateCfdiAgainstCompany } from "@/lib/fiscal-validation";
import { FormError } from "@/components/form-error";

const companyErrorMessages: Record<string, string> = {
  "rfc-requerido-xml": "Completa el RFC del perfil fiscal antes de importar XML.",
  "xml-duplicado": "El XML ya estaba registrado y no se importó nuevamente.",
  "xml-invalido": "No pudimos importar el XML. Verifica que sea un CFDI válido.",
  "xml-vacio": "Selecciona al menos un archivo XML.",
  movimiento: "No se pudo guardar el movimiento. Revisa el monto, la fecha y la descripción.",
};

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ captura?: string; error?: string; mes?: string; tipo?: string; vista?: string; xmlImportados?: string; xmlOmitidos?: string }>;
}) {
  const { companyId } = await params;
  const { captura, error, mes, tipo, vista, xmlImportados, xmlOmitidos } = await searchParams;
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
  const transactions = company.transactions.map((item) => {
    if (!item.fiscalDocument) return item;

    try {
      const issues = validateCfdiAgainstCompany(company, parseCfdiXml(item.fiscalDocument.xmlContent));
      return issues.length > 0
        ? { ...item, reviewNote: issues.join(" "), reviewStatus: "correction_required" }
        : item;
    } catch {
      return { ...item, reviewNote: "El XML almacenado no se pudo validar.", reviewStatus: "correction_required" };
    }
  });

  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
  const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
  const grossMargin = formatPercent(income > 0 ? (income - expense) / income : 0);
  const pendingReview = transactions.filter((item) => item.reviewStatus === "unreviewed").length;
  const corrections = transactions.filter((item) => item.reviewStatus === "correction_required").length;
  const creditTransactions = transactions.filter(isCreditTransaction);
  const creditTotal = creditTransactions.reduce((sum, item) => sum + item.total, 0);
  const movementFilter = tipo === "income" || tipo === "expense" || tipo === "credit" ? tipo : "all";
  const visibleTransactions = transactions.filter((item) => {
    if (movementFilter === "credit") return isCreditTransaction(item);
    return movementFilter === "all" || item.type === movementFilter;
  });
  const categories = company.categories.map((item) => item.name);
  const fiscalProfileComplete = Boolean(company.rfc && company.legalName && company.postalCode && company.taxRegime);
  const importedCount = Number(xmlImportados ?? 0);
  const omittedCount = Number(xmlOmitidos ?? 0);

  if (membership.role === "client") {
    const isMovementsView = vista === "movimientos";
    const captureMode: "income" | "expense" | "xml" | null = captura === "income" || captura === "expense" || captura === "xml" ? captura : null;
    const clientTransactions = transactions.filter((item) => {
      if (movementFilter === "credit") return isCreditTransaction(item);
      return movementFilter === "all" || item.type === movementFilter;
    });
    const captureTitles: Record<NonNullable<typeof captureMode>, string> = {
      income: "Registrar ingreso",
      expense: "Registrar gasto",
      xml: "Importar XML",
    };
    const selectedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes ?? "") ? mes! : currentMonthInMexico();
    const { end, previousEnd, previousStart, start } = getMonthBounds(selectedMonth);
    const periodTransactions = transactions.filter((item) => item.date >= start && item.date < end);
    const previousTransactions = transactions.filter((item) => item.date >= previousStart && item.date < previousEnd);
    const periodIncome = totalByType(periodTransactions, "income");
    const periodExpense = totalByType(periodTransactions, "expense");
    const previousIncome = totalByType(previousTransactions, "income");
    const previousExpense = totalByType(previousTransactions, "expense");
    const grossProfit = periodIncome - periodExpense;
    const periodGrossMargin = formatPercent(periodIncome > 0 ? grossProfit / periodIncome : 0);
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
        <main className="ledger-main max-w-6xl" id="main-content">
        <header className="calm-header">
           <div>
            <h1 className="calm-title break-words">{company.tradeName || company.legalName}</h1>
            <p className="calm-subtitle">
              {isMovementsView
                ? "Consulta los movimientos registrados."
                : captureMode
                  ? "Registra ingresos, gastos o XML para tu contador."
                  : "Consulta el resumen financiero de tu negocio."}
            </p>
          </div>
        </header>

        {error && companyErrorMessages[error] ? <FormError className="mt-6">{companyErrorMessages[error]}</FormError> : null}
        {importedCount > 0 ? (
          <div className="calm-alert-success mt-6" role="status">
            {importedCount} {importedCount === 1 ? "XML importado" : "XML importados"}.{omittedCount > 0 ? ` ${omittedCount} omitidos por duplicado o formato inválido.` : ""}
          </div>
        ) : null}

        {isMovementsView ? (
          <section className="calm-panel mt-6">
            <p className="calm-eyebrow">Libro del mes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Ingresos y gastos</h2>
            <p className="calm-muted mt-1 text-sm leading-6">Todo lo que has enviado a tu contador, ordenado para reconocerlo de un vistazo.</p>
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
                 counterpartyRfc: item.counterpartyRfc,
                 categoryName: item.category?.name ?? null,
                 total: item.total,
                 paymentStatus: item.paymentStatus,
                 paymentMethod: item.fiscalDocument?.paymentMethod ?? null,
                 paymentForm: item.fiscalDocument?.paymentForm ?? null,
                  isCredit: isCreditTransaction(item),
                  reviewStatus: item.reviewStatus,
                  reviewNote: item.reviewNote,
                  createdById: item.createdById,
              }))}
            />
          </section>
        ) : captureMode ? (
          <section className="calm-panel mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">{captureTitles[captureMode]}</h2>
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
            creditCount={creditTransactions.length}
            creditTotal={creditTotal}
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
      <main className="ledger-main" id="main-content">
      <header className="calm-header">
        <div>
          <Link href="/empresas" className="calm-muted text-sm font-medium transition hover:text-slate-950">Clientes / {company.tradeName || company.legalName}</Link>
          <h1 className="calm-title break-words">{company.tradeName || company.legalName}</h1>
          <p className="calm-subtitle">RFC {company.rfc || "pendiente"}. Revisa movimientos, estados y pendientes sin ruido.</p>
        </div>
      </header>

      {error && companyErrorMessages[error] ? <FormError className="mt-6">{companyErrorMessages[error]}</FormError> : null}
      {importedCount > 0 ? (
        <div className="calm-alert-success mt-6" role="status">
          {importedCount} {importedCount === 1 ? "XML importado" : "XML importados"}.{omittedCount > 0 ? ` ${omittedCount} omitidos por duplicado o formato inválido.` : ""}
        </div>
      ) : null}

      <section className="calm-panel mt-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="calm-eyebrow">Perfil fiscal SAT</p>
              <h2 className="mt-2 text-lg font-semibold">Datos para validar CFDI 4.0</h2>
            </div>
            <span className={`calm-badge ${fiscalProfileComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {fiscalProfileComplete ? "Perfil completo" : "Perfil incompleto"}
            </span>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FiscalValue label="Nombre fiscal" value={company.legalName} />
            <FiscalValue label="RFC" value={company.rfc || "Pendiente"} />
            <FiscalValue label="Codigo postal" value={company.postalCode || "Pendiente"} />
            <FiscalValue label="Regimen fiscal" value={company.taxRegime || "Pendiente"} />
          </dl>
        </div>
      </section>

      <section className="calm-card mt-6 grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Ingresos" value={currency(income)} tone="emerald" />
        <Metric label="Gastos" value={currency(expense)} tone="rose" />
        <Metric label="Cuentas por pagar" value={currency(creditTotal)} tone="amber" />
        <Metric label="Margen bruto" value={grossMargin} tone="slate" />
        <Metric label="Sin revisar" value={String(pendingReview)} tone="amber" />
        <Metric label="Requieren correccion" value={String(corrections)} tone="blue" />
      </section>

      <section className="mt-6">
        <div className="calm-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="calm-eyebrow">Libro de movimientos</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Ingresos y gastos</h2>
              <div className="mt-4"><MovementFiltersBubble companyId={company.id} movementFilter={movementFilter} /></div>
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
              counterpartyRfc: item.counterpartyRfc,
              categoryName: item.category?.name ?? null,
              fiscalUuid: item.fiscalDocument?.uuid ?? null,
              total: item.total,
              paymentStatus: item.paymentStatus,
              paymentMethod: item.fiscalDocument?.paymentMethod ?? null,
              paymentForm: item.fiscalDocument?.paymentForm ?? null,
              isCredit: isCreditTransaction(item),
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

function isCreditTransaction(transaction: {
  fiscalDocument: { paymentMethod: string | null } | null;
  paymentStatus: string;
  source: string;
  type: string;
}) {
  if (transaction.type !== "expense" || transaction.paymentStatus !== "pending") return false;
  return transaction.fiscalDocument?.paymentMethod === "PPD" || transaction.source === "manual";
}

function FiscalValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="calm-soft-box min-w-0">
      <dt className="calm-muted text-xs">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function changeLabel(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "Sin cambios vs mes anterior" : "Nuevo vs mes anterior";

  const change = (current - previous) / previous;
  return `${change >= 0 ? "+" : ""}${formatPercent(change)} vs mes anterior`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function currentMonthInMexico() {
  const parts = new Intl.DateTimeFormat("en", {
    month: "2-digit",
    timeZone: "America/Mexico_City",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
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
    emerald: "text-emerald-700",
    rose: "text-slate-950",
    amber: "text-amber-700",
    blue: "text-rose-700",
    slate: "text-slate-950",
  };

  return <div className="border-b border-r border-slate-100 p-5"><p className="calm-muted text-sm">{label}</p><p className={`mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] ${tones[tone]}`}>{value}</p></div>;
}
