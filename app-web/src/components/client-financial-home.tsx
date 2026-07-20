import Link from "next/link";
import { currency } from "@/lib/format";

type RankingItem = {
  count: number;
  name: string;
  total: number;
};

type RecentMovement = {
  date: string;
  description: string;
  id: string;
  total: number;
  type: string;
};

export function ClientFinancialHome({
  companyId,
  creditCount,
  creditTotal,
  expenseChange,
  expenses,
  grossMargin,
  grossProfit,
  incomeChange,
  incomes,
  month,
  monthLabel,
  pendingReview,
  recentMovements,
  topExpenses,
  topIncomes,
}: {
  companyId: string;
  creditCount: number;
  creditTotal: number;
  expenseChange: string;
  expenses: number;
  grossMargin: string;
  grossProfit: number;
  incomeChange: string;
  incomes: number;
  month: string;
  monthLabel: string;
  pendingReview: number;
  recentMovements: RecentMovement[];
  topExpenses: RankingItem[];
  topIncomes: RankingItem[];
}) {
  return (
    <div className="mt-8 grid gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="calm-eyebrow">Resumen financiero</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{monthLabel}</h2>
          <p className="calm-muted mt-2 text-sm">Tus ingresos y gastos del mes, sin ruido.</p>
        </div>
        <form className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:w-auto">
          <label className="sr-only" htmlFor="dashboard-month">Seleccionar mes</label>
          <input className="calm-input min-w-0" defaultValue={month} id="dashboard-month" name="mes" type="month" />
          <button className="calm-button-secondary" type="submit">Ver</button>
        </form>
      </section>

      {expenses > incomes && incomes > 0 ? (
        <div className="calm-alert-warning">
          Tus gastos superan tus ingresos por {currency(expenses - incomes)} en este periodo.
        </div>
      ) : null}

      <section className="calm-card grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
        <DashboardMetric comparison={incomeChange} label="Ingresos" tone="success" value={currency(incomes)} />
        <DashboardMetric comparison={expenseChange} label="Gastos" tone="danger" value={currency(expenses)} />
        <DashboardMetric comparison={`${creditCount} ${creditCount === 1 ? "factura pendiente" : "facturas pendientes"}`} label="Cuentas por pagar" tone="warning" value={currency(creditTotal)} />
        <DashboardMetric comparison="Ingresos menos gastos" label="Ganancia bruta estimada" tone={grossProfit >= 0 ? "success" : "danger"} value={currency(grossProfit)} />
        <DashboardMetric comparison="Sobre los ingresos" label="Margen bruto" tone="neutral" value={grossMargin} />
        <DashboardMetric comparison="Por validar" label="Pendientes" tone="warning" value={String(pendingReview)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingCard emptyText="Aun no hay gastos registrados este mes." items={topExpenses} title="Top 5 gastos por contraparte" tone="danger" />
        <RankingCard emptyText="Aun no hay ingresos registrados este mes." items={topIncomes} title="Top 5 ingresos por contraparte" tone="success" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="calm-panel">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="calm-eyebrow">Actividad</p>
              <h3 className="mt-2 text-xl font-semibold">Movimientos recientes</h3>
            </div>
            <Link className="calm-button-secondary" href={`/empresas/${companyId}?vista=movimientos`}>Ver todos</Link>
          </div>
          {recentMovements.length > 0 ? (
            <div className="mt-5 divide-y divide-slate-100">
              {recentMovements.map((movement) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4" key={movement.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950">{movement.description}</p>
                    <p className="calm-muted mt-1 text-xs">{movement.date}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold tabular-nums ${movement.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                    {movement.type === "income" ? "+" : "-"}{currency(movement.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : <div className="calm-empty mt-5">No hay actividad durante este mes.</div>}
        </div>

        <div className="calm-panel">
          <p className="calm-eyebrow">Accesos rapidos</p>
          <h3 className="mt-2 text-xl font-semibold">Registrar</h3>
          <div className="mt-5 grid gap-3">
            <Link className="calm-button-primary w-full" href={`/empresas/${companyId}?captura=income`}>+ Ingreso</Link>
            <Link className="calm-button-secondary w-full" href={`/empresas/${companyId}?captura=expense`}>+ Gasto</Link>
            <Link className="calm-button-secondary w-full" href={`/empresas/${companyId}?captura=xml`}>Importar XML</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardMetric({ comparison, label, tone, value }: { comparison: string; label: string; tone: "danger" | "neutral" | "success" | "warning"; value: string }) {
  const tones = {
    danger: "text-red-700",
    neutral: "text-slate-950",
    success: "text-emerald-700",
    warning: "text-amber-700",
  };

  return (
    <div className="border-b border-r border-slate-100 p-5">
      <p className="calm-muted text-sm">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] ${tones[tone]}`}>{value}</p>
      <p className="calm-muted mt-2 text-xs">{comparison}</p>
    </div>
  );
}

function RankingCard({ emptyText, items, title, tone }: { emptyText: string; items: RankingItem[]; title: string; tone: "danger" | "success" }) {
  const maximum = Math.max(...items.map((item) => item.total), 0);
  const barColor = tone === "success" ? "bg-emerald-600" : "bg-red-500";

  return (
    <div className="calm-panel">
      <p className="calm-eyebrow">Por contraparte</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-6 grid gap-5">
          {items.map((item) => (
            <div className="grid gap-2" key={item.name}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                <span className="truncate font-medium text-slate-700">{item.name}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-950">{currency(item.total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${maximum > 0 ? Math.max((item.total / maximum) * 100, 4) : 0}%` }} />
              </div>
              <p className="calm-muted text-xs">{item.count} {item.count === 1 ? "movimiento" : "movimientos"}</p>
            </div>
          ))}
        </div>
      ) : <div className="calm-empty mt-5">{emptyText}</div>}
    </div>
  );
}
