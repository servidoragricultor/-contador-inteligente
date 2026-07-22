"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClientInvitation, deleteCompany } from "@/app/actions";
import { InvitationLink } from "@/components/invitation-link";
import { SubmitButton } from "@/components/submit-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

export function ClientCardMenu({ companyId, companyName, hasAccess }: { companyId: string; companyName: string; hasAccess: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [invitationState, invitationAction, isCreatingInvitation] = useActionState(createClientInvitation, null);
  const dialogRef = useRef<HTMLFormElement>(null);
  useDialogFocus(isAccessOpen, dialogRef);

  useEffect(() => {
    if (!isOpen && !isAccessOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsAccessOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isAccessOpen]);

  return (
    <div className="relative">
      <button
        aria-controls={`client-menu-${companyId}`}
        aria-expanded={isOpen}
        aria-label={`Acciones de ${companyName}`}
        className="calm-icon-button"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        ⋯
      </button>
      {isOpen ? <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-md" id={`client-menu-${companyId}`}>
        {hasAccess ? (
          <span className="block px-3 py-2 text-sm font-medium text-emerald-700">Acceso activo</span>
        ) : (
          <button
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              setIsOpen(false);
              setIsAccessOpen(true);
            }}
            type="button"
          >
            Dar acceso
          </button>
        )}
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
          <SubmitButton className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50" pendingLabel="Eliminando…">Eliminar</SubmitButton>
        </form>
      </div> : null}
      {isAccessOpen ? createPortal(
        <div className="calm-modal-backdrop">
          <form
            action={invitationAction}
            aria-labelledby="client-access-title"
            aria-modal="true"
            className="calm-modal w-[min(92vw,430px)]"
            ref={dialogRef}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Portal del cliente</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="client-access-title">Generar invitacion</h2>
                <p className="calm-muted mt-1 text-sm leading-6">Crearemos un enlace seguro para que {companyName} registre su correo y elija su contrasena.</p>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setIsAccessOpen(false)} type="button">×</button>
            </div>

            <input name="companyId" type="hidden" value={companyId} />
            <div className="mt-6 grid gap-4">
              {invitationState?.token ? <InvitationLink token={invitationState.token} /> : null}
              {invitationState?.error ? <div className="calm-alert-error" role="alert">{invitationState.error}</div> : null}
              <div className="calm-soft-box text-sm leading-6 text-slate-700">El enlace funcionará una sola vez y vencerá en 7&nbsp;días. Generar uno nuevo invalidará el anterior.</div>
              <button className="calm-button-primary w-full" disabled={isCreatingInvitation} type="submit">
                {isCreatingInvitation ? <span className="inline-flex items-center gap-2" role="status"><span aria-hidden="true" className="calm-spinner" />Generando enlace…</span> : invitationState?.token ? "Generar otro enlace" : "Generar enlace"}
              </button>
            </div>
          </form>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
