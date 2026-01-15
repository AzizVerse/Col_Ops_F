// src/components/InvoiceReminders.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  fetchUnpaidInvoices,
  toggleInvoiceReminder,
  toggleInvoiceReminderPause,
  sendInvoiceReminder,
} from "../api";

function formatAmount(amount) {
  if (amount == null || isNaN(amount)) return "—";
  return amount.toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function parseDateToTs(value) {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? 0 : ts;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
}

function computeReminderState(inv) {
  const FIRST_DELAY_DAYS = 0;
  const SECOND_DELAY_DAYS = 0;
  const THIRD_DELAY_DAYS = 0;

  if (inv.reminder_paused) {
    return { label: "Paused", canSend: false, stage: null };
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();

  const parse = (s) => {
    if (!s) return null;
    const dt = new Date(s);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const start = parse(inv.reminder_start);
  const first = parse(inv.first_reminder_at);
  const second = parse(inv.second_reminder_at);
  const third = parse(inv.third_reminder_at);

  if (!start) {
    return { label: "—", canSend: false, stage: null };
  }

  const diffDays = (from, to) =>
    Math.floor((to.getTime() - from.getTime()) / DAY_MS);

  // 1er rappel
  if (!first) {
    const d = diffDays(start, now);
    const remaining = FIRST_DELAY_DAYS - d;

    if (remaining > 0) {
      return {
        label:
          remaining === 0
            ? "1st reminder due today"
            : `1st reminder in ${remaining} day${remaining > 1 ? "s" : ""}`,
        canSend: false,
        stage: 1,
      };
    }

    const overdue = -remaining;
    return {
      label:
        overdue === 0
          ? "1st reminder due today"
          : `1st reminder overdue by ${overdue} day${overdue > 1 ? "s" : ""}`,
      canSend: true,
      stage: 1,
    };
  }

  // 2e rappel
  if (!second) {
    const d = diffDays(first, now);
    const remaining = SECOND_DELAY_DAYS - d;

    if (remaining > 0) {
      return {
        label:
          remaining === 0
            ? "2nd reminder due today"
            : `2nd reminder in ${remaining} day${remaining > 1 ? "s" : ""}`,
        canSend: false,
        stage: 2,
      };
    }

    const overdue = -remaining;
    return {
      label:
        overdue === 0
          ? "2nd reminder due today"
          : `2nd reminder overdue by ${overdue} day${overdue > 1 ? "s" : ""}`,
      canSend: true,
      stage: 2,
    };
  }

  // 3e rappel
  if (!third) {
    const d = diffDays(second, now);
    const remaining = THIRD_DELAY_DAYS - d;

    if (remaining > 0) {
      return {
        label:
          remaining === 0
            ? "3rd reminder due today"
            : `3rd reminder in ${remaining} day${remaining > 1 ? "s" : ""}`,
        canSend: false,
        stage: 3,
      };
    }

    const overdue = -remaining;
    return {
      label:
        overdue === 0
          ? "3rd reminder due today"
          : `3rd reminder overdue by ${overdue} day${overdue > 1 ? "s" : ""}`,
      canSend: true,
      stage: 3,
    };
  }

  return { label: "3 reminders sent", canSend: false, stage: null };
}
function buildEmailTooltip(inv) {
  const to = inv.reminder_to || [];
  const cc = inv.reminder_cc || [];

  if ((!to || to.length === 0) && (!cc || cc.length === 0)) {
    return "";
  }

  const parts = [];
  if (to.length) parts.push(`To: ${to.join(", ")}`);
  if (cc.length) parts.push(`Cc: ${cc.join(", ")}`);

  // newline -> multi-line browser tooltip
  return parts.join("\n");
}


export default function InvoiceReminders() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // NEW: responsive breakpoint
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const update = () => {
      // stack tables when viewport < 1100px
      setIsNarrow(window.innerWidth < 1100);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [activatingRow, setActivatingRow] = useState(null);
  const [deactivatingRow, setDeactivatingRow] = useState(null);
  const [pausingRow, setPausingRow] = useState(null);
  const [sendingRow, setSendingRow] = useState(null);

  async function reload() {
    try {
      setLoading(true);
      setError("");
      const resp = await fetchUnpaidInvoices();
      setInvoices(resp.invoices || []);
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const handleToggle = async (rowIndex, active) => {
    try {
      setError("");
      if (active) setActivatingRow(rowIndex);
      else setDeactivatingRow(rowIndex);

      await toggleInvoiceReminder(rowIndex, active);
      await reload();
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setActivatingRow(null);
      setDeactivatingRow(null);
    }
  };

  const handlePause = async (inv) => {
    try {
      setError("");
      setPausingRow(inv.row_index);
      await toggleInvoiceReminderPause(inv.row_index, !inv.reminder_paused);
      await reload();
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setPausingRow(null);
    }
  };

  const handleSend = async (inv) => {
    try {
      setError("");
      setSendingRow(inv.row_index);
      await sendInvoiceReminder(inv.row_index);
      await reload();
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setSendingRow(null);
    }
  };

  const { totalCount, totalAmount } = useMemo(() => {
    let count = invoices.length;
    let sum = 0;
    for (const inv of invoices) {
      const amt = Number(inv.amount);
      if (!Number.isNaN(amt)) {
        sum += amt;
      }
    }
    return { totalCount: count, totalAmount: sum };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const client = (inv.client || "").toLowerCase();
      const rowStr = String(inv.row_index || "");
      return client.includes(q) || rowStr.includes(q);
    });
  }, [invoices, search]);

  const sortByInvoiceDateDesc = (a, b) => {
    const ta = parseDateToTs(a.invoice_date);
    const tb = parseDateToTs(b.invoice_date);
    if (ta !== tb) return tb - ta;
    return (a.row_index || 0) - (b.row_index || 0);
  };

  const unpaidOff = useMemo(
    () =>
      [...filtered]
        .filter((inv) => !inv.reminder_active)
        .sort(sortByInvoiceDateDesc),
    [filtered]
  );

  const active = useMemo(
    () =>
      [...filtered]
        .filter((inv) => inv.reminder_active)
        .sort(sortByInvoiceDateDesc),
    [filtered]
  );

  return (
    <div
      style={{
        marginTop: 24,
        padding: 24,
        borderRadius: 16,
        border: "1px solid rgba(148, 163, 184, 0.15)",
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 12,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Invoice reminder monitor
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Suivi automatique des factures <strong>unpaid</strong> : rappels à{" "}
            <strong>30 jours</strong>, puis <strong>15 jours</strong>, puis{" "}
            <strong>15 jours</strong>.
          </p>

          <p
            style={{
              fontSize: 13,
              color: "#e5e7eb",
              marginTop: 4,
            }}
          >
            Total unpaid: <strong>{totalCount}</strong>{" "}
            invoice{totalCount > 1 ? "s" : ""} –{" "}
            <strong>{formatAmount(totalAmount)}</strong> TND
          </p>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            placeholder="Search client / row…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.4)",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: 13,
              minWidth: 200,
            }}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: "#f97373", fontSize: 13, marginTop: 8 }}>
          {String(error)}
        </p>
      )}

      {loading && (
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
          Loading unpaid invoices from Notion…
        </p>
      )}

      {!loading && invoices.length === 0 && !error && (
        <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
          Aucune facture <strong>unpaid</strong> dans Notion.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: 24,
          marginTop: 20,
          overflowX: "auto",
        }}
      >
        {/* LEFT TABLE */}
        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Unpaid invoices (reminder OFF)
          </h3>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(31,41,55,0.8)",
              overflowX: "auto", // 🔹 allow horizontal scroll on narrow screens
              overflowY: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 700, // 🔹 keep columns readable, scroll if needed
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead
                style={{
                  background: "rgba(15,23,42,0.9)",
                  textAlign: "left",
                }}
              >
                <tr>
                  <th style={{ padding: "8px 12px", width: 80 }}>Invoice #</th>
                  <th style={{ padding: "8px 12px" }}>Client</th>
                  <th style={{ padding: "8px 12px" }}>Invoice date</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>
                    Amount TND
                  </th>
                  <th style={{ padding: "8px 12px" }}>Email</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {unpaidOff.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 12,
                        color: "#9ca3af",
                        fontSize: 12,
                      }}
                    >
                      Aucune facture unpaid sans reminder actif.
                    </td>
                  </tr>
                )}
                {unpaidOff.map((inv) => {
  const cannotActivate = inv.can_activate === false;

  return (
    <tr
      key={inv.row_index}
      style={{ borderTop: "1px solid rgba(31,41,55,0.8)" }}
    >
      <td style={{ padding: "8px 12px" }}>
        {inv.invoice_number || `#${inv.row_index ?? "?"}`}
      </td>

      <td style={{ padding: "8px 12px" }}>{inv.client}</td>

      <td style={{ padding: "8px 12px" }}>
        {formatDate(inv.invoice_date)}
      </td>

      <td
        style={{
          padding: "8px 12px",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatAmount(inv.amount)}
      </td>

      <td
        style={{
          padding: "8px 12px",
          color: "#9ca3af",
          fontSize: 12,
          cursor: inv.reminder_to || inv.reminder_cc ? "help" : "default",
        }}
        title={buildEmailTooltip(inv)}
      >
        {inv.client_email || "—"}
      </td>

      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        <button
          onClick={() => handleToggle(inv.row_index, true)}
          disabled={activatingRow === inv.row_index || cannotActivate}
          title={
            cannotActivate
              ? "No email configured (Emails table / invoice email)"
              : ""
          }
          style={{
            padding: "4px 12px",
            borderRadius: 999,
            border: "none",
            background:
              activatingRow === inv.row_index
                ? "#16a34a80"
                : cannotActivate
                ? "rgba(148,163,184,0.25)"
                : "#16a34a",
            color: "white",
            fontSize: 12,
            cursor:
              activatingRow === inv.row_index || cannotActivate
                ? "not-allowed"
                : "pointer",
            opacity: cannotActivate ? 0.7 : 1,
          }}
        >
          {activatingRow === inv.row_index
            ? "Activating..."
            : cannotActivate
            ? "Missing email"
            : "Activate"}
        </button>
      </td>
    </tr>
  );
})}

              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT TABLE */}
        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Active reminder follow-up
          </h3>

          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(31,41,55,0.8)",
              overflowX: "auto", // 🔹 horizontal scroll
              overflowY: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: 850, // 🔹 table can be wider than viewport
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead
                style={{
                  background: "rgba(15,23,42,0.9)",
                  textAlign: "left",
                }}
              >
                <tr>
                  <th style={{ padding: "8px 12px", width: 80 }}>Invoice #</th>
                  <th style={{ padding: "8px 12px" }}>Client</th>
                  <th style={{ padding: "8px 12px" }}>Invoice date</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>
                    Amount TND
                  </th>
                  <th style={{ padding: "8px 12px" }}>Start</th>
                  <th style={{ padding: "8px 12px" }}>1st reminder</th>
                  <th style={{ padding: "8px 12px" }}>2nd reminder</th>
                  <th style={{ padding: "8px 12px" }}>3rd reminder</th>
                  <th style={{ padding: "8px 12px" }}>Next step</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: 12,
                        color: "#9ca3af",
                        fontSize: 12,
                      }}
                    >
                      Aucun reminder actif actuellement.
                    </td>
                  </tr>
                )}
                {active.map((inv) => {
                  const state = computeReminderState(inv);
                  const isDeactivating = deactivatingRow === inv.row_index;
                  const isPausing = pausingRow === inv.row_index;
                  const isSending = sendingRow === inv.row_index;

                  return (
                    <tr
                      key={inv.row_index}
                      style={{
                        borderTop: "1px solid rgba(31,41,55,0.8)",
                      }}
                    >
                      <td style={{ padding: "8px 12px" }}>
                        {inv.invoice_number || `#${inv.row_index ?? "?"}`}
                      </td>
                      <td style={{ padding: "8px 12px" }}>{inv.client}</td>
                      <td style={{ padding: "8px 12px" }}>
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatAmount(inv.amount)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {formatDate(inv.reminder_start)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {formatDate(inv.first_reminder_at)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {formatDate(inv.second_reminder_at)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        {formatDate(inv.third_reminder_at)}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          fontSize: 12,
                          color: "#e5e7eb",
                        }}
                      >
                        {state.label}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            onClick={() => handlePause(inv)}
                            disabled={isPausing}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              border: "1px solid rgba(148,163,184,0.6)",
                              background: inv.reminder_paused
                                ? "#0f172a"
                                : "#111827",
                              color: inv.reminder_paused
                                ? "#fbbf24"
                                : "#e5e7eb",
                              fontSize: 12,
                              cursor: isPausing ? "default" : "pointer",
                            }}
                          >
                            {isPausing
                              ? inv.reminder_paused
                                ? "Resuming..."
                                : "Pausing..."
                              : inv.reminder_paused
                              ? "Resume"
                              : "Pause"}
                          </button>

                          <button
                            onClick={() => handleSend(inv)}
                            disabled={!state.canSend || isSending}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              border: "none",
                              background: !state.canSend
                                ? "#2563eb40"
                                : isSending
                                ? "#2563eb80"
                                : "#2563eb",
                              color: "white",
                              fontSize: 12,
                              cursor:
                                !state.canSend || isSending
                                  ? "default"
                                  : "pointer",
                            }}
                          >
                            {isSending
                              ? "Sending..."
                              : state.stage === 1
                              ? "Send 1st"
                              : state.stage === 2
                              ? "Send 2nd"
                              : state.stage === 3
                              ? "Send 3rd"
                              : "Send"}
                          </button>

                          <button
                            onClick={() =>
                              handleToggle(inv.row_index, false /* deactivate */)
                            }
                            disabled={isDeactivating}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              border: "none",
                              background: isDeactivating
                                ? "#ef444480"
                                : "#ef4444",
                              color: "white",
                              fontSize: 12,
                              cursor: isDeactivating ? "default" : "pointer",
                            }}
                          >
                            {isDeactivating ? "Deactivating..." : "Deactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
