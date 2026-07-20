"use client";

import { useEffect, useState } from "react";
import { deleteTransaction, updateTransaction } from "@/app/actions";
import { currency, paymentLabel } from "@/lib/format";
import { paymentFormLabel, paymentMethodLabel } from "@/lib/cfdi-classification";

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
      <table className="calm-table responsive-table md:min-w-[720px]">
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
                className={`${canEdit ? "cursor-pointer" : ""} ${item.reviewStatus === "correction_required" ? "bg-rose-50/80 hover:bg-rose-50" : item.isCredit ? "bg-amber-50/70 hover:bg-amber-50" : ""}`}
                key={item.id}
                onClick={() => {
                  if (canEdit) setSelected(item);
                }}
                onKeyDown={(event) => {
                  if (canEdit && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setSelected(item);
                  }
                }}
                tabIndex={canEdit ? 0 : undefined}
              >
                <td className="py-4" data-label="Fecha">{item.displayDate}</td>
                <td data-label="Tipo">{item.type === "income" ? "Ingreso" : "Gasto"}<br /><span className="text-xs text-slate-500">{item.source}</span></td>
                <td data-label="Descripcion">
                  <span className="font-medium">{item.description}</span><br />
                  <span className="text-xs text-slate-500">{item.counterpartyName || "Sin contraparte"}</span>
                  {item.reviewStatus === "correction_required" ? <span className="calm-badge mt-1 block w-fit bg-rose-100 text-rose-800">Requiere correccion</span> : null}
                </td>
                <td className="font-medium tabular-nums" data-label="Total">{currency(item.total)}</td>
                <td data-label="Estado">
                  <span className="font-medium">{paymentLabel(item.paymentStatus, item.type)}</span>
                  {item.isCredit ? <span className="calm-badge mt-1 block w-fit bg-amber-100 text-amber-800">A credito</span> : null}
                  {item.paymentMethod || item.paymentForm ? (
                    <span className="calm-muted mt-1 block max-w-48 text-xs">
                      {paymentMethodLabel(item.paymentMethod)}<br />{paymentFormLabel(item.paymentForm)}
                    </span>
                  ) : null}
                </td>
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
        <div className="calm-modal-backdrop" onClick={() => setSelected(null)}>
          <form action={updateTransaction} aria-labelledby="client-movement-title" aria-modal="true" className="calm-modal" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar registro</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="client-movement-title">{selected.type === "income" ? "Ingreso" : "Gasto"}</h2>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setSelected(null)} type="button">
                ×
              </button>
            </div>

            <input type="hidden" name="companyId" value={selected.companyId} />
            <input type="hidden" name="transactionId" value={selected.id} />
            <input type="hidden" name="type" value={selected.type} />

            <div className="mt-6 grid gap-3">
              <label className="calm-field">Monto<input className="calm-input font-normal" name="total" type="number" step="0.01" min="0" defaultValue={selected.total} required /></label>
              <label className="calm-field">Fecha<input className="calm-input font-normal" name="date" type="date" defaultValue={selected.date} required /></label>
              <label className="calm-field">Descripcion<input className="calm-input font-normal" name="description" defaultValue={selected.description} required /></label>
              {selected.type === "expense" ? (
                <label className="calm-field">Categoria<select className="calm-input font-normal" name="categoryName" defaultValue={selected.categoryName ?? "Sin clasificar"}>
                  {categories.map((name) => <option key={name} value={name}>{name}</option>)}
                </select></label>
              ) : null}
              <label className="calm-field">Estado de pago<select className="calm-input font-normal" name="paymentStatus" defaultValue={selected.paymentStatus}>
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
                  <p><span className="calm-muted">Metodo:</span> {paymentMethodLabel(selected.paymentMethod)}</p>
                  <p><span className="calm-muted">Forma:</span> {paymentFormLabel(selected.paymentForm)}</p>
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
