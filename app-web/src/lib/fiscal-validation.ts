import type { ParsedCfdi } from "@/lib/cfdi";
import { normalizeFiscalName } from "@/lib/fiscal-constancy";

type CompanyFiscalProfile = {
  legalName: string;
  postalCode: string | null;
  rfc: string | null;
  taxRegime: string | null;
};

export function validateCfdiAgainstCompany(company: CompanyFiscalProfile, cfdi: ParsedCfdi) {
  const issues: string[] = [];
  const companyRfc = company.rfc?.toUpperCase();
  const issuerRfc = cfdi.issuerRfc.toUpperCase();
  const receiverRfc = cfdi.receiverRfc.toUpperCase();
  const isIssuer = Boolean(companyRfc && companyRfc === issuerRfc);
  const isReceiver = Boolean(companyRfc && companyRfc === receiverRfc);

  if (!companyRfc) issues.push("El perfil fiscal no tiene RFC para comparar.");
  if (companyRfc && !isIssuer && !isReceiver) issues.push("El RFC del cliente no coincide con el emisor ni con el receptor del CFDI.");
  if (!company.postalCode) issues.push("El perfil fiscal no tiene codigo postal.");
  if (!company.taxRegime) issues.push("El perfil fiscal no tiene regimen fiscal.");

  const expectedName = normalizeFiscalName(company.legalName);
  const actualName = normalizeFiscalName((isIssuer ? cfdi.issuerName : cfdi.receiverName) ?? "");
  if (!actualName) {
    issues.push(`El CFDI no contiene el nombre fiscal del ${isIssuer ? "emisor" : "receptor"}.`);
  } else if (expectedName && expectedName !== actualName) {
    issues.push(`El nombre fiscal del ${isIssuer ? "emisor" : "receptor"} no coincide con la constancia.`);
  }

  const regimes = company.taxRegime?.split(/[,; ]+/).filter((value) => /^\d{3}$/.test(value)) ?? [];
  const cfdiRegime = isIssuer ? cfdi.issuerTaxRegime : cfdi.receiverTaxRegime;
  if (company.taxRegime && regimes.length === 0) {
    issues.push("El perfil fiscal no contiene una clave de regimen SAT valida.");
  }
  if (!cfdiRegime) {
    issues.push(`El CFDI no contiene el regimen fiscal del ${isIssuer ? "emisor" : "receptor"}.`);
  } else if (regimes.length > 0 && !regimes.includes(cfdiRegime)) {
    issues.push(`El regimen fiscal ${cfdiRegime} del CFDI no aparece en la constancia.`);
  }

  if (isReceiver && !cfdi.receiverPostalCode) {
    issues.push("El CFDI no contiene el codigo postal del receptor.");
  } else if (isReceiver && company.postalCode && cfdi.receiverPostalCode && company.postalCode !== cfdi.receiverPostalCode) {
    issues.push(`El codigo postal del receptor ${cfdi.receiverPostalCode} no coincide con ${company.postalCode}.`);
  }

  if (cfdi.version && cfdi.version !== "4.0") {
    issues.push(`El CFDI usa la version ${cfdi.version}; la validacion completa requiere CFDI 4.0.`);
  }

  if (cfdi.voucherType !== "P" && cfdi.voucherType !== "T") {
    if (!cfdi.paymentMethod) {
      issues.push("El CFDI no contiene MetodoPago.");
    }
    if (!cfdi.paymentForm) {
      issues.push("El CFDI no contiene FormaPago.");
    }
    if (cfdi.paymentMethod === "PPD" && cfdi.paymentForm !== "99") {
      issues.push("Un CFDI PPD debe usar FormaPago 99 - Por definir.");
    }
    if (cfdi.paymentMethod === "PUE" && cfdi.paymentForm === "99") {
      issues.push("Un CFDI PUE no debe usar FormaPago 99 - Por definir.");
    }
  }

  if (cfdi.concepts.length === 0) {
    issues.push("El CFDI no contiene conceptos para validar.");
  }
  cfdi.concepts.forEach((concept, index) => {
    const position = index + 1;
    if (!concept.taxObject || !/^(0[1-8])$/.test(concept.taxObject)) {
      issues.push(`El concepto ${position} no contiene un ObjetoImp valido.`);
    } else if (concept.taxObject === "02" && !concept.hasTaxes) {
      issues.push(`El concepto ${position} indica ObjetoImp 02 pero no contiene impuestos.`);
    } else if (["01", "04"].includes(concept.taxObject) && concept.hasTaxes) {
      issues.push(`El concepto ${position} indica ObjetoImp ${concept.taxObject} pero contiene impuestos.`);
    }
  });

  return issues;
}
