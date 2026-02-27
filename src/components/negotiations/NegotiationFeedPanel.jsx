import { useEffect, useMemo, useState } from "react";
import { fetchNegotiationFeed, createNegotiationFeedEntry } from "../../api";

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
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
};

const optionStyle = {
  background: "#ffffff",
  color: "#0f172a",
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
  ...cardStyle,
  overflowX: "auto",
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

function statusPill(status) {
  const s = String(status || "").toUpperCase();
  let bg = "rgba(148,163,184,0.18)";
  let br = "rgba(148,163,184,0.25)";
  let color = "rgba(229,231,235,0.92)";

  if (s === "CONFIRMED") {
    bg = "rgba(34,197,94,0.18)";
    br = "rgba(34,197,94,0.30)";
  } else if (s === "NEGOTIATING") {
    bg = "rgba(234,179,8,0.18)";
    br = "rgba(234,179,8,0.30)";
  } else if (s === "CANCELLED") {
    bg = "rgba(239,68,68,0.18)";
    br = "rgba(239,68,68,0.30)";
  } else if (s === "INFO") {
    bg = "rgba(59,130,246,0.18)";
    br = "rgba(59,130,246,0.30)";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${br}`,
        fontWeight: 900,
        fontSize: 12,
        color,
      }}
    >
      {s || "—"}
    </span>
  );
}

/* ======================
 * Dropdown lists
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

export default function NegotiationFeedPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    currency_pair: "EUR/TND",
    side: "SELL",
    amount_fcy: "",
    bank_name: "",
    quoted_rate: "",
    analyst_name: "",
    status: "CONFIRMED",
  });

  const canSubmit = useMemo(() => {
    const amt = Number(form.amount_fcy);
    const rate = Number(form.quoted_rate);
    return (
      form.currency_pair.trim() &&
      form.side.trim() &&
      Number.isFinite(amt) &&
      amt > 0 &&
      form.bank_name.trim() &&
      Number.isFinite(rate) &&
      rate > 0 &&
      form.analyst_name.trim() &&
      form.status.trim()
    );
  }, [form]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNegotiationFeed(200);
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
      await createNegotiationFeedEntry({
        currency_pair: form.currency_pair.trim(),
        side: form.side.trim().toUpperCase(),
        amount_fcy: Number(form.amount_fcy),
        bank_name: form.bank_name.trim(),
        quoted_rate: Number(form.quoted_rate),
        analyst_name: form.analyst_name.trim(),
        status: form.status.trim().toUpperCase(),
      });

      setForm((f) => ({
        ...f,
        amount_fcy: "",
        bank_name: "",
        quoted_rate: "",
        status: "CONFIRMED",
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
          Add to Desk Feed
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          {/* Currency + Side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
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
              <div style={labelStyle}>Side</div>
              <select
                style={selectStyle}
                value={form.side}
                onChange={(e) => setForm({ ...form, side: e.target.value })}
              >
                <option value="SELL" style={optionStyle}>
                  SELL
                </option>
                <option value="BUY" style={optionStyle}>
                  BUY
                </option>
              </select>
            </div>
          </div>

          {/* Amount + Rate (reduce amount width + keep rate inside) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 0.8fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div style={{ maxWidth: 240 }}>
              <div style={labelStyle}>Amount (FCY)</div>
              <input
                style={inputStyle}
                placeholder="e.g. 250000"
                value={form.amount_fcy}
                onChange={(e) => setForm({ ...form, amount_fcy: e.target.value })}
                inputMode="decimal"
              />
            </div>

            <div style={{ maxWidth: 200 }}>
              <div style={labelStyle}>Quoted Rate</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder="e.g. 3.4230"
                value={form.quoted_rate}
                onChange={(e) => setForm({ ...form, quoted_rate: e.target.value })}
                inputMode="decimal"
              />
            </div>
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

          {/* Status */}
          <div>
            <div style={labelStyle}>Status</div>
            <select
              style={selectStyle}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="CONFIRMED" style={optionStyle}>
                CONFIRMED
              </option>
              <option value="NEGOTIATING" style={optionStyle}>
                NEGOTIATING
              </option>
              <option value="INFO" style={optionStyle}>
                INFO
              </option>
              <option value="CANCELLED" style={optionStyle}>
                CANCELLED
              </option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" style={btnStyle(true)} disabled={!canSubmit || posting}>
              {posting ? "Saving..." : "Save to Excel"}
            </button>

            <button type="button" style={btnStyle(false)} onClick={refresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(229,231,235,0.65)" }}>
              {loading ? "Syncing…" : "Live"}
            </div>
          </div>

          {error && <div style={{ color: "#f97373", fontSize: 13 }}>{error}</div>}
        </form>
      </div>

      {/* RIGHT: Table */}
      <div style={{ ...tableWrapStyle, flex: "2 1 620px", minWidth: 620 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 900, color: "#e5e7eb" }}>Central Desk View</div>
          <div style={{ color: "rgba(229,231,235,0.7)", fontSize: 12 }}>
            Auto-refresh: 10s • Rows: {items.length}
          </div>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {[
                "timestamp_utc",
                "currency_pair",
                "side",
                "amount_fcy",
                "bank_name",
                "quoted_rate",
                "analyst_name",
                "status",
              ].map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((r, idx) => {
              const zebra = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";

              return (
                <tr
                  key={r.negotiation_id || `${r.timestamp_utc}-${idx}`}
                  style={{ background: zebra, transition: "background 120ms ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = zebra)}
                >
                  <td style={{ ...tdStyle, color: "rgba(229,231,235,0.80)" }}>{r.timestamp_utc}</td>

                  <td style={{ ...tdStyle, fontWeight: 900 }}>{r.currency_pair}</td>

                  <td style={{ ...tdStyle, fontWeight: 900 }}>{String(r.side || "").toUpperCase()}</td>

                  <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                    {Number(r.amount_fcy || 0).toLocaleString()}
                  </td>

                  <td style={tdStyle}>{r.bank_name}</td>

                  <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                    {Number(r.quoted_rate || 0).toFixed(4)}
                  </td>

                  <td style={tdStyle}>{r.analyst_name}</td>

                  <td style={tdStyle}>{statusPill(r.status)}</td>
                </tr>
              );
            })}

            {!items.length && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 12, color: "rgba(229,231,235,0.7)" }}>
                  No feed entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
