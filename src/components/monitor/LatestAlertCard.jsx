// src/components/monitor/LatestAlertCard.jsx
export function LatestAlertCard({ latestSubject, totalAmount }) {
  return (
    <div
      style={{
        flex: 2,
        minWidth: 260,
        padding: 14,
        borderRadius: 12,
        background: "#020617",
        border: "1px dashed #1f2937",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ flex: 3 }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Latest subject</div>
          <div
            style={{
              marginTop: 4,
              fontWeight: 600,
              color: "#e5e7eb",
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: "1.3",
              maxHeight: "2.6em",
            }}
            title={latestSubject || ""}
          >
            {latestSubject || "—"}
          </div>
        </div>
        <div style={{ flex: 2, textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Total amount in latest alert
          </div>
          <div
            style={{
              marginTop: 4,
              fontWeight: 700,
              fontSize: 16,
              color: totalAmount ? "#22c55e" : "#6b7280",
            }}
          >
            {totalAmount
              ? totalAmount.toLocaleString("fr-FR", {
                  minimumFractionDigits: 3,
                }) + " TND"
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
