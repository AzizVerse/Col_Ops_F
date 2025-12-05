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
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 8,
          fontSize: 13,
        }}
      >
        {/* Client filter */}
        <input
          placeholder="Filter by client…"
          value={historyClientFilter}
          onChange={(e) => setHistoryClientFilter(e.target.value)}
          style={{
            padding: "6px 8px",
            borderRadius: 999,
            border: "1px solid #1f2937",
            background: "#020617",
            color: "#e5e7eb",
            outline: "none",
            minWidth: 180,
          }}
        />

        {/* Match type select */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <select
            value={historyMatchType}
            onChange={(e) => setHistoryMatchType(e.target.value)}
            style={{
              padding: "6px 28px 6px 10px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "transparent",
              color: "#e5e7eb",
              outline: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All match types</option>
            <option value="exact">Exact</option>
            <option value="tolerance">Tolerance</option>
          </select>
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              fontSize: 10,
              color: "#9ca3af",
            }}
          >
            ▼
          </span>
        </div>

        {/* Source select */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <select
            value={historySource}
            onChange={(e) => setHistorySource(e.target.value)}
            style={{
              padding: "6px 28px 6px 10px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "transparent",
              color: "#e5e7eb",
              outline: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All sources</option>
            <option value="auto">Auto</option>
            <option value="ocr">OCR</option>
            <option value="manual">Manuel</option>
          </select>
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              fontSize: 10,
              color: "#9ca3af",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
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
            borderCollapse: "collapse",
            fontSize: 12,
            color: "#e5e7eb",
          }}
        >
          <thead>
            <tr style={{ background: "#0f172a" }}>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Time
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Source
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Client
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Amount
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Invoice
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Diff
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Type
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Row
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, idx) => (
              <tr key={idx}>
                <td style={{ borderBottom: "1px solid #0f172a" }}>
                  {r.timestamp}
                </td>
                <td style={{ borderBottom: "1px solid #0f172a" }}>
                  {r.source}
                </td>
                <td style={{ borderBottom: "1px solid #0f172a" }}>
                  {r.client}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
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
                  }}
                >
                  {Number(r.diff || 0).toFixed(3)}
                </td>
                <td style={{ borderBottom: "1px solid #0f172a" }}>
                  {r.match_type}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
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
                    padding: 8,
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
