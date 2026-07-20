"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { createTransaction, importXml } from "@/app/actions";

export function RegisterTransactionsBubble({ companyId, categories }: { companyId: string; categories: string[] }) {
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

  return (
    <div className="relative">
      <button
        className="calm-button-primary w-full"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        + Registros
      </button>

      {isOpen ? (
        <div className="calm-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div aria-labelledby="register-movements-title" aria-modal="true" className="calm-modal w-[min(94vw,860px)] max-w-none" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="calm-eyebrow">Captura del cliente</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]" id="register-movements-title">Registrar movimientos</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Alta rapida de ingresos, gastos o XML del cliente.</p>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setIsOpen(false)} type="button">
                ×
              </button>
            </div>

            <RegisterTransactionsPanel categories={categories} companyId={companyId} />
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
}: {
  companyId: string;
  categories: string[];
  isScrollable?: boolean;
  mode?: "all" | "income" | "expense" | "xml";
}) {
  return (
    <div className={`mt-5 grid gap-5 pr-1 ${mode === "all" ? "lg:grid-cols-2" : "grid-cols-1"} ${isScrollable ? "max-h-[76vh] overflow-y-auto" : ""}`}>
      {mode === "all" || mode === "income" ? <TransactionForm companyId={companyId} type="income" categories={categories} /> : null}
      {mode === "all" || mode === "expense" ? <TransactionForm companyId={companyId} type="expense" categories={categories} /> : null}
      {mode === "all" || mode === "xml" ? <XmlUploadForm companyId={companyId} /> : null}
    </div>
  );
}

function XmlUploadForm({ companyId }: { companyId: string }) {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submitXml() {
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const validFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.name.toLowerCase().endsWith(".xml") || file.type === "text/xml" || file.type === "application/xml",
    );

    if (validFiles.length === 0) return;

    const files = new DataTransfer();
    validFiles.forEach((file) => files.items.add(file));

    if (fileInputRef.current) {
      fileInputRef.current.files = files.files;
    }

    setFileNames(validFiles.map((file) => file.name));
    submitXml();
  }

  return (
    <form action={importXml} className="calm-soft-box p-5 lg:col-span-2" ref={formRef}>
      <div>
        <p className="calm-eyebrow">Documento fiscal</p>
        <h3 className="mt-2 text-lg font-semibold">Importar XML</h3>
        <p className="calm-muted mt-1 text-sm leading-6">Arrastra tu CFDI y crearemos el registro automaticamente.</p>
      </div>
      <input type="hidden" name="companyId" value={companyId} />
      <label
        className={`mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition duration-150 ${
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
            if (selectedFiles.length > 0) submitXml();
          }}
          ref={fileInputRef}
          type="file"
          required
        />
      </label>
    </form>
  );
}

function TransactionForm({ companyId, type, categories }: { companyId: string; type: "income" | "expense"; categories: string[] }) {
  const isIncome = type === "income";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createTransaction} className="calm-card p-5">
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
          <input className="calm-input text-lg font-semibold" name="total" type="number" step="0.01" min="0" placeholder="0.00" required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="calm-field">Fecha
            <input className="calm-input font-normal" name="date" type="date" defaultValue={today} required />
          </label>
          <label className="calm-field">Estado de pago
            <select className="calm-input font-normal" name="paymentStatus" defaultValue={isIncome ? "collected" : "paid"}>
              <option value={isIncome ? "collected" : "paid"}>{isIncome ? "Cobrado" : "Pagado"}</option>
              <option value="pending">{isIncome ? "Pendiente" : "A credito / pendiente"}</option>
            </select>
          </label>
        </div>
        <label className="calm-field">Descripcion
          <input className="calm-input font-normal" name="description" placeholder={isIncome ? "Concepto del ingreso" : "Concepto del gasto"} required />
        </label>
        {!isIncome ? (
          <label className="calm-field">Categoria
            <select className="calm-input font-normal" name="categoryName" defaultValue="Sin clasificar">
              {categories.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        ) : null}
        <button className="calm-button-primary mt-1 w-full" type="submit">
          {isIncome ? "Guardar ingreso" : "Guardar gasto"}
        </button>
      </div>
    </form>
  );
}
