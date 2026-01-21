// src/components/digest/DailyDigestPanel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchDigestSchedule,
  updateDigestSchedule,
  previewDailyDigest,
  sendDailyDigestNow,
} from "../../api";

function pad2(n) {
  const x = Number(n || 0);
  return String(x).padStart(2, "0");
}

function formatMoneyTND(x) {
  const v = Number(x || 0);
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default function DailyDigestPanel() {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [preview, setPreview] = useState(null);

  const [schedule, setSchedule] = useState({
    enabled: true,
    hour: 17,
    minute: 0,
    timezone: "Africa/Tunis",
  });

  // Pending-by-month UI state
  const [pendingQuery, setPendingQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("__ALL__");
  const [sortMode, setSortMode] = useState("amount_desc");
  const [topN, setTopN] = useState("10");
  const [expandedMonths, setExpandedMonths] = useState(new Set());

  // Load schedule on mount
  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const data = await fetchDigestSchedule();
        setSchedule((s) => ({
          ...s,
          ...data,
          hour: data?.hour ?? s.hour,
          minute: data?.minute ?? s.minute,
          enabled: typeof data?.enabled === "boolean" ? data.enabled : s.enabled,
          timezone: data?.timezone ?? s.timezone,
        }));
      } catch (e) {
        console.error(e);
        setError("Failed to load digest schedule.");
      }
    };
    load();
  }, []);

  const handlePreview = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await previewDailyDigest();
      setPreview(data);
    } catch (e) {
      console.error(e);
      setError("Failed to generate preview.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async () => {
    try {
      setSending(true);
      setError("");
      const res = await sendDailyDigestNow();
      await handlePreview();
      return res;
    } catch (e) {
      console.error(e);
      setError("Failed to send digest to Telegram.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setError("");
      await updateDigestSchedule({
        enabled: !!schedule.enabled,
        hour: Number(schedule.hour),
        minute: Number(schedule.minute),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString();
  }, []);

  const textPreview = preview?.text || "";

  const monthOptions = useMemo(() => {
    const obj = preview?.pending_by_month || {};
    return Object.keys(obj);
  }, [preview]);

  // Auto-expand all months when preview loads
  useEffect(() => {
    if (monthOptions.length > 0) {
      setExpandedMonths(new Set(monthOptions));
    }
  }, [monthOptions]);

  const filteredMonthBlocks = useMemo(() => {
    const obj = preview?.pending_by_month || {};
    const q = pendingQuery.trim().toLowerCase();
    const limit = Number(topN || 10);

    let blocks = Object.entries(obj).map(([month, bucket]) => {
      let items = (bucket?.items || []).map((x) => ({
        client: x.client || "—",
        amount: Number(x.amount || 0),
      }));

      // Month filter
      if (selectedMonth !== "__ALL__" && month !== selectedMonth) {
        items = [];
      }

      // Search filter
      if (q) {
        items = items.filter((it) =>
          String(it.client || "").toLowerCase().includes(q)
        );
      }

      // Sort
      if (sortMode === "client_az") {
        items.sort((a, b) =>
          String(a.client || "").localeCompare(String(b.client || ""))
        );
      } else if (sortMode === "amount_asc") {
        items.sort((a, b) => a.amount - b.amount);
      } else {
        items.sort((a, b) => b.amount - a.amount);
      }

      // Limit
      if (items.length > limit) items = items.slice(0, limit);

      const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

      return { month, items, total };
    });

    blocks = blocks.filter((b) => b.items.length > 0);
    return blocks;
  }, [preview, pendingQuery, selectedMonth, sortMode, topN]);

  return (
    <div
      style={{
        marginTop: 16,
        background: "#0b1220",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 16,
        color: "#e5e7eb",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            Daily Digest (Telegram)
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Generates “Cash inflows today” + “Pending invoices by month”.
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Note: Render free can sleep → “Send now” is always available.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handlePreview}
            disabled={loading}
            style={btnStyle(loading ? 0.7 : 1)}
          >
            {loading ? "Generating…" : "Preview"}
          </button>

          <button
            onClick={handleSendNow}
            disabled={sending}
            style={btnStyle(sending ? 0.7 : 1, true)}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      {/* Schedule */}
      <div
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 8 }}>
          Auto schedule (Tunis time)
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={!!schedule.enabled}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, enabled: e.target.checked }))
              }
              style={{ marginRight: 8 }}
            />
            Enabled
          </label>

          <label style={labelStyle}>
            Hour
            <input
              type="number"
              min={0}
              max={23}
              value={schedule.hour}
              onChange={(e) => setSchedule((s) => ({ ...s, hour: e.target.value }))}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Minute
            <input
              type="number"
              min={0}
              max={59}
              value={schedule.minute}
              onChange={(e) =>
                setSchedule((s) => ({ ...s, minute: e.target.value }))
              }
              style={inputStyle}
            />
          </label>

          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Scheduled: {pad2(schedule.hour)}:{pad2(schedule.minute)} (
            {schedule.timezone || "Africa/Tunis"})
          </div>

          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            style={btnStyle(saving ? 0.7 : 1)}
          >
            {saving ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: "#fca5a5", fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      {/* Preview */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 8 }}>
          Preview ({todayStr})
        </div>

        {preview?.pending_by_month ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            {/* Inflows today */}
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 8 }}>
                Cash Inflows (Today)
              </div>

              {(preview?.inflows_today || []).length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  No inflows detected today.
                </div>
              ) : (
                <>
                  {(preview.inflows_today || []).map((x, idx) => (
                    <div key={idx} style={rowStyle}>
                      <span style={{ opacity: 0.9 }}>{x.client}</span>
                      <span style={{ fontWeight: 700 }}>
                        {formatMoneyTND(x.amount)} TND
                      </span>
                    </div>
                  ))}

                  <div
                    style={{
                      ...rowStyle,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span style={{ opacity: 0.9 }}>Total</span>
                    <span style={{ fontWeight: 800 }}>
                      {formatMoneyTND(preview.inflows_total || 0)} TND
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Pending by Month (Enhanced) */}
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 8 }}>
                Pending by Month
              </div>

              {/* Filters (sticky) */}
              <div style={stickyFiltersStyle}>
                <input
                  value={pendingQuery}
                  onChange={(e) => setPendingQuery(e.target.value)}
                  placeholder="Search client… (e.g., BK Food)"
                  style={searchInputStyle}
                />

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={selectStyle}
                >
                  <option value="__ALL__">All months</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                  style={selectStyle}
                >
                  <option value="amount_desc">Sort: Amount ↓</option>
                  <option value="amount_asc">Sort: Amount ↑</option>
                  <option value="client_az">Sort: Client A→Z</option>
                </select>

                <select
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  style={selectStyle}
                >
                  <option value="10">Top 10</option>
                  <option value="25">Top 25</option>
                  <option value="999999">All</option>
                </select>

                <button
                  onClick={() => setExpandedMonths(new Set(monthOptions))}
                  style={miniBtnStyle}
                  title="Expand all"
                >
                  Expand
                </button>
                <button
                  onClick={() => setExpandedMonths(new Set())}
                  style={miniBtnStyle}
                  title="Collapse all"
                >
                  Collapse
                </button>
              </div>

              {/* Scrollable list */}
              <div style={scrollAreaStyle}>
                {filteredMonthBlocks.length === 0 ? (
                  <div style={{ fontSize: 12, opacity: 0.75, padding: 8 }}>
                    No results.
                  </div>
                ) : (
                  filteredMonthBlocks.map(({ month, items, total }) => {
                    const isOpen = expandedMonths.has(month);

                    return (
                      <div key={month} style={{ marginBottom: 10 }}>
                        {/* Month header */}
                        <div
                          style={monthHeaderStyle}
                          onClick={() => {
                            setExpandedMonths((prev) => {
                              const next = new Set(prev);
                              if (next.has(month)) next.delete(month);
                              else next.add(month);
                              return next;
                            });
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>{month}</span>
                            <span style={{ opacity: 0.75, fontSize: 12 }}>
                              ({items.length})
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <span style={{ fontWeight: 800 }}>
                              {formatMoneyTND(total)} TND
                            </span>
                            <span style={{ opacity: 0.7, fontSize: 12 }}>
                              {isOpen ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        {isOpen ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              padding: "6px 2px",
                            }}
                          >
                            {items.map((it, idx) => (
                              <div key={idx} style={rowStyle}>
                                <span style={{ opacity: 0.92 }}>{it.client}</span>
                                <span style={{ fontWeight: 700 }}>
                                  {formatMoneyTND(it.amount)} TND
                                </span>
                              </div>
                            ))}

                            <div
                              style={{
                                ...rowStyle,
                                marginTop: 6,
                                paddingTop: 8,
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <span style={{ opacity: 0.9 }}>Total</span>
                              <span style={{ fontWeight: 800 }}>
                                {formatMoneyTND(total)} TND
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Raw Telegram text */}
        <div
          style={{
            background: "#050a14",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: 12,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            whiteSpace: "pre-wrap",
            fontSize: 12,
            lineHeight: 1.35,
          }}
        >
          {textPreview ? textPreview : "Click Preview to generate the message text…"}
        </div>
      </div>
    </div>
  );
}

function btnStyle(opacity = 1, primary = false) {
  return {
    opacity,
    background: primary ? "#2563eb" : "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 650,
  };
}

const labelStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  opacity: 0.9,
};

const inputStyle = {
  marginLeft: 8,
  width: 72,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#e5e7eb",
  padding: "6px 8px",
  borderRadius: 8,
  outline: "none",
};

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: 12,
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
};

const scrollAreaStyle = {
  maxHeight: 360,
  overflowY: "auto",
  paddingRight: 6,
};

const stickyFiltersStyle = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "rgba(11,18,32,0.95)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: 10,

  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};


const searchInputStyle = {
  flex: "1 1 240px",
  minWidth: 180,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#f9fafb",
  padding: "9px 12px",
  borderRadius: 10,
  outline: "none",
  fontSize: 13,
};

const selectStyle = {
  flex: "0 1 170px",
  minWidth: 150,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "#ffffff",
  padding: "9px 12px",
  borderRadius: 10,
  outline: "none",
  fontSize: 13,
  fontWeight: 650,

  // helps in some browsers
  appearance: "none",
};

const miniBtnStyle = {
  flex: "0 0 auto",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

const monthHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 10px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  cursor: "pointer",
  userSelect: "none",
};
