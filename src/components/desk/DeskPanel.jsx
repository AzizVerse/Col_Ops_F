// src/components/desk/DeskPanel.jsx
import NegotiationFeedPanel from "../negotiations/NegotiationFeedPanel.jsx";
import MarketQuotesPanel from "../negotiations/MarketQuotesPanel.jsx";

export default function DeskPanel() {
  return (
    <div style={{ marginTop: 8, display: "grid", gap: 14 }}>
      <div
        style={{
          color: "rgba(229,231,235,0.92)",
          fontWeight: 900,
          letterSpacing: "0.02em",
          fontSize: 14,
        }}
      >
        Desk
      </div>
       {/* BOTTOM: Market quotes */}
      <div>
        <MarketQuotesPanel />
      </div>

      {/* TOP: Negotiation feed */}
      <div>
        <NegotiationFeedPanel />
      </div>

     
    </div>
  );
}
