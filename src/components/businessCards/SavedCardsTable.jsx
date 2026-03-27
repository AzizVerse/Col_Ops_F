import React, { useMemo, useState } from "react";

function pillStyle(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("ok") || s.includes("done") || s.includes("saved")) {
    return {
      ...styles.pill,
      background: "rgba(34,197,94,0.18)",
      borderColor: "rgba(34,197,94,0.35)",
      color: "#BBF7D0",
    };
  }

  if (s.includes("review") || s.includes("needs")) {
    return {
      ...styles.pill,
      background: "rgba(251,191,36,0.16)",
      borderColor: "rgba(251,191,36,0.35)",
      color: "#FDE68A",
    };
  }

  if (s.includes("fail") || s.includes("error")) {
    return {
      ...styles.pill,
      background: "rgba(239,68,68,0.16)",
      borderColor: "rgba(239,68,68,0.35)",
      color: "#FCA5A5",
    };
  }

  return {
    ...styles.pill,
    background: "rgba(148,163,184,0.12)",
    borderColor: "rgba(148,163,184,0.25)",
    color: "#E5E7EB",
  };
}

function safeContains(value, query) {
  return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
}

export default function SavedCardsTable({ rows, formatAddedOn }) {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows || [];

    return (rows || []).filter((r) => {
      return (
        safeContains(r.Card_id, q) ||
        safeContains(r.added_on, q) ||
        safeContains(r.company, q) ||
        safeContains(r.full_name, q) ||
        safeContains(r.job_title, q) ||
        safeContains(r.email, q) ||
        safeContains(r.email2, q) ||
        safeContains(r.phone, q) ||
        safeContains(r.phone2, q) ||
        safeContains(r.website, q) ||
        safeContains(r.address, q) ||
        safeContains(r.status, q)
      );
    });
  }, [rows, search]);

  if (!rows?.length) return null;

  return (
    <div style={{ marginTop: 26 }}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.h3}>Saved cards</h3>
          <p style={styles.subtle}>Single source of truth after validation and save</p>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.counterBadge}>
            {filteredRows.length} / {rows.length}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, name, email, phone..."
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.tableShell}>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Card ID</th>
                <th style={styles.th}>Added on</th>
                <th style={styles.th}>Company</th>
                <th style={styles.th}>Full name</th>
                <th style={styles.th}>Job title</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Email 2</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Phone 2</th>
                <th style={styles.th}>Website</th>
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r, idx) => (
                <tr
                  key={`${r.Card_id || idx}-${r.email || ""}`}
                  style={{
                    background:
                      idx % 2 === 0
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(255,255,255,0.05)",
                  }}
                >
                  <td style={styles.tdMono}>{r.Card_id || ""}</td>
                  <td style={styles.td}>
                    {formatAddedOn ? formatAddedOn(r.added_on) : r.added_on || ""}
                  </td>
                  <td style={styles.tdStrong}>{r.company || ""}</td>
                  <td style={styles.td}>{r.full_name || ""}</td>
                  <td style={styles.td}>{r.job_title || ""}</td>
                  <td style={styles.td}>{r.email || ""}</td>
                  <td style={styles.td}>{r.email2 || ""}</td>
                  <td style={styles.td}>{r.phone || ""}</td>
                  <td style={styles.td}>{r.phone2 || ""}</td>
                  <td style={styles.td}>{r.website || ""}</td>
                  <td style={styles.tdAddress}>{r.address || ""}</td>
                  <td style={styles.tdPillCell}>
                    <span style={pillStyle(r.status)}>{r.status || ""}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div style={styles.emptyState}>No saved cards match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  h3: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "white",
  },
  subtle: {
    margin: "6px 0 0 0",
    color: "#94A3B8",
    fontSize: 13,
  },
  counterBadge: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(59,130,246,0.25)",
    background: "rgba(37,99,235,0.14)",
    color: "#DBEAFE",
    fontWeight: 800,
    fontSize: 13,
  },
  searchInput: {
    minWidth: 280,
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(2,6,23,0.45)",
    color: "#F8FAFC",
    padding: "11px 12px",
    outline: "none",
    fontSize: 14,
  },
  tableShell: {
    borderRadius: 20,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(2,6,23,0.82))",
    boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
    overflow: "hidden",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1300,
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  th: {
    textAlign: "left",
    padding: "14px 12px",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
    color: "#CBD5E1",
    borderBottom: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,6,23,0.72)",
    position: "sticky",
    top: 0,
    zIndex: 1,
    backdropFilter: "blur(8px)",
  },
  td: {
    padding: "13px 12px",
    fontSize: 13,
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.10)",
    color: "#E5E7EB",
    whiteSpace: "nowrap",
  },
  tdStrong: {
    padding: "13px 12px",
    fontSize: 13,
    fontWeight: 700,
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.10)",
    color: "#F8FAFC",
    whiteSpace: "nowrap",
  },
  tdMono: {
    padding: "13px 12px",
    fontSize: 12,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.10)",
    color: "#C7D2FE",
    whiteSpace: "nowrap",
  },
  tdAddress: {
    padding: "13px 12px",
    fontSize: 13,
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.10)",
    color: "#E5E7EB",
    minWidth: 260,
    whiteSpace: "normal",
    lineHeight: 1.45,
  },
  tdPillCell: {
    padding: "13px 12px",
    verticalAlign: "top",
    borderTop: "1px solid rgba(148,163,184,0.10)",
    whiteSpace: "nowrap",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.25)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
  },
  emptyState: {
    padding: 20,
    color: "#94A3B8",
    fontSize: 14,
  },
};