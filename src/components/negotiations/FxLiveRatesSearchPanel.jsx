import { useMemo, useState } from "react";
import { fetchFxLiveRates } from "../../api";

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

const monoStyle = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontVariantNumeric: "tabular-nums",
};

export default function FxLiveRatesSearchPanel() {
  const [dateStr, setDateStr] = useState("");       // optional
  const [timeStr, setTimeStr] = useState("12:50");  // required
  const [windowSeconds, setWindowSeconds] = useState(5);
  const [limit, setLimit] = useState(200);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const canSearch = useMemo(() => {
    return String(timeStr || "").trim().length >= 4; // "HH:MM"
  }, [timeStr]);

  async function onSearch() {
    if (!canSearch) return;

    setLoading(true);
    setError("");
    try {
      const data = await fetchFxLiveRates({
        date: dateStr.trim() ? dateStr.trim() : null,
        time: timeStr.trim(),
        window: Number(windowSeconds) || 0,   // ✅ FIX
        limit: Number(limit) || 200,
        });

      setRows(data.items || []);

    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // Build columns dynamically from returned rows
  const columns = useMemo(() => {
    if (!rows.length) return ["ts"];
    const keys = new Set();
    rows.forEach((r) => Object.keys(r || {}).forEach((k) => keys.add(k)));
    // Put ts first, keep stable order
    const arr = Array.from(keys);
    arr.sort((a, b) => {
      if (a === "ts") return -1;
      if (b === "ts") return 1;
      return a.localeCompare(b);
    });
    return arr;
  }, [rows]);

  return (
    <div style={{ marginTop: 12, display: "grid", gap: 16 }}>
      {/* Search form */}
      <div style={cardStyle}>
        <div style={{ fontWeight: 900, color: "#e5e7eb", marginBottom: 10 }}>
          Reuters Live Rates Search
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 0.8fr 0.8fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <div style={labelStyle}>Date (optional)</div>
            <input
              style={inputStyle}
              placeholder="YYYY-MM-DD (empty = today)"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>Time</div>
            <input
              style={{ ...inputStyle, ...monoStyle }}
              placeholder="HH:MM or HH:MM:SS"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>Window (sec)</div>
            <input
              style={{ ...inputStyle, ...monoStyle }}
              value={String(windowSeconds)}
              onChange={(e) => setWindowSeconds(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div>
            <div style={labelStyle}>Limit</div>
            <input
              style={{ ...inputStyle, ...monoStyle }}
              value={String(limit)}
              onChange={(e) => setLimit(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <button style={btnStyle(true)} onClick={onSearch} disabled={!canSearch || loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && <div style={{ marginTop: 10, color: "#f97373", fontSize: 13 }}>{error}</div>}
      </div>

      {/* Results table */}
      <div style={{ ...cardStyle, padding: 0 }}>
        <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 900, color: "#e5e7eb" }}>Results</div>
          <div style={{ fontSize: 12, color: "rgba(229,231,235,0.7)" }}>
            Rows: {rows.length}
          </div>
        </div>

        <div
          style={{
            maxHeight: 520,          // ✅ vertical scroll
            overflowY: "auto",
            overflowX: "auto",       // ✅ horizontal scroll
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {columns.map((c) => (
                  <th
                    key={c}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      background: "rgba(2,6,23,0.92)",
                      color: "rgba(229,231,235,0.88)",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "10px 10px",
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => {
                const zebra = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";
                return (
                  <tr key={`${r.ts || "row"}-${idx}`} style={{ background: zebra }}>
                    {columns.map((c) => {
                      const v = r?.[c];
                      const isNumber = typeof v === "number";
                      return (
                        <td
                          key={c}
                          style={{
                            padding: "10px 10px",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            color: "#e5e7eb",
                            whiteSpace: "nowrap",
                            ...(isNumber ? monoStyle : null),
                            textAlign: isNumber ? "right" : "left",
                          }}
                        >
                          {v === null || v === undefined || v === "" ? "—" : String(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {!rows.length && !loading && (
                <tr>
                  <td colSpan={columns.length} style={{ padding: 14, color: "rgba(229,231,235,0.7)" }}>
                    No results yet. Enter time and click Search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
