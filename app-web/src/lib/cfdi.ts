import { XMLParser } from "fast-xml-parser";

type XmlNode = Record<string, unknown>;

export type ParsedCfdi = {
  version?: string;
  uuid: string;
  folio?: string;
  issueDate: Date;
  issuerRfc: string;
  issuerName?: string;
  receiverRfc: string;
  receiverName?: string;
  issuerTaxRegime?: string;
  receiverTaxRegime?: string;
  receiverPostalCode?: string;
  cfdiUse?: string;
  voucherType?: string;
  placeOfIssue?: string;
  exportCode?: string;
  concepts: Array<{
    description?: string;
    hasTaxes: boolean;
    taxObject?: string;
  }>;
  subtotal: number;
  taxAmount: number;
  withholdingAmount: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  paymentForm?: string;
  description: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
});

function asNode(value: unknown): XmlNode {
  return value && typeof value === "object" ? (value as XmlNode) : {};
}

function asArray(value: unknown): XmlNode[] {
  if (!value) return [];
  return Array.isArray(value) ? value.map(asNode) : [asNode(value)];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function money(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseCfdiXml(xmlContent: string): ParsedCfdi {
  const parsed = asNode(parser.parse(xmlContent));
  const comprobante = asNode(parsed.Comprobante);
  const emisor = asNode(comprobante.Emisor);
  const receptor = asNode(comprobante.Receptor);
  const complemento = asNode(comprobante.Complemento);
  const timbre = asNode(complemento.TimbreFiscalDigital);
  const conceptos = asNode(comprobante.Conceptos);
  const conceptoList = asArray(conceptos.Concepto);
  const impuestos = asNode(comprobante.Impuestos);
  const traslados = asNode(impuestos.Traslados);
  const trasladoList = asArray(traslados.Traslado);
  const retenciones = asNode(impuestos.Retenciones);
  const retencionList = asArray(retenciones.Retencion);

  const uuid = text(timbre.UUID);
  const issuerRfc = text(emisor.Rfc);
  const receiverRfc = text(receptor.Rfc);
  const date = text(comprobante.Fecha);

  if (!uuid || !issuerRfc || !receiverRfc || !date) {
    throw new Error("El XML no contiene UUID, RFC emisor, RFC receptor o fecha.");
  }

  const taxAmount = trasladoList.reduce((sum, item) => sum + money(item.Importe), 0);
  const withholdingAmount = retencionList.reduce((sum, item) => sum + money(item.Importe), 0);
  const description = conceptoList
    .map((item) => text(item.Descripcion))
    .filter(Boolean)
    .join("; ") || "XML importado";
  const conceptDetails = conceptoList.map((item) => ({
    description: text(item.Descripcion),
    hasTaxes: Object.keys(asNode(item.Impuestos)).length > 0,
    taxObject: text(item.ObjetoImp),
  }));

  return {
    version: text(comprobante.Version),
    uuid,
    folio: text(comprobante.Folio),
    issueDate: new Date(date),
    issuerRfc,
    issuerName: text(emisor.Nombre),
    receiverRfc,
    receiverName: text(receptor.Nombre),
    issuerTaxRegime: text(emisor.RegimenFiscal),
    receiverTaxRegime: text(receptor.RegimenFiscalReceptor),
    receiverPostalCode: text(receptor.DomicilioFiscalReceptor),
    cfdiUse: text(receptor.UsoCFDI),
    voucherType: text(comprobante.TipoDeComprobante),
    placeOfIssue: text(comprobante.LugarExpedicion),
    exportCode: text(comprobante.Exportacion),
    concepts: conceptDetails,
    subtotal: money(comprobante.SubTotal),
    taxAmount,
    withholdingAmount,
    total: money(comprobante.Total),
    currency: text(comprobante.Moneda) ?? "MXN",
    paymentMethod: text(comprobante.MetodoPago),
    paymentForm: text(comprobante.FormaPago),
    description,
  };
}
