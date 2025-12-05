// src/components/monitor/MatchesActivityCard.jsx
export function MatchesActivityCard({ matches }) {
  if (!matches || matches.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        background: "#0f172a",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
        Latest Matching Actions
      </h2>

      <div
        style={{
          maxHeight: 220,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {matches.map((m, i) => {
          const amount = Number(m.amount || m.amount_detected || 0);
          const invoiceAmount = Number(m.invoice_amount || 0);
          const diff = Number(m.diff || 0);

          return (
            <div
              key={i}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e5e7eb" }}>
                Matched {amount.toLocaleString("fr-FR", { minimumFractionDigits: 3 })} TND
              </div>

              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                → {m.client || "Unknown client"} ({m.match_type})
              </div>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Diff: {diff.toFixed(3)} TND — Invoice:{" "}
                {invoiceAmount.toLocaleString("fr-FR", {
                  minimumFractionDigits: 3,
                })}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "#4b5563",
                  marginTop: 2,
                }}
              >
                Row #{m.row_index}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
