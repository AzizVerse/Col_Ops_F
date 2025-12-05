// src/components/monitor/MonitorPanel.jsx
import { StatusCard } from "./StatusCard";
import { LatestAlertCard } from "./LatestAlertCard";
import { QueueCard } from "./QueueCard";
import { MatchesActivityCard } from "./MatchesActivityCard";

export function MonitorPanel({
  statusText,
  statusColor,
  lastCheck,
  latestSubject,
  totalAmount,
  pending,
  nextPending,
  autoMode,
  toggleAutoMode,
  matches,    // <--- new
}) {
  return (
    <div
      style={{
        flex: 2,
        minWidth: 420,
        padding: 18,
        borderRadius: 16,
        background: "#020617",
        border: "1px solid #1f2937",
        boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 10,
        }}
      >
        <button
          onClick={toggleAutoMode}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #1f2937",
            background: autoMode ? "#22c55e" : "#111827",
            color: autoMode ? "#020617" : "#e5e7eb",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {autoMode ? "Auto mode: ON" : "Auto mode: OFF"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        <StatusCard
          statusText={statusText}
          statusColor={statusColor}
          lastCheck={lastCheck}
        />
        <LatestAlertCard
          latestSubject={latestSubject}
          totalAmount={totalAmount}
        />
        <QueueCard pendingCount={pending.length} nextPending={nextPending} />
      </div>

      <MatchesActivityCard matches={matches} />
    </div>
  );
}
