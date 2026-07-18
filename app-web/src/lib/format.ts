export function currency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function shortDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(value);
}

export function reviewLabel(status: string) {
  const labels: Record<string, string> = {
    unreviewed: "Sin revisar",
    reviewed: "Revisado",
    correction_required: "Requiere correccion",
  };

  return labels[status] ?? status;
}

export function paymentLabel(status: string, type: string) {
  if (status === "pending") return "Pendiente";
  if (status === "cancelled") return "Cancelado";
  if (type === "income") return "Cobrado";
  return "Pagado";
}
