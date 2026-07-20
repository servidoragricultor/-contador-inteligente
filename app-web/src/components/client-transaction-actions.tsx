"use client";

import { useEffect, useState } from "react";
import { deleteTransaction, updateTransaction } from "@/app/actions";

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

  useEffect(() => {
    if (!isEditing) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsEditing(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing]);

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
          <form action={updateTransaction} className="calm-modal">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar registro</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{transaction.type === "income" ? "Ingreso" : "Gasto"}</h2>
              </div>
              <button className="calm-button-secondary px-3 py-1.5" onClick={() => setIsEditing(false)} type="button">
                Cerrar
              </button>
            </div>

            <input type="hidden" name="companyId" value={transaction.companyId} />
            <input type="hidden" name="transactionId" value={transaction.id} />
            <input type="hidden" name="type" value={transaction.type} />

            <div className="mt-6 grid gap-3">
              <input className="calm-input" name="total" type="number" step="0.01" min="0" defaultValue={transaction.total} placeholder="Monto" required />
              <input className="calm-input" name="date" type="date" defaultValue={transaction.date} required />
              <input className="calm-input" name="description" defaultValue={transaction.description} placeholder="Descripcion" required />
              <input className="calm-input" name="counterpartyName" defaultValue={transaction.counterpartyName ?? ""} placeholder="Contraparte opcional" />
              {transaction.type === "expense" ? (
                <select className="calm-input" name="categoryName" defaultValue="Sin clasificar">
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              ) : null}
              <select className="calm-input" name="paymentStatus" defaultValue={transaction.paymentStatus}>
                <option value={transaction.type === "income" ? "collected" : "paid"}>{transaction.type === "income" ? "Cobrado" : "Pagado"}</option>
                <option value="pending">Pendiente</option>
              </select>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  className="calm-button-danger w-full sm:w-auto"
                  formAction={deleteTransaction}
                  onClick={(event) => {
                    if (!window.confirm("Seguro que quieres eliminar este registro?")) {
                      event.preventDefault();
                    }
                  }}
                  type="submit"
                >
                  Eliminar registro
                </button>
                <button className="calm-button-primary w-full sm:w-auto" type="submit">
                  Guardar cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
