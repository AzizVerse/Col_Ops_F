import { useEffect, useMemo, useState } from "react";
import {
  fetchNegotiationFeed,
  createNegotiationFeedEntry,
  confirmNegotiationFeedEntry,
  deleteNegotiationFeedEntry,
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

function parseAmount(value) {
  if (value == null) return null;
  const s = String(value).trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getAmountCurrency(pair) {
  const p = String(pair || "").trim().toUpperCase();
  if (!p.includes("/")) return "FCY";
  return p.split("/")[0];
}

function sanitizeAmountInput(value) {
  if (value == null) return "";

  let s = String(value);

  // keep only digits, comma, dot
  s = s.replace(/[^\d.,]/g, "");

  // if both comma and dot exist, assume comma is thousands separator
  if (s.includes(".") && s.includes(",")) {
    s = s.replace(/,/g, "");
  } else {
    // otherwise convert comma to dot
    s = s.replace(/,/g, ".");
  }

  // keep only first decimal dot
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }

  return s;
}

function formatAmountDisplay(value) {
  const n = parseAmount(value);
  if (n == null) return "";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function sanitizeRateInput(value) {
  if (value == null) return "";

  let s = String(value);

  // keep only digits, comma, dot
  s = s.replace(/[^\d.,]/g, "");

  // convert comma to dot
  s = s.replace(/,/g, ".");

  // keep only first decimal dot
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }

  return s;
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

function statusAccent(status) {
  const s = String(status || "").toUpperCase();

  if (s === "CONFIRMED") {
    return {
      color: "#86efac",
      bg: "rgba(34,197,94,0.14)",
      border: "rgba(34,197,94,0.28)",
    };
  }

  return {
    color: "#fde68a",
    bg: "rgba(234,179,8,0.14)",
    border: "rgba(234,179,8,0.28)",
  };
}

function buildCreateValidationReason(form) {
  const amount = parseAmount(form.amount_fcy);
  const rate = parseDecimal(form.quoted_rate);
  const status = String(form.status || "").toUpperCase();

  if (!form.currency_pair.trim()) return "Select a currency pair.";
  if (!form.side.trim()) return "Select a side.";
  if (amount == null || amount <= 0) return "Amount is invalid.";
  if (!form.bank_name.trim()) return "Select a bank.";
  if (!form.analyst_name.trim()) return "Select an analyst.";
  if (!status) return "Select a status.";

  if (status === "CONFIRMED") {
    if (rate == null || rate <= 0) return "Quoted rate is required for confirmed.";
  }

  if (status === "NEGOTIATING") {
    if (String(form.quoted_rate).trim() !== "" && (rate == null || rate <= 0)) {
      return "Quoted rate is invalid.";
    }
  }

  return "";
}

function isCreateFormValid(form) {
  return buildCreateValidationReason(form) === "";
}

function buildConfirmValidationReason(form) {
  const rate = parseDecimal(form.quoted_rate);

  if (!form.bank_name.trim()) return "Select a bank.";
  if (rate == null || rate <= 0) return "Quoted rate is required.";
  return "";
}

function isConfirmFormValid(form) {
  return buildConfirmValidationReason(form) === "";
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

  if (kind === "confirm") {
    background = "rgba(34,197,94,0.14)";
    border = "1px solid rgba(34,197,94,0.28)";
    color = "#86efac";
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
  minWidth: 1260,
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
  gridTemplateColumns: "minmax(220px,1.4fr) minmax(140px,1fr) minmax(140px,1fr) minmax(140px,1fr) auto",
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

const statusPillStyle = (status) => {
  const accent = statusAccent(status);
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

const SIDES = ["BUY", "SELL"];
const STATUSES = ["NEGOTIATING", "CONFIRMED"];

/* ======================
 * Modals
 * ====================== */

function CreateDeskFeedModal({
  open,
  onClose,
  onSubmit,
  posting,
  error,
  form,
  setForm,
}) {
  const [amountFocused, setAmountFocused] = useState(false);

  if (!open) return null;

  const canSubmit = isCreateFormValid(form);
  const validationReason = buildCreateValidationReason(form);
  const amountCurrency = getAmountCurrency(form.currency_pair);

  const displayedAmount = amountFocused
    ? String(form.amount_fcy || "")
    : formatAmountDisplay(form.amount_fcy);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#e5e7eb" }}>
              Add Desk Feed Ticket
            </div>
            <div style={{ ...subtleTextStyle, marginTop: 4 }}>
              Negotiating can keep quoted rate empty. Confirmed requires quoted rate.
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
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
                {SIDES.map((s) => (
                  <option key={s} value={s} style={optionStyle}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Amount ({amountCurrency})</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder={`e.g. 250000 ${amountCurrency}`}
                value={displayedAmount}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount_fcy: sanitizeAmountInput(e.target.value),
                  })
                }
                inputMode="decimal"
              />
            </div>

            <div>
              <div style={labelStyle}>Quoted Rate</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                placeholder={form.status === "NEGOTIATING" ? "optional while negotiating" : "e.g. 3.4230"}
                value={form.quoted_rate}
                onChange={(e) => setForm({ ...form, quoted_rate: sanitizeRateInput(e.target.value) })}
                inputMode="decimal"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
              {posting ? "Saving..." : "Save Ticket"}
            </button>

            <div style={{ ...subtleTextStyle, marginLeft: "auto" }}>
              Smart numeric input enabled
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

function ConfirmNegotiationModal({
  open,
  item,
  posting,
  error,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !item) return null;

  const canSubmit = isConfirmFormValid(form);
  const validationReason = buildConfirmValidationReason(form);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#e5e7eb" }}>
              Confirm Ticket
            </div>
            <div style={{ ...subtleTextStyle, marginTop: 4 }}>
              Set bank and quoted rate, then confirm this negotiation.
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
            <div>
              <div style={labelStyle}>Currency Pair</div>
              <input style={inputStyle} value={item.currency_pair || ""} readOnly />
            </div>

            <div>
              <div style={labelStyle}>Side</div>
              <input style={inputStyle} value={item.side || ""} readOnly />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={labelStyle}>Amount ({getAmountCurrency(item.currency_pair)})</div>
              <input
                style={{ ...inputStyle, ...monoStyle }}
                value={item.amount_fcy == null ? "" : Number(item.amount_fcy).toLocaleString()}
                readOnly
              />
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

          <div>
            <div style={labelStyle}>Quoted Rate</div>
            <input
              style={{ ...inputStyle, ...monoStyle }}
              placeholder="e.g. 3.4230"
              value={form.quoted_rate}
              onChange={(e) => setForm({ ...form, quoted_rate: sanitizeRateInput(e.target.value) })}
              inputMode="decimal"
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
              {posting ? "Confirming..." : "Confirm"}
            </button>

            <div style={{ ...subtleTextStyle, marginLeft: "auto" }}>
              Quoted rate required
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
          Delete Desk Feed Ticket
        </div>

        <div style={{ color: "rgba(229,231,235,0.72)", fontSize: 13, lineHeight: 1.6 }}>
          Are you sure you want to delete this ticket?
          <br />
          <br />
          <strong>Pair:</strong> {item.currency_pair}
          <br />
          <strong>Bank:</strong> {item.bank_name || "—"}
          <br />
          <strong>Status:</strong> {item.status}
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

export default function NegotiationFeedPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [createPosting, setCreatePosting] = useState(false);
  const [confirmPosting, setConfirmPosting] = useState(false);
  const [deletePosting, setDeletePosting] = useState(false);

  const [error, setError] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const [createForm, setCreateForm] = useState({
    currency_pair: "EUR/TND",
    side: "SELL",
    amount_fcy: "",
    bank_name: "",
    quoted_rate: "",
    analyst_name: "",
    status: "NEGOTIATING",
  });

  const [confirmForm, setConfirmForm] = useState({
    bank_name: "",
    quoted_rate: "",
  });

  const [filters, setFilters] = useState({
    q: "",
    currency_pair: "ALL",
    status: "ALL",
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

  function resetCreateForm() {
    setCreateForm({
      currency_pair: "EUR/TND",
      side: "SELL",
      amount_fcy: "",
      bank_name: "",
      quoted_rate: "",
      analyst_name: "",
      status: "NEGOTIATING",
    });
  }

  function openCreateModal() {
    setError("");
    resetCreateForm();
    setIsAddModalOpen(true);
  }

  function openConfirmModal(item) {
    setError("");
    setSelectedItem(item);
    setConfirmForm({
      bank_name: String(item.bank_name || ""),
      quoted_rate: item.quoted_rate == null ? "" : String(item.quoted_rate),
    });
    setIsConfirmModalOpen(true);
  }

  function openDeleteModal(item) {
    setError("");
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!isCreateFormValid(createForm)) {
      setError(buildCreateValidationReason(createForm));
      return;
    }

    setCreatePosting(true);
    setError("");

    try {
      const hasRate = String(createForm.quoted_rate).trim() !== "";

      const payload = {
        currency_pair: createForm.currency_pair.trim(),
        side: createForm.side.trim().toUpperCase(),
        amount_fcy: parseAmount(createForm.amount_fcy),
        bank_name: createForm.bank_name.trim(),
        quoted_rate: hasRate ? parseDecimal(createForm.quoted_rate) : null,
        analyst_name: createForm.analyst_name.trim(),
        status: createForm.status.trim().toUpperCase(),
      };

      await createNegotiationFeedEntry(payload);
      setIsAddModalOpen(false);
      resetCreateForm();
      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setCreatePosting(false);
    }
  }

  async function handleConfirmSubmit(e) {
    e.preventDefault();
    if (!selectedItem?.negotiation_id) return;

    if (!isConfirmFormValid(confirmForm)) {
      setError(buildConfirmValidationReason(confirmForm));
      return;
    }

    setConfirmPosting(true);
    setError("");

    try {
      const payload = {
        bank_name: confirmForm.bank_name.trim(),
        quoted_rate: parseDecimal(confirmForm.quoted_rate),
        status: "CONFIRMED",
      };

      await confirmNegotiationFeedEntry(selectedItem.negotiation_id, payload);
      setIsConfirmModalOpen(false);
      setSelectedItem(null);
      setConfirmForm({ bank_name: "", quoted_rate: "" });
      await refresh();
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setConfirmPosting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!selectedItem?.negotiation_id) return;

    setDeletePosting(true);
    setError("");

    try {
      await deleteNegotiationFeedEntry(selectedItem.negotiation_id);
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
                Central Desk View
              </div>
              <div style={{ color: "rgba(229,231,235,0.7)", fontSize: 12, marginTop: 4 }}>
                Auto-refresh: 10s • Rows: {filteredItems.length}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" style={btnStyle(true)} onClick={openCreateModal}>
                + Add Desk Ticket
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
              placeholder="Search pair / bank / analyst / side / status..."
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
                    "side",
                    "amount_fcy",
                    "bank_name",
                    "quoted_rate",
                    "EUR_USD_bid",
                    "EUR_USD_ask",
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
                  const canConfirm = rowStatus === "NEGOTIATING";
                  const eurusdBid = parseDecimal(r.eurusd_bid);
                  const eurusdAsk = parseDecimal(r.eurusd_ask);

                  return (
                    <tr
                      key={r.negotiation_id || `${r.timestamp_utc}-${idx}`}
                      style={{ background: zebra, transition: "background 120ms ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = zebra)}
                    >
                      <td style={{ ...tdStyle, color: "rgba(229,231,235,0.80)" }}>
                        {r.timestamp_utc}
                      </td>

                      <td style={tdStyle}>
                        <span style={badgeStyle(r.currency_pair)}>{r.currency_pair}</span>
                      </td>

                      <td style={{ ...tdStyle, fontWeight: 900 }}>
                        {String(r.side || "").toUpperCase()}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {r.amount_fcy == null ? "—" : Number(r.amount_fcy).toLocaleString()}
                      </td>

                      <td style={tdStyle}>{r.bank_name || "—"}</td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {r.quoted_rate == null || r.quoted_rate === ""
                          ? "—"
                          : Number(r.quoted_rate).toFixed(4)}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {eurusdBid == null ? "—" : <span style={eurusdCellStyle}>{eurusdBid.toFixed(4)}</span>}
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right", ...monoStyle }}>
                        {eurusdAsk == null ? "—" : <span style={eurusdCellStyle}>{eurusdAsk.toFixed(4)}</span>}
                      </td>

                      <td style={tdStyle}>{r.analyst_name}</td>

                      <td style={tdStyle}>
                        <span style={statusPillStyle(r.status)}>
                          {String(r.status || "").toUpperCase()}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          {canConfirm ? (
                            <button
                              type="button"
                              style={smallBtnStyle("confirm")}
                              onClick={() => openConfirmModal(r)}
                            >
                              Confirm
                            </button>
                          ) : (
                            <span style={{ color: "rgba(229,231,235,0.35)", fontSize: 12, padding: "6px 4px" }}>
                              —
                            </span>
                          )}

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
                    <td colSpan={11} style={{ padding: 12, color: "rgba(229,231,235,0.7)" }}>
                      No desk feed entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateDeskFeedModal
        open={isAddModalOpen}
        onClose={() => {
          if (!createPosting) {
            setIsAddModalOpen(false);
          }
        }}
        onSubmit={handleCreateSubmit}
        posting={createPosting}
        error={error}
        form={createForm}
        setForm={setCreateForm}
      />

      <ConfirmNegotiationModal
        open={isConfirmModalOpen}
        item={selectedItem}
        posting={confirmPosting}
        error={error}
        form={confirmForm}
        setForm={setConfirmForm}
        onClose={() => {
          if (!confirmPosting) {
            setIsConfirmModalOpen(false);
          }
        }}
        onSubmit={handleConfirmSubmit}
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