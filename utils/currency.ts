export function formatRs(amount: number | undefined | null): string {
  const n = Number(amount);
  return `Rs ${Number.isFinite(n) ? Math.round(n).toLocaleString("en-PK") : "0"}`;
}
