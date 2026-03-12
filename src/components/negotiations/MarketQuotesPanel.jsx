import { useEffect, useMemo, useState } from "react";
import {
  fetchMarketQuotes,
  createMarketQuote,
  updateMarketQuote,
  deleteMarketQuote,
} from "../../api";

/* ======================
 * Helpers
 * ====================== */

function parseDecimal(value) {
  if (value == null) return null;
  const s = String(value).trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function pairAccent(pair) {
  const p = String(pair || "").toUpperCase();

  if (p === "EUR/TND") {
    return {
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.12)",
      border: "rgba(96,165,250,0.28)",
    };
  }

  if (p === "USD/TND") {
    return {
      color: "#34d399",
      bg: "rgba(52,211,153,0.12)",
      border: "rgba(52,211,153,0.28)",
    };
  }

  if (p === "GBP/TND") {
    return {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.28)",
    };
  }

  if (p === "CAD/TND") {
    return {
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
      border: "rgba(248,113,113,0.28)",
    };
  }

  return {
    color: "#c4b5fd",
    bg: "rgba(196,181,253,0.12)",
    border: "rgba(196,181,253,0.28)",
  };
}

function buildValidationReason(form) {
  const bidParsed = parseDecimal(form.bid);
  const askParsed = parseDecimal(form.ask);
  const hasBid = String(form.bid).trim() !== "";
  const hasAsk = String(form.ask).trim() !== "";

  if (!form.currency_pair.trim()) return "Select a currency pair.";
  if (!form.bank_name.trim()) return "Select a bank.";
  if (!form.analyst_name.trim()) return "Select an analyst.";
  if (!hasBid && !hasAsk) return "Enter at least one valid price.";
  if (hasBid && (bidParsed == null || bidParsed <= 0)) return "Bid is invalid.";
  if (hasAsk && (askParsed == null || askParsed <= 0)) return "Ask is invalid.";
  if (hasBid && hasAsk && bidParsed >= askParsed) return "Bid must be lower than ask.";
  return "";
}

function isFormValid(form) {
  return buildValidationReason(form) === "";
}

/* ======================
 * Styles
 * ====================== */

const pageWrapStyle = {
  marginTop: 12,
};

const panelStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 12,
  color: "rgba(229,231,235,0.75)",
  fontWeight: 800,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
};

const optionStyle = {
  background: "#0b1220",
  color: "#e5e7eb",
};

const btnStyle = (primary = true) => ({
  background: primary ? "#2563eb" : "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: primary
    ? "1px solid rgba(37,99,235,0.45)"
    : "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 800,
});

const smallBtnStyle = (kind = "neutral") => {
  let background = "rgba(255,255,255,0.06)";
  let border = "1px solid rgba(255,255,255,0.14)";
  let color = "#e5e7eb";

  if (kind === "edit") {
    background = "rgba(59,130,246,0.14)";
    border = "1px solid rgba(59,130,246,0.28)";
    color = "#93c5fd";
  }

  if (kind === "delete") {
    background = "rgba(239,68,68,0.14)";
    border = "1px solid rgba(239,68,68,0.28)";
    color = "#fca5a5";
  }

  return {
    background,
    color,
    border,
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 800,
  };
};

const tableWrapStyle = {
  maxHeight: "74vh",
  overflowY: "auto",
  overflowX: "auto",
  position: "relative",
  width: "100%",
};

const tableStyle = {
  width: "100%",
  minWidth: 1220,
  maxWidth: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

const thStyle = {
  position: "sticky",
  top: 0,
  zIndex: 2,
  background: "rgba(2,6,23,0.96)",
  color: "rgba(229,231,235,0.88)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: 11,
  fontWeight: 900,
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px 10px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

const monoStyle = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontVariantNumeric: "tabular-nums",
};

const filterBarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(220px,1.4fr) minmax(140px,1fr) minmax(140px,1fr) auto auto",
  gap: 10,
  marginBottom: 12,
  alignItems: "center",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
};

const modalStyle = {
  width: "100%",
  maxWidth: 720,
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
};

const deleteModalStyle = {
  width: "100%",
  maxWidth: 460,
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
};

const badgeStyle = (pair) => {
  const accent = pairAccent(pair);
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    background: accent.bg,
    border: `1px solid ${accent.border}`,
    color: accent.color,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: "0.03em",
  };
};

const bestPriceCellStyle = {
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.25)",
  borderRadius: 10,
  color: "#86efac",
  fontWeight: 900,
  padding: "6px 8px",
  display: "inline-block",
  minWidth: 76,
  textAlign: "right",
};

const normalPriceCellStyle = {
  display: "inline-block",
  minWidth: 76,
  textAlign: "right",
};

const subtleTextStyle = {
  color: "rgba(229,231,235,0.65)",
  fontSize: 12,
};

const eurusdCellStyle = {
  display: "inline-block",
  minWidth: 76,
  textAlign: "right",
  padding: "6px 8px",
  borderRadius: 10,
  background: "rgba(168,85,247,0.10)",
  border: "1px solid rgba(168,85,247,0.20)",
  color: "#d8b4fe",
};

/* ======================
 * Lists
 * ====================== */

const CURRENCY_PAIRS = [
  "EUR/TND",
  "USD/TND",
  "GBP/TND",
  "CAD/TND",
  "EUR/USD",
  "EUR/GBP",
  "USD/GBP",
];

const BANKS = [
  "BIAT",
  "STB",
  "UBCI",
  "NAIB",
  "BTL",
  "WIFAK BANK",
  "BNA",
  "ATTIJARI BANK",
  "ATB",
  "AMEN BANK",
  "ZITOUNA",
  "BT",
  "UIB",
  "QNB",
  "BH",
  "BTK",
  "BTE",
];

const ANALYSTS = [
  "Mezri Karoui",
  "Amine Rouaissi",
  "Yosr Ben Amar",
  "Tarak Ktari",
  "Hedi Ghorbel",
  "Aziz Ben Mahmoud",
  "Amine Soltana",
  "Heni Ghazouany",
];

/* ======================
 * Modals
 * ====================== */

function QuoteFormModal({
  open,
  title,
  submitLabel,
  onClose,
  onSubmit,
  posting,
  error,
  form,
  setForm,
}) {
  if (!open) return null;

  const canSubmit = isFormValid(form);
  const validationReason = buildValidationReason(form);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#e5e7eb" }}>
              {title}
            </div>
            <div style={{ ...subtleTextStyle, marginTop: 4 }}>
              Enter at least one valid price. If both are entered, bid must be lower than ask.
            </div>
          </div>

          <button
            type="button"
            style={{ ...btnStyle(false), marginLeft: "auto" }}
            onClick={onClose}
            disabled={posting}
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Currency Pair</div>
              <select
                style={selectStyle}
                value={form.currency_pair}
                onChange={(e) => setForm({ ...form, currency_pair: e.target.value })}
              >
                {CURRENCY_PAIRS.map((p) => (
                  <option key={p} value={p} style={optionStyle}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={labelStyle}>Bank</div>
              <select
                style={selectStyle}
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              >
                <option value="" style={optionStyle}>
                  Select bank
                </option>
                {BANKS.map((b) => (
                  <option key={b} value={b} style={optionStyle}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Bid</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder="e.g. 3.4120"
                value={form.bid}
                onChange={(e) => setForm({ ...form, bid: e.target.value })}
                inputMode="decimal"
              />
            </div>

            <div>
              <div style={labelStyle}>Ask</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder="e.g. 3.4250"
                value={form.ask}
                onChange={(e) => setForm({ ...form, ask: e.target.value })}
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Analyst</div>
            <select
              style={selectStyle}
              value={form.analyst_name}
              onChange={(e) => setForm({ ...form, analyst_name: e.target.value })}
            >
              <option value="" style={optionStyle}>
                Select analyst
              </option>
              {ANALYSTS.map((a) => (
                <option key={a} value={a} style={optionStyle}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Note (optional)</div>
            <input
              style={inputStyle}
              placeholder="e.g. indicative, wide, client flow..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
            <button
              type="submit"
              style={{
                ...btnStyle(true),
                opacity: !canSubmit || posting ? 0.5 : 1,
                cursor: !canSubmit || posting ? "not-allowed" : "pointer",
              }}
              disabled={!canSubmit || posting}
            >
              {posting ? "Saving..." : submitLabel}
            </button>

            <div style={{ ...subtleTextStyle, marginLeft: "auto" }}>
              Comma or dot decimal accepted
            </div>
          </div>

          {error && <div style={{ color: "#f97373", fontSize: 13 }}>{error}</div>}
          {!error && !canSubmit && (
            <div style={{ color: "rgba(229,231,235,0.55)", fontSize: 12 }}>
              {validationReason || "Form is not valid yet."}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  open,
  item,
  busy,
  onClose,
  onConfirm,
}) {
  if (!open || !item) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={deleteModalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#e5e7eb", marginBottom: 8 }}>
          Delete Market Quote
        </div>

        <div style={{ color: "rgba(229,231,235,0.72)", fontSize: 13, lineHeight: 1.6 }}>
          Are you sure you want to delete this quote?
          <br />
          <br />
          <strong>Pair:</strong> {item.currency_pair}
          <br />
          <strong>Bank:</strong> {item.bank_name}
          <br />
          <strong>Analyst:</strong> {item.analyst_name}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" style={btnStyle(false)} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            style={{ ...btnStyle(true), background: "#dc2626", border: "1px solid rgba(220,38,38,0.45)" }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================
 * Component
 * ====================== */

export default function MarketQuotesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [createPosting, setCreatePosting] = useState(false);
  const [updatePosting, setUpdatePosting] = useState(false);
  const [deletePosting, setDeletePosting] = useState(false);

  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [form, setForm] = useState({
    currency_pair: "EUR/TND",
    bank_name: "",
    bid: "",
    ask: "",
    analyst_name: "",
    note: "",
  });

  const [filters, setFilters] = useState({
    q: "",
    currency_pair: "ALL",
    bank_name: "ALL",
  });

  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return items.filter((r) => {
      const matchesText =
        !q ||
        String(r.currency_pair || "").toLowerCase().includes(q) ||
        String(r.bank_name || "").toLowerCase().includes(q) ||
        String(r.analyst_name || "").toLowerCase().includes(q) ||
        String(r.note || "").toLowerCase().includes(q);

      const matchesPair =
        filters.currency_pair === "ALL" || r.currency_pair === filters.currency_pair;

      const matchesBank =
        filters.bank_name === "ALL" || r.bank_name === filters.bank_name;

      return matchesText && matchesPair && matchesBank;
    });
  }, [items, filters]);

  const bestLevelsByPair = useMemo(() => {
    const map = {};

    for (const row of filteredItems) {
      const pair = String(row.currency_pair || "").trim();
      if (!pair) continue;

      const bid = parseDecimal(row.bid);
      const ask = parseDecimal(row.ask);

      if (!map[pair]) {
        map[pair] = {
          bestBid: null,
          bestAsk: null,
        };
      }

      if (bid != null && (map[pair].bestBid == null || bid > map[pair].bestBid)) {
        map[pair].bestBid = bid;
      }

      if (ask != null && (map[pair].bestAsk == null || ask < map[pair].bestAsk)) {
        map[pair].bestAsk = ask;
      }
    }

    return map;
  }, [filteredItems]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMarketQuotes(200);
      setItems(data.items || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  function resetForm() {
    setForm({
      currency_pair: "EUR/TND",
      bank_name: "",
      bid: "",
      ask: "",
      analyst_name: "",
      note: "",
    });
  }

  function openCreateModal() {
    setError("");
    resetForm();
    setIsAddModalOpen(true);
  }

  function openEditModal(item) {
    setError("");
    setSelectedItem(item);
    setForm({
      currency_pair: String(item.currency_pair || ""),
      bank_name: String(item.bank_name || ""),
      bid: item.bid == null ? "" : String(item.bid),
      ask: item.ask == null ? "" : String(item.ask),
      analyst_name: String(item.analyst_name || ""),
      note: String(item.note || ""),
    });
    setIsEditModalOpen(true);
  }

  function openDeleteModal(item) {
    setError("");
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!isFormValid(form)) {
      setError(buildValidationReason(form));
      return;
    }

    setCreatePosting(true);
    setError("");

    try {
      const hasBid = String(form.bid).trim() !== "";
      const hasAsk = String(form.ask).trim() !== "";

      const payload = {
        currency_pair: form.currency_pair.trim(),
        bank_name: form.bank_name.trim(),
        bid: hasBid ? parseDecimal(form.bid) : null,
        ask: hasAsk ? parseDecimal(form.ask) : null,
        analyst_name: form.analyst_name.trim(),
        note: String(form.note || "").trim(),
      };

      await createMarketQuote(payload);
      setIsAddModalOpen(false);
      resetForm();
      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setCreatePosting(false);
    }
  }

  async function handleUpdateSubmit(e) {
    e.preventDefault();
    if (!selectedItem?.quote_id) return;

    if (!isFormValid(form)) {
      setError(buildValidationReason(form));
      return;
    }

    setUpdatePosting(true);
    setError("");

    try {
      const hasBid = String(form.bid).trim() !== "";
      const hasAsk = String(form.ask).trim() !== "";

      const payload = {
        currency_pair: form.currency_pair.trim(),
        bank_name: form.bank_name.trim(),
        bid: hasBid ? parseDecimal(form.bid) : null,
        ask: hasAsk ? parseDecimal(form.ask) : null,
        analyst_name: form.analyst_name.trim(),
        note: String(form.note || "").trim(),
      };

      await updateMarketQuote(selectedItem.quote_id, payload);
      setIsEditModalOpen(false);
      setSelectedItem(null);
      resetForm();
      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setUpdatePosting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedItem?.quote_id) return;

    setDeletePosting(true);
    setError("");

    try {
      await deleteMarketQuote(selectedItem.quote_id);
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setDeletePosting(false);
    }
  }

  return (
    <>
      <div style={pageWrapStyle}>
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: 900, color: "#e5e7eb", fontSize: 16 }}>
                Market Quotes
              </div>
              <div style={{ color: "rgba(229,231,235,0.7)", fontSize: 12, marginTop: 4 }}>
                Auto-refresh: 10s • Rows: {filteredItems.length}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" style={btnStyle(true)} onClick={openCreateModal}>
                + Add Market Quote
              </button>

              <button
                type="button"
                style={btnStyle(false)}
                onClick={refresh}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div style={filterBarStyle}>
            <input
              style={inputStyle}
              placeholder="Search pair / bank / analyst / note..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />

            <select
              style={selectStyle}
              value={filters.currency_pair}
              onChange={(e) => setFilters((f) => ({ ...f, currency_pair: e.target.value }))}
            >
              <option value="ALL" style={optionStyle}>
                All pairs
              </option>
              {CURRENCY_PAIRS.map((p) => (
                <option key={p} value={p} style={optionStyle}>
                  {p}
                </option>
              ))}
            </select>

            <select
              style={selectStyle}
              value={filters.bank_name}
              onChange={(e) => setFilters((f) => ({ ...f, bank_name: e.target.value }))}
            >
              <option value="ALL" style={optionStyle}>
                All banks
              </option>
              {BANKS.map((b) => (
                <option key={b} value={b} style={optionStyle}>
                  {b}
                </option>
              ))}
            </select>

            <button
              type="button"
              style={btnStyle(false)}
              onClick={() =>
                setFilters({
                  q: "",
                  currency_pair: "ALL",
                  bank_name: "ALL",
                })
              }
            >
              Reset
            </button>

            <div style={{ ...subtleTextStyle, display: "flex", alignItems: "center" }}>
              Best bid = max • Best ask = min
            </div>
          </div>

          {error && (
            <div style={{ color: "#f97373", fontSize: 13, marginBottom: 10 }}>{error}</div>
          )}

          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {[
                    "timestamp_utc",
                    "currency_pair",
                    "bank_name",
                    "bid",
                    "ask",
                    "eurusd_bid",
                    "eurusd_ask",
                    "analyst_name",
                    "note",
                    "action",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((r, idx) => {
                  const zebra = idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent";
                  const pair = String(r.currency_pair || "").trim();
                  const bid = parseDecimal(r.bid);
                  const ask = parseDecimal(r.ask);
                  const eurusdBid = parseDecimal(r.eurusd_bid);
                  const eurusdAsk = parseDecimal(r.eurusd_ask);

                  const bestBid = bestLevelsByPair[pair]?.bestBid ?? null;
                  const bestAsk = bestLevelsByPair[pair]?.bestAsk ?? null;

                  const isBestBid = bid != null && bestBid != null && bid === bestBid;
                  const isBestAsk = ask != null && bestAsk != null && ask === bestAsk;

                  return (
                    <tr
                      key={r.quote_id || `${r.timestamp_utc}-${idx}`}
                      style={{ background: zebra, transition: "background 120ms ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = zebra)}
                    >
                      <td style={{ ...tdStyle, color: "rgba(229,231,235,0.80)" }}>
                        {r.timestamp_utc}
                      </td>

                      <td style={tdStyle}>
                        <span style={badgeStyle(pair)}>{pair}</span>
                      </td>

                      <td style={tdStyle}>{r.bank_name}</td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {bid == null ? (
                          "—"
                        ) : (
                          <span style={isBestBid ? bestPriceCellStyle : normalPriceCellStyle}>
                            {bid.toFixed(4)}
                          </span>
                        )}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {ask == null ? (
                          "—"
                        ) : (
                          <span style={isBestAsk ? bestPriceCellStyle : normalPriceCellStyle}>
                            {ask.toFixed(4)}
                          </span>
                        )}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {eurusdBid == null ? "—" : <span style={eurusdCellStyle}>{eurusdBid.toFixed(4)}</span>}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {eurusdAsk == null ? "—" : <span style={eurusdCellStyle}>{eurusdAsk.toFixed(4)}</span>}
                      </td>

                      <td style={tdStyle}>{r.analyst_name}</td>

                      <td
                        style={{
                          ...tdStyle,
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.note || ""}
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            style={smallBtnStyle("edit")}
                            onClick={() => openEditModal(r)}
                          >
                            Up
                          </button>

                          <button
                            type="button"
                            style={smallBtnStyle("delete")}
                            onClick={() => openDeleteModal(r)}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredItems.length && !loading && (
                  <tr>
                    <td colSpan={10} style={{ padding: 12, color: "rgba(229,231,235,0.7)" }}>
                      No quotes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <QuoteFormModal
        open={isAddModalOpen}
        title="Add Market Quote"
        submitLabel="Save Quote"
        onClose={() => {
          if (!createPosting) {
            setIsAddModalOpen(false);
          }
        }}
        onSubmit={handleCreateSubmit}
        posting={createPosting}
        error={error}
        form={form}
        setForm={setForm}
      />

      <QuoteFormModal
        open={isEditModalOpen}
        title="Update Market Quote"
        submitLabel="Update Quote"
        onClose={() => {
          if (!updatePosting) {
            setIsEditModalOpen(false);
          }
        }}
        onSubmit={handleUpdateSubmit}
        posting={updatePosting}
        error={error}
        form={form}
        setForm={setForm}
      />

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        item={selectedItem}
        busy={deletePosting}
        onClose={() => {
          if (!deletePosting) {
            setIsDeleteModalOpen(false);
          }
        }}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}