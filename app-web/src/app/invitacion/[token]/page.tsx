import { createHash } from "node:crypto";
import Link from "next/link";
import { acceptClientInvitation } from "@/app/actions";
import { prisma } from "@/lib/prisma";

const invitationErrors: Record<string, string> = {
  correo: "Ese correo ya tiene una cuenta. Solicita una invitacion para otro correo.",
  datos: "Revisa tu nombre, correo y contrasena. Ambas contrasenas deben coincidir y tener al menos 6 caracteres.",
  invalida: "La invitacion no es valida o ya vencio.",
  utilizada: "La invitacion ya fue utilizada o el cliente ya tiene acceso.",
};

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const validTokenFormat = /^[a-f0-9]{64}$/.test(token);
  const invitation = validTokenFormat
    ? await prisma.clientInvitation.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      include: { company: { select: { legalName: true, tradeName: true } } },
    })
    : null;
  const isAvailable = Boolean(invitation && !invitation.usedAt && invitation.expiresAt > new Date());

  return (
    <main className="calm-page min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center">
        <section className="calm-panel w-full">
          <div className="ledger-workspace-mark">L</div>
          <p className="calm-eyebrow mt-6">Portal del cliente</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Crea tu acceso</h1>

          {isAvailable && invitation ? (
            <>
              <p className="calm-muted mt-2 text-sm leading-6">
                {invitation.company.tradeName || invitation.company.legalName} te invito a su espacio contable. Registra tu correo y elige una contrasena personal.
              </p>
              {error && invitationErrors[error] ? <div className="calm-alert-error mt-5" role="alert">{invitationErrors[error]}</div> : null}
              <form action={acceptClientInvitation} className="mt-6 grid gap-4">
                <input name="token" type="hidden" value={token} />
                <label className="calm-field">Tu nombre
                  <input autoComplete="name" className="calm-input font-normal" name="name" required />
                </label>
                <label className="calm-field">Correo
                  <input autoCapitalize="none" autoComplete="email" className="calm-input font-normal" name="email" placeholder="tu@correo.com" required type="email" />
                </label>
                <label className="calm-field">Elige una contrasena
                  <input autoComplete="new-password" className="calm-input font-normal" minLength={6} name="password" required type="password" />
                  <span className="calm-help">Minimo 6 caracteres.</span>
                </label>
                <label className="calm-field">Confirma tu contrasena
                  <input autoComplete="new-password" className="calm-input font-normal" minLength={6} name="passwordConfirmation" required type="password" />
                </label>
                <button className="calm-button-primary mt-2 w-full" type="submit">Crear mi acceso</button>
              </form>
            </>
          ) : (
            <div className="mt-6 grid gap-4">
              <div className="calm-alert-error" role="alert">Esta invitacion vencio, ya fue utilizada o no es valida.</div>
              <p className="calm-muted text-sm leading-6">Solicita al contador que genere un enlace nuevo.</p>
              <Link className="calm-button-secondary" href="/">Volver al inicio</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
