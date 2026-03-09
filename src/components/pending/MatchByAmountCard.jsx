import { useMemo, useState } from "react";
import { matchByAmount } from "../../api";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function MatchByAmountCard({ onQueued }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const amountNum = useMemo(() => {
    const x = Number(String(amount).trim().replace(/\s+/g, "").replace(",", "."));
    return Number.isFinite(x) ? x : NaN;
  }, [amount]);

  const canSubmit = Number.isFinite(amountNum) && amountNum > 0 && !loading;

  const submit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const res = await matchByAmount({
        amount_tnd: amountNum,
        date: date || null,
      });

      setMsg(
        res?.match?.match_type
          ? `Queued (${res.match.match_type}) → ${res.match.client || "—"}`
          : "Queued (unmatched)"
      );

      setAmount("");

      if (onQueued) await onQueued();
    } catch (e) {
      setErr(e?.message || "Failed to match by amount");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    outline: "none",
    fontSize: 13,
  };

  const labelStyle = { fontSize: 12, color: "rgba(229,231,235,0.75)" };

  const buttonStyle = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: canSubmit ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    fontWeight: 750,
    fontSize: 13,
    cursor: canSubmit ? "pointer" : "not-allowed",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        padding: 14,
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Manual Match</div>
        <div style={{ fontSize: 12, color: "rgba(229,231,235,0.65)" }}>
          Adds a pending item (confirm/cancel like Outlook & OCR)
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>Amount (TND)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="29082.915"
            style={{ ...inputStyle, width: 210 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>Date (optional)</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ ...inputStyle, width: 170 }}
          />
        </div>

        <button onClick={submit} disabled={!canSubmit} style={buttonStyle} title="Queue a match suggestion">
          {loading ? "Searching…" : "Search & Queue"}
        </button>

        {(msg || err) && (
          <div style={{ flex: 1, minWidth: 240, paddingBottom: 2 }}>
            {msg ? <div style={{ color: "#4ade80", fontSize: 13 }}>{msg}</div> : null}
            {err ? <div style={{ color: "#f97373", fontSize: 13 }}>{err}</div> : null}
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "rgba(229,231,235,0.60)" }}>
        Tip: you can paste with spaces or comma decimals (e.g. <span style={{ color: "#e5e7eb" }}>29 082,915</span>).
      </div>
    </div>
  );
}