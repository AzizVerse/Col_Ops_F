// src/components/desk/DeskPanel.jsx
import NegotiationFeedPanel from "../negotiations/NegotiationFeedPanel.jsx";
import MarketQuotesPanel from "../negotiations/MarketQuotesPanel.jsx";

export default function DeskPanel() {
  return (
    <div
      style={{
        marginTop: 8,
        display: "grid",
        gap: 14,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          color: "rgba(229,231,235,0.92)",
          fontWeight: 900,
          letterSpacing: "0.02em",
          fontSize: 14,
          minWidth: 0,
        }}
      >
        Desk
      </div>

      <div style={{ minWidth: 0, width: "100%" }}>
        <MarketQuotesPanel />
      </div>

      <div style={{ minWidth: 0, width: "100%" }}>
        <NegotiationFeedPanel />
      </div>
    </div>
  );
}