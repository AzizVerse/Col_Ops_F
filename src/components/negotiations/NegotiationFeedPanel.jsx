// src/components/negotiations/NegotiationFeedPanel.jsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchNegotiationFeed,
  createNegotiationFeedEntry,
  confirmNegotiationFeedEntry, // add this in api.js
} from "../../api";

/* ======================
 * Styles
 * ====================== */

const cardStyle = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
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
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 13,
  cursor: "pointer",
  fontWeight: 800,
});

const btnSmallStyle = (primary = true) => ({
  background: primary ? "#2563eb" : "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 800,
});

const tableWrapStyle = {
  ...cardStyle,
  maxHeight: "72vh",
  overflowY: "auto",
  overflowX: "auto",
  position: "relative",
};

const tableStyle = {
  width: "100%",
  minWidth: 1200,
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

const thStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1,
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
  gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto",
  gap: 10,
  marginBottom: 12,
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
};

const modalStyle = {
  width: "100%",
  maxWidth: 520,
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
};

function statusPill(status) {
  const s = String(status || "").toUpperCase();
  let bg = "rgba(148,163,184,0.18)";
  let br = "rgba(148,163,184,0.25)";
  let color = "rgba(229,231,235,0.92)";

  if (s === "CONFIRMED") {
    bg = "rgba(34,197,94,0.18)";
    br = "rgba(34,197,94,0.30)";
  } else if (s === "NEGOTIATING") {
    bg = "rgba(234,179,8,0.18)";
    br = "rgba(234,179,8,0.30)";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${br}`,
        fontWeight: 900,
        fontSize: 12,
        color,
      }}
    >
      {s || "—"}
    </span>
  );
}

/* ======================
 * Lists
 * ====================== */

const CURRENCY_PAIRS = ["EUR/TND", "USD/TND", "GBP/TND", "EUR/USD", "EUR/GBP", "USD/GBP"];

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

const STATUSES = ["NEGOTIATING", "CONFIRMED"];

function ConfirmNegotiationModal({
  open,
  item,
  busy,
  bankName,
  setBankName,
  quotedRate,
  setQuotedRate,
  onClose,
  onConfirm,
}) {
  if (!open || !item) return null;

  const canConfirm = bankName.trim() && Number(quotedRate) > 0;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#e5e7eb", marginBottom: 8 }}>
          Confirm Negotiation
        </div>

        <div style={{ color: "rgba(229,231,235,0.72)", fontSize: 13, marginBottom: 16 }}>
          Update the bank and quoted rate, then validate to turn this deal into confirmed.
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={labelStyle}>Currency Pair</div>
            <input style={inputStyle} value={item.currency_pair || ""} readOnly />
          </div>

          <div>
            <div style={labelStyle}>Bank</div>
            <select style={selectStyle} value={bankName} onChange={(e) => setBankName(e.target.value)}>
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

          <div>
            <div style={labelStyle}>Quoted Rate</div>
            <input
              style={{ ...inputStyle, ...monoStyle }}
              placeholder="e.g. 3.4230"
              value={quotedRate}
              onChange={(e) => setQuotedRate(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18 }}>
          <button type="button" style={btnStyle(false)} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" style={btnStyle(true)} onClick={onConfirm} disabled={!canConfirm || busy}>
            {busy ? "Confirming..." : "Validate & Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NegotiationFeedPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    currency_pair: "EUR/TND",
    side: "SELL",
    amount_fcy: "",
    bank_name: "",
    quoted_rate: "",
    analyst_name: "",
    status: "NEGOTIATING",
  });

  const [filters, setFilters] = useState({
    q: "",
    currency_pair: "ALL",
    status: "ALL",
    bank_name: "ALL",
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmBankName, setConfirmBankName] = useState("");
  const [confirmQuotedRate, setConfirmQuotedRate] = useState("");

  const isNegotiating = form.status === "NEGOTIATING";
  const isConfirmed = form.status === "CONFIRMED";

  const canSubmit = useMemo(() => {
    const amt = Number(form.amount_fcy);
    const rate = Number(form.quoted_rate);

    return (
      form.currency_pair.trim() &&
      form.side.trim() &&
      Number.isFinite(amt) &&
      amt > 0 &&
      form.bank_name.trim() &&
      form.analyst_name.trim() &&
      form.status.trim() &&
      (isNegotiating || (Number.isFinite(rate) && rate > 0))
    );
  }, [form, isNegotiating]);

  const filteredItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return items.filter((r) => {
      const matchesText =
        !q ||
        String(r.currency_pair || "").toLowerCase().includes(q) ||
        String(r.bank_name || "").toLowerCase().includes(q) ||
        String(r.analyst_name || "").toLowerCase().includes(q) ||
        String(r.side || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q);

      const matchesPair =
        filters.currency_pair === "ALL" || r.currency_pair === filters.currency_pair;

      const matchesStatus =
        filters.status === "ALL" || String(r.status || "").toUpperCase() === filters.status;

      const matchesBank =
        filters.bank_name === "ALL" || r.bank_name === filters.bank_name;

      return matchesText && matchesPair && matchesStatus && matchesBank;
    });
  }, [items, filters]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchNegotiationFeed(200);
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

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setPosting(true);
    setError("");

    try {
      await createNegotiationFeedEntry({
        currency_pair: form.currency_pair.trim(),
        side: form.side.trim().toUpperCase(),
        amount_fcy: Number(form.amount_fcy),
        bank_name: form.bank_name.trim(),
        quoted_rate: isNegotiating && !form.quoted_rate ? null : Number(form.quoted_rate),
        analyst_name: form.analyst_name.trim(),
        status: form.status.trim().toUpperCase(),
      });

      setForm((f) => ({
        ...f,
        amount_fcy: "",
        bank_name: "",
        quoted_rate: "",
        status: "NEGOTIATING",
      }));

      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setPosting(false);
    }
  }

  function openConfirmModal(item) {
    setSelectedItem(item);
    setConfirmBankName(item.bank_name || "");
    setConfirmQuotedRate(item.quoted_rate != null ? String(item.quoted_rate) : "");
    setConfirmModalOpen(true);
  }

  function closeConfirmModal() {
    if (confirming) return;
    setConfirmModalOpen(false);
    setSelectedItem(null);
    setConfirmBankName("");
    setConfirmQuotedRate("");
  }

  async function handleConfirmNegotiation() {
    if (!selectedItem) return;
    if (!confirmBankName.trim() || !(Number(confirmQuotedRate) > 0)) return;

    setConfirming(true);
    setError("");

    try {
      await confirmNegotiationFeedEntry(selectedItem.negotiation_id, {
        bank_name: confirmBankName.trim(),
        quoted_rate: Number(confirmQuotedRate),
        status: "CONFIRMED",
      });

      closeConfirmModal();
      await refresh();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...cardStyle, flex: "1 1 360px", minWidth: 360 }}>
          <div style={{ fontWeight: 900, color: "#e5e7eb", marginBottom: 10 }}>
            Add to Desk Feed
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
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
                <div style={labelStyle}>Side</div>
                <select
                  style={selectStyle}
                  value={form.side}
                  onChange={(e) => setForm({ ...form, side: e.target.value })}
                >
                  <option value="SELL" style={optionStyle}>
                    SELL
                  </option>
                  <option value="BUY" style={optionStyle}>
                    BUY
                  </option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
              <div>
                <div style={labelStyle}>Amount (FCY)</div>
                <input
                  style={{ ...inputStyle, ...monoStyle }}
                  placeholder="e.g. 250000"
                  value={form.amount_fcy}
                  onChange={(e) => setForm({ ...form, amount_fcy: e.target.value })}
                  inputMode="decimal"
                />
              </div>

              <div>
                <div style={labelStyle}>
                  Quoted Rate {isNegotiating ? "(optional)" : "(required)"}
                </div>
                <input
                  style={{ ...inputStyle, ...monoStyle }}
                  placeholder={isNegotiating ? "optional while negotiating" : "e.g. 3.4230"}
                  value={form.quoted_rate}
                  onChange={(e) => setForm({ ...form, quoted_rate: e.target.value })}
                  inputMode="decimal"
                />
              </div>
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
              <div style={labelStyle}>Status</div>
              <select
                style={selectStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} style={optionStyle}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit" style={btnStyle(true)} disabled={!canSubmit || posting}>
                {posting ? "Saving..." : "Save Ticket"}
              </button>

              <button type="button" style={btnStyle(false)} onClick={refresh} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(229,231,235,0.65)" }}>
                {loading ? "Syncing..." : "Live"}
              </div>
            </div>

            {error && <div style={{ color: "#f97373", fontSize: 13 }}>{error}</div>}

            {!error && !canSubmit && (
              <div style={{ color: "rgba(229,231,235,0.55)", fontSize: 12 }}>
                {isConfirmed
                  ? "Quoted rate is required for confirmed deals."
                  : "Quoted rate can stay empty for negotiating deals."}
              </div>
            )}
          </form>
        </div>

        <div style={{ ...tableWrapStyle, flex: "2 1 780px", minWidth: 780 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 900, color: "#e5e7eb" }}>Central Desk View</div>
            <div style={{ color: "rgba(229,231,235,0.7)", fontSize: 12 }}>
              Auto-refresh: 10s • Rows: {filteredItems.length}
            </div>
          </div>

          <div style={filterBarStyle}>
            <input
              style={inputStyle}
              placeholder="Search side / pair / bank / analyst / status..."
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
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="ALL" style={optionStyle}>
                All statuses
              </option>
              {STATUSES.map((s) => (
                <option key={s} value={s} style={optionStyle}>
                  {s}
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
                  status: "ALL",
                  bank_name: "ALL",
                })
              }
            >
              Reset
            </button>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {[
                  "timestamp_utc",
                  "currency_pair",
                  "side",
                  "amount_fcy",
                  "bank_name",
                  "quoted_rate",
                  "analyst_name",
                  "status",
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
                const rowStatus = String(r.status || "").toUpperCase();
                const canConfirmRow = rowStatus === "NEGOTIATING";

                return (
                  <tr
                    key={r.negotiation_id || `${r.timestamp_utc}-${idx}`}
                    style={{ background: zebra, transition: "background 120ms ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = zebra)}
                  >
                    <td style={{ ...tdStyle, color: "rgba(229,231,235,0.80)" }}>{r.timestamp_utc}</td>

                    <td style={{ ...tdStyle, fontWeight: 900 }}>{r.currency_pair}</td>

                    <td style={{ ...tdStyle, fontWeight: 900 }}>{String(r.side || "").toUpperCase()}</td>

                    <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                      {Number(r.amount_fcy || 0).toLocaleString()}
                    </td>

                    <td style={tdStyle}>{r.bank_name || "—"}</td>

                    <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                      {r.quoted_rate == null || r.quoted_rate === ""
                        ? "—"
                        : Number(r.quoted_rate).toFixed(4)}
                    </td>

                    <td style={tdStyle}>{r.analyst_name}</td>

                    <td style={tdStyle}>{statusPill(r.status)}</td>

                    <td style={tdStyle}>
                      {canConfirmRow ? (
                        <button
                          type="button"
                          style={btnSmallStyle(true)}
                          onClick={() => openConfirmModal(r)}
                        >
                          Confirm
                        </button>
                      ) : (
                        <span style={{ color: "rgba(229,231,235,0.45)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!filteredItems.length && !loading && (
                <tr>
                  <td colSpan={9} style={{ padding: 12, color: "rgba(229,231,235,0.7)" }}>
                    No feed entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmNegotiationModal
        open={confirmModalOpen}
        item={selectedItem}
        busy={confirming}
        bankName={confirmBankName}
        setBankName={setConfirmBankName}
        quotedRate={confirmQuotedRate}
        setQuotedRate={setConfirmQuotedRate}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmNegotiation}
      />
    </>
  );
}