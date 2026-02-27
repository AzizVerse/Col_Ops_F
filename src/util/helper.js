export function getRowIndexes(op) {
  if (Array.isArray(op?.row_indexes) && op.row_indexes.length > 0) {
    return op.row_indexes.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }
  if (op?.row_index != null) return [Number(op.row_index)];
  return [];
}

export function formatRowIndexes(op) {
  const rows = getRowIndexes(op);
  if (rows.length === 0) return "—";
  if (rows.length === 1) return `#${rows[0]}`;
  return `#${rows.join(", #")} (${rows.length} invoices)`;
}

export function getInvoiceItems(op) {
  if (!Array.isArray(op?.invoice_items)) return [];
  return op.invoice_items
    .map((it) => ({
      row_index: Number(it?.row_index),
      month: String(it?.month || ""),
      invoice_amount: Number(it?.invoice_amount || 0),
    }))
    .filter((it) => Number.isFinite(it.row_index));
}

export function formatMoneyTND(x) {
  const n = Number(x || 0);
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 3 }) + " TND";
}

export function formatInvoiceItemsInline(op) {
  const items = getInvoiceItems(op);
  if (items.length === 0) return "—";

  // short inline summary for tables
  return items
    .map((it) => {
      const m = it.month ? ` — ${it.month}` : "";
      return `#${it.row_index}${m}: ${formatMoneyTND(it.invoice_amount)}`;
    })
    .join(" | ");
}