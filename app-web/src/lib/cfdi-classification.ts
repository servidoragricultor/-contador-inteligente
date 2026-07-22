const PAYMENT_FORMS: Record<string, string> = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electrónica",
  "04": "Tarjeta de crédito",
  "05": "Monedero electrónico",
  "06": "Dinero electrónico",
  "08": "Vales de despensa",
  "12": "Dación en pago",
  "13": "Pago por subrogación",
  "14": "Pago por consignación",
  "15": "Condonación",
  "17": "Compensación",
  "23": "Novación",
  "24": "Confusión",
  "25": "Remisión de deuda",
  "26": "Prescripción o caducidad",
  "27": "A satisfacción del acreedor",
  "28": "Tarjeta de débito",
  "29": "Tarjeta de servicios",
  "30": "Aplicación de anticipos",
  "31": "Intermediario de pagos",
  "99": "Por definir",
};

const CATEGORY_RULES: Array<[string, string[]]> = [
  ["Combustible", ["GASOLINA", "DIESEL", "COMBUSTIBLE", "GASOLINERA"]],
  ["Renta", ["ARRENDAMIENTO", "RENTA", "ALQUILER"]],
  ["Servicios", ["ELECTRICIDAD", "ENERGIA", "INTERNET", "TELEFON", "AGUA", "SERVICIO DE LUZ", "TELECOM"]],
  ["Honorarios", ["HONORARIO", "ASESORIA", "CONSULTORIA", "SERVICIOS PROFESIONALES"]],
  ["Transporte", ["FLETE", "TRANSPORTE", "PAQUETERIA", "MENSAJERIA", "CASETA", "PEAJE"]],
  ["Publicidad", ["PUBLICIDAD", "MARKETING", "ANUNCIO", "PROMOCION"]],
  ["Oficina", ["PAPELERIA", "OFICINA", "TONER", "IMPRESION", "MOBILIARIO"]],
  ["Inventario", ["MERCANCIA", "INSUMO", "MATERIA PRIMA", "PRODUCTO", "SEMILLA", "FERTILIZANTE", "PLAGUICIDA", "MAQUINARIA", "EQUIPO"]],
  ["Impuestos", ["IMPUESTO", "DERECHO", "CONTRIBUCION"]],
  ["Nomina", ["NOMINA", "SUELDO", "SALARIO"]],
];

export function inferCfdiPaymentStatus(paymentMethod: string | undefined, paymentForm: string | undefined, type: string) {
  const isPending = paymentMethod === "PPD" || paymentForm === "99" || !paymentMethod;
  if (isPending) return "pending";
  return type === "income" ? "collected" : "paid";
}

export function inferExpenseCategory(description: string, availableCategories: Array<{ id: string; name: string }>) {
  const normalized = normalize(description);
  const suggestedName = CATEGORY_RULES.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0] ?? "Sin clasificar";
  return availableCategories.find((category) => normalize(category.name) === normalize(suggestedName)) ?? null;
}

export function paymentFormLabel(value?: string | null) {
  if (!value) return "Forma no indicada";
  return `${value} - ${PAYMENT_FORMS[value] ?? "Forma SAT"}`;
}

export function paymentMethodLabel(value?: string | null) {
  if (value === "PUE") return "PUE - Pago en una exhibición";
  if (value === "PPD") return "PPD - Pago en parcialidades o diferido";
  return value ? `${value} - Método SAT` : "Método no indicado";
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}
