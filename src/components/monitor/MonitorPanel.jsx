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
  matches,
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
      {/* Mode switch (safe) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#e5e7eb" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>
            Processing mode
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Manual = preview + confirm. Auto = applies matches immediately.
          </div>
        </div>

        {/* Segmented control */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Manual */}
          <button
            type="button"
            onClick={() => {
              if (autoMode) toggleAutoMode(); // only toggle if currently auto
            }}
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              border: "1px solid transparent",
              background: autoMode ? "transparent" : "#2563eb",
              color: autoMode ? "#e5e7eb" : "#ffffff",
              fontSize: 12,
              fontWeight: 700,
              cursor: autoMode ? "pointer" : "default",
              transition: "all 120ms ease",
              outline: "none",
            }}
            aria-pressed={!autoMode}
          >
            Manual (safe)
          </button>

          {/* Auto */}
          <button
            type="button"
            onClick={() => {
              if (!autoMode) toggleAutoMode(); // only toggle if currently manual
            }}
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              border: "1px solid transparent",
              background: autoMode ? "#f59e0b" : "transparent",
              color: autoMode ? "#111827" : "#e5e7eb",
              fontSize: 12,
              fontWeight: 800,
              cursor: autoMode ? "default" : "pointer",
              transition: "all 120ms ease",
              outline: "none",
            }}
            aria-pressed={autoMode}
            title="Auto applies matches immediately (no confirmation)."
          >
            Auto Mode
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        <StatusCard statusText={statusText} statusColor={statusColor} lastCheck={lastCheck} />
        <LatestAlertCard latestSubject={latestSubject} totalAmount={totalAmount} />
        <QueueCard pendingCount={pending.length} nextPending={nextPending} />
      </div>

      <MatchesActivityCard matches={matches} />
    </div>
  );
}
