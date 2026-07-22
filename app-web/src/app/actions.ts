"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, requireCompanyAccess, requireUser, verifyPassword } from "@/lib/auth";
import { parseCfdiXml } from "@/lib/cfdi";
import { inferCfdiPaymentStatus, inferExpenseCategory } from "@/lib/cfdi-classification";
import { parseFiscalConstancy, type FiscalProfile } from "@/lib/fiscal-constancy";
import { validateCfdiAgainstCompany } from "@/lib/fiscal-validation";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const companyInputSchema = z.object({
  legalName: z.string().trim().optional(),
  tradeName: z.string().optional(),
  rfc: z.string().trim().optional(),
  taxRegime: z.string().optional(),
  postalCode: z.string().optional(),
});

const companySchema = z.object({
  legalName: z.string().trim().min(2),
  tradeName: z.string().trim().optional(),
  rfc: z.string().trim().regex(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/).optional(),
  taxRegime: z.string().trim().regex(/^\d{3}(,\d{3})*$/).optional(),
  postalCode: z.string().trim().regex(/^\d{5}$/).optional(),
});

const clientInvitationSchema = z.object({
  companyId: z.string().min(1),
});

const acceptClientInvitationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6).max(100),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, { path: ["passwordConfirmation"] });

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
  const input = companyInputSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) redirect("/empresas?error=empresa");

  const fiscalConstancy = formData.get("fiscalConstancy");
  let fiscalProfile: FiscalProfile | undefined;

  if (fiscalConstancy instanceof File && fiscalConstancy.size > 0) {
    try {
      fiscalProfile = await parseFiscalConstancy(fiscalConstancy);
    } catch {
      redirect("/empresas?error=constancia-invalida");
    }
  }

  const companyData = {
    legalName: fiscalProfile?.legalName || input.data.legalName,
    postalCode: fiscalProfile?.postalCode || input.data.postalCode || undefined,
    rfc: fiscalProfile?.rfc || input.data.rfc?.toUpperCase() || undefined,
    taxRegime: fiscalProfile?.taxRegimes.join(",") || input.data.taxRegime || undefined,
    tradeName: input.data.tradeName || fiscalProfile?.tradeName || undefined,
  };

  if (fiscalProfile && (!companyData.legalName || !companyData.rfc || !companyData.taxRegime || !companyData.postalCode)) {
    redirect("/empresas?error=constancia-incompleta");
  }
  if (fiscalProfile?.fiscalStatus && fiscalProfile.fiscalStatus !== "ACTIVO") {
    redirect("/empresas?error=constancia-inactiva");
  }

  const parsed = companySchema.safeParse(companyData);
  if (!parsed.success) redirect(`/empresas?error=${fiscalProfile ? "constancia-incompleta" : "empresa"}`);

  if (parsed.data.rfc) {
    const duplicate = await prisma.company.findFirst({
      where: { rfc: parsed.data.rfc, members: { some: { userId: user.id, status: "active" } } },
    });
    if (duplicate) redirect("/empresas?error=rfc-duplicado");
  }

  const company = await prisma.company.create({
    data: {
      ...parsed.data,
      rfc: parsed.data.rfc ?? null,
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

export async function createClientInvitation(
  _previousState: { error: string | null; token: string | null } | null,
  formData: FormData,
) {
  const parsed = clientInvitationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "No pudimos identificar al cliente.", token: null };

  const { membership } = await requireCompanyAccess(parsed.data.companyId);
  if (membership.role !== "accountant") return { error: "No tienes permiso para generar esta invitacion.", token: null };

  const existingAccess = await prisma.companyMember.findFirst({
    where: { companyId: parsed.data.companyId, role: "client", status: "active" },
  });
  if (existingAccess) return { error: "Este cliente ya tiene un acceso activo.", token: null };

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.clientInvitation.deleteMany({
      where: { companyId: parsed.data.companyId, usedAt: null },
    }),
    prisma.clientInvitation.create({
      data: {
        companyId: parsed.data.companyId,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  revalidatePath("/empresas");
  return { error: null, token };
}

export async function acceptClientInvitation(formData: FormData) {
  const parsed = acceptClientInvitationSchema.safeParse(Object.fromEntries(formData));
  const token = String(formData.get("token") ?? "");
  const invitationPath = `/invitacion/${encodeURIComponent(token)}`;
  if (!parsed.success) redirect(`${invitationPath}?error=datos`);

  const invitation = await prisma.clientInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(parsed.data.token) },
  });
  if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date()) {
    redirect(`${invitationPath}?error=invalida`);
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) redirect(`${invitationPath}?error=correo`);

  const existingAccess = await prisma.companyMember.findFirst({
    where: { companyId: invitation.companyId, role: "client", status: "active" },
  });
  if (existingAccess) redirect(`${invitationPath}?error=utilizada`);

  const passwordHash = await hashPassword(parsed.data.password);
  const createdUser = await prisma.$transaction(async (transaction) => {
    const claimed = await transaction.clientInvitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("INVITATION_ALREADY_USED");

    return transaction.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        globalRole: "client",
        memberships: {
          create: {
            companyId: invitation.companyId,
            role: "client",
            status: "active",
          },
        },
      },
    });
  }).catch(() => null);

  if (!createdUser) redirect(`${invitationPath}?error=utilizada`);
  await createSession(createdUser.id);
  redirect(`/empresas/${invitation.companyId}`);
}

export async function createTransaction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "");
  const captureMode = formData.get("type") === "expense" ? "expense" : "income";
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/empresas/${companyId}?captura=${captureMode}&error=movimiento`);

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
  const companyId = String(formData.get("companyId") ?? "");
  const parsed = updateTransactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/empresas/${companyId}?vista=movimientos&error=movimiento`);

  const { user, membership } = await requireCompanyAccess(parsed.data.companyId);
  const transaction = await prisma.transaction.findUnique({
    where: { id: parsed.data.transactionId, companyId: parsed.data.companyId },
    include: { fiscalDocument: true },
  });

  if (!transaction) redirect(`/empresas/${parsed.data.companyId}`);

  const canModify = membership.role === "accountant" || transaction.createdById === user.id;
  if (!canModify) redirect(`/empresas/${parsed.data.companyId}`);

  const category = parsed.data.categoryName
    ? await prisma.category.findFirst({ where: { companyId: parsed.data.companyId, name: parsed.data.categoryName } })
    : null;
  let nextReviewStatus = membership.role === "client" ? "unreviewed" : (parsed.data.reviewStatus ?? transaction.reviewStatus);
  let nextReviewNote = membership.role === "accountant" ? (parsed.data.reviewNote?.trim() || null) : transaction.reviewNote;

  if (membership.role === "accountant" && nextReviewStatus === "reviewed" && transaction.fiscalDocument) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: parsed.data.companyId } });
    const validationIssues = validateCfdiAgainstCompany(company, parseCfdiXml(transaction.fiscalDocument.xmlContent));
    if (validationIssues.length > 0) {
      nextReviewStatus = "correction_required";
      nextReviewNote = validationIssues.join(" ");
    }
  }

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
      reviewStatus: nextReviewStatus,
      reviewNote: nextReviewNote,
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

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { categories: true },
  });

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
    const type = issuerRfc === companyRfc ? "income" : "expense";
    const validationIssues = validateCfdiAgainstCompany(company, cfdi);
    const reviewStatus = validationIssues.length > 0 ? "correction_required" : "unreviewed";
    const paymentStatus = inferCfdiPaymentStatus(cfdi.paymentMethod, cfdi.paymentForm, type);
    const suggestedCategory = type === "expense"
      ? inferExpenseCategory(`${cfdi.description} ${cfdi.issuerName ?? ""}`, company.categories)
      : null;
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
        categoryId: suggestedCategory?.id,
        subtotal: cfdi.subtotal,
        taxAmount: cfdi.taxAmount,
        withholdingAmount: cfdi.withholdingAmount,
        total: cfdi.total,
        currency: cfdi.currency,
        paymentStatus,
        reviewStatus,
        reviewNote: validationIssues.length > 0 ? validationIssues.join(" ") : null,
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

  const { membership } = await requireCompanyAccess(companyId);
  if (membership.role !== "accountant") redirect(`/empresas/${companyId}`);

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId, companyId },
    include: { fiscalDocument: true },
  });
  if (!transaction) redirect(`/empresas/${companyId}`);

  let nextReviewStatus = reviewStatus;
  let nextReviewNote = reviewNote;
  if (reviewStatus === "reviewed" && transaction.fiscalDocument) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const validationIssues = validateCfdiAgainstCompany(company, parseCfdiXml(transaction.fiscalDocument.xmlContent));
    if (validationIssues.length > 0) {
      nextReviewStatus = "correction_required";
      nextReviewNote = validationIssues.join(" ");
    }
  }

  await prisma.transaction.update({
    where: { id: transactionId, companyId },
    data: { reviewStatus: nextReviewStatus, reviewNote: nextReviewNote },
  });

  revalidatePath(`/empresas/${companyId}`);
}

function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
