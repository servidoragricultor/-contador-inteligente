"use client";

import { useEffect, useState } from "react";
import { updateReviewStatus, updateTransaction } from "@/app/actions";
import { currency, paymentLabel } from "@/lib/format";

type AccountantMovement = {
  id: string;
  companyId: string;
  date: string;
  displayDate: string;
  type: string;
  source: string;
  description: string;
  counterpartyName: string | null;
  fiscalUuid: string | null;
  total: number;
  paymentStatus: string;
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
      <table className="calm-table min-w-[850px]">
        <thead>
          <tr>
            <th className="py-3">Fecha</th>
            <th>Tipo</th>
            <th>Descripcion</th>
            <th>Total</th>
            <th>Pago</th>
            <th>Revision</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr className="cursor-pointer" key={item.id} onClick={() => setSelected(item)}>
              <td className="py-4">{item.displayDate}</td>
              <td>{item.type === "income" ? "Ingreso" : "Gasto"}<br /><span className="text-xs text-slate-400">{item.source}</span></td>
              <td>
                <span className="font-medium">{item.description}</span><br />
                <span className="text-xs text-slate-500">{item.counterpartyName || "Sin contraparte"}</span>
                {item.fiscalUuid ? <span className="mt-1 block text-xs text-blue-600">UUID {item.fiscalUuid}</span> : null}
              </td>
              <td className="font-medium">{currency(item.total)}</td>
              <td>{paymentLabel(item.paymentStatus, item.type)}</td>
              <td>
                <form action={updateReviewStatus} onClick={(event) => event.stopPropagation()}>
                  <input type="hidden" name="companyId" value={item.companyId} />
                  <input type="hidden" name="transactionId" value={item.id} />
                  <button
                    aria-label={item.reviewStatus === "reviewed" ? "Marcar como no revisado" : "Marcar como revisado"}
                    className={`grid h-8 w-8 place-items-center rounded-lg border transition duration-150 ${
                      item.reviewStatus === "reviewed"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-slate-200 bg-white text-transparent hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    name="reviewStatus"
                    type="submit"
                    value={item.reviewStatus === "reviewed" ? "unreviewed" : "reviewed"}
                  >
                    ✓
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 ? (
        <div className="calm-empty">
          No hay movimientos para este filtro.
        </div>
      ) : null}

      {selected ? (
        (() => {
          const isReviewed = selected.reviewStatus === "reviewed";
          const nextReviewStatus = isReviewed ? "unreviewed" : "reviewed";

          return (
        <div className="calm-modal-backdrop" onClick={() => setSelected(null)}>
          <form action={updateTransaction} className="calm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Editar y revisar</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{selected.type === "income" ? "Ingreso" : "Gasto"} registrado</h2>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setSelected(null)} type="button">
                ×
              </button>
            </div>

            <input type="hidden" name="companyId" value={selected.companyId} />
            <input type="hidden" name="transactionId" value={selected.id} />
            <input type="hidden" name="type" value={selected.type} />
            <input type="hidden" name="reviewStatus" value={selected.reviewStatus} />

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

              <div className="calm-soft-box mt-2 grid gap-3 p-4">
                <div>
                  <p className="calm-eyebrow">Accion</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">Revision contable</p>
                </div>
                <textarea className="calm-input min-h-24" name="reviewNote" defaultValue={selected.reviewNote ?? ""} placeholder="Nota opcional para correccion" />
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

              <button className="calm-button-primary mt-2 w-full" type="submit">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
          );
        })()
      ) : null}
    </div>
  );
}
