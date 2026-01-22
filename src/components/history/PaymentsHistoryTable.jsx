// src/components/history/PaymentsHistoryTable.jsx

export function PaymentsHistoryTable({
  history,
  historyClientFilter,
  historyMatchType,
  historySource,
  setHistoryClientFilter,
  setHistoryMatchType,
  setHistorySource,
}) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Matching history (log)
      </h2>

      {/* Filters row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
          fontSize: 13,
          alignItems: "center",
        }}
      >
        {/* Client filter */}
        <input
          placeholder="Filter by client…"
          value={historyClientFilter}
          onChange={(e) => setHistoryClientFilter(e.target.value)}
          style={{
            padding: "7px 10px",
            borderRadius: 999,
            border: "1px solid #1f2937",
            background: "#020617",
            color: "#e5e7eb",
            outline: "none",
            minWidth: 220,
          }}
        />

        {/* Match type select */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <select
            value={historyMatchType}
            onChange={(e) => setHistoryMatchType(e.target.value)}
            style={{
              padding: "7px 34px 7px 12px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              outline: "none",
              appearance: "none",
              cursor: "pointer",
              minWidth: 210,
            }}
          >
            <option value="all">All match types (Exact + Tolerance)</option>
            <option value="exact">Exact matches only</option>
            <option value="tolerance">Tolerance matches only</option>
          </select>

          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            ▼
          </span>
        </div>

        {/* Source select */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <select
            value={historySource}
            onChange={(e) => setHistorySource(e.target.value)}
            style={{
              padding: "7px 34px 7px 12px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              outline: "none",
              appearance: "none",
              cursor: "pointer",
              minWidth: 220,
            }}
          >
            <option value="all">All sources (Auto + OCR + Manual)</option>
            <option value="auto">Auto</option>
            <option value="ocr">OCR</option>
            <option value="manual">Manual</option>
          </select>

          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Table wrapper: vertical + horizontal scroll */}
      <div
        style={{
          overflowX: "auto",
          overflowY: "auto",
          borderRadius: 12,
          border: "1px solid #1f2937",
          background: "#020617",
          maxHeight: 320,
        }}
      >
        <table
          cellPadding="6"
          style={{
            width: "100%",
            minWidth: 980, // forces horizontal scroll on smaller screens
            borderCollapse: "collapse",
            fontSize: 12,
            color: "#e5e7eb",
            whiteSpace: "nowrap", // prevents wrapping -> keeps columns readable
          }}
        >
          <thead>
            <tr style={{ background: "#0f172a" }}>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Time
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Source
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Client
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Amount
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Invoice
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Diff
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Type
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                  padding: "8px 10px",
                  position: "sticky",
                  top: 0,
                  background: "#0f172a",
                  zIndex: 1,
                }}
              >
                Row
              </th>
            </tr>
          </thead>

          <tbody>
            {history.map((r, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    padding: "8px 10px",
                  }}
                >
                  {r.timestamp}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    padding: "8px 10px",
                  }}
                >
                  {r.source}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    padding: "8px 10px",
                  }}
                >
                  {r.client}
                </td>

                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    padding: "8px 10px",
                  }}
                >
                  {Number(r.amount_detected || 0).toLocaleString("fr-FR", {
                    minimumFractionDigits: 3,
                  })}
                </td>

                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    padding: "8px 10px",
                  }}
                >
                  {Number(r.invoice_amount || 0).toLocaleString("fr-FR", {
                    minimumFractionDigits: 3,
                  })}
                </td>

                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    padding: "8px 10px",
                  }}
                >
                  {Number(r.diff || 0).toFixed(3)}
                </td>

                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    padding: "8px 10px",
                  }}
                >
                  {r.match_type}
                </td>

                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    padding: "8px 10px",
                  }}
                >
                  {r.row_index}
                </td>
              </tr>
            ))}

            {history.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 10,
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  No history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
