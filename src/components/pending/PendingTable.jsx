// src/components/pending/PendingTable.jsx
export function PendingTable({
  pending,
  error,
  handleConfirm,
  handleCancel,
  confirmingId,
  cancellingId,
}) {
  if (pending.length === 0 && !error) {
    return (
      <p style={{ marginTop: 24, color: "#9ca3af", fontSize: 14 }}>
        No pending operations. Waiting for next bank alert.
      </p>
    );
  }

  if (pending.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        All pending operations
      </h2>
      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid #1f2937",
          background: "#020617",
        }}
      >
        <table
          cellPadding="8"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
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
                #
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Date
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Amount (TND)
              </th>
              <th
                style={{
                  textAlign: "left",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Matched client
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
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Conf.
              </th>
              <th
                style={{
                  textAlign: "right",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Hours left
              </th>
              <th
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {pending.map((op) => (
              <tr key={op.id}>
                <td style={{ borderBottom: "1px solid #0f172a" }}>{op.id}</td>
                <td style={{ borderBottom: "1px solid #0f172a" }}>{op.date}</td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {op.amount_tnd.toLocaleString("fr-FR", {
                    minimumFractionDigits: 3,
                  })}
                </td>
                <td style={{ borderBottom: "1px solid #0f172a" }}>
                  {op.matched_client || "—"}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {(op.nearest_diff ?? 0).toFixed(3)}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                  }}
                >
                  {(((op.confidence ?? 0) * 100).toFixed(0))}%
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "right",
                  }}
                >
                  {op.hours_left.toFixed(1)}
                </td>
                <td
                  style={{
                    borderBottom: "1px solid #0f172a",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <button
                      onClick={() => handleConfirm(op.id)}
                      disabled={confirmingId === op.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "none",
                        background:
                          confirmingId === op.id ? "#6b7280" : "#22c55e",
                        color: "#020617",
                        fontWeight: 600,
                        cursor:
                          confirmingId === op.id ? "default" : "pointer",
                        fontSize: 12,
                      }}
                    >
                      {confirmingId === op.id ? "..." : "Confirm"}
                    </button>

                    <button
                      onClick={() => handleCancel(op.id)}
                      disabled={cancellingId === op.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "1px solid #f97373",
                        background:
                          cancellingId === op.id ? "#111827" : "#0f172a",
                        color: "#f97373",
                        fontWeight: 600,
                        cursor:
                          cancellingId === op.id ? "default" : "pointer",
                        fontSize: 12,
                      }}
                    >
                      {cancellingId === op.id ? "..." : "Cancel"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
