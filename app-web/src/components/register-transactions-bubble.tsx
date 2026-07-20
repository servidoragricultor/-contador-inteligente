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
          <div className="calm-modal w-[min(94vw,860px)] max-w-none" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="calm-eyebrow">Captura del cliente</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Registrar movimientos</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Alta rapida de ingresos, gastos o XML del cliente.</p>
              </div>
              <button aria-label="Cerrar" className="calm-icon-button shrink-0" onClick={() => setIsOpen(false)} type="button">
                ×
              </button>
            </div>

            <RegisterTransactionsPanel categories={categories} companyId={companyId} isScrollable />
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
      {mode === "income" || mode === "expense" ? <XmlUploadForm companyId={companyId} compact /> : null}
    </div>
  );
}

function XmlUploadForm({ companyId, compact = false }: { companyId: string; compact?: boolean }) {
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
    <form action={importXml} className={compact ? "lg:col-span-2" : "calm-soft-box p-5 lg:col-span-2"} ref={formRef}>
      {!compact ? <div>
        <p className="calm-eyebrow">Documento fiscal</p>
        <h3 className="mt-2 text-lg font-semibold">Importar XML</h3>
        <p className="calm-muted mt-1 text-sm leading-6">Arrastra tu CFDI y crearemos el registro automaticamente.</p>
      </div> : null}
      <input type="hidden" name="companyId" value={companyId} />
      <label
        className={`${compact ? "flex min-h-24 px-4 py-4" : "mt-5 flex min-h-48 px-6 py-8"} cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed text-center transition duration-150 ${
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
            : compact ? "Arrastra XML o haz clic" : "Arrastra aqui tus archivos XML"}
        </span>
        {!compact ? <span className="calm-muted mt-1 max-w-full truncate text-xs">{fileNames.length > 0 ? fileNames.join(", ") : "o haz clic para seleccionarlos"}</span> : null}
        <span className={`calm-muted text-xs ${compact ? "mt-1" : "mt-3"}`}>{compact ? "Uno o varios archivos .xml" : "Puedes cargar varios archivos .xml a la vez"}</span>
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
  const tone = isIncome
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : "border-rose-200 bg-rose-50 text-rose-950";
  const buttonTone = isIncome ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700";

  return (
    <form action={createTransaction} className={`rounded-3xl border p-5 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium opacity-70">{isIncome ? "Dinero que entra" : "Dinero que sale"}</p>
          <h3 className="mt-1 text-2xl font-semibold">{isIncome ? "Ingreso" : "Gasto"}</h3>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold shadow-sm">
          {isIncome ? "+" : "-"}
        </span>
      </div>
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="type" value={type} />
      <div className="mt-4 grid gap-3">
        <input className="rounded-2xl border border-white/70 bg-white px-4 py-4 text-lg font-semibold shadow-sm transition focus:ring-4 focus:ring-slate-950/5" name="total" type="number" step="0.01" min="0" placeholder="Monto" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm transition focus:ring-4 focus:ring-slate-950/5" name="date" type="date" defaultValue={today} required />
          <select className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm transition focus:ring-4 focus:ring-slate-950/5" name="paymentStatus" defaultValue={isIncome ? "collected" : "paid"}>
            <option value={isIncome ? "collected" : "paid"}>{isIncome ? "Cobrado" : "Pagado"}</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>
        <input className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm transition focus:ring-4 focus:ring-slate-950/5" name="description" placeholder={isIncome ? "Cliente o descripcion" : "Proveedor o descripcion"} required />
        <input className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm transition focus:ring-4 focus:ring-slate-950/5" name="counterpartyName" placeholder={isIncome ? "Cliente opcional" : "Proveedor opcional"} />
        {!isIncome ? (
          <select className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm transition focus:ring-4 focus:ring-slate-950/5" name="categoryName" defaultValue="Sin clasificar">
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        <button className={`rounded-2xl px-4 py-4 text-base font-semibold text-white transition ${buttonTone}`} type="submit">
          {isIncome ? "Guardar ingreso" : "Guardar gasto"}
        </button>
      </div>
    </form>
  );
}
