export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseMoney(value: string): number {
  const normalized = value.replace(/[^\d]/g, "");
  return Number(normalized);
}
