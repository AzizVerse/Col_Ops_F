// src/components/monitor/QueueCard.jsx
import { formatRowIndexes } from "../../util/helper";

export function QueueCard({ pendingCount, nextPending }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 220,
        padding: 14,
        borderRadius: 12,
        background: "#0f172a",
      }}
    >
      <div style={{ fontSize: 14, color: "#9ca3af" }}>Queue</div>

      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 700,
          color: pendingCount > 0 ? "#facc15" : "#4ade80",
        }}
      >
        {pendingCount} pending
      </div>

      {nextPending && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
          Next:{" "}
          {Number(nextPending.amount_tnd || 0).toLocaleString("fr-FR", {
            minimumFractionDigits: 3,
          })}{" "}
          TND – {nextPending.date}
          <br />
          Invoices: {formatRowIndexes(nextPending)}
          <br />
          Time left: {Number(nextPending.hours_left ?? 0).toFixed(1)} h
        </div>
      )}
    </div>
  );
}