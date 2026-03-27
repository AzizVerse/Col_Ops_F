import React from "react";

function Field({ label, value, onChange, full = false }) {
  return (
    <div style={full ? styles.fieldFull : styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

export default function ReviewQueue({
  editableRows,
  isSaving,
  reviewedCount,
  updateRow,
  removeRow,
  toggleAllInclude,
  onSaveClick,
}) {
  if (!editableRows.length) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={styles.reviewHeader}>
        <div>
          <h3 style={styles.h3}>Review extracted data</h3>
          <p style={styles.subtle}>
            Edit any field, choose which rows to include, then save only the checked rows.
          </p>
        </div>

        <div style={styles.reviewHeaderActions}>
          <button onClick={() => toggleAllInclude(true)} style={styles.btnTiny} type="button">
            Include all
          </button>

          <button onClick={() => toggleAllInclude(false)} style={styles.btnTinyGhost} type="button">
            Uncheck all
          </button>

          <button
            onClick={onSaveClick}
            disabled={isSaving || reviewedCount === 0}
            style={{
              ...styles.btnSuccess,
              opacity: isSaving || reviewedCount === 0 ? 0.6 : 1,
              cursor: isSaving || reviewedCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Saving..." : "Validate & Save"}
          </button>
        </div>
      </div>

      <div style={styles.reviewGrid}>
        {editableRows.map((row, idx) => (
          <div key={row.id} style={styles.reviewCard}>
            <div style={styles.reviewCardHead}>
              <div>
                <div style={styles.cardTitle}>{row.source_file || `Card ${idx + 1}`}</div>
                <div style={styles.cardSub}>Review and correct before saving</div>

                <div style={styles.cardMetaRow}>
                  <span style={styles.modeBadge}>
                    {row.ai_used ? "AI enhanced" : "OCR only"}
                  </span>
                  {row.ai_error ? (
                    <span style={styles.modeBadgeError}>AI fallback failed</span>
                  ) : null}
                </div>
              </div>

              <div style={styles.cardActionsRight}>
                <label style={styles.checkWrap}>
                  <input
                    type="checkbox"
                    checked={!!row.selected}
                    onChange={(e) => updateRow(row.id, "selected", e.target.checked)}
                  />
                  <span>Include</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              </div>
            </div>

            {row.error ? (
              <div style={styles.inlineError}>{row.error}</div>
            ) : (
              <>
                <div style={styles.formGrid}>
                  <Field label="Company" value={row.company} onChange={(v) => updateRow(row.id, "company", v)} />
                  <Field label="Full name" value={row.full_name} onChange={(v) => updateRow(row.id, "full_name", v)} />
                  <Field label="Job title" value={row.job_title} onChange={(v) => updateRow(row.id, "job_title", v)} />
                  <Field label="Email" value={row.email} onChange={(v) => updateRow(row.id, "email", v)} />
                  <Field label="Email 2" value={row.email2} onChange={(v) => updateRow(row.id, "email2", v)} />
                  <Field label="Phone" value={row.phone} onChange={(v) => updateRow(row.id, "phone", v)} />
                  <Field label="Phone 2" value={row.phone2} onChange={(v) => updateRow(row.id, "phone2", v)} />
                  <Field label="Website" value={row.website} onChange={(v) => updateRow(row.id, "website", v)} />
                  <Field label="Address" value={row.address} onChange={(v) => updateRow(row.id, "address", v)} full />
                </div>

                <div style={styles.debugBox}>
                  <div style={styles.debugTitle}>Raw OCR text</div>
                  <pre style={styles.ocrPre}>{row.ocr_text || ""}</pre>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  h3: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "white",
  },
  subtle: {
    margin: "6px 0 0 0",
    color: "#94A3B8",
    fontSize: 13,
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  reviewHeaderActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  btnTiny: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.30)",
    background: "rgba(37,99,235,0.18)",
    color: "#DBEAFE",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnTinyGhost: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.18)",
    color: "#E5E7EB",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSuccess: {
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid rgba(16,185,129,0.55)",
    background: "linear-gradient(180deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))",
    color: "#042617",
    fontWeight: 900,
    boxShadow: "0 10px 24px rgba(16,185,129,0.24)",
  },
  reviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(520px, 1fr))",
    gap: 16,
  },
  reviewCard: {
    borderRadius: 20,
    border: "1px solid rgba(148,163,184,0.16)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.80), rgba(2,6,23,0.82))",
    padding: 16,
    boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
  },
  reviewCardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  cardTitle: {
    fontWeight: 800,
    fontSize: 16,
    color: "white",
  },
  cardSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  cardMetaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  modeBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    color: "#DDD6FE",
    background: "rgba(109,40,217,0.20)",
    border: "1px solid rgba(168,85,247,0.35)",
  },
  modeBadgeError: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    color: "#FCA5A5",
    background: "rgba(127,29,29,0.22)",
    border: "1px solid rgba(239,68,68,0.35)",
  },
  cardActionsRight: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  checkWrap: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "#E5E7EB",
  },
  removeBtn: {
    padding: "8px 11px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(127,29,29,0.20)",
    color: "#FCA5A5",
    fontWeight: 700,
    cursor: "pointer",
  },
  inlineError: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(127,29,29,0.20)",
    color: "#FCA5A5",
    fontWeight: 700,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#CBD5E1",
  },
  input: {
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(2,6,23,0.45)",
    color: "#F8FAFC",
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
  },
  debugBox: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.14)",
    background: "rgba(2,6,23,0.28)",
    padding: 12,
  },
  debugTitle: {
    fontWeight: 800,
    color: "#E5E7EB",
    marginBottom: 8,
  },
  ocrPre: {
    whiteSpace: "pre-wrap",
    margin: 0,
    background: "transparent",
    color: "#CBD5E1",
    maxHeight: 180,
    overflowY: "auto",
    fontSize: 12,
    lineHeight: 1.5,
  },
};