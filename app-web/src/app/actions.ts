"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, requireCompanyAccess, requireUser, verifyPassword } from "@/lib/auth";
import { parseCfdiXml } from "@/lib/cfdi";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const companySchema = z.object({
  legalName: z.string().min(2),
  tradeName: z.string().optional(),
  rfc: z.string().trim().optional(),
  taxRegime: z.string().optional(),
  postalCode: z.string().optional(),
}).refine((value) => !value.rfc || (value.rfc.length >= 12 && value.rfc.length <= 13), {
  message: "RFC invalido",
  path: ["rfc"],
});

const transactionSchema = z.object({
  companyId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  date: z.string().min(1),
  description: z.string().min(2),
  counterpartyName: z.string().optional(),
  counterpartyRfc: z.string().optional(),
  categoryName: z.string().optional(),
  total: z.coerce.number().positive(),
  paymentStatus: z.string().min(1),
});

export async function registerAccountant(formData: FormData) {
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.name) redirect("/?error=registro");

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) redirect("/?error=email-existente");

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      globalRole: "accountant",
    },
  });

  await createSession(user.id);
  redirect("/empresas");
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/?error=login");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) redirect("/?error=login");

  await createSession(user.id);
  redirect("/empresas");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function createCompany(formData: FormData) {
  const user = await requireUser();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/empresas?error=empresa");

  const company = await prisma.company.create({
    data: {
      ...parsed.data,
      rfc: parsed.data.rfc ? parsed.data.rfc.toUpperCase() : null,
      createdById: user.id,
      members: { create: { userId: user.id, role: "accountant", status: "active" } },
      categories: {
        create: ["Sin clasificar", "Renta", "Servicios", "Combustible", "Nomina", "Honorarios", "Oficina", "Transporte", "Publicidad", "Inventario", "Impuestos", "Otro"].map((name) => ({ name, type: "both", isDefault: true })),
      },
    },
  });

  redirect(`/empresas/${company.id}`);
}

export async function deleteCompany(formData: FormData) {
  const user = await requireUser();
  const companyId = String(formData.get("companyId") ?? "");

  if (!companyId) redirect("/empresas?error=empresa");

  const membership = await prisma.companyMember.findFirst({
    where: { companyId, userId: user.id, role: "accountant", status: "active" },
  });

  if (!membership) redirect("/empresas?error=sin-permiso");

  await prisma.company.delete({ where: { id: companyId } });

  revalidatePath("/empresas");
  redirect("/empresas");
}

export async function createTransaction(formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/empresas?error=movimiento");

  const { user } = await requireCompanyAccess(parsed.data.companyId);
  const category = parsed.data.categoryName
    ? await prisma.category.findFirst({ where: { companyId: parsed.data.companyId, name: parsed.data.categoryName } })
    : null;

  await prisma.transaction.create({
    data: {
      companyId: parsed.data.companyId,
      type: parsed.data.type,
      source: "manual",
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      counterpartyName: parsed.data.counterpartyName,
      counterpartyRfc: parsed.data.counterpartyRfc?.toUpperCase(),
      categoryId: category?.id,
      total: parsed.data.total,
      subtotal: parsed.data.total,
      paymentStatus: parsed.data.paymentStatus,
      reviewStatus: "unreviewed",
      createdById: user.id,
    },
  });

  revalidatePath(`/empresas/${parsed.data.companyId}`);
  redirect(`/empresas/${parsed.data.companyId}`);
}

export async function importXml(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const file = formData.get("xml") as File | null;
  const { user } = await requireCompanyAccess(companyId);

  if (!file || file.size === 0) redirect(`/empresas/${companyId}?error=xml-vacio`);

  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const xmlContent = await file.text();

  if (!company.rfc) redirect(`/empresas/${companyId}?error=rfc-requerido-xml`);

  let cfdi;
  try {
    cfdi = parseCfdiXml(xmlContent);
  } catch {
    redirect(`/empresas/${companyId}?error=xml-invalido`);
  }

  const companyRfc = company.rfc.toUpperCase();
  const issuerRfc = cfdi.issuerRfc.toUpperCase();
  const receiverRfc = cfdi.receiverRfc.toUpperCase();
  const type = issuerRfc === companyRfc ? "income" : receiverRfc === companyRfc ? "expense" : "expense";
  const reviewStatus = issuerRfc === companyRfc || receiverRfc === companyRfc ? "unreviewed" : "correction_required";
  const duplicate = await prisma.fiscalDocument.findUnique({
    where: { companyId_uuid: { companyId, uuid: cfdi.uuid } },
  });

  if (duplicate) redirect(`/empresas/${companyId}?error=xml-duplicado`);

  await prisma.transaction.create({
    data: {
      companyId,
      type,
      source: "xml",
      date: cfdi.issueDate,
      description: cfdi.description,
      counterpartyName: type === "income" ? cfdi.receiverName : cfdi.issuerName,
      counterpartyRfc: type === "income" ? receiverRfc : issuerRfc,
      subtotal: cfdi.subtotal,
      taxAmount: cfdi.taxAmount,
      withholdingAmount: cfdi.withholdingAmount,
      total: cfdi.total,
      currency: cfdi.currency,
      paymentStatus: type === "income" ? "collected" : "paid",
      reviewStatus,
      reviewNote: reviewStatus === "correction_required" ? "El RFC emisor/receptor no coincide con la empresa seleccionada." : null,
      createdById: user.id,
      fiscalDocument: {
        create: {
          companyId,
          uuid: cfdi.uuid,
          folio: cfdi.folio,
          issuerRfc,
          issuerName: cfdi.issuerName,
          receiverRfc,
          receiverName: cfdi.receiverName,
          issueDate: cfdi.issueDate,
          subtotal: cfdi.subtotal,
          taxAmount: cfdi.taxAmount,
          total: cfdi.total,
          currency: cfdi.currency,
          paymentMethod: cfdi.paymentMethod,
          paymentForm: cfdi.paymentForm,
          xmlContent,
        },
      },
    },
  });

  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}`);
}

export async function updateReviewStatus(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const transactionId = String(formData.get("transactionId") ?? "");
  const reviewStatus = String(formData.get("reviewStatus") ?? "unreviewed");
  const reviewNote = String(formData.get("reviewNote") ?? "") || null;

  await requireCompanyAccess(companyId);

  await prisma.transaction.update({
    where: { id: transactionId, companyId },
    data: { reviewStatus, reviewNote },
  });

  revalidatePath(`/empresas/${companyId}`);
}
