import Link from "next/link";
import { createCompany, logout } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/format";

export default async function CompaniesPage() {
  const user = await requireUser();
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

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Sesion activa</p>
          <h1 className="text-3xl font-semibold">Empresas de {user.name}</h1>
        </div>
        <form action={logout}>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium" type="submit">Salir</button>
        </form>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {memberships.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Aun no tienes empresas. Crea la primera para comenzar.
            </div>
          ) : memberships.map(({ company }) => {
            const income = company.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
            const expense = company.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
            const pendingReview = company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;

            return (
              <Link key={company.id} href={`/empresas/${company.id}`} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{company.tradeName || company.legalName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{company.legalName} · RFC {company.rfc}</p>
                  </div>
                  <div className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                    {pendingReview} por revisar
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">Ingresos: {currency(income)}</div>
                  <div className="rounded-2xl bg-rose-50 p-4 text-rose-800">Gastos: {currency(expense)}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <form action={createCompany} className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold">Crear empresa</h2>
          <p className="mt-2 text-sm text-slate-500">Datos fiscales minimos para validar XML.</p>
          <div className="mt-6 grid gap-3">
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="legalName" placeholder="Razon social" required />
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="tradeName" placeholder="Nombre comercial" />
            <input className="rounded-xl border border-slate-200 px-4 py-3 uppercase" name="rfc" placeholder="RFC" required />
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="taxRegime" placeholder="Regimen fiscal opcional" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="postalCode" placeholder="Codigo postal" />
            <button className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white" type="submit">Crear empresa</button>
          </div>
        </form>
      </section>
    </main>
  );
}
