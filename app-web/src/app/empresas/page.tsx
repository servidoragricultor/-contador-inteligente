import Link from "next/link";
import { logout } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currency } from "@/lib/format";
import { DeleteCompanyButton } from "@/components/delete-company-button";
import { CreateCompanyBubble } from "@/components/create-company-bubble";

const errorMessages: Record<string, string> = {
  empresa: "No se pudo crear el cliente. Revisa que el nombre tenga al menos 2 caracteres y que el RFC, si lo escribes, tenga 12 o 13 caracteres.",
  "sin-permiso": "No tienes permiso para eliminar este cliente.",
};

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { error } = await searchParams;
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
          <div className="mb-4">
            <CreateCompanyBubble />
          </div>
          <p className="text-sm text-slate-500">Sesion activa</p>
          <h1 className="text-3xl font-semibold">Clientes de {user.name}</h1>
        </div>
        <form action={logout}>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium" type="submit">Salir</button>
        </form>
      </header>

      <section className="mt-8">
        <div className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {error && errorMessages[error] ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
              {errorMessages[error]}
            </div>
          ) : null}
          {memberships.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 sm:col-span-2">
              Aun no tienes empresas. Crea la primera para comenzar.
            </div>
          ) : memberships.map(({ company }) => {
            const income = company.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.total, 0);
            const expense = company.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.total, 0);
            const pendingReview = company.transactions.filter((item) => item.reviewStatus !== "reviewed").length;

            return (
              <div key={company.id} className="flex min-h-[240px] w-full max-w-[420px] flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/empresas/${company.id}`} className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold">{company.tradeName || company.legalName}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{company.legalName}</p>
                    <p className="mt-1 text-xs text-slate-400">RFC {company.rfc || "pendiente"}</p>
                  </Link>
                  <DeleteCompanyButton companyId={company.id} companyName={company.tradeName || company.legalName} />
                </div>
                <Link href={`/empresas/${company.id}`} className="mt-auto grid gap-3 pt-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
                      <p className="text-xs opacity-70">Ingresos</p>
                      <p className="mt-1 truncate text-sm font-semibold">{currency(income)}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-3 text-rose-800">
                      <p className="text-xs opacity-70">Gastos</p>
                      <p className="mt-1 truncate text-sm font-semibold">{currency(expense)}</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-700">
                    {pendingReview} por revisar
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

      </section>
    </main>
  );
}
