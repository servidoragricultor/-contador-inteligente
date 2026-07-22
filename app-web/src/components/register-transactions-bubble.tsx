"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { createTransaction, importXml } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

export function RegisterTransactionsBubble({ companyId, categories }: { companyId: string; categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isOpen, dialogRef);
  useUnsavedChanges(isDirty);

  function closeDialog() {
    if (isDirty && !window.confirm("¿Quieres cerrar sin guardar los movimientos?")) return;
    setIsOpen(false);
    setIsDirty(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!isDirty || window.confirm("¿Quieres cerrar sin guardar los movimientos?")) {
          setIsOpen(false);
          setIsDirty(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDirty]);

  return (
    <div className="relative">
      <button
        aria-controls="register-movements-dialog"
        aria-expanded={isOpen}
        className="calm-button-primary w-full"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true">+</span> Registros
      </button>

      {isOpen ? (
        <div className="calm-modal-backdrop">
          <div aria-labelledby="register-movements-title" aria-modal="true" className="calm-modal w-[min(94vw,860px)] max-w-none" id="register-movements-dialog" ref={dialogRef} role="dialog">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="calm-eyebrow">Captura del cliente</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="register-movements-title">Registrar movimientos</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Alta rapida de ingresos, gastos o XML del cliente.</p>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={closeDialog} type="button">
                ×
              </button>
            </div>

            <RegisterTransactionsPanel categories={categories} companyId={companyId} onDirty={() => setIsDirty(true)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RegisterTransactionsPanel({
  companyId,
  categories,
  isScrollable = false,
  mode = "all",
  onDirty,
}: {
  companyId: string;
  categories: string[];
  isScrollable?: boolean;
  mode?: "all" | "income" | "expense" | "xml";
  onDirty?: () => void;
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useUnsavedChanges(hasUnsavedChanges);

  return (
    <div className={`mt-5 grid gap-5 pr-1 ${mode === "all" ? "lg:grid-cols-2" : "grid-cols-1"} ${isScrollable ? "max-h-[76vh] overflow-y-auto" : ""}`} onChange={() => { setHasUnsavedChanges(true); onDirty?.(); }}>
      {mode === "all" || mode === "income" ? <TransactionForm companyId={companyId} onSubmit={() => setHasUnsavedChanges(false)} type="income" categories={categories} /> : null}
      {mode === "all" || mode === "expense" ? <TransactionForm companyId={companyId} onSubmit={() => setHasUnsavedChanges(false)} type="expense" categories={categories} /> : null}
      {mode === "all" || mode === "xml" ? <XmlUploadForm companyId={companyId} onSubmit={() => setHasUnsavedChanges(false)} /> : null}
    </div>
  );
}

function XmlUploadForm({ companyId, onSubmit }: { companyId: string; onSubmit: () => void }) {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const validFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.name.toLowerCase().endsWith(".xml") || file.type === "text/xml" || file.type === "application/xml",
    );

    if (validFiles.length === 0) {
      setFileError("Selecciona uno o más archivos XML válidos.");
      return;
    }

    const files = new DataTransfer();
    validFiles.forEach((file) => files.items.add(file));

    if (fileInputRef.current) {
      fileInputRef.current.files = files.files;
    }

    setFileNames(validFiles.map((file) => file.name));
    setFileError(null);
  }

  return (
    <form action={importXml} className="calm-soft-box p-5 lg:col-span-2" onSubmit={onSubmit}>
      <div>
        <p className="calm-eyebrow">Documento fiscal</p>
        <h3 className="mt-2 text-lg font-semibold">Importar XML</h3>
        <p className="calm-muted mt-1 text-sm leading-6">Arrastra tu CFDI y crearemos el registro automaticamente.</p>
      </div>
      <input type="hidden" name="companyId" value={companyId} />
      <label
        className={`mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition duration-150 focus-within:ring-4 focus-within:ring-slate-950/10 ${isDragging ? "select-none" : ""} ${
          isDragging
            ? "border-emerald-600 bg-emerald-50"
            : fileNames.length > 0
              ? "border-emerald-300 bg-emerald-50/60"
              : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
        }`}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={handleDrop}
      >
        <span className="text-sm font-semibold text-slate-900">
          {fileNames.length > 0
            ? `${fileNames.length} XML ${fileNames.length === 1 ? "listo" : "listos"}`
            : "Arrastra aqui tus archivos XML"}
        </span>
        <span className="calm-muted mt-1 max-w-full truncate text-xs">{fileNames.length > 0 ? fileNames.join(", ") : "o haz clic para seleccionarlos"}</span>
        <span className="calm-muted mt-3 text-xs">Puedes cargar varios archivos .xml a la vez</span>
        <input
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          multiple
          name="xml"
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files ?? []);
            setFileNames(selectedFiles.map((file) => file.name));
            setFileError(null);
          }}
          ref={fileInputRef}
          type="file"
          required
        />
      </label>
      {fileError ? <div aria-live="polite" className="calm-alert-error mt-4">{fileError}</div> : null}
      <SubmitButton className="calm-button-primary mt-4 w-full" disabled={fileNames.length === 0} pendingLabel="Importando XML…">Importar XML</SubmitButton>
    </form>
  );
}

function TransactionForm({ companyId, onSubmit, type, categories }: { companyId: string; onSubmit: () => void; type: "income" | "expense"; categories: string[] }) {
  const isIncome = type === "income";
  const today = currentDateInMexico();

  return (
    <form action={createTransaction} className="calm-card p-5" onSubmit={onSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="calm-muted text-sm">{isIncome ? "Dinero que entra" : "Dinero que sale"}</p>
          <h3 className="mt-1 text-2xl font-semibold">{isIncome ? "Ingreso" : "Gasto"}</h3>
        </div>
        <span className={`calm-badge ${isIncome ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
          {isIncome ? "+" : "-"}
        </span>
      </div>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <div className="mt-4 grid gap-3">
        <label className="calm-field">Monto
          <input autoComplete="off" className="calm-input text-lg font-semibold" inputMode="decimal" name="total" type="number" step="0.01" min="0.01" placeholder="Ej. 1250.00…" required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="calm-field">Fecha
            <input autoComplete="off" className="calm-input font-normal" name="date" type="date" defaultValue={today} required />
          </label>
          <label className="calm-field">Estado de pago
            <select autoComplete="off" className="calm-input font-normal" name="paymentStatus" defaultValue={isIncome ? "collected" : "paid"}>
              <option value={isIncome ? "collected" : "paid"}>{isIncome ? "Cobrado" : "Pagado"}</option>
              <option value="pending">{isIncome ? "Pendiente" : "A credito / pendiente"}</option>
            </select>
          </label>
        </div>
        <label className="calm-field">Descripcion
          <input autoComplete="off" className="calm-input font-normal" name="description" placeholder={isIncome ? "Ej. Venta de productos…" : "Ej. Compra de insumos…"} required />
        </label>
        {!isIncome ? (
          <label className="calm-field">Categoria
            <select autoComplete="off" className="calm-input font-normal" name="categoryName" defaultValue="Sin clasificar">
              {categories.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        ) : null}
        <SubmitButton className="calm-button-primary mt-1 w-full" pendingLabel={isIncome ? "Guardando ingreso…" : "Guardando gasto…"}>
          {isIncome ? "Guardar ingreso" : "Guardar gasto"}
        </SubmitButton>
      </div>
    </form>
  );
}

function currentDateInMexico() {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Mexico_City",
    year: "numeric",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}
