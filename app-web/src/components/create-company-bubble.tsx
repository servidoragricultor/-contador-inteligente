"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { createCompany } from "@/app/actions";

export function CreateCompanyBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (!file || file.type !== "application/pdf") return;

    const files = new DataTransfer();
    files.items.add(file);

    if (fileInputRef.current) {
      fileInputRef.current.files = files.files;
    }

    setFileName(file.name);
  }

  return (
    <div className="relative">
      <button
        className="calm-button-primary w-full"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        + Crear cliente
      </button>

      {isOpen ? (
        <div className="calm-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="calm-modal w-[min(92vw,430px)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
            <div>
              <p className="calm-eyebrow">Area del contador</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Registrar cliente</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Solo el nombre es obligatorio. Puedes adjuntar su constancia fiscal en PDF.</p>
            </div>
            <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setIsOpen(false)} type="button">
              ×
            </button>
          </div>

          <form action={createCompany} className="mt-6 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Nombre o razon social *
              <input className="calm-input font-normal" name="legalName" placeholder="Ej. Abarrotes San Juan" required />
            </label>
            <input className="calm-input" name="tradeName" placeholder="Nombre comercial" />
            <input className="calm-input uppercase" name="rfc" placeholder="RFC opcional" />
            <input className="calm-input" name="taxRegime" placeholder="Regimen fiscal opcional" />
            <input className="calm-input" name="postalCode" placeholder="Codigo postal" />

            <label
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-7 text-center transition ${
                isDragging ? "border-slate-500 bg-slate-100" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
            >
              <span className="text-sm font-semibold text-slate-800">Arrastra aqui la constancia fiscal PDF</span>
              <span className="mt-1 text-xs text-slate-500">o haz clic para seleccionarla</span>
              <span className="mt-3 max-w-full truncate text-xs font-medium text-slate-500">{fileName || "PDF opcional"}</span>
              <input
                accept="application/pdf,.pdf"
                className="sr-only"
                name="fiscalConstancy"
                onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
                ref={fileInputRef}
                type="file"
              />
            </label>

            <button className="calm-button-primary mt-2 w-full" type="submit">
              Guardar cliente
            </button>
          </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
