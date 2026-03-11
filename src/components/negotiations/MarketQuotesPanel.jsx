// src/components/negotiations/MarketQuotesPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchMarketQuotes, createMarketQuote } from "../../api";

/* ======================
 * Styles
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
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
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
  maxHeight: "72vh",
  overflowY: "auto",
  overflowX: "auto",
  position: "relative",
};

const tableStyle = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

const thStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "rgba(2,6,23,0.96)",
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

const filterBarStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 1fr auto",
  gap: 10,
  marginBottom: 12,
};

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

  const [filters, setFilters] = useState({
    q: "",
    currency_pair: "ALL",
    bank_name: "ALL",
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

  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return items.filter((r) => {
      const matchesText =
        !q ||
        String(r.currency_pair || "").toLowerCase().includes(q) ||
        String(r.bank_name || "").toLowerCase().includes(q) ||
        String(r.analyst_name || "").toLowerCase().includes(q) ||
        String(r.note || "").toLowerCase().includes(q);

      const matchesPair =
        filters.currency_pair === "ALL" || r.currency_pair === filters.currency_pair;

      const matchesBank =
        filters.bank_name === "ALL" || r.bank_name === filters.bank_name;

      return matchesText && matchesPair && matchesBank;
    });
  }, [items, filters]);

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
        bank_name: "",
        bid: "",
        ask: "",
        note: "",
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
      <div style={{ ...cardStyle, flex: "1 1 360px", minWidth: 360 }}>
        <div style={{ fontWeight: 900, color: "#e5e7eb", marginBottom: 10 }}>
          Add Market Quote
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div>
              <div style={labelStyle}>Bid</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder="e.g. 3.4120"
                value={form.bid}
                onChange={(e) => setForm({ ...form, bid: e.target.value })}
                inputMode="decimal"
              />
            </div>

            <div>
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

          <div>
            <div style={labelStyle}>Note (optional)</div>
            <input
              style={inputStyle}
              placeholder="e.g. indicative, wide, client flow..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" style={btnStyle(true)} disabled={!canSubmit || posting}>
              {posting ? "Saving..." : "Save Quote"}
            </button>

            <button type="button" style={btnStyle(false)} onClick={refresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(229,231,235,0.65)" }}>
              {loading ? "Syncing..." : "Live"}
            </div>
          </div>

          {error && <div style={{ color: "#f97373", fontSize: 13 }}>{error}</div>}
          {!error && !canSubmit && (
            <div style={{ color: "rgba(229,231,235,0.55)", fontSize: 12 }}>
              Tip: bid must be less than ask.
            </div>
          )}
        </form>
      </div>

      <div style={{ ...tableWrapStyle, flex: "2 1 720px", minWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 900, color: "#e5e7eb" }}>Market Quotes</div>
          <div style={{ color: "rgba(229,231,235,0.7)", fontSize: 12 }}>
            Auto-refresh: 10s • Rows: {filteredItems.length}
          </div>
        </div>

        <div style={filterBarStyle}>
          <input
            style={inputStyle}
            placeholder="Search pair / bank / analyst / note..."
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />

          <select
            style={selectStyle}
            value={filters.currency_pair}
            onChange={(e) => setFilters((f) => ({ ...f, currency_pair: e.target.value }))}
          >
            <option value="ALL" style={optionStyle}>
              All pairs
            </option>
            {CURRENCY_PAIRS.map((p) => (
              <option key={p} value={p} style={optionStyle}>
                {p}
              </option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={filters.bank_name}
            onChange={(e) => setFilters((f) => ({ ...f, bank_name: e.target.value }))}
          >
            <option value="ALL" style={optionStyle}>
              All banks
            </option>
            {BANKS.map((b) => (
              <option key={b} value={b} style={optionStyle}>
                {b}
              </option>
            ))}
          </select>

          <button
            type="button"
            style={btnStyle(false)}
            onClick={() =>
              setFilters({
                q: "",
                currency_pair: "ALL",
                bank_name: "ALL",
              })
            }
          >
            Reset
          </button>
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
            {filteredItems.map((r, idx) => {
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

            {!filteredItems.length && !loading && (
              <tr>
                <td colSpan={7} style={{ padding: 12, color: "rgba(229,231,235,0.7)" }}>
                  No quotes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}