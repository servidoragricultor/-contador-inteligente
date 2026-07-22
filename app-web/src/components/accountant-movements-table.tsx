"use client";

import { useEffect, useRef, useState } from "react";
import { deleteTransaction, updateReviewStatus, updateTransaction } from "@/app/actions";
import { currency, paymentLabel } from "@/lib/format";
import { paymentFormLabel, paymentMethodLabel } from "@/lib/cfdi-classification";
import { SubmitButton } from "@/components/submit-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type AccountantMovement = {
  id: string;
  companyId: string;
  date: string;
  displayDate: string;
  type: string;
  source: string;
  description: string;
  counterpartyName: string | null;
  counterpartyRfc: string | null;
  categoryName: string | null;
  fiscalUuid: string | null;
  total: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentForm: string | null;
  isCredit: boolean;
  reviewStatus: string;
  reviewNote: string | null;
};

export function AccountantMovementsTable({
  categories,
  transactions,
}: {
  categories: string[];
  transactions: AccountantMovement[];
}) {
  const [selected, setSelected] = useState<AccountantMovement | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const dialogRef = useRef<HTMLFormElement>(null);
  useDialogFocus(Boolean(selected), dialogRef);
  useUnsavedChanges(isDirty);

  function closeDialog() {
    if (isDirty && !window.confirm("¿Quieres cerrar sin guardar los cambios?")) return;
    setSelected(null);
    setIsDirty(false);
  }

  function openDialog(item: AccountantMovement) {
    setIsDirty(false);
    setSelected(item);
  }

  useEffect(() => {
    if (!selected) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isDirty || window.confirm("¿Quieres cerrar sin guardar los cambios?")) {
          setSelected(null);
          setIsDirty(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected, isDirty]);

  return (
    <div className="mt-5">
      <div className="ledger-register-guide" id="accountant-register-help">
        <p><strong>{transactions.length}</strong> {transactions.length === 1 ? "movimiento" : "movimientos"}</p>
        <p>Selecciona una línea para editar. La revisión se cambia directamente en la última columna.</p>
      </div>
      {transactions.length > 0 ? <div className="overflow-x-auto">
      <table aria-describedby="accountant-register-help" className="calm-table ledger-register responsive-table md:min-w-[920px]">
        <thead>
          <tr>
            <th className="py-3">Fecha</th>
            <th>Movimiento</th>
            <th>Clasificación</th>
            <th>Estado</th>
            <th className="text-right">Importe</th>
            <th>Revision</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr
              aria-label={`Editar ${item.type === "income" ? "ingreso" : "gasto"}: ${item.description}`}
              className="calm-content-auto calm-table-row-interactive ledger-register-row"
              data-kind={item.type}
              key={item.id}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("button, input, select, textarea, a")) return;
                openDialog(item);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                openDialog(item);
              }}
              tabIndex={0}
            >
              <td className="ledger-register-date" data-label="Fecha">{item.displayDate}</td>
              <td data-label="Movimiento">
                <div className="ledger-register-concept">
                  <span className={`ledger-kind ${item.type === "income" ? "ledger-kind-income" : "ledger-kind-expense"}`}>{item.type === "income" ? "Ingreso" : "Gasto"}</span>
                  <span className="font-semibold">{item.description}</span>
                  <span className="calm-muted text-xs">{item.counterpartyName || "Sin contraparte"}</span>
                  {item.fiscalUuid ? <span className="ledger-register-code" translate="no">UUID {item.fiscalUuid}</span> : null}
                </div>
              </td>
              <td data-label="Clasificación">
                <span className="font-medium">{item.categoryName || (item.type === "income" ? "Ingreso general" : "Sin clasificar")}</span>
                <span className="calm-muted mt-1 block text-xs">{movementSourceLabel(item.source)}</span>
              </td>
              <td data-label="Estado">
                <span className={`ledger-status ${item.isCredit ? "ledger-status-warning" : "ledger-status-neutral"}`}>{paymentLabel(item.paymentStatus, item.type)}</span>
                {item.isCredit ? <span className="ledger-register-note ledger-register-note-warning">Cuenta por pagar</span> : null}
                {item.reviewStatus === "correction_required" ? <span className="ledger-register-note ledger-register-note-error">Alerta fiscal</span> : null}
                {item.paymentMethod || item.paymentForm ? (
                  <span className="calm-muted mt-1.5 block max-w-48 text-xs leading-5">
                    <span translate="no">{paymentMethodLabel(item.paymentMethod)}<br />{paymentFormLabel(item.paymentForm)}</span>
                  </span>
                ) : null}
              </td>
              <td className={`ledger-register-amount ${item.type === "income" ? "ledger-amount-income" : "ledger-amount-expense"}`} data-label="Importe">
                <span aria-hidden="true">{item.type === "income" ? "+" : "−"}</span>{currency(item.total)}
              </td>
              <td data-label="Revision">
                <form action={updateReviewStatus}>
                  <input type="hidden" name="companyId" value={item.companyId} />
                  <input type="hidden" name="transactionId" value={item.id} />
                  <SubmitButton
                    aria-label={item.reviewStatus === "reviewed" ? "Marcar como no revisado" : "Marcar como revisado"}
                    className={`ledger-review-control ${
                      item.reviewStatus === "reviewed"
                        ? "ledger-review-control-done"
                        : "ledger-review-control-pending"
                    }`}
                    name="reviewStatus"
                    pendingLabel="…"
                    value={item.reviewStatus === "reviewed" ? "unreviewed" : "reviewed"}
                  >
                    <span aria-hidden="true">{item.reviewStatus === "reviewed" ? "✓" : "○"}</span>
                    <span>{item.reviewStatus === "reviewed" ? "Revisado" : "Por revisar"}</span>
                  </SubmitButton>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div> : null}
      {transactions.length === 0 ? (
        <div className="calm-empty">
          No hay movimientos con este filtro. Prueba otra combinación o registra uno nuevo.
        </div>
      ) : null}

      {selected ? (
        (() => {
          const isReviewed = selected.reviewStatus === "reviewed";
          const nextReviewStatus = isReviewed ? "unreviewed" : "reviewed";

          return (
        <div className="calm-modal-backdrop">
          <form action={updateTransaction} aria-labelledby="accountant-movement-title" aria-modal="true" className="calm-modal" onChange={() => setIsDirty(true)} onSubmit={() => setIsDirty(false)} ref={dialogRef} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar y revisar</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="accountant-movement-title">{selected.type === "income" ? "Ingreso" : "Gasto"} registrado</h2>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={closeDialog} type="button">
                ×
              </button>
            </div>

            <input type="hidden" name="companyId" value={selected.companyId} />
            <input type="hidden" name="transactionId" value={selected.id} />
            <input type="hidden" name="type" value={selected.type} />
            <input type="hidden" name="reviewStatus" value={selected.reviewStatus} />

            <div className="mt-6 grid gap-3">
              <label className="calm-field">Monto<input autoComplete="off" className="calm-input font-normal" inputMode="decimal" name="total" type="number" step="0.01" min="0" defaultValue={selected.total} required /></label>
              <label className="calm-field">Fecha<input autoComplete="off" className="calm-input font-normal" name="date" type="date" defaultValue={selected.date} required /></label>
              <label className="calm-field">Descripcion<input autoComplete="off" className="calm-input font-normal" name="description" defaultValue={selected.description} required /></label>
              <label className="calm-field">Contraparte <span className="calm-help">Obtenida automaticamente del XML cuando aplica</span><input autoComplete="off" className="calm-input font-normal" name="counterpartyName" defaultValue={selected.counterpartyName ?? ""} /></label>
              {selected.type === "expense" ? (
                <label className="calm-field">Categoria<select autoComplete="off" className="calm-input font-normal" name="categoryName" defaultValue={selected.categoryName ?? "Sin clasificar"}>
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select></label>
              ) : null}
              <label className="calm-field">Estado de pago<select autoComplete="off" className="calm-input font-normal" name="paymentStatus" defaultValue={selected.paymentStatus}>
                <option value={selected.type === "income" ? "collected" : "paid"}>{selected.type === "income" ? "Cobrado" : "Pagado"}</option>
                <option value="pending">{selected.type === "expense" ? "A credito / pendiente" : "Pendiente"}</option>
              </select></label>

              {selected.isCredit ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">Cuenta por pagar activa</p>
                  <p className="mt-1 text-xs leading-5 text-amber-700">Cambia el estado a Pagado y guarda para retirarla de Gastos a credito.</p>
                </div>
              ) : null}

              {selected.source === "xml" ? (
                <div className="calm-soft-box grid gap-2 p-4 text-sm">
                  <p className="calm-eyebrow">Datos obtenidos del CFDI</p>
                  <p><span className="calm-muted">Contraparte:</span> {selected.counterpartyName || "Sin nombre"}</p>
                  <p><span className="calm-muted">RFC:</span> {selected.counterpartyRfc || "No indicado"}</p>
                  <p><span className="calm-muted">Metodo:</span> <span translate="no">{paymentMethodLabel(selected.paymentMethod)}</span></p>
                  <p><span className="calm-muted">Forma:</span> <span translate="no">{paymentFormLabel(selected.paymentForm)}</span></p>
                  {selected.categoryName ? <p><span className="calm-muted">Categoria sugerida:</span> {selected.categoryName}</p> : null}
                </div>
              ) : null}

              {selected.reviewStatus === "correction_required" ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  <p className="font-semibold">El CFDI requiere correccion fiscal</p>
                  <p className="mt-1 text-xs leading-5 text-rose-700">{selected.reviewNote || "Los datos del XML no coinciden con el perfil fiscal."}</p>
                </div>
              ) : null}

              <div className="calm-soft-box mt-2 grid gap-3 p-4">
                <div>
                  <p className="calm-eyebrow">Accion</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">Revision contable</p>
                </div>
                <label className="calm-field">Nota de revision <span className="calm-help">Opcional</span><textarea autoComplete="off" className="calm-input min-h-24 font-normal" name="reviewNote" defaultValue={selected.reviewNote ?? ""} placeholder="Ej. Verifica el RFC del registro…" /></label>
                <div>
                  <button
                    aria-pressed={isReviewed}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setSelected((current) => current ? { ...current, reviewStatus: nextReviewStatus } : current)}
                    type="button"
                  >
                    <span>Revisado</span>
                    <span
                      className={`relative h-6 w-11 rounded-full transition duration-150 ${
                        isReviewed ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                      aria-hidden="true"
                    >
                      <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out data-[checked=true]:translate-x-5" data-checked={isReviewed} />
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <SubmitButton
                  className="calm-button-danger w-full"
                  formAction={deleteTransaction}
                  onClick={(event) => {
                    if (!window.confirm("Seguro que quieres eliminar este registro? Esta accion no se puede deshacer.")) {
                      event.preventDefault();
                    }
                  }}
                  pendingLabel="Eliminando registro…"
                >
                  Eliminar registro
                </SubmitButton>
                <SubmitButton className="calm-button-primary w-full" pendingLabel="Guardando cambios…">Guardar cambios</SubmitButton>
              </div>
            </div>
          </form>
        </div>
          );
        })()
      ) : null}
    </div>
  );
}

function movementSourceLabel(source: string) {
  return source === "xml" ? "Importado desde CFDI" : "Captura manual";
}
