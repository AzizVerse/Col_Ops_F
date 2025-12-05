// src/components/pending/NextPendingCard.jsx
export function NextPendingCard({
  nextPending,
  handleConfirm,
  handleCancel,
  confirmingId,
  cancellingId,
}) {
  if (!nextPending) return null;

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
        <div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Date</div>
          <div style={{ fontWeight: 600 }}>{nextPending.date}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            Amount
          </div>
          <div
            style={{
              fontWeight: 700,
              color: "#22c55e",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {nextPending.amount_tnd.toLocaleString("fr-FR", {
              minimumFractionDigits: 3,
            })}{" "}
            TND
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>Matched client</div>
          <div style={{ fontWeight: 600 }}>
            {nextPending.matched_client || "—"}
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            Confidence
          </div>
          <div style={{ fontWeight: 600 }}>
            {(((nextPending.confidence ?? 0) * 100).toFixed(0))}%
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            Diff to nearest
          </div>
          <div style={{ fontWeight: 600 }}>
            {(nextPending.nearest_diff ?? 0).toFixed(3)} TND
          </div>

          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            Time left before expiry
          </div>
          <div style={{ fontWeight: 600 }}>
            {nextPending.hours_left.toFixed(1)} hours
          </div>
        </div>

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
              background:
                confirmingId === nextPending.id ? "#6b7280" : "#22c55e",
              color: "#020617",
              fontWeight: 700,
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
              background:
                cancellingId === nextPending.id ? "#111827" : "#0f172a",
              color: "#f97373",
              fontWeight: 700,
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
