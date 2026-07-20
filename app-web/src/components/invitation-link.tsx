"use client";

import Link from "next/link";
import { useState } from "react";

export function InvitationLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/invitacion/${token}`;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
  }

  return (
    <div className="grid gap-3">
      <div className="calm-alert-success" role="status">Invitacion lista. Comparte este enlace solo con el cliente.</div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input aria-label="Enlace de invitacion" className="calm-input min-w-0 font-mono text-xs" readOnly value={path} />
        <button className="calm-button-primary" onClick={copyLink} type="button">{copied ? "Copiado" : "Copiar enlace"}</button>
      </div>
      <Link className="text-center text-sm font-medium text-emerald-800 hover:underline" href={path} target="_blank">Abrir enlace para comprobarlo</Link>
    </div>
  );
}
