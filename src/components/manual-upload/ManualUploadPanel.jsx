// src/components/manual-upload/ManualUploadPanel.jsx
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
                {manualHistory.map((h) => (
                  <tr key={h.id}>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
