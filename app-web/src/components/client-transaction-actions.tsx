"use client";

import { useEffect, useRef, useState } from "react";
import { deleteTransaction, updateTransaction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

type TransactionActionProps = {
  transaction: {
    id: string;
    companyId: string;
    type: string;
    date: string;
    description: string;
    counterpartyName: string | null;
    total: number;
    paymentStatus: string;
  };
  categories: string[];
};

export function ClientTransactionActions({ transaction, categories }: TransactionActionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const dialogRef = useRef<HTMLFormElement>(null);
  useDialogFocus(isEditing, dialogRef);
  useUnsavedChanges(isDirty);

  function closeDialog() {
    if (isDirty && !window.confirm("¿Quieres cerrar sin guardar los cambios?")) return;
    setIsEditing(false);
    setIsDirty(false);
  }

  useEffect(() => {
    if (!isEditing) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isDirty || window.confirm("¿Quieres cerrar sin guardar los cambios?")) {
          setIsEditing(false);
          setIsDirty(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, isDirty]);

  return (
    <div className="relative inline-flex">
      <button
        className="calm-button-primary px-4 py-2 text-xs"
        onClick={() => setIsEditing(true)}
        type="button"
      >
        Editar
      </button>

      {isEditing ? (
        <div className="calm-modal-backdrop">
          <form action={updateTransaction} aria-labelledby="transaction-edit-title" aria-modal="true" className="calm-modal" onChange={() => setIsDirty(true)} onSubmit={() => setIsDirty(false)} ref={dialogRef} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar registro</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="transaction-edit-title">{transaction.type === "income" ? "Ingreso" : "Gasto"}</h2>
              </div>
              <button className="calm-button-secondary px-3 py-1.5" onClick={closeDialog} type="button">
                Cerrar
              </button>
            </div>

            <input type="hidden" name="companyId" value={transaction.companyId} />
            <input type="hidden" name="transactionId" value={transaction.id} />
            <input type="hidden" name="type" value={transaction.type} />

            <div className="mt-6 grid gap-3">
              <label className="calm-field">Monto<input autoComplete="off" className="calm-input" inputMode="decimal" name="total" type="number" step="0.01" min="0" defaultValue={transaction.total} required /></label>
              <label className="calm-field">Fecha<input autoComplete="off" className="calm-input" name="date" type="date" defaultValue={transaction.date} required /></label>
              <label className="calm-field">Descripcion<input autoComplete="off" className="calm-input" name="description" defaultValue={transaction.description} required /></label>
              <label className="calm-field">Contraparte <span className="calm-help">Opcional</span><input autoComplete="off" className="calm-input" name="counterpartyName" defaultValue={transaction.counterpartyName ?? ""} /></label>
              {transaction.type === "expense" ? (
                <label className="calm-field">Categoria<select autoComplete="off" className="calm-input" name="categoryName" defaultValue="Sin clasificar">
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select></label>
              ) : null}
              <label className="calm-field">Estado de pago<select autoComplete="off" className="calm-input" name="paymentStatus" defaultValue={transaction.paymentStatus}>
                <option value={transaction.type === "income" ? "collected" : "paid"}>{transaction.type === "income" ? "Cobrado" : "Pagado"}</option>
                <option value="pending">Pendiente</option>
              </select></label>
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
