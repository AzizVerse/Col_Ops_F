import { useMemo, useState } from "react";
import { fetchFxLiveRates } from "../../api";

const panelStyle = {
  marginTop: 12,
  display: "grid",
  gap: 16,
};

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
};

const titleStyle = {
  fontWeight: 900,
  color: "#e5e7eb",
  fontSize: 16,
  marginBottom: 6,
};

const subTitleStyle = {
  fontSize: 13,
  color: "rgba(229,231,235,0.65)",
  marginBottom: 16,
};

const labelStyle = {
  fontSize: 12,
  color: "rgba(229,231,235,0.78)",
  fontWeight: 800,
  marginBottom: 7,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  minHeight: 44,
  boxSizing: "border-box",
};

const buttonStyle = {
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#ffffff",
  border: "none",
  borderRadius: 14,
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  minHeight: 44,
  boxShadow: "0 8px 20px rgba(37,99,235,0.28)",
};

const buttonDisabledStyle = {
  ...buttonStyle,
  opacity: 0.55,
  cursor: "not-allowed",
  boxShadow: "none",
};

const monoStyle = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontVariantNumeric: "tabular-nums",
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FxLiveRatesSearchPanel() {
  const [dateStr, setDateStr] = useState(todayISO());
  const [timeStr, setTimeStr] = useState("12:50");
  const [limit, setLimit] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  // hidden internal default
  const windowSeconds = 320;

  const canSearch = useMemo(() => {
    return String(timeStr || "").trim().length >= 4;
  }, [timeStr]);

  async function onSearch() {
    if (!canSearch || loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await fetchFxLiveRates({
        date: dateStr || null,
        time: timeStr,
        window: windowSeconds,
        limit: Number(limit) || 100,
      });

      setRows(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(String(e?.message || e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(() => {
    if (!rows.length) return ["timestamp"];
    const keys = new Set();
    rows.forEach((row) => Object.keys(row || {}).forEach((key) => keys.add(key)));

    const arr = Array.from(keys);
    arr.sort((a, b) => {
      if (a === "timestamp") return -1;
      if (b === "timestamp") return 1;
      if (a === "ts") return -1;
      if (b === "ts") return 1;
      return a.localeCompare(b);
    });
    return arr;
  }, [rows]);

  return (
    <div style={panelStyle}>
      <div style={cardStyle}>
        <div style={titleStyle}>Reuters Live Rates Search</div>
        <div style={subTitleStyle}>
          Choose a date, a time, and how many rows you want to display.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 0.8fr auto",
            gap: 14,
            alignItems: "end",
          }}
        >
          <div>
            <div style={labelStyle}>Date</div>
            <input
              type="date"
              style={inputStyle}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>Time</div>
            <input
              type="time"
              step="1"
              style={{ ...inputStyle, ...monoStyle }}
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>Number of lines</div>
            <input
              type="number"
              min="1"
              max="1000"
              style={{ ...inputStyle, ...monoStyle }}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>

          <button
            style={canSearch && !loading ? buttonStyle : buttonDisabledStyle}
            onClick={onSearch}
            disabled={!canSearch || loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.22)",
              color: "#fca5a5",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      <div style={{ ...cardStyle, padding: 0 }}>
        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontWeight: 900, color: "#e5e7eb", fontSize: 15 }}>
            Results
          </div>
          <div style={{ fontSize: 12, color: "rgba(229,231,235,0.72)" }}>
            Rows: {rows.length}
          </div>
        </div>

        <div
          style={{
            maxHeight: 520,
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      background: "rgba(2,6,23,0.96)",
                      color: "rgba(229,231,235,0.88)",
                      fontSize: 11,
                      fontWeight: 900,
                      padding: "11px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.10)",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const zebra = index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";

                return (
                  <tr key={`${row.timestamp || row.ts || "row"}-${index}`} style={{ background: zebra }}>
                    {columns.map((column) => {
                      const value = row?.[column];
                      const isNumber = typeof value === "number";

                      return (
                        <td
                          key={column}
                          style={{
                            padding: "10px 12px",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            color: "#e5e7eb",
                            whiteSpace: "nowrap",
                            textAlign: isNumber ? "right" : "left",
                            ...(isNumber ? monoStyle : {}),
                          }}
                        >
                          {value === null || value === undefined || value === ""
                            ? "—"
                            : String(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {!rows.length && !loading && (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{
                      padding: 18,
                      color: "rgba(229,231,235,0.72)",
                    }}
                  >
                    No results yet. Select a date and time, then click Search.
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