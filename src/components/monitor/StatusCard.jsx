// src/components/monitor/StatusCard.jsx
export function StatusCard({ statusText, statusColor, lastCheck }) {
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
      <div style={{ fontSize: 14, color: "#9ca3af" }}>Status</div>
      <div
        style={{
          marginTop: 4,
          fontSize: 18,
          fontWeight: 700,
          color: statusColor,
        }}
      >
        {statusText}
      </div>
      {lastCheck && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          Last check: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
