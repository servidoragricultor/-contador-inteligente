"use client";

import { deleteCompany } from "@/app/actions";

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  return (
    <form
      action={deleteCompany}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Estas seguro de eliminar el cliente "${companyName}"? Esta accion eliminara sus ingresos, gastos y XML registrados.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="companyId" value={companyId} />
      <button
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
        type="submit"
      >
        Eliminar
      </button>
    </form>
  );
}
