// src/components/manual-upload/ManualUploadPanel.jsx
import React from "react";

export function ManualUploadPanel({
  uploading,
  uploadError,
  dragActive,
  manualHistory,
  handleFileInputChange,
  handleDrop,
  handleDragOver,
  handleDragLeave,
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 300,
        padding: 16,
        borderRadius: 16,
        background: "#020617",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
        Manual upload (screenshots)
      </h2>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
        Drag &amp; drop bank screenshots here, or click to select files. The
        engine will run OCR, extract amounts, match clients, and push results
        into the Pending queue.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          borderRadius: 12,
          border: dragActive ? "2px dashed #38bdf8" : "2px dashed #1f2937",
          background: "#020617",
          padding: "24px 16px",
          textAlign: "center",
          cursor: uploading ? "default" : "pointer",
          transition: "border-color 0.15s ease, background 0.15s ease",
        }}
        onClick={() => {
          if (!uploading) {
            document.getElementById("file-input-hidden")?.click();
          }
        }}
      >
        <input
          id="file-input-hidden"
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />
        <div style={{ fontSize: 14, marginBottom: 4 }}>
          {uploading ? "Processing images..." : "Drop files here or click to browse"}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          JPG, PNG, etc. You can upload several images at once.
        </div>
      </div>

      {uploadError && (
        <p style={{ color: "#f97373", marginTop: 8, fontSize: 13 }}>
          {uploadError}
        </p>
      )}

      {manualHistory.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginBottom: 4,
            }}
          >
            Recent manual uploads
          </div>
          <div
            style={{
              borderRadius: 10,
              border: "1px solid #1f2937",
              overflow: "hidden",
              fontSize: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "6px 8px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Time
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Images
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Ops
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "6px 8px",
                      borderBottom: "1px solid #1f2937",
                    }}
                  >
                    Total (TND)
                  </th>
                </tr>
              </thead>
              <tbody>
                  {manualHistory.map((h) => {
                    const hasUnmatched = Array.isArray(h.unmatched) && h.unmatched.length > 0;

                    const showUnmatchedWarning =
                      h.opsCount === 0 &&
                      hasUnmatched &&
                      (
                        typeof h.metaSubject !== "string" ||
                        h.metaSubject.includes("0 matched") // keep your original logic if you use it
                      );

                    return (
                      <React.Fragment key={h.id}>
                        {/* main row */}
                        <tr>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                            }}
                          >
                            {h.ts.toLocaleTimeString()}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                              textAlign: "right",
                            }}
                          >
                            {h.imagesCount}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                              textAlign: "right",
                            }}
                          >
                            {h.opsCount}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                              textAlign: "right",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {h.totalAmount.toLocaleString("fr-FR", {
                              minimumFractionDigits: 3,
                            })}
                          </td>
                        </tr>

                        {/* warning when OCR saw amounts but nothing was matched */}
                        {showUnmatchedWarning && (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                padding: "4px 8px 4px",
                                borderBottom: "1px solid #020617",
                                fontSize: 11,
                                color: "#fbbf24",
                              }}
                            >
                              OCR a bien détecté des montants sur les captures, mais aucun
                              n’a été rapproché d’une facture (tolérance ±2 TND). Vérifiez
                              ci-dessous les montants et leurs factures les plus proches.
                            </td>
                          </tr>
                        )}

                        {/* details: OCR unmatched amounts + top closest unpaid invoices */}
                        {hasUnmatched && (
                          <tr>
                            <td
                              colSpan={4}
                              style={{
                                padding: "4px 8px 8px",
                                borderBottom: "1px solid #020617",
                                fontSize: 11,
                                color: "#9ca3af",
                                background: "#020617",
                              }}
                            >
                              {h.unmatched.map((u, idx) => (
                                <div key={idx} style={{ marginTop: idx ? 4 : 0 }}>
                                  <span style={{ fontWeight: 500 }}>
                                    {u.amount_tnd.toLocaleString("fr-FR", {
                                      minimumFractionDigits: 3,
                                      maximumFractionDigits: 3,
                                    })}{" "}
                                    TND
                                  </span>{" "}
                                  ({u.date || "date inconnue"}) →{" "}
                                  {u.suggestions && u.suggestions.length > 0 ? (
                                    u.suggestions.slice(0, 3).map((s, j) => (
                                      <span key={j}>
                                        {j > 0 && " | "}
                                        {s.client} #{s.row_index} (
                                        {s.amount_tnd.toLocaleString("fr-FR", {
                                          minimumFractionDigits: 3,
                                          maximumFractionDigits: 3,
                                        })}
                                        , diff {s.diff.toFixed(3)})
                                      </span>
                                    ))
                                  ) : (
                                    <span>aucune facture proche trouvée</span>
                                  )}
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>

            </table>
          </div>
        </div>
      )}
    </div>
  );
}
