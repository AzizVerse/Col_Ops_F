// src/components/pending/NextPendingCard.jsx
import {
  formatRowIndexes,
  getInvoiceItems,
  formatMoneyTND,
} from "../../util/helper";

export function NextPendingCard({
  nextPending,
  handleConfirm,
  handleCancel,
  confirmingId,
  cancellingId,
}) {
  if (!nextPending) return null;

  const invoiceItems = getInvoiceItems(nextPending);

  const sumAmount = Number(nextPending.sum_amount);
  const hasSumAmount = Number.isFinite(sumAmount) && sumAmount > 0;

  const transferAmount = Number(nextPending.amount_tnd || 0);

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 16,
        background: "#0f172a",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Next pending matching
      </h2>
      <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>
        Review this payment and confirm that the matched client is correct, or
        cancel if the match is not valid.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left block */}
        <div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Date</div>
          <div style={{ fontWeight: 600 }}>{nextPending.date}</div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            Amount (transfer)
          </div>
          <div
            style={{
              fontWeight: 800,
              color: "#22c55e",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {transferAmount.toLocaleString("fr-FR", { minimumFractionDigits: 3 })}{" "}
            TND
          </div>

          {hasSumAmount && (
            <>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                Sum of invoices
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {sumAmount.toLocaleString("fr-FR", { minimumFractionDigits: 3 })}{" "}
                TND
              </div>
            </>
          )}
        </div>

        {/* Middle block */}
        <div style={{ minWidth: 260 }}>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Matched client</div>
          <div style={{ fontWeight: 700 }}>
            {nextPending.matched_client || "—"}
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 10 }}>
            Invoices matched
          </div>
          <div style={{ fontWeight: 700 }}>{formatRowIndexes(nextPending)}</div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 10 }}>
            Invoices details
          </div>

          {invoiceItems.length === 0 ? (
            <div style={{ fontWeight: 600 }}>—</div>
          ) : (
            <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
              {invoiceItems.map((it) => (
                <div
                  key={it.row_index}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#020617",
                    border: "1px solid #1f2937",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    fontVariantNumeric: "tabular-nums",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                #{it.row_index}
                {it.invoice_number ? ` — ${it.invoice_number}` : ""}
                {it.month ? ` — ${it.month}` : ""}
              </div>
                  <div style={{ fontWeight: 900 }}>
                    {formatMoneyTND(it.invoice_amount)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 10 }}>
            Confidence
          </div>
          <div style={{ fontWeight: 700 }}>
            {(((nextPending.confidence ?? 0) * 100).toFixed(0))}%
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 10 }}>
            Diff to nearest
          </div>
          <div style={{ fontWeight: 700 }}>
            {Number(nextPending.nearest_diff ?? 0).toFixed(3)} TND
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 10 }}>
            Time left before expiry
          </div>
          <div style={{ fontWeight: 700 }}>
            {Number(nextPending.hours_left ?? 0).toFixed(1)} hours
          </div>
        </div>

        {/* Right block */}
        <div
          style={{
            alignSelf: "center",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => handleConfirm(nextPending.id)}
            disabled={confirmingId === nextPending.id}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: confirmingId === nextPending.id ? "#6b7280" : "#22c55e",
              color: "#020617",
              fontWeight: 800,
              cursor: confirmingId === nextPending.id ? "default" : "pointer",
            }}
          >
            {confirmingId === nextPending.id ? "Confirming..." : "Confirm match"}
          </button>

          <button
            onClick={() => handleCancel(nextPending.id)}
            disabled={cancellingId === nextPending.id}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #f97373",
              background: cancellingId === nextPending.id ? "#111827" : "#0f172a",
              color: "#f97373",
              fontWeight: 800,
              cursor: cancellingId === nextPending.id ? "default" : "pointer",
            }}
          >
            {cancellingId === nextPending.id ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}