"use client";

import { useEffect, useState } from "react";
import { deleteCompany } from "@/app/actions";

export function ClientCardMenu({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-label={`Acciones de ${companyName}`}
        className="calm-icon-button"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        ⋯
      </button>
      {isOpen ? <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-md">
        <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50" type="button">
          Editar
        </button>
        <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50" type="button">
          Archivar
        </button>
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
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50" type="submit">
            Eliminar
          </button>
        </form>
      </div> : null}
    </div>
  );
}
