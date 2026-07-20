"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MovementFiltersBubble({
  companyId,
  movementFilter,
}: {
  companyId: string;
  movementFilter: string;
}) {
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

  const options = [
    { href: `/empresas/${companyId}`, label: "Todos", value: "all" },
    { href: `/empresas/${companyId}?tipo=income`, label: "Ingresos", value: "income" },
    { href: `/empresas/${companyId}?tipo=expense`, label: "Gastos", value: "expense" },
  ];

  return (
    <div className="relative w-full sm:w-[180px]">
      <button
        aria-expanded={isOpen}
        className="calm-button-secondary flex w-full items-center justify-between"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <span>Filtros</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-12 z-20 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-md">
          {options.map((option) => (
            <Link
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                movementFilter === option.value ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-50"
              }`}
              href={option.href}
              key={option.value}
              onClick={() => setIsOpen(false)}
            >
              {option.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
