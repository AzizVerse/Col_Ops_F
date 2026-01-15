import React, { useMemo, useRef, useState, useCallback } from "react";
import { useCardUpload } from "../hooks/useCardUpload";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"; // fallback

function formatAddedOn(value) {
  if (!value) return "";
  // If backend already sends pretty "YYYY-MM-DD HH:MM", keep it
  if (typeof value === "string" && value.includes(" ") && !value.includes("T")) {
    return value;
  }
  // Try parsing ISO timestamps
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function BusinessCardUploader() {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // You are using session cookie + X-Session-Id header in other calls.
  // This hook currently doesn't include it. If you want admin protection:
  // - either modify useCardUpload to use your authFetch (recommended),
  // - or pass a token here if you actually use bearer tokens.
  const getAuthToken = () => null; // You don't use Bearer in require_admin

  const { upload, isUploading, error, response, reset } = useCardUpload({
    apiBase: API_BASE,
    endpoint: "/api/cards/upload",
    getAuthToken,
  });

  const onPickFiles = (files) => {
    const arr = Array.from(files || []);
    setSelectedFiles(arr);
  };

  const onFileChange = (e) => onPickFiles(e.target.files);

  const onUploadClick = async () => {
    if (selectedFiles.length === 0) return;
    await upload(selectedFiles);
  };

  const onClear = () => {
    setSelectedFiles([]);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const results = response?.results || [];

  const summary = useMemo(() => {
    if (!response) return null;
    return {
      uploaded: response.uploaded ?? results.length,
      ok: response.processed_ok ?? 0,
      failed: response.processed_failed ?? 0,
    };
  }, [response, results.length]);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      onPickFiles(e.dataTransfer.files);
    },
    [setSelectedFiles]
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={styles.h2}>Business Cards OCR → OneDrive Excel</h2>
          <p style={styles.p}>
            Upload card images. The backend extracts fields and appends a row to your OneDrive Excel table.
          </p>
        </div>

        {/* Upload box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={styles.dropzone}
        >
          <div>
            <div style={styles.dropTitle}>Drop images here</div>
            <div style={styles.dropSub}>
              or click “Choose files”. (jpg, png, webp)
            </div>
          </div>

          <div style={styles.actions}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              style={{ display: "none" }}
              id="card-files"
            />

            <label htmlFor="card-files" style={styles.btnSecondary}>
              Choose files
            </label>

            <button
              onClick={onUploadClick}
              disabled={isUploading || selectedFiles.length === 0}
              style={{
                ...styles.btnPrimary,
                opacity: isUploading || selectedFiles.length === 0 ? 0.6 : 1,
                cursor: isUploading || selectedFiles.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? "Uploading..." : "Upload & Save"}
            </button>

            <button
              onClick={onClear}
              disabled={isUploading}
              style={{
                ...styles.btnGhost,
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Selected files list */}
        <div style={{ marginTop: 14 }}>
          <div style={styles.sectionTitle}>
            Selected: {selectedFiles.length} file(s)
          </div>
          {selectedFiles.length > 0 && (
            <ul style={styles.fileList}>
              {selectedFiles.map((f) => (
                <li key={`${f.name}-${f.size}-${f.lastModified}`} style={styles.fileItem}>
                  <span style={{ color: "#E5E7EB" }}>{f.name}</span>
                  <span style={{ color: "#9CA3AF" }}>
                    {" "}
                    ({Math.round(f.size / 1024)} KB)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div style={styles.summaryBox}>
            <div><b>Uploaded:</b> {summary.uploaded}</div>
            <div><b>Processed OK:</b> {summary.ok}</div>
            <div><b>Failed:</b> {summary.failed}</div>
          </div>
        )}

        {/* Results table */}
        {results.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 style={styles.h3}>Results</h3>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Source file</th>
                    <th style={styles.th}>Card_id</th>
                    <th style={styles.th}>Added on</th>
                    <th style={styles.th}>Company</th>
                    <th style={styles.th}>Full name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Email2</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Website</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((r, idx) => {
                    const rowBg = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)";
                    const cardId = r.Card_id || r.card_id || "";
                    const addedOn = formatAddedOn(r.added_on);
                    return (
                      <tr key={`${cardId}-${idx}`} style={{ background: rowBg }}>
                        <td style={styles.td}>{r.source_file || ""}</td>
                        <td style={styles.tdMono}>{cardId}</td>
                        <td style={styles.td}>{addedOn}</td>
                        <td style={styles.td}>{r.company || ""}</td>
                        <td style={styles.td}>{r.full_name || ""}</td>
                        <td style={styles.td}>{r.email || ""}</td>
                        <td style={styles.td}>{r.email2 || ""}</td>
                        <td style={styles.td}>{r.phone || ""}</td>
                        <td style={styles.td}>{r.website || ""}</td>
                        <td style={styles.tdPillCell}>
                          <span style={pillStyle(r.status)}>{r.status || ""}</span>
                        </td>
                        <td style={{ ...styles.td, color: r.error ? "#FCA5A5" : "#9CA3AF" }}>
                          {r.error || ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Raw OCR viewer */}
            <details style={styles.details}>
              <summary style={styles.summary}>Show raw OCR text (debug)</summary>
              <div style={{ marginTop: 10 }}>
                {results.map((r, idx) => (
                  <div key={idx} style={styles.ocrBlock}>
                    <div style={styles.ocrTitle}>
                      {r.source_file || `Card ${idx + 1}`}
                    </div>
                    <pre style={styles.ocrPre}>
                      {r.ocr_text || ""}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function pillStyle(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("ok") || s.includes("done")) {
    return { ...styles.pill, background: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.35)", color: "#BBF7D0" };
  }
  if (s.includes("review") || s.includes("needs")) {
    return { ...styles.pill, background: "rgba(251,191,36,0.16)", borderColor: "rgba(251,191,36,0.35)", color: "#FDE68A" };
  }
  if (s.includes("fail") || s.includes("error")) {
    return { ...styles.pill, background: "rgba(239,68,68,0.16)", borderColor: "rgba(239,68,68,0.35)", color: "#FCA5A5" };
  }
  return { ...styles.pill, background: "rgba(148,163,184,0.12)", borderColor: "rgba(148,163,184,0.25)", color: "#E5E7EB" };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.20), transparent 55%), #050B1A",
    color: "#E5E7EB",
    padding: 18,
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  h2: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "white",
  },
  h3: {
    margin: "0 0 10px 0",
    fontSize: 16,
    fontWeight: 700,
    color: "white",
  },
  p: {
    margin: "6px 0 0 0",
    color: "#A7B0C0",
    fontSize: 13,
    lineHeight: 1.45,
  },
  dropzone: {
    border: "1px dashed rgba(148,163,184,0.45)",
    borderRadius: 14,
    padding: 16,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 10px 30px rgba(0,0,0,0.30)",
  },
  dropTitle: {
    fontWeight: 700,
    color: "white",
    marginBottom: 4,
  },
  dropSub: {
    fontSize: 13,
    color: "#A7B0C0",
  },
  actions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(16,185,129,0.60)",
    background: "linear-gradient(180deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))",
    color: "#071A12",
    fontWeight: 800,
  },
  btnSecondary: {
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.35)",
    color: "#E5E7EB",
    fontWeight: 700,
  },
  btnGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(2,6,23,0.20)",
    color: "#E5E7EB",
    fontWeight: 700,
  },
  sectionTitle: {
    fontWeight: 700,
    marginBottom: 6,
    color: "white",
  },
  fileList: {
    marginTop: 0,
    paddingLeft: 18,
    color: "#E5E7EB",
  },
  fileItem: {
    marginBottom: 4,
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.40)",
    background: "rgba(239,68,68,0.10)",
    color: "#FCA5A5",
    fontWeight: 700,
  },
  summaryBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    color: "#E5E7EB",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: 14,
    background: "rgba(15, 23, 42, 0.55)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 10px",
    fontSize: 12,
    whiteSpace: "nowrap",
    color: "#E5E7EB",
    borderBottom: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.25)",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "10px 10px",
    fontSize: 13,
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.14)",
    color: "#E5E7EB",
    whiteSpace: "nowrap",
  },
  tdMono: {
    padding: "10px 10px",
    fontSize: 12,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.14)",
    color: "#E5E7EB",
    whiteSpace: "nowrap",
  },
  tdPillCell: {
    padding: "10px 10px",
    fontSize: 13,
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.14)",
    color: "#E5E7EB",
    whiteSpace: "nowrap",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3px 10px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.25)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
  },
  details: {
    marginTop: 12,
    border: "1px solid rgba(148,163,184,0.22)",
    borderRadius: 14,
    background: "rgba(15, 23, 42, 0.55)",
    padding: 12,
  },
  summary: {
    cursor: "pointer",
    color: "#E5E7EB",
    fontWeight: 800,
  },
  ocrBlock: {
    marginBottom: 12,
  },
  ocrTitle: {
    fontWeight: 800,
    marginBottom: 6,
    color: "white",
  },
  ocrPre: {
    whiteSpace: "pre-wrap",
    background: "rgba(2,6,23,0.35)",
    border: "1px solid rgba(148,163,184,0.18)",
    padding: 12,
    borderRadius: 12,
    color: "#E5E7EB",
    overflowX: "auto",
  },
};
