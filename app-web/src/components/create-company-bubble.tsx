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

    if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) return;

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
          <div aria-labelledby="create-company-title" aria-modal="true" className="calm-modal w-[min(92vw,430px)]" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Perfil fiscal SAT</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="create-company-title">Registrar cliente</h2>
                <p className="calm-muted mt-1 text-sm leading-6">La constancia completa RFC, nombre fiscal, regimen y codigo postal.</p>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setIsOpen(false)} type="button">
                ×
              </button>
            </div>

            <form action={createCompany} className="mt-6 grid gap-4">
              <label
                className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition ${
                  isDragging || fileName ? "border-emerald-400 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }`}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDrop={handleDrop}
              >
                <span className="text-sm font-semibold text-slate-800">Arrastra la constancia fiscal PDF</span>
                <span className="calm-muted mt-1 text-xs">o haz clic para seleccionarla</span>
                <span className="mt-3 max-w-full truncate text-xs font-medium text-emerald-700">{fileName || "Lectura automatica"}</span>
                <input
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  name="fiscalConstancy"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
                  ref={fileInputRef}
                  type="file"
                />
              </label>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>Datos manuales de respaldo</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <label className="calm-field">Nombre o razon social
                <input className="calm-input font-normal" name="legalName" placeholder="Se completa desde la constancia" />
              </label>
              <label className="calm-field">Nombre comercial <span className="calm-help">Opcional</span>
                <input className="calm-input font-normal" name="tradeName" placeholder="Nombre usado para identificar al cliente" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="calm-field">RFC
                  <input className="calm-input font-normal uppercase" name="rfc" placeholder="AICK911004HR5" />
                </label>
                <label className="calm-field">Codigo postal
                  <input className="calm-input font-normal" inputMode="numeric" maxLength={5} name="postalCode" placeholder="00000" />
                </label>
              </div>
              <label className="calm-field">Regimen fiscal
                <input className="calm-input font-normal" name="taxRegime" placeholder="Clave SAT, por ejemplo 626" />
              </label>

              <button className="calm-button-primary mt-2 w-full" type="submit">
                Crear perfil fiscal
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
