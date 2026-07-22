"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
};

type IconName = "home" | "users" | "table" | "file" | "bank" | "check" | "clock" | "chart" | "report" | "settings" | "help" | "logout";

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: "Despacho",
    items: [
      { label: "Clientes", href: "/empresas", icon: "users" },
    ],
  },
];

export function AppSidebar({
  companyId,
  variant = "accountant",
  workspaceName = "Ledger UI",
}: {
  companyId?: string;
  variant?: "accountant" | "client";
  workspaceName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  useDialogFocus(isMobileOpen, mobileNavigationRef);
  const clientBase = companyId ? `/empresas/${companyId}` : "/empresas";
  const navigationSections: { title: string; items: NavItem[] }[] = variant === "client" ? [
    {
      title: "Registros",
      items: [
        { label: "Home", href: clientBase, icon: "home" as IconName },
        { label: "Registrar ingreso", href: `${clientBase}?captura=income`, icon: "chart" as IconName },
        { label: "Registrar gasto", href: `${clientBase}?captura=expense`, icon: "report" as IconName },
        { label: "Importar XML", href: `${clientBase}?captura=xml`, icon: "file" as IconName },
      ],
    },
    {
      title: "Historial",
      items: [
        { label: "Todos los registros", href: `${clientBase}?vista=movimientos`, icon: "table" as IconName },
        { label: "Ingresos", href: `${clientBase}?vista=movimientos&tipo=income`, icon: "chart" as IconName },
        { label: "Gastos", href: `${clientBase}?vista=movimientos&tipo=expense`, icon: "report" as IconName },
        { label: "Gastos a credito", href: `${clientBase}?vista=movimientos&tipo=credit`, icon: "clock" as IconName },
      ],
    },
  ] : sections;

  useEffect(() => {
    if (!isMobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const sidebar = (
    <aside className={`ledger-sidebar flex flex-col ${isCollapsed ? "ledger-sidebar-collapsed" : ""}`} aria-label="Navegacion principal">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="ledger-workspace-mark" aria-hidden="true">L</div>
          {!isCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{workspaceName}</p>
              <p className="calm-muted truncate text-xs">Espacio activo</p>
            </div>
          ) : null}
        </div>
        <button
          aria-label={isCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          className="calm-icon-button hidden lg:inline-flex"
          onClick={() => setIsCollapsed((value) => !value)}
          type="button"
        >
          {isCollapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className="mt-8 grid min-h-0 flex-1 content-start gap-6 overflow-y-auto">
        {navigationSections.map((section) => (
          <div className="grid gap-2" key={section.title}>
            {!isCollapsed ? <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{section.title}</p> : null}
            <div className="grid gap-1">
              {section.items.map((item) => {
                const [itemPath, itemQuery = ""] = item.href.split("?");
                const isClientHome = variant === "client" && item.href === clientBase;
                const expectedQuery = new URLSearchParams(itemQuery);
                const isActive = variant === "client"
                  ? pathname === itemPath && (isClientHome
                    ? !searchParams.has("captura") && !searchParams.has("vista")
                    : [...expectedQuery.entries()].every(([key, value]) => searchParams.get(key) === value)
                      && (expectedQuery.has("captura") ? searchParams.has("captura") : true)
                      && (expectedQuery.has("vista") ? searchParams.has("vista") : true)
                      && (expectedQuery.has("tipo") ? true : !searchParams.has("tipo")))
                  : item.href === "/empresas" ? pathname?.startsWith("/empresas") : pathname === item.href;

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    aria-label={isCollapsed ? item.label : undefined}
                    className={`ledger-nav-item ${isActive ? "ledger-nav-item-active" : ""}`}
                    data-tooltip={item.label}
                    href={item.href}
                    key={item.label}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="ledger-nav-icon" aria-hidden="true"><NavIcon name={item.icon} /></span>
                    {!isCollapsed ? (
                      <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate">{item.label}</span>
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <form action={logout} className="mt-4 border-t border-slate-200 pt-4">
        <button aria-label={isCollapsed ? "Salir" : undefined} className="ledger-nav-item w-full" data-tooltip="Salir" type="submit">
          <span className="ledger-nav-icon" aria-hidden="true"><NavIcon name="logout" /></span>
          {!isCollapsed ? <span>Salir</span> : null}
        </button>
      </form>
    </aside>
  );

  return (
    <>
      <button
        aria-controls="mobile-navigation"
        aria-expanded={isMobileOpen}
        aria-label="Abrir navegacion"
        className="calm-icon-button fixed z-40 lg:hidden"
        onClick={() => {
          setIsCollapsed(false);
          setIsMobileOpen(true);
        }}
        type="button"
        style={{ left: "max(1rem, env(safe-area-inset-left))", top: "max(1rem, env(safe-area-inset-top))" }}
      >
        ≡
      </button>
      <div className="hidden lg:block">{sidebar}</div>
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 overscroll-contain lg:hidden" id="mobile-navigation" ref={mobileNavigationRef}>
          <button aria-label="Cerrar navegacion" className="absolute inset-0 bg-slate-950/30" onClick={() => setIsMobileOpen(false)} type="button" />
          <div className="relative h-full w-[min(88vw,304px)] p-3">{sidebar}</div>
        </div>
      ) : null}
    </>
  );
}

function NavIcon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;

  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10.5V19h11v-8.5" /></>,
    users: <><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M3.5 19a4.5 4.5 0 0 1 9 0" /><path d="M16.5 11.5a2.5 2.5 0 1 0 0-5" /><path d="M15.5 15a4 4 0 0 1 5 4" /></>,
    table: <><path d="M4 6h16v12H4z" /><path d="M4 10h16" /><path d="M9 6v12" /></>,
    file: <><path d="M7 4h7l4 4v12H7z" /><path d="M14 4v5h5" /><path d="M9.5 13h5" /><path d="M9.5 16h4" /></>,
    bank: <><path d="M4 9h16" /><path d="M6 9v8" /><path d="M10 9v8" /><path d="M14 9v8" /><path d="M18 9v8" /><path d="M3.5 19h17" /><path d="m12 4 8 5H4z" /></>,
    check: <><path d="M20 6 9 17l-5-5" /></>,
    clock: <><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path d="M12 7.5V12l3 2" /></>,
    chart: <><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /></>,
    report: <><path d="M5 5h14v14H5z" /><path d="M8 15h8" /><path d="M8 11h8" /><path d="M8 8h4" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.1L14.2 3h-4.4l-.3 2.8a7.5 7.5 0 0 0-2 1.1l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.1l.3 2.8h4.4l.3-2.8a7.5 7.5 0 0 0 2-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></>,
    help: <><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path d="M9.8 9a2.3 2.3 0 0 1 4.4 1c0 1.8-2.2 2-2.2 3.5" /><path d="M12 17h.01" /></>,
    logout: <><path d="M10 5H5v14h5" /><path d="M14 8l4 4-4 4" /><path d="M9 12h9" /></>,
  };

  return <svg aria-hidden="true" height="18" width="18" {...common}>{paths[name]}</svg>;
}
