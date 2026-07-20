"use client";

import { useEffect, useState } from "react";
import { deleteTransaction, updateTransaction } from "@/app/actions";
import { currency, paymentLabel } from "@/lib/format";

type ClientMovement = {
  id: string;
  companyId: string;
  date: string;
  displayDate: string;
  type: string;
  source: string;
  description: string;
  counterpartyName: string | null;
  total: number;
  paymentStatus: string;
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

  useEffect(() => {
    if (!selected) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="calm-table min-w-[720px]">
        <thead>
          <tr>
            <th className="py-3">Fecha</th>
            <th>Tipo</th>
            <th>Descripcion</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const canEdit = item.createdById === currentUserId;

            return (
              <tr
                className={canEdit ? "cursor-pointer" : ""}
                key={item.id}
                onClick={() => {
                  if (canEdit) setSelected(item);
                }}
              >
                <td className="py-4">{item.displayDate}</td>
                <td>{item.type === "income" ? "Ingreso" : "Gasto"}<br /><span className="text-xs text-slate-400">{item.source}</span></td>
                <td>
                  <span className="font-medium">{item.description}</span><br />
                  <span className="text-xs text-slate-500">{item.counterpartyName || "Sin contraparte"}</span>
                </td>
                <td className="font-medium">{currency(item.total)}</td>
                <td>{paymentLabel(item.paymentStatus, item.type)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {transactions.length === 0 ? (
        <div className="calm-empty">
          Aun no hay registros capturados.
        </div>
      ) : null}

      {selected ? (
        <div className="calm-modal-backdrop">
          <form action={updateTransaction} className="calm-modal">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar registro</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{selected.type === "income" ? "Ingreso" : "Gasto"}</h2>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setSelected(null)} type="button">
                ×
              </button>
            </div>

            <input type="hidden" name="companyId" value={selected.companyId} />
            <input type="hidden" name="transactionId" value={selected.id} />
            <input type="hidden" name="type" value={selected.type} />

            <div className="mt-6 grid gap-3">
              <input className="calm-input" name="total" type="number" step="0.01" min="0" defaultValue={selected.total} placeholder="Monto" required />
              <input className="calm-input" name="date" type="date" defaultValue={selected.date} required />
              <input className="calm-input" name="description" defaultValue={selected.description} placeholder="Descripcion" required />
              <input className="calm-input" name="counterpartyName" defaultValue={selected.counterpartyName ?? ""} placeholder="Contraparte opcional" />
              {selected.type === "expense" ? (
                <select className="calm-input" name="categoryName" defaultValue="Sin clasificar">
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              ) : null}
              <select className="calm-input" name="paymentStatus" defaultValue={selected.paymentStatus}>
                <option value={selected.type === "income" ? "collected" : "paid"}>{selected.type === "income" ? "Cobrado" : "Pagado"}</option>
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
