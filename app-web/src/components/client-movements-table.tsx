"use client";

import { useEffect, useRef, useState } from "react";
import { deleteTransaction, updateTransaction } from "@/app/actions";
import { currency, paymentLabel } from "@/lib/format";
import { paymentFormLabel, paymentMethodLabel } from "@/lib/cfdi-classification";
import { SubmitButton } from "@/components/submit-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type ClientMovement = {
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
  total: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentForm: string | null;
  isCredit: boolean;
  reviewStatus: string;
  reviewNote: string | null;
  createdById: string;
};

export function ClientMovementsTable({
  categories,
  currentUserId,
  transactions,
}: {
  categories: string[];
  currentUserId: string;
  transactions: ClientMovement[];
}) {
  const [selected, setSelected] = useState<ClientMovement | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const dialogRef = useRef<HTMLFormElement>(null);
  useDialogFocus(Boolean(selected), dialogRef);
  useUnsavedChanges(isDirty);

  function closeDialog() {
    if (isDirty && !window.confirm("¿Quieres cerrar sin guardar los cambios?")) return;
    setSelected(null);
    setIsDirty(false);
  }

  function openDialog(item: ClientMovement) {
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
      <div className="ledger-register-guide" id="client-register-help">
        <p><strong>{transactions.length}</strong> {transactions.length === 1 ? "movimiento" : "movimientos"}</p>
        <p>Selecciona un registro para ver sus detalles o corregirlo.</p>
      </div>
      {transactions.length > 0 ? <div className="overflow-x-auto">
      <table aria-describedby="client-register-help" className="calm-table ledger-register responsive-table md:min-w-[760px]">
        <thead>
          <tr>
            <th className="py-3">Fecha</th>
            <th>Movimiento</th>
            <th>Clasificación</th>
            <th>Estado</th>
            <th className="text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const canEdit = item.createdById === currentUserId;

            return (
              <tr
                aria-label={canEdit ? `Editar ${item.type === "income" ? "ingreso" : "gasto"}: ${item.description}` : undefined}
                className={`calm-content-auto ledger-register-row ${canEdit ? "calm-table-row-interactive" : ""}`}
                data-kind={item.type}
                key={item.id}
                onClick={canEdit ? () => openDialog(item) : undefined}
                onKeyDown={canEdit ? (event) => {
                  if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  openDialog(item);
                } : undefined}
                tabIndex={canEdit ? 0 : undefined}
              >
                <td className="ledger-register-date" data-label="Fecha">{item.displayDate}</td>
                <td data-label="Movimiento">
                  <div className="ledger-register-concept">
                    <span className={`ledger-kind ${item.type === "income" ? "ledger-kind-income" : "ledger-kind-expense"}`}>{item.type === "income" ? "Ingreso" : "Gasto"}</span>
                    <span className="font-semibold">{item.description}</span>
                    <span className="calm-muted text-xs">{item.counterpartyName || "Sin contraparte"}</span>
                    {!canEdit ? <span className="calm-muted text-xs">Solo lectura</span> : null}
                  </div>
                </td>
                <td data-label="Clasificación">
                  <span className="font-medium">{item.categoryName || (item.type === "income" ? "Ingreso general" : "Sin clasificar")}</span>
                  <span className="calm-muted mt-1 block text-xs">{movementSourceLabel(item.source)}</span>
                </td>
                <td data-label="Estado">
                  <span className={`ledger-status ${item.isCredit ? "ledger-status-warning" : "ledger-status-neutral"}`}>{paymentLabel(item.paymentStatus, item.type)}</span>
                  {item.isCredit ? <span className="ledger-register-note ledger-register-note-warning">Cuenta por pagar</span> : null}
                  {item.reviewStatus === "correction_required" ? <span className="ledger-register-note ledger-register-note-error">Requiere corrección</span> : null}
                  {item.paymentMethod || item.paymentForm ? (
                    <span className="calm-muted mt-1.5 block max-w-48 text-xs leading-5">
                      <span translate="no">{paymentMethodLabel(item.paymentMethod)}<br />{paymentFormLabel(item.paymentForm)}</span>
                    </span>
                  ) : null}
                </td>
                <td className={`ledger-register-amount ${item.type === "income" ? "ledger-amount-income" : "ledger-amount-expense"}`} data-label="Importe">
                  <span aria-hidden="true">{item.type === "income" ? "+" : "−"}</span>{currency(item.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div> : null}
      {transactions.length === 0 ? (
        <div className="calm-empty">
          Aún no hay movimientos. Registra un ingreso, un gasto o importa un XML para comenzar.
        </div>
      ) : null}

      {selected ? (
        <div className="calm-modal-backdrop">
          <form action={updateTransaction} aria-labelledby="client-movement-title" aria-modal="true" className="calm-modal" onChange={() => setIsDirty(true)} onSubmit={() => setIsDirty(false)} ref={dialogRef} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar registro</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="client-movement-title">{selected.type === "income" ? "Ingreso" : "Gasto"}</h2>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={closeDialog} type="button">
                ×
              </button>
            </div>

            <input type="hidden" name="companyId" value={selected.companyId} />
            <input type="hidden" name="transactionId" value={selected.id} />
            <input type="hidden" name="type" value={selected.type} />

            <div className="mt-6 grid gap-3">
              <label className="calm-field">Monto<input autoComplete="off" className="calm-input font-normal" inputMode="decimal" name="total" type="number" step="0.01" min="0" defaultValue={selected.total} required /></label>
              <label className="calm-field">Fecha<input autoComplete="off" className="calm-input font-normal" name="date" type="date" defaultValue={selected.date} required /></label>
              <label className="calm-field">Descripcion<input autoComplete="off" className="calm-input font-normal" name="description" defaultValue={selected.description} required /></label>
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
                  <p><span className="calm-muted">RFC contraparte:</span> {selected.counterpartyRfc || "No indicado"}</p>
                  <p><span className="calm-muted">Metodo:</span> <span translate="no">{paymentMethodLabel(selected.paymentMethod)}</span></p>
                  <p><span className="calm-muted">Forma:</span> <span translate="no">{paymentFormLabel(selected.paymentForm)}</span></p>
                  {selected.categoryName ? <p><span className="calm-muted">Categoria sugerida:</span> {selected.categoryName}</p> : null}
                </div>
              ) : null}
              {selected.reviewStatus === "correction_required" ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                  <p className="font-semibold">Tu CFDI tiene una alerta fiscal</p>
                  <p className="mt-1 text-xs leading-5 text-rose-700">{selected.reviewNote || "Revisa los datos fiscales del XML con tu contador."}</p>
                </div>
              ) : null}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <SubmitButton
                  className="calm-button-danger w-full sm:w-auto"
                  formAction={deleteTransaction}
                  onClick={(event) => {
                    if (!window.confirm("Seguro que quieres eliminar este registro?")) {
                      event.preventDefault();
                    }
                  }}
                  pendingLabel="Eliminando registro…"
                >
                  Eliminar registro
                </SubmitButton>
                <SubmitButton className="calm-button-primary w-full sm:w-auto" pendingLabel="Guardando cambios…">Guardar cambios</SubmitButton>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function movementSourceLabel(source: string) {
  return source === "xml" ? "Importado desde CFDI" : "Captura manual";
}
