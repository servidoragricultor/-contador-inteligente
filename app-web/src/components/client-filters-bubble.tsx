"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ClientFiltersBubble({
  cardViewHref,
  filtro,
  orden,
  q,
  tableViewHref,
  vista,
}: {
  cardViewHref: string;
  filtro: string;
  orden: string;
  q: string;
  tableViewHref: string;
  vista: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFilters = Number(filtro !== "todos") + Number(orden !== "recientes");

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
    <div className="relative lg:w-[220px]">
      <button
        aria-expanded={isOpen}
        className="calm-button-secondary flex w-full items-center justify-between"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <span>{activeFilters > 0 ? `Filtros (${activeFilters})` : "Filtros"}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen ? (
        <div className="calm-modal absolute right-0 top-12 z-20 w-[min(92vw,360px)] max-w-none">
          <form className="grid gap-4">
            <input type="hidden" name="vista" value={vista} />
            <input type="hidden" name="q" value={q} />
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Filtrar
              <select className="calm-input font-normal" name="filtro" defaultValue={filtro} aria-label="Filtrar clientes">
                <option value="todos">Todos</option>
                <option value="pendientes">Con pendientes</option>
                <option value="rfc">RFC pendiente</option>
                <option value="positivo">Saldo positivo</option>
              </select>
            </label>
            <div className="grid gap-2">
              <p className="text-sm font-medium text-slate-700">Vista</p>
              <div className="flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Selector de vista">
                <Link className={`calm-filter flex-1 text-center ${vista === "tabla" ? "calm-filter-idle" : "calm-filter-active"}`} href={cardViewHref}>Tarjetas</Link>
                <Link className={`calm-filter flex-1 text-center ${vista === "tabla" ? "calm-filter-active" : "calm-filter-idle"}`} href={tableViewHref}>Tabla</Link>
              </div>
            </div>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Ordenar
              <select className="calm-input font-normal" name="orden" defaultValue={orden} aria-label="Ordenar clientes">
                <option value="recientes">Mas recientes</option>
                <option value="nombre">Nombre</option>
                <option value="pendientes">Pendientes</option>
              </select>
            </label>
            <button className="calm-button-primary" type="submit">Aplicar filtros</button>
            {activeFilters > 0 ? <Link className="calm-button-secondary" href={`/empresas?q=${encodeURIComponent(q)}&vista=${vista}`}>Restablecer</Link> : null}
          </form>
        </div>
      ) : null}
    </div>
  );
}
