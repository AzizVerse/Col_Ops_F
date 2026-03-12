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
  padding: "12px 16px",
  fontSize: 14,
  outline: "none",
  minHeight: 44,
  boxSizing: "border-box",
  colorScheme: "dark",
  cursor: "pointer",
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

function formatTimestamp(value) {
  if (!value) return "—";

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);

  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function getColumnGroup(columnName) {
  const c = String(columnName || "").toUpperCase();

  if (c === "TIMESTAMP" || c === "TS") return "time";
  if (c.includes("EURUSD")) return "eurusd";
  if (c.includes("EUR_TND") || c.includes("ADJ_EUR") || c.includes("PCT_EUR")) return "eur";
  if (c.includes("USD_TND") || c.includes("ADJ_USD") || c.includes("PCT_USD")) return "usd";
  return "other";
}

function getHeaderStyle(group) {
  const base = {
    position: "sticky",
    top: 0,
    zIndex: 2,
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: 900,
    padding: "11px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    textAlign: "left",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  if (group === "time") {
    return {
      ...base,
      background: "rgba(15,23,42,0.98)",
      color: "rgba(255,255,255,0.95)",
    };
  }

  if (group === "eur") {
    return {
      ...base,
      background: "rgba(21, 83, 45, 0.92)",
    };
  }

  if (group === "usd") {
    return {
      ...base,
      background: "rgba(30, 58, 138, 0.92)",
    };
  }

  if (group === "eurusd") {
    return {
      ...base,
      background: "rgba(91, 33, 182, 0.92)",
    };
  }

  return {
    ...base,
    background: "rgba(55, 65, 81, 0.92)",
  };
}

export default function FxLiveRatesSearchPanel() {
  const [dateStr, setDateStr] = useState(todayISO());
  const [timeStr, setTimeStr] = useState("12:50");
  const [limit, setLimit] = useState(100);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const windowSeconds = 900;

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

  const normalizedRows = useMemo(() => {
    return rows.map((row) => {
      const normalized = { ...(row || {}) };

      if (normalized.timestamp == null && normalized.ts != null) {
        normalized.timestamp = normalized.ts;
      }

      delete normalized.ts;

      return normalized;
    });
  }, [rows]);

  const columns = useMemo(() => {
    if (!normalizedRows.length) return ["timestamp"];

    const keys = new Set();

    normalizedRows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keys.add(key));
    });

    const arr = Array.from(keys);

    arr.sort((a, b) => {
      if (a === "timestamp") return -1;
      if (b === "timestamp") return 1;
      return a.localeCompare(b);
    });

    return arr;
  }, [normalizedRows]);

  return (
    <div style={panelStyle}>
      <div style={cardStyle}>
        <div style={titleStyle}>Reuters Hisotrical Rates Search</div>
        <div style={subTitleStyle}>
          Select date, time and number of rows to display.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 0.85fr auto",
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
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
            />
          </div>

          <div>
            <div style={labelStyle}>Number of lines</div>
            <input
              type="number"
              min="1"
              max="1000"
              style={{ ...inputStyle, ...monoStyle, cursor: "text" }}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
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
            Rows: {normalizedRows.length}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: 520,
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div style={{ minWidth: "1400px" }}>
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
                  {columns.map((column, index) => {
                    const group = getColumnGroup(column);
                    const isFirst = index === 0;

                    return (
                      <th
                        key={column}
                        style={{
                          ...getHeaderStyle(group),
                          ...(isFirst
                            ? {
                                position: "sticky",
                                left: 0,
                                zIndex: 3,
                                boxShadow: "2px 0 0 rgba(255,255,255,0.04)",
                              }
                            : {}),
                        }}
                      >
                        {column === "timestamp" ? "Date / Time" : column}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {normalizedRows.map((row, rowIndex) => {
                  const zebra =
                    rowIndex % 2 === 0
                      ? "rgba(255,255,255,0.02)"
                      : "transparent";

                  return (
                    <tr key={`${row.timestamp || "row"}-${rowIndex}`} style={{ background: zebra }}>
                      {columns.map((column, colIndex) => {
                        const rawValue = row?.[column];
                        const value = column === "timestamp" ? formatTimestamp(rawValue) : rawValue;
                        const isNumber = typeof rawValue === "number";
                        const group = getColumnGroup(column);
                        const isFirst = colIndex === 0;

                        let cellTint = "transparent";
                        if (group === "eur") cellTint = "rgba(34,197,94,0.04)";
                        if (group === "usd") cellTint = "rgba(59,130,246,0.05)";
                        if (group === "eurusd") cellTint = "rgba(168,85,247,0.05)";

                        return (
                          <td
                            key={column}
                            style={{
                              padding: "10px 12px",
                              borderBottom: "1px solid rgba(255,255,255,0.06)",
                              color: "#e5e7eb",
                              whiteSpace: "nowrap",
                              textAlign: isNumber ? "right" : "left",
                              background: isFirst
                                ? "rgba(15,23,42,0.98)"
                                : cellTint,
                              ...(isNumber ? monoStyle : {}),
                              ...(isFirst
                                ? {
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 1,
                                    boxShadow: "2px 0 0 rgba(255,255,255,0.04)",
                                  }
                                : {}),
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

                {!normalizedRows.length && !loading && (
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
    </div>
  );
}