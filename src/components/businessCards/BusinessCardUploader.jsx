import React, { useMemo, useRef, useState, useCallback } from "react";
import ReviewQueue from "./ReviewQueue";
import SavedCardsTable from "./SavedCardsTable";

import { API_BASE } from "../../api";

function formatAddedOn(value) {
  if (!value) return "";
  if (typeof value === "string" && value.includes(" ") && !value.includes("T")) {
    return value;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

async function postFiles(endpoint, files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "Request failed");
  }
  return data;
}

async function postJson(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "Request failed");
  }
  return data;
}

async function getJson(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "Request failed");
  }
  return data;
}

function StepChip({ label, active }) {
  return (
    <div
      style={{
        ...styles.stepChip,
        ...(active ? styles.stepChipActive : {}),
      }}
    >
      {label}
    </div>
  );
}

export default function BusinessCardUploader() {
  const inputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [scanResponse, setScanResponse] = useState(null);
  const [editableRows, setEditableRows] = useState([]);
  const [saveResponse, setSaveResponse] = useState(null);
  const [savedRows, setSavedRows] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [error, setError] = useState("");
  const [scanMode, setScanMode] = useState("normal");

  const onPickFiles = (files) => {
    const arr = Array.from(files || []);

    setSelectedFiles((prev) => {
      const merged = [...prev, ...arr];
      const seen = new Set();

      return merged.filter((f) => {
        const key = `${f.name}-${f.size}-${f.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setScanResponse(null);
    setSaveResponse(null);
    setError("");
  };

  const onFileChange = (e) => onPickFiles(e.target.files);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    onPickFiles(e.dataTransfer.files);
  }, []);

  const onClear = () => {
    setSelectedFiles([]);
    setScanResponse(null);
    setEditableRows([]);
    setSaveResponse(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onScanClick = async (mode = "normal") => {
    if (selectedFiles.length === 0) return;

    setIsScanning(true);
    setError("");
    setSaveResponse(null);
    setScanMode(mode);

    try {
      const endpoint = mode === "ai" ? "/api/cards/scan-ai" : "/api/cards/scan";
      const data = await postFiles(endpoint, selectedFiles);
      setScanResponse(data);

      setEditableRows((prev) => {
        const incoming = (data.results || []).map((r, idx) => ({
          id: `${Date.now()}-${r.source_file || "row"}-${idx}`,
          source_file: r.source_file || "",
          company: r.company || "",
          full_name: r.full_name || "",
          job_title: r.job_title || "",
          email: r.email || "",
          email2: r.email2 || "",
          phone: r.phone || "",
          phone2: r.phone2 || "",
          website: r.website || "",
          address: r.address || "",
          status: r.status || "needs_review",
          ocr_text: r.ocr_text || "",
          error: r.error || "",
          ok: r.ok !== false,
          selected: r.ok !== false,
          ai_used: !!r.ai_used,
          ai_error: r.ai_error || "",
        }));

        return [...prev, ...incoming];
      });

      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e.message || "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const loadSavedRows = async () => {
    setIsLoadingSaved(true);
    setError("");

    try {
      const data = await getJson("/api/cards/saved");
      setSavedRows(data.results || []);
    } catch (e) {
      setError(e.message || "Failed to load saved rows");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const onSaveClick = async () => {
    const selectedRows = editableRows.filter((r) => r.selected && !r.error);

    const rowsToSave = selectedRows.map((r) => ({
      source_file: r.source_file,
      company: r.company,
      full_name: r.full_name,
      job_title: r.job_title,
      email: r.email,
      email2: r.email2,
      phone: r.phone,
      phone2: r.phone2,
      website: r.website,
      address: r.address,
      status: r.status,
      ocr_text: r.ocr_text,
    }));

    if (rowsToSave.length === 0) {
      setError("No valid reviewed rows selected for saving.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const data = await postJson("/api/cards/confirm", { rows: rowsToSave });
      setSaveResponse(data);

      const selectedIds = new Set(selectedRows.map((r) => r.id));
      setEditableRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));

      const savedOkRows = (data.results || []).filter((r) => r.ok !== false);
      setSavedRows((prev) => {
        const merged = [...savedOkRows, ...prev];
        const seen = new Set();

        return merged.filter((row) => {
            const key = `${row.Card_id || ""}-${row.email || ""}-${row.phone || ""}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        });
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRow = (rowId, field, value) => {
    setEditableRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (rowId) => {
    setEditableRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const toggleAllInclude = (checked) => {
    setEditableRows((prev) =>
      prev.map((row) => (row.error ? row : { ...row, selected: checked }))
    );
  };

  const scanSummary = useMemo(() => {
    if (!scanResponse) return null;
    return {
      uploaded: scanResponse.uploaded ?? 0,
      ok: scanResponse.processed_ok ?? 0,
      failed: scanResponse.processed_failed ?? 0,
    };
  }, [scanResponse]);

  const saveSummary = useMemo(() => {
    if (!saveResponse) return null;
    return {
      submitted: saveResponse.submitted ?? 0,
      ok: saveResponse.saved_ok ?? 0,
      failed: saveResponse.saved_failed ?? 0,
    };
  }, [saveResponse]);

  const reviewedCount = editableRows.filter((r) => r.selected && !r.error).length;
  const pendingCount = editableRows.length;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div>
            <div style={styles.kicker}>Client Operations</div>
            <h2 style={styles.h2}>Business Cards OCR Review Console</h2>
            <p style={styles.p}>
              Scan cards in batches, review extracted fields, and save only validated rows.
            </p>
          </div>

          <div style={styles.stepper}>
            <StepChip active label="1. Select" />
            <StepChip active={!!scanResponse} label="2. Scan" />
            <StepChip active={editableRows.length > 0} label="3. Review" />
            <StepChip active={savedRows.length > 0 || !!saveResponse} label="4. Saved" />
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={styles.dropzone}
        >
          <div>
            <div style={styles.dropTitle}>Drop images here</div>
            <div style={styles.dropSub}>
              or click “Choose files”. Supported: jpg, png, webp
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
              onClick={() => onScanClick("normal")}
              disabled={isScanning || selectedFiles.length === 0}
              style={{
                ...styles.btnPrimary,
                opacity: isScanning || selectedFiles.length === 0 ? 0.6 : 1,
                cursor:
                  isScanning || selectedFiles.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isScanning && scanMode === "normal" ? "Scanning..." : "Scan cards"}
            </button>

            <button
              onClick={() => onScanClick("ai")}
              disabled={isScanning || selectedFiles.length === 0}
              style={{
                ...styles.btnAI,
                opacity: isScanning || selectedFiles.length === 0 ? 0.6 : 1,
                cursor:
                  isScanning || selectedFiles.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isScanning && scanMode === "ai" ? "Scanning with AI..." : "Scan with AI"}
            </button>

            <button
              onClick={loadSavedRows}
              disabled={isLoadingSaved}
              style={{
                ...styles.btnSecondary,
                opacity: isLoadingSaved ? 0.6 : 1,
                cursor: isLoadingSaved ? "not-allowed" : "pointer",
              }}
            >
              {isLoadingSaved ? "Loading saved..." : "Load saved rows"}
            </button>

            <button
              onClick={onClear}
              disabled={isScanning || isSaving}
              style={{
                ...styles.btnGhost,
                opacity: isScanning || isSaving ? 0.6 : 1,
                cursor: isScanning || isSaving ? "not-allowed" : "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div style={styles.toolbarRow}>
          <div style={styles.panel}>
            <div style={styles.sectionTitle}>Selected files</div>
            <div style={styles.bigMetric}>{selectedFiles.length}</div>
            <div style={styles.muted}>ready for next scan</div>
          </div>

          <div style={styles.panel}>
            <div style={styles.sectionTitle}>Pending review</div>
            <div style={styles.bigMetric}>{pendingCount}</div>
            <div style={styles.muted}>cards still in queue</div>
          </div>

          <div style={styles.panel}>
            <div style={styles.sectionTitle}>Ready to save</div>
            <div style={styles.bigMetric}>{reviewedCount}</div>
            <div style={styles.muted}>validated rows selected</div>
          </div>

          <div style={styles.panelWide}>
            <div style={styles.sectionTitle}>Workflow</div>
            <div style={styles.muted}>
              Choose files → Scan → Review queue → Save checked rows → Final saved rows appear in the single table below
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div style={styles.fileCard}>
            <div style={styles.sectionTitle}>
              Selected file list ({selectedFiles.length})
            </div>
            <ul style={styles.fileList}>
              {selectedFiles.map((f) => (
                <li
                  key={`${f.name}-${f.size}-${f.lastModified}`}
                  style={styles.fileItem}
                >
                  <span style={{ color: "#F8FAFC", fontWeight: 600 }}>{f.name}</span>
                  <span style={{ color: "#94A3B8" }}>
                    {" "}
                    ({Math.round(f.size / 1024)} KB)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <div style={styles.errorBox}>{error}</div>}

        {scanSummary && (
          <div style={styles.summaryBox}>
            <div><b>Uploaded:</b> {scanSummary.uploaded}</div>
            <div><b>Readable:</b> {scanSummary.ok}</div>
            <div><b>Failed:</b> {scanSummary.failed}</div>
            <div><b>Mode:</b> {scanMode === "ai" ? "AI-assisted" : "OCR only"}</div>
          </div>
        )}

        {saveSummary && (
          <div style={styles.successBox}>
            <div style={styles.successTitle}>Save completed</div>
            <div style={styles.successMeta}>
              <span><b>Submitted:</b> {saveSummary.submitted}</span>
              <span><b>Saved:</b> {saveSummary.ok}</span>
              <span><b>Failed:</b> {saveSummary.failed}</span>
            </div>
          </div>
        )}

        <ReviewQueue
          editableRows={editableRows}
          isSaving={isSaving}
          reviewedCount={reviewedCount}
          updateRow={updateRow}
          removeRow={removeRow}
          toggleAllInclude={toggleAllInclude}
          onSaveClick={onSaveClick}
        />

        <SavedCardsTable rows={savedRows} formatAddedOn={formatAddedOn} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    color: "#E5E7EB",
  },
  container: {
    maxWidth: 1420,
    margin: "18px auto 0 auto",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  kicker: {
    color: "#7DD3FC",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  h2: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    color: "white",
  },
  p: {
    margin: "8px 0 0 0",
    color: "#A7B0C0",
    fontSize: 14,
    lineHeight: 1.55,
    maxWidth: 820,
  },
  stepper: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  stepChip: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.20)",
    background: "rgba(15,23,42,0.45)",
    color: "#94A3B8",
    fontWeight: 700,
    fontSize: 12,
  },
  stepChipActive: {
    background: "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
    color: "#F8FAFC",
    border: "1px solid rgba(59,130,246,0.40)",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.10) inset",
  },
  dropzone: {
    border: "1px dashed rgba(148,163,184,0.35)",
    borderRadius: 20,
    padding: 20,
    background: "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.84))",
    display: "flex",
    gap: 14,
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 24px 60px rgba(0,0,0,0.30)",
    backdropFilter: "blur(10px)",
    flexWrap: "wrap",
  },
  dropTitle: {
    fontWeight: 800,
    color: "white",
    marginBottom: 4,
    fontSize: 18,
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
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(59,130,246,0.55)",
    background: "linear-gradient(180deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))",
    color: "white",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(37,99,235,0.25)",
  },
  btnAI: {
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(168,85,247,0.55)",
    background: "linear-gradient(180deg, rgba(168,85,247,0.95), rgba(126,34,206,0.95))",
    color: "white",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(126,34,206,0.22)",
  },
  btnSecondary: {
    cursor: "pointer",
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(15,23,42,0.55)",
    color: "#E5E7EB",
    fontWeight: 700,
  },
  btnGhost: {
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.18)",
    color: "#E5E7EB",
    fontWeight: 700,
  },
  toolbarRow: {
    display: "grid",
    gridTemplateColumns: "180px 180px 180px 1fr",
    gap: 14,
    marginTop: 16,
  },
  panel: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(15,23,42,0.62)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
  },
  panelWide: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(15,23,42,0.62)",
    border: "1px solid rgba(148,163,184,0.16)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.22)",
  },
  sectionTitle: {
    fontWeight: 800,
    marginBottom: 8,
    color: "white",
  },
  bigMetric: {
    fontSize: 28,
    fontWeight: 900,
    color: "#F8FAFC",
    lineHeight: 1,
  },
  muted: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 6,
  },
  fileCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    background: "rgba(15,23,42,0.58)",
    border: "1px solid rgba(148,163,184,0.16)",
  },
  fileList: {
    margin: 0,
    paddingLeft: 18,
  },
  fileItem: {
    marginBottom: 6,
  },
  errorBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(239,68,68,0.40)",
    background: "rgba(127,29,29,0.25)",
    color: "#FCA5A5",
    fontWeight: 700,
  },
  summaryBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.65)",
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    color: "#E5E7EB",
    boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
  },
  successBox: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(16,185,129,0.35)",
    background: "linear-gradient(180deg, rgba(6,78,59,0.45), rgba(5,46,22,0.35))",
    color: "#D1FAE5",
    boxShadow: "0 16px 36px rgba(0,0,0,0.20)",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#ECFDF5",
    marginBottom: 8,
  },
  successMeta: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    fontSize: 14,
  },
};