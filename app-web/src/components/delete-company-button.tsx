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
        className="calm-button-danger px-3 py-1.5 text-xs"
        type="submit"
      >
        Eliminar
      </button>
    </form>
  );
}
