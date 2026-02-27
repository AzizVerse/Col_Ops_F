// src/components/negotiations/MarketQuotesPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchMarketQuotes, createMarketQuote } from "../../api";

/* ======================
 * Styles (same dark theme, fixed dropdown colors)
 * ====================== */

const cardStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
};

const labelStyle = {
  fontSize: 12,
  color: "rgba(229,231,235,0.75)",
  fontWeight: 800,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const inputStyle = {
  width: "90%",
  background: "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
};

const optionStyle = {
  background: "#0b1220",
  color: "#e5e7eb",
};

const btnStyle = (primary = true) => ({
  background: primary ? "#2563eb" : "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 800,
});

const tableWrapStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,

  // ✅ scrolling
  maxHeight: "70vh",     // adjust: 60vh / 75vh
  overflowY: "auto",
  overflowX: "auto",

  // helps sticky header behave nicely
  position: "relative",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

const thStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "rgba(2,6,23,0.92)",
  color: "rgba(229,231,235,0.88)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: 11,
  fontWeight: 900,
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const monoStyle = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontVariantNumeric: "tabular-nums",
};

/* ======================
 * Lists
 * ====================== */

const CURRENCY_PAIRS = ["EUR/TND", "USD/TND", "GBP/TND", "EUR/USD", "EUR/GBP", "USD/GBP"];

const BANKS = [
  "BIAT",
  "STB",
  "UBCI",
  "NAIB",
  "BTL",
  "WIFAK BANK",
  "BNA",
  "ATTIJARI BANK",
  "ATB",
  "AMEN BANK",
  "ZITOUNA",
  "BT",
  "UIB",
  "QNB",
  "BH",
  "BTK",
  "BTE",
];

const ANALYSTS = [
  "Mezri Karoui",
  "Amine Rouaissi",
  "Yosr Ben Amar",
  "Tarak Ktari",
  "Hedi Ghorbel",
  "Aziz Ben Mahmoud",
  "Amine Soltana",
  "Heni Ghazouany",
];

export default function MarketQuotesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    currency_pair: "EUR/TND",
    bank_name: "",
    bid: "",
    ask: "",
    analyst_name: "",
    note: "",
  });

  const canSubmit = useMemo(() => {
    const bid = Number(form.bid);
    const ask = Number(form.ask);
    return (
      form.currency_pair.trim() &&
      form.bank_name.trim() &&
      form.analyst_name.trim() &&
      Number.isFinite(bid) &&
      Number.isFinite(ask) &&
      bid > 0 &&
      ask > 0 &&
      bid < ask
    );
  }, [form]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMarketQuotes(200);
      setItems(data.items || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setPosting(true);
    setError("");
    try {
      await createMarketQuote({
        currency_pair: form.currency_pair.trim(),
        bank_name: form.bank_name.trim(),
        bid: Number(form.bid),
        ask: Number(form.ask),
        analyst_name: form.analyst_name.trim(),
        note: String(form.note || "").trim(),
      });

      setForm((f) => ({
        ...f,
        bid: "",
        ask: "",
        note: "",
        bank_name: "",
      }));

      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setPosting(false);
    }
  }

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
      {/* LEFT: Form */}
      <div style={{ ...cardStyle, flex: "1 1 340px", minWidth: 340 }}>
        <div style={{ fontWeight: 900, color: "#e5e7eb", marginBottom: 10 }}>
          Add Market Quote
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          {/* Pair */}
          <div>
            <div style={labelStyle}>Currency Pair</div>
            <select
              style={selectStyle}
              value={form.currency_pair}
              onChange={(e) => setForm({ ...form, currency_pair: e.target.value })}
            >
              {CURRENCY_PAIRS.map((p) => (
                <option key={p} value={p} style={optionStyle}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Bank */}
          <div>
            <div style={labelStyle}>Bank</div>
            <select
              style={selectStyle}
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            >
              <option value="" style={optionStyle}>
                Select bank
              </option>
              {BANKS.map((b) => (
                <option key={b} value={b} style={optionStyle}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Bid / Ask (bid a bit smaller than ask, both stay inside) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.9fr 1.1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div style={{ maxWidth: 170 }}>
              <div style={labelStyle}>Bid</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder="e.g. 3.4120"
                value={form.bid}
                onChange={(e) => setForm({ ...form, bid: e.target.value })}
                inputMode="decimal"
              />
            </div>

            <div style={{ maxWidth: 210 }}>
              <div style={labelStyle}>Ask</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder="e.g. 3.4250"
                value={form.ask}
                onChange={(e) => setForm({ ...form, ask: e.target.value })}
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Analyst */}
          <div>
            <div style={labelStyle}>Analyst</div>
            <select
              style={selectStyle}
              value={form.analyst_name}
              onChange={(e) => setForm({ ...form, analyst_name: e.target.value })}
            >
              <option value="" style={optionStyle}>
                Select analyst
              </option>
              {ANALYSTS.map((a) => (
                <option key={a} value={a} style={optionStyle}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <div style={labelStyle}>Note (optional)</div>
            <input
              style={inputStyle}
              placeholder="e.g. indicative, wide, client flow…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" style={btnStyle(true)} disabled={!canSubmit || posting}>
              {posting ? "Saving..." : "Save Quote"}
            </button>

            <button type="button" style={btnStyle(false)} onClick={refresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(229,231,235,0.65)" }}>
              {loading ? "Syncing…" : "Live"}
            </div>
          </div>

          {error && <div style={{ color: "#f97373", fontSize: 13 }}>{error}</div>}
          {!error && !canSubmit && (
            <div style={{ color: "rgba(229,231,235,0.55)", fontSize: 12 }}>
              Tip: bid must be &lt; ask.
            </div>
          )}
        </form>
      </div>

      {/* RIGHT: Table */}
      <div style={{ ...tableWrapStyle, flex: "2 1 620px", minWidth: 620 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 900, color: "#e5e7eb" }}>Market Quotes</div>
          <div style={{ color: "rgba(229,231,235,0.7)", fontSize: 12 }}>
            Auto-refresh: 10s • Rows: {items.length}
          </div>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["timestamp_utc", "currency_pair", "bank_name", "bid", "ask", "analyst_name", "note"].map(
                (h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {items.map((r, idx) => {
              const zebra = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";

              return (
                <tr
                  key={r.quote_id || `${r.timestamp_utc}-${idx}`}
                  style={{ background: zebra, transition: "background 120ms ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = zebra)}
                >
                  <td style={{ ...tdStyle, color: "rgba(229,231,235,0.80)" }}>{r.timestamp_utc}</td>

                  <td style={{ ...tdStyle, fontWeight: 900 }}>{r.currency_pair}</td>

                  <td style={tdStyle}>{r.bank_name}</td>

                  <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                    {Number(r.bid || 0).toFixed(4)}
                  </td>

                  <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                    {Number(r.ask || 0).toFixed(4)}
                  </td>

                  <td style={tdStyle}>{r.analyst_name}</td>

                  <td style={{ ...tdStyle, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.note || ""}
                  </td>
                </tr>
              );
            })}

            {!items.length && !loading && (
              <tr>
                <td colSpan={7} style={{ padding: 12, color: "rgba(229,231,235,0.7)" }}>
                  No quotes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
