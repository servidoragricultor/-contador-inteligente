const PAYMENT_FORMS: Record<string, string> = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electronica",
  "04": "Tarjeta de credito",
  "05": "Monedero electronico",
  "06": "Dinero electronico",
  "08": "Vales de despensa",
  "12": "Dacion en pago",
  "13": "Pago por subrogacion",
  "14": "Pago por consignacion",
  "15": "Condonacion",
  "17": "Compensacion",
  "23": "Novacion",
  "24": "Confusion",
  "25": "Remision de deuda",
  "26": "Prescripcion o caducidad",
  "27": "A satisfaccion del acreedor",
  "28": "Tarjeta de debito",
  "29": "Tarjeta de servicios",
  "30": "Aplicacion de anticipos",
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
  if (value === "PUE") return "PUE - Pago en una exhibicion";
  if (value === "PPD") return "PPD - Pago en parcialidades o diferido";
  return value ? `${value} - Metodo SAT` : "Metodo no indicado";
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}
