"use client";

import { deleteCompany } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

export function DeleteCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  return (
    <form
      action={deleteCompany}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Estás seguro de eliminar el cliente “${companyName}”? Esta acción eliminará sus ingresos, gastos y XML registrados.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="companyId" value={companyId} />
      <SubmitButton
        className="calm-button-danger px-3 py-1.5 text-xs"
        pendingLabel="Eliminando…"
      >
        Eliminar
      </SubmitButton>
    </form>
  );
}
