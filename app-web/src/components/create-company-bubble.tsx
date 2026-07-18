"use client";

import { DragEvent, useRef, useState } from "react";
import { createCompany } from "@/app/actions";

export function CreateCompanyBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        + Crear cliente
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-14 z-20 w-[min(92vw,430px)] rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Area del contador</p>
              <h2 className="mt-2 text-2xl font-semibold">Registrar cliente</h2>
              <p className="mt-1 text-sm text-slate-500">Solo el nombre es obligatorio. Puedes adjuntar su constancia fiscal en PDF.</p>
            </div>
            <button className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600" onClick={() => setIsOpen(false)} type="button">
              Cerrar
            </button>
          </div>

          <form action={createCompany} className="mt-6 grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Nombre o razon social *
              <input className="rounded-xl border border-slate-200 px-4 py-3 font-normal" name="legalName" placeholder="Ej. Abarrotes San Juan" required />
            </label>
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="tradeName" placeholder="Nombre comercial" />
            <input className="rounded-xl border border-slate-200 px-4 py-3 uppercase" name="rfc" placeholder="RFC opcional" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="taxRegime" placeholder="Regimen fiscal opcional" />
            <input className="rounded-xl border border-slate-200 px-4 py-3" name="postalCode" placeholder="Codigo postal" />

            <label
              className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-7 text-center transition ${
                isDragging ? "border-blue-500 bg-blue-100" : "border-blue-300 bg-blue-50 hover:bg-blue-100"
              }`}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
            >
              <span className="text-sm font-semibold text-blue-800">Arrastra aqui la constancia fiscal PDF</span>
              <span className="mt-1 text-xs text-blue-600">o haz clic para seleccionarla</span>
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

            <button className="mt-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700" type="submit">
              Guardar cliente
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
