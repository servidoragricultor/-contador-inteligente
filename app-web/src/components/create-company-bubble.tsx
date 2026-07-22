"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { createCompany } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { FormError } from "@/components/form-error";

export function CreateCompanyBubble({ errorMessage }: { errorMessage?: string }) {
  const [isOpen, setIsOpen] = useState(Boolean(errorMessage));
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialogRef);
  useUnsavedChanges(isDirty);

  function closeDialog() {
    if (isDirty && !window.confirm("¿Quieres cerrar sin guardar los datos del cliente?")) return;
    setIsOpen(false);
    setIsDirty(false);
    setFileError(null);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isDirty || window.confirm("¿Quieres cerrar sin guardar los datos del cliente?")) {
          setIsOpen(false);
          setIsDirty(false);
          setFileError(null);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty]);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) {
      setFileError("Selecciona un archivo PDF válido.");
      return;
    }

    const files = new DataTransfer();
    files.items.add(file);

    if (fileInputRef.current) {
      fileInputRef.current.files = files.files;
    }

    setFileName(file.name);
    setFileError(null);
    setIsDirty(true);
  }

  return (
    <div className="relative">
      <button
        aria-controls="create-company-dialog"
        aria-expanded={isOpen}
        className="calm-button-primary w-full"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">+</span> Crear cliente
      </button>

      {isOpen ? (
        <div className="calm-modal-backdrop">
          <div aria-labelledby="create-company-title" aria-modal="true" className="calm-modal w-[min(92vw,430px)]" id="create-company-dialog" ref={dialogRef} role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="calm-eyebrow">Perfil fiscal SAT</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="create-company-title">Registrar cliente</h2>
                <p className="calm-muted mt-1 text-sm leading-6">La constancia completa RFC, nombre fiscal, regimen y codigo postal.</p>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={closeDialog} type="button">
                ×
              </button>
            </div>

            <form action={createCompany} className="mt-6 grid gap-4" onChange={() => setIsDirty(true)} onSubmit={() => setIsDirty(false)}>
              {errorMessage ? <FormError>{errorMessage}</FormError> : null}
              <label
                className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition focus-within:ring-4 focus-within:ring-slate-950/10 ${isDragging ? "select-none" : ""} ${
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
                  onChange={(event) => {
                    setFileName(event.target.files?.[0]?.name ?? null);
                    setFileError(null);
                  }}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
              {fileError ? <div aria-live="polite" className="calm-alert-error">{fileError}</div> : null}

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>Datos manuales de respaldo</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <label className="calm-field">Nombre o razon social
                <input autoComplete="off" className="calm-input font-normal" name="legalName" placeholder="Ej. Comercializadora del Centro…" />
              </label>
              <label className="calm-field">Nombre comercial <span className="calm-help">Opcional</span>
                <input autoComplete="off" className="calm-input font-normal" name="tradeName" placeholder="Ej. Tienda Centro…" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="calm-field">RFC
                  <input autoComplete="off" className="calm-input font-normal uppercase" name="rfc" placeholder="Ej. AICK911004HR5…" spellCheck={false} />
                </label>
                <label className="calm-field">Codigo postal
                  <input autoComplete="postal-code" className="calm-input font-normal" inputMode="numeric" maxLength={5} name="postalCode" placeholder="Ej. 00000…" />
                </label>
              </div>
              <label className="calm-field">Regimen fiscal
                <input autoComplete="off" className="calm-input font-normal" inputMode="numeric" name="taxRegime" placeholder="Ej. 626…" spellCheck={false} />
              </label>

              <SubmitButton className="calm-button-primary mt-2 w-full" pendingLabel="Creando perfil…">Crear perfil fiscal</SubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
