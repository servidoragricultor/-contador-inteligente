import { extractText } from "unpdf";

export type FiscalProfile = {
  economicActivities: string[];
  fiscalStatus?: string;
  legalName?: string;
  operationStartDate?: Date;
  postalCode?: string;
  rfc?: string;
  taxRegimes: string[];
  tradeName?: string;
};

const TAX_REGIMES: Array<[string, string[]]> = [
  ["601", ["GENERAL DE LEY PERSONAS MORALES"]],
  ["603", ["PERSONAS MORALES CON FINES NO LUCRATIVOS"]],
  ["605", ["SUELDOS Y SALARIOS E INGRESOS ASIMILADOS A SALARIOS"]],
  ["606", ["ARRENDAMIENTO"]],
  ["607", ["REGIMEN DE ENAJENACION O ADQUISICION DE BIENES"]],
  ["608", ["DEMAS INGRESOS"]],
  ["610", ["RESIDENTES EN EL EXTRANJERO SIN ESTABLECIMIENTO PERMANENTE EN MEXICO"]],
  ["611", ["INGRESOS POR DIVIDENDOS"]],
  ["612", ["PERSONAS FISICAS CON ACTIVIDADES EMPRESARIALES Y PROFESIONALES"]],
  ["614", ["INGRESOS POR INTERESES"]],
  ["615", ["INGRESOS POR OBTENCION DE PREMIOS"]],
  ["616", ["SIN OBLIGACIONES FISCALES"]],
  ["620", ["SOCIEDADES COOPERATIVAS DE PRODUCCION QUE OPTAN POR DIFERIR SUS INGRESOS"]],
  ["621", ["INCORPORACION FISCAL"]],
  ["622", ["ACTIVIDADES AGRICOLAS GANADERAS SILVICOLAS Y PESQUERAS"]],
  ["623", ["OPCIONAL PARA GRUPOS DE SOCIEDADES"]],
  ["624", ["COORDINADOS"]],
  ["625", ["ACTIVIDADES EMPRESARIALES CON INGRESOS A TRAVES DE PLATAFORMAS TECNOLOGICAS"]],
  ["626", ["REGIMEN SIMPLIFICADO DE CONFIANZA"]],
  ["628", ["HIDROCARBUROS"]],
  ["629", ["REGIMENES FISCALES PREFERENTES"]],
  ["630", ["ENAJENACION DE ACCIONES EN BOLSA DE VALORES"]],
];

export async function parseFiscalConstancy(file: File): Promise<FiscalProfile> {
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("La constancia debe ser un PDF menor a 10 MB.");
  }

  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("La constancia debe tener formato PDF.");
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const result = await extractText(data, { mergePages: true });
  return parseFiscalConstancyText(result.text);
}

export function parseFiscalConstancyText(rawText: string): FiscalProfile {
  const text = normalize(rawText, true);

  if (!text.includes("CONSTANCIA DE SITUACION FISCAL") && !text.includes("CEDULA DE IDENTIFICACION FISCAL")) {
    throw new Error("El PDF no parece ser una constancia de situacion fiscal del SAT.");
  }

  const rfc = text.match(/\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/)?.[0];
  const postalCode = capture(text, ["CODIGO POSTAL"], ["TIPO DE VIALIDAD", "NOMBRE DE VIALIDAD"])?.match(/\b\d{5}\b/)?.[0]
    ?? text.match(/CODIGO POSTAL\s*:?\s*(\d{5})/)?.[1];
  const corporateName = capture(
    text,
    ["DENOMINACION RAZON SOCIAL", "DENOMINACION O RAZON SOCIAL", "RAZON SOCIAL"],
    ["REGIMEN CAPITAL", "NOMBRE COMERCIAL", "FECHA INICIO DE OPERACIONES", "ESTATUS EN EL PADRON", "CODIGO POSTAL", "DATOS DEL DOMICILIO", "ACTIVIDADES ECONOMICAS", "REGIMENES"],
  );
  const firstName = cleanPersonPart(
    capture(text, ["NOMBRE S", "NOMBRES"], ["PRIMER APELLIDO", "APELLIDO PATERNO"]),
    ["NOMBRE S", "NOMBRES"],
  );
  const firstSurname = cleanPersonPart(
    capture(text, ["PRIMER APELLIDO", "APELLIDO PATERNO"], ["SEGUNDO APELLIDO", "APELLIDO MATERNO"]),
    ["PRIMER APELLIDO", "APELLIDO PATERNO"],
  );
  const secondSurname = cleanPersonPart(
    capture(text, ["SEGUNDO APELLIDO", "APELLIDO MATERNO"], ["FECHA INICIO DE OPERACIONES", "ESTATUS EN EL PADRON", "NOMBRE COMERCIAL", "CODIGO POSTAL", "DATOS DEL DOMICILIO", "ACTIVIDADES ECONOMICAS", "REGIMENES", "REGIMEN"]),
    ["SEGUNDO APELLIDO", "APELLIDO MATERNO"],
  );
  const personalName = [firstName, firstSurname, secondSurname].filter(Boolean).join(" ");
  const tradeName = capture(text, ["NOMBRE COMERCIAL"], ["FECHA INICIO DE OPERACIONES", "ESTATUS EN EL PADRON", "DATOS DEL DOMICILIO", "CODIGO POSTAL", "ACTIVIDADES ECONOMICAS", "REGIMENES", "REGIMEN"]);
  const explicitRegimes = [...text.matchAll(/(?:REGIMEN FISCAL|REGIMEN)\s*:?\s*(\d{3})\b/g)].map((match) => match[1]);
  const mappedRegimes = TAX_REGIMES
    .filter(([, descriptions]) => descriptions.some((description) => text.includes(description)))
    .map(([code]) => code);
  const fiscalStatus = capture(text, ["ESTATUS EN EL PADRON"], ["FECHA DE ULTIMO CAMBIO DE ESTADO", "NOMBRE COMERCIAL"]);
  const operationStartDate = parseSatDate(capture(text, ["FECHA INICIO DE OPERACIONES"], ["ESTATUS EN EL PADRON"]));
  const activitiesSection = capture(text, ["ACTIVIDADES ECONOMICAS"], ["REGIMENES"]);
  const economicActivities = activitiesSection
    ? [...activitiesSection.matchAll(/(?:^|\n)\s*\d+\s+([\s\S]+?)\s+\d{1,3}\s+\d{2}\/\d{2}\/\d{4}/g)]
      .map((match) => cleanValue(match[1]))
      .filter((value): value is string => Boolean(value))
    : [];
  const legalName = rfc?.length === 13 ? personalName || corporateName : corporateName || personalName;

  return {
    economicActivities,
    fiscalStatus: cleanValue(fiscalStatus),
    legalName: cleanValue(legalName),
    operationStartDate,
    postalCode,
    rfc,
    taxRegimes: [...new Set([...explicitRegimes, ...mappedRegimes])],
    tradeName: cleanValue(tradeName),
  };
}

function parseSatDate(value?: string) {
  if (!value) return undefined;

  const months: Record<string, number> = {
    ENERO: 0,
    FEBRERO: 1,
    MARZO: 2,
    ABRIL: 3,
    MAYO: 4,
    JUNIO: 5,
    JULIO: 6,
    AGOSTO: 7,
    SEPTIEMBRE: 8,
    OCTUBRE: 9,
    NOVIEMBRE: 10,
    DICIEMBRE: 11,
  };
  const match = value.match(/(\d{1,2})\s+DE\s+([A-Z]+)\s+DE\s+(\d{4})/);
  if (!match || months[match[2]] === undefined) return undefined;

  return new Date(Date.UTC(Number(match[3]), months[match[2]], Number(match[1])));
}

export function normalizeFiscalName(value: string) {
  return normalize(value)
    .replace(/\b(SA DE CV|S A DE C V|SAPI DE CV|S DE RL DE CV|SC|AC)\b/g, (match) => match.replace(/\s+/g, " "))
    .replace(/[^A-Z0-9&Ñ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function capture(text: string, labels: string[], nextLabels: string[]) {
  for (const label of labels) {
    const next = nextLabels.map(escapeRegExp).join("|");
    const expression = new RegExp(`${escapeRegExp(label)}\\s*:?\\s*([\\s\\S]+?)(?=\\s+(?:${next})\\s*:?|$)`);
    const value = text.match(expression)?.[1];

    if (value) return value;
  }

  return undefined;
}

function cleanValue(value?: string) {
  return value?.replace(/\s+/g, " ").replace(/^[:\- ]+|[:\- ]+$/g, "").trim() || undefined;
}

function cleanPersonPart(value: string | undefined, repeatedLabels: string[]) {
  if (!value) return undefined;

  let candidate = value;
  for (const label of repeatedLabels) {
    const repeatedLabelIndex = candidate.lastIndexOf(label);
    if (repeatedLabelIndex >= 0) candidate = candidate.slice(repeatedLabelIndex + label.length);
  }

  const cleaned = cleanValue(candidate);
  if (!cleaned || cleaned.length > 80 || /\b(?:RFC|CURP|CONSTANCIA|CONTRIBUYENTE)\b/.test(cleaned)) return undefined;
  return cleaned;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string, preserveLines = false) {
  const normalized = value
    .replace(/Ñ/g, "\uE000")
    .replace(/ñ/g, "\uE000")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uE000/g, "Ñ")
    .replace(/[()]/g, "")
    .toUpperCase();

  return preserveLines
    ? normalized.replace(/[\t\r]+/g, " ").replace(/ +/g, " ").replace(/\n+/g, "\n").trim()
    : normalized;
}
