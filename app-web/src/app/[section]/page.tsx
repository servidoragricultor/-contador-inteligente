import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";

const sections: Record<string, { title: string; description: string }> = {
  home: {
    title: "Home",
    description: "Resumen general del espacio contable. Esta interfaz se activara proximamente.",
  },
  tabla: {
    title: "Tabla general",
    description: "Vista consolidada de movimientos y clientes. Esta interfaz se activara proximamente.",
  },
  facturas: {
    title: "Facturas",
    description: "Gestion de facturas y XML. Esta interfaz se activara proximamente.",
  },
  bancos: {
    title: "Bancos",
    description: "Conexion y revision de movimientos bancarios. Esta interfaz se activara proximamente.",
  },
  conciliaciones: {
    title: "Conciliaciones",
    description: "Flujo para conciliar registros fiscales, contables y bancarios. Esta interfaz se activara proximamente.",
  },
  pendientes: {
    title: "Pendientes",
    description: "Seguimiento de registros que requieren atencion. Esta interfaz se activara proximamente.",
  },
  dashboard: {
    title: "Dashboard",
    description: "Indicadores financieros principales. Esta interfaz se activara proximamente.",
  },
  reportes: {
    title: "Reportes",
    description: "Reportes contables y financieros exportables. Esta interfaz se activara proximamente.",
  },
  configuracion: {
    title: "Configuracion",
    description: "Preferencias del despacho y del sistema. Esta interfaz se activara proximamente.",
  },
  ayuda: {
    title: "Ayuda",
    description: "Guias y soporte para usar la plataforma. Esta interfaz se activara proximamente.",
  },
};

export default async function TemporarySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const user = await requireUser();
  const { section } = await params;
  const current = sections[section];

  if (!current) {
    notFound();
  }

  return (
    <div className="ledger-layout">
      <AppSidebar workspaceName={user.name || "Despacho"} />
      <main className="ledger-main" id="main-content">
        <header className="relative flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="calm-eyebrow">Desactivado temporalmente</p>
            <h1 className="calm-title">{current.title}</h1>
            <p className="calm-subtitle">{current.description}</p>
          </div>
        </header>

        <section className="calm-panel mt-8 max-w-2xl">
          <p className="calm-eyebrow">Proximamente</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Esta seccion aun no esta disponible</h2>
          <p className="calm-muted mt-3 text-sm leading-6">
            La navegacion ya esta preparada para esta area. Mientras tanto, puedes volver a Clientes desde la barra lateral.
          </p>
        </section>
      </main>
    </div>
  );
}
