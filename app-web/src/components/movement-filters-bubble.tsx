import Link from "next/link";

export function MovementFiltersBubble({
  companyId,
  movementFilter,
}: {
  companyId: string;
  movementFilter: string;
}) {
  const options = [
    { href: `/empresas/${companyId}`, label: "Todos", value: "all" },
    { href: `/empresas/${companyId}?tipo=income`, label: "Ingresos", value: "income" },
    { href: `/empresas/${companyId}?tipo=expense`, label: "Gastos", value: "expense" },
    { href: `/empresas/${companyId}?tipo=credit`, label: "Gastos a credito", value: "credit" },
  ];

  return (
    <nav aria-label="Filtrar movimientos" className="flex max-w-full gap-2 overflow-x-auto pb-1">
      {options.map((option) => (
        <Link
          aria-current={movementFilter === option.value ? "page" : undefined}
          className={`calm-filter shrink-0 ${movementFilter === option.value ? "calm-filter-active" : "calm-filter-idle"}`}
          href={option.href}
          key={option.value}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
