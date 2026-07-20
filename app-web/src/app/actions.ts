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

const updateTransactionSchema = transactionSchema.extend({
  transactionId: z.string().min(1),
  reviewStatus: z.enum(["unreviewed", "reviewed", "correction_required"]).optional(),
  reviewNote: z.string().optional(),
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

export async function updateTransaction(formData: FormData) {
  const parsed = updateTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/empresas?error=movimiento");

  const { user, membership } = await requireCompanyAccess(parsed.data.companyId);
  const transaction = await prisma.transaction.findUnique({
    where: { id: parsed.data.transactionId, companyId: parsed.data.companyId },
  });

  if (!transaction) redirect(`/empresas/${parsed.data.companyId}`);

  const canModify = membership.role === "accountant" || transaction.createdById === user.id;
  if (!canModify) redirect(`/empresas/${parsed.data.companyId}`);

  const category = parsed.data.categoryName
    ? await prisma.category.findFirst({ where: { companyId: parsed.data.companyId, name: parsed.data.categoryName } })
    : null;

  await prisma.transaction.update({
    where: { id: parsed.data.transactionId, companyId: parsed.data.companyId },
    data: {
      date: new Date(parsed.data.date),
      description: parsed.data.description,
      counterpartyName: parsed.data.counterpartyName,
      counterpartyRfc: parsed.data.counterpartyRfc?.toUpperCase(),
      categoryId: category?.id,
      total: parsed.data.total,
      subtotal: parsed.data.total,
      paymentStatus: parsed.data.paymentStatus,
      reviewStatus: membership.role === "client" ? "unreviewed" : (parsed.data.reviewStatus ?? transaction.reviewStatus),
      reviewNote: membership.role === "accountant" ? (parsed.data.reviewNote?.trim() || null) : transaction.reviewNote,
    },
  });

  revalidatePath(`/empresas/${parsed.data.companyId}`);
  redirect(`/empresas/${parsed.data.companyId}?vista=movimientos`);
}

export async function deleteTransaction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const transactionId = String(formData.get("transactionId") ?? "");

  const { user, membership } = await requireCompanyAccess(companyId);
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId, companyId },
  });

  if (!transaction) redirect(`/empresas/${companyId}`);

  const canModify = membership.role === "accountant" || transaction.createdById === user.id;
  if (!canModify) redirect(`/empresas/${companyId}`);

  await prisma.transaction.delete({ where: { id: transactionId, companyId } });

  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}?vista=movimientos`);
}

export async function importXml(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const files = formData.getAll("xml").filter((value): value is File => value instanceof File && value.size > 0);
  const { user } = await requireCompanyAccess(companyId);

  if (files.length === 0) redirect(`/empresas/${companyId}?error=xml-vacio`);

  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });

  if (!company.rfc) redirect(`/empresas/${companyId}?error=rfc-requerido-xml`);

  const companyRfc = company.rfc.toUpperCase();
  let imported = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const file of files) {
    const xmlContent = await file.text();
    let cfdi;

    try {
      cfdi = parseCfdiXml(xmlContent);
    } catch {
      invalid += 1;
      continue;
    }

    const issuerRfc = cfdi.issuerRfc.toUpperCase();
    const receiverRfc = cfdi.receiverRfc.toUpperCase();
    const type = issuerRfc === companyRfc ? "income" : receiverRfc === companyRfc ? "expense" : "expense";
    const reviewStatus = issuerRfc === companyRfc || receiverRfc === companyRfc ? "unreviewed" : "correction_required";
    const duplicate = await prisma.fiscalDocument.findUnique({
      where: { companyId_uuid: { companyId, uuid: cfdi.uuid } },
    });

    if (duplicate) {
      duplicates += 1;
      continue;
    }

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
    imported += 1;
  }

  if (imported === 0) {
    redirect(`/empresas/${companyId}?error=${duplicates > 0 && invalid === 0 ? "xml-duplicado" : "xml-invalido"}`);
  }

  revalidatePath(`/empresas/${companyId}`);
  redirect(`/empresas/${companyId}?xmlImportados=${imported}&xmlOmitidos=${duplicates + invalid}`);
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
