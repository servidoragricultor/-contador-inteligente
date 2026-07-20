import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/format";
import { AppSidebar } from "@/components/app-sidebar";
import { ClientCardMenu } from "@/components/client-card-menu";
import { ClientFiltersBubble } from "@/components/client-filters-bubble";
import { CreateCompanyBubble } from "@/components/create-company-bubble";

const errorMessages: Record<string, string> = {
  empresa: "No se pudo crear el cliente. Revisa que el nombre tenga al menos 2 caracteres y que el RFC, si lo escribes, tenga 12 o 13 caracteres.",
  "sin-permiso": "No tienes permiso para eliminar este cliente.",
};

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ error?: string; filtro?: string; orden?: string; q?: string; vista?: string }> }) {
  const user = await requireUser();
  const { error, filtro = "todos", orden = "recientes", q = "", vista = "tarjetas" } = await searchParams;
  const memberships = await prisma.companyMember.findMany({
    where: { userId: user.id, status: "active" },
    include: {
      company: {
        include: {
          transactions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clientMembership = memberships.find((membership) => membership.role === "client");

  if (clientMembership) {
    redirect(`/empresas/${clientMembership.company.id}`);
  }

  const filteredMemberships = memberships
    .filter(({ company }) => {
      const income = company.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
      const expense = company.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
      const pendingReview = company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;
      const status = pendingReview > 0 ? "atencion" : "al dia";
      const text = `${company.tradeName || ""} ${company.legalName} ${company.rfc || ""} ${status}`.toLowerCase();
      const matchesSearch = q.trim().length === 0 || text.includes(q.trim().toLowerCase());
      const matchesFilter = filtro === "todos"
        || (filtro === "pendientes" && pendingReview > 0)
        || (filtro === "rfc" && !company.rfc)
        || (filtro === "positivo" && income >= expense);

      return matchesSearch && matchesFilter;
    })
    .sort((left, right) => {
      if (orden === "nombre") {
        return (left.company.tradeName || left.company.legalName).localeCompare(right.company.tradeName || right.company.legalName);
      }

      if (orden === "pendientes") {
        const leftPending = left.company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;
        const rightPending = right.company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;

        return rightPending - leftPending;
      }

      return right.company.createdAt.getTime() - left.company.createdAt.getTime();
    });

  const currentParams = new URLSearchParams({ filtro, orden, q });
  const cardViewHref = `/empresas?${new URLSearchParams({ ...Object.fromEntries(currentParams), vista: "tarjetas" }).toString()}`;
  const tableViewHref = `/empresas?${new URLSearchParams({ ...Object.fromEntries(currentParams), vista: "tabla" }).toString()}`;

  return (
    <div className="ledger-layout">
      <AppSidebar workspaceName={user.name || "Despacho"} />
      <main className="ledger-main">
        <header className="relative flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="calm-eyebrow">Principal</p>
            <h1 className="calm-title">Clientes</h1>
            <p className="calm-subtitle">Administra empresas, revisa pendientes y abre cada cliente desde un espacio limpio.</p>
          </div>
        </header>

        <section className="calm-panel mt-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <form className="flex-1">
              <input type="hidden" name="vista" value={vista} />
              <input type="hidden" name="filtro" value={filtro} />
              <input type="hidden" name="orden" value={orden} />
              <label className="relative block">
                <span className="sr-only">Buscar clientes</span>
                <input className="calm-input pl-10" name="q" defaultValue={q} placeholder="Buscar por nombre, RFC o estado" />
                <span className="calm-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm" aria-hidden="true">⌕</span>
              </label>
            </form>
            <ClientFiltersBubble cardViewHref={cardViewHref} filtro={filtro} orden={orden} q={q} tableViewHref={tableViewHref} vista={vista} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="calm-muted">{filteredMemberships.length} de {memberships.length} clientes</p>
            <p className="calm-muted">Vista optimizada para revision contable diaria</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-full max-w-[220px] sm:order-first">
              <CreateCompanyBubble />
            </div>
          </div>
          {vista === "tabla" ? (
            <div className="calm-panel overflow-x-auto">
              <table className="calm-table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>RFC</th>
                    <th>Ingresos</th>
                    <th>Gastos</th>
                    <th>Pendientes</th>
                    <th>Estado</th>
                    <th>Actualizacion</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map(({ company }) => {
                    const income = company.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
                    const expense = company.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
                    const pendingReview = company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;
                    const lastUpdate = company.transactions.length > 0
                      ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(
                        company.transactions.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, company.transactions[0].updatedAt),
                      )
                      : "Sin movimientos";

                    return (
                      <tr key={company.id}>
                        <td><Link className="font-medium text-slate-950 hover:underline" href={`/empresas/${company.id}`}>{company.tradeName || company.legalName}</Link></td>
                        <td>{company.rfc || "Pendiente"}</td>
                        <td>{currency(income)}</td>
                        <td>{currency(expense)}</td>
                        <td>{pendingReview}</td>
                        <td><span className={`calm-badge ${pendingReview > 0 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>{pendingReview > 0 ? "Atencion" : "Al dia"}</span></td>
                        <td>{lastUpdate}</td>
                        <td><ClientCardMenu companyId={company.id} companyName={company.tradeName || company.legalName} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredMemberships.length === 0 ? <div className="calm-empty">No hay clientes con estos filtros.</div> : null}
            </div>
          ) : (
          <div className="grid content-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {error && errorMessages[error] ? (
              <div className="calm-alert-warning sm:col-span-2 xl:col-span-3">
                {errorMessages[error]}
              </div>
            ) : null}
          {filteredMemberships.length === 0 ? (
            <div className="calm-empty border border-dashed sm:col-span-2 xl:col-span-3">
              {memberships.length === 0 ? "Aun no tienes clientes. Crea el primero para comenzar." : "No hay clientes con estos filtros."}
            </div>
          ) : filteredMemberships.map(({ company }) => {
              const income = company.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
              const expense = company.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
              const pendingReview = company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;
              const lastUpdate = company.transactions.length > 0
                ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(
                  company.transactions.reduce((latest, item) => item.updatedAt > latest ? item.updatedAt : latest, company.transactions[0].updatedAt),
                )
                : "Sin movimientos";
              const status = pendingReview > 0 ? "Atencion" : "Al dia";

              return (
              <article key={company.id} className="calm-card calm-card-hover group relative flex min-h-[280px] flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/empresas/${company.id}`} className="min-w-0 flex-1 rounded-xl outline-offset-4">
                    <div className="flex items-center gap-3">
                      <span className="ledger-workspace-mark h-9 w-9">{(company.tradeName || company.legalName).slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">{company.tradeName || company.legalName}</h2>
                        <p className="calm-muted mt-1 truncate text-xs">RFC {company.rfc || "pendiente"}</p>
                      </div>
                    </div>
                  </Link>
                  <ClientCardMenu companyId={company.id} companyName={company.tradeName || company.legalName} />
                </div>

                <Link href={`/empresas/${company.id}`} className="mt-6 grid flex-1 gap-4 rounded-xl outline-offset-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="calm-soft-box text-slate-800">
                      <p className="calm-muted text-xs">Ingresos</p>
                      <p className="mt-1 truncate text-base font-semibold tabular-nums">{currency(income)}</p>
                    </div>
                    <div className="calm-soft-box text-slate-800">
                      <p className="calm-muted text-xs">Gastos</p>
                      <p className="mt-1 truncate text-base font-semibold tabular-nums">{currency(expense)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="calm-muted">Pendientes</span>
                      <span className="font-semibold text-slate-950">{pendingReview}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="calm-muted">Estado</span>
                      <span className={`calm-badge ${pendingReview > 0 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>{status}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="calm-muted">Ultima actualizacion</span>
                      <span className="text-right text-slate-700">{lastUpdate}</span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
          </div>
          )}
        </section>
      </main>
    </div>
  );
}
