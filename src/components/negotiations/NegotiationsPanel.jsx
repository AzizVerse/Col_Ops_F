// src/components/negotiations/NegotiationsPanel.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import { useNegotiations } from "../../hooks/useNegotiations";

/* =========================
   Small safe helpers (MUST be above usage)
   ========================= */

function safeInnerHtml(html) {
  return { __html: String(html || "") };
}

function toTime(lastRefresh) {
  try {
    return lastRefresh ? lastRefresh.toLocaleTimeString() : "—";
  } catch {
    return "—";
  }
}
function formatIso(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso); // fallback
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}


export default function NegotiationsPanel() {
  const {
    pending,
    pendingCount,
    selectedId,
    setSelectedId,
    item,
    loading,
    loadingItem,
    sending,
    error,
    lastRefresh,
    refresh,
    pollNow, // ✅ must exist in your hook
    editor,
    updateDraftFields,
    sendCurrent,
  } = useNegotiations({ enabled: true, refreshIntervalMs: 20000 });

  const [draftPreview, setDraftPreview] = useState(true);
  const [showHtmlSource, setShowHtmlSource] = useState(false);

  const selectedMeta = useMemo(() => {
    if (!item?.email) return null;
    return item.email;
  }, [item]);

  async function onPollNow() {
    // If pollNow isn't provided, fail gracefully instead of white screen
    if (typeof pollNow !== "function") {
      alert("pollNow() is missing. Add it to useNegotiations hook return.");
      return;
    }
    await pollNow();
    await refresh();
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ color: "#e5e7eb", fontWeight: 800, fontSize: 16 }}>
            Negotiations Inbox (RFQ) — Pending: {pendingCount}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 3 }}>
            Auto refresh 20s • Last refresh: {toTime(lastRefresh)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onPollNow} style={btnStyle("ghost")}>
            Poll now
          </button>

          <button
            onClick={refresh}
            disabled={loading}
            style={btnStyle(loading ? "disabled" : "ghost")}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 10, color: "#fda4af", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Main layout */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 12,
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT: list */}
        <div style={{ ...cardStyle, width: 380, flex: "0 0 380px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ color: "#e5e7eb", fontWeight: 750, fontSize: 13 }}>
              Pending emails
            </div>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{pendingCount}</span>
          </div>

          {/* ✅ scrollable list */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: 6,
            }}
          >
            {pendingCount === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>
                No negotiation emails detected.
                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.45 }}>
                  Notes:
                  <ul style={{ marginTop: 6 }}>
                    <li>Click <b>Poll now</b> to fetch unread emails from Outlook.</li>
                    <li>Only <b>UNREAD</b> emails are queued (if you opened it, it won’t appear).</li>
                  </ul>
                </div>
              </div>
            ) : (
              pending.map((x) => {
                const isActive = Number(x.id) === Number(selectedId);
                const e = x.email || {};
                return (
                  <button
                    key={x.id}
                    onClick={() => setSelectedId(Number(x.id))}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: isActive
                        ? "rgba(37, 99, 235, 0.25)"
                        : "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      color: "#e5e7eb",
                    }}
                  >
                    {/* ✅ ellipsis for long subject */}
                    <div
                      style={{
                        fontWeight: 750,
                        fontSize: 13,
                        marginBottom: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={e.subject || ""}
                    >
                      #{x.id} — {e.subject || "(no subject)"}
                    </div>

                    {/* ✅ wrap long emails */}
                    <div
                      style={{
                        color: "#cbd5e1",
                        fontSize: 12,
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      {e.sender_name || "—"}{" "}
                      <span style={{ color: "#94a3b8" }}>
                        &lt;{e.sender_email || "—"}&gt;
                      </span>
                    </div>

                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                      {formatIso(e.received_at)}
                    </div>

                    {/* ✅ snippet clamp-ish */}
                    {e.snippet ? (
                      <div
                        style={{
                          color: "#94a3b8",
                          fontSize: 12,
                          marginTop: 6,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {e.snippet}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: details + editor */}
        <div style={{ ...cardStyle, flex: "1 1 700px", minWidth: 340 }}>
          {!selectedId ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Select an email on the left.
            </div>
          ) : loadingItem ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading email…</div>
          ) : !item ? (
            <div style={{ color: "#94a3b8", fontSize: 13 }}>No item loaded.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Original email */}
              <div style={{ ...subCardStyle }}>
                <div style={{ color: "#e5e7eb", fontWeight: 800, fontSize: 13 }}>
                  Original email
                </div>

                <div style={{ marginTop: 8, color: "#cbd5e1", fontSize: 13 }}>
                  <div style={{ overflowWrap: "anywhere" }}>
                    <span style={{ color: "#94a3b8" }}>From:</span>{" "}
                    {selectedMeta?.sender_name || "—"}{" "}
                    <span style={{ color: "#94a3b8" }}>
                      &lt;{selectedMeta?.sender_email || "—"}&gt;
                    </span>
                  </div>
                  <div style={{ marginTop: 4, overflowWrap: "anywhere" }}>
                    <span style={{ color: "#94a3b8" }}>Subject:</span>{" "}
                    {selectedMeta?.subject || "—"}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: "#94a3b8" }}>Received:</span>{" "}
                    {formatIso(selectedMeta?.received_at)}

                  </div>
                </div>

                {/* ✅ vertical + horizontal scrolling for long emails/tables */}
                <div
                  style={{
                    marginTop: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 12,
                    padding: 12,
                    maxHeight: 360,
                    overflowY: "auto",
                    overflowX: "auto",
                    color: "#e5e7eb",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  <div
                    style={{
                      minWidth: 600,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={safeInnerHtml(item.raw_body_html || "<em>(empty body)</em>")}
                  />
                </div>
              </div>

              {/* Reply editor */}
              <div style={{ ...subCardStyle }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ color: "#e5e7eb", fontWeight: 800, fontSize: 13 }}>
                    Reply draft (editable)
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => setShowHtmlSource((v) => !v)}
                      style={btnStyle("ghost")}
                      title="Toggle between rich text editing and HTML source"
                    >
                      {showHtmlSource ? "Rich text" : "HTML source"}
                    </button>

                    <button onClick={() => setDraftPreview((v) => !v)} style={btnStyle("ghost")}>
                      {draftPreview ? "Hide preview" : "Show preview"}
                    </button>

                    <button
                      onClick={sendCurrent}
                      disabled={sending}
                      style={btnStyle(sending ? "disabled" : "primary")}
                    >
                      {sending ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  <Field
                    label="To (comma-separated)"
                    value={editor.toText}
                    onChange={(v) => updateDraftFields({ toText: v })}
                    placeholder="client@example.com"
                  />
                  <Field
                    label="CC (comma-separated)"
                    value={editor.ccText}
                    onChange={(v) => updateDraftFields({ ccText: v })}
                    placeholder="mezri..., amine..., contact..., ..."
                  />
                  <Field
                    label="Subject"
                    value={editor.subject}
                    onChange={(v) => updateDraftFields({ subject: v })}
                    placeholder="Re: ..."
                  />

                  {/* Body editor */}
                  <div>
                    <div style={labelStyle}>Body ({showHtmlSource ? "HTML source" : "Rich text"})</div>

                    {!showHtmlSource ? (
                      <RichTextEditor
                        html={editor.bodyHtml || ""}
                        onChangeHtml={(html) => updateDraftFields({ bodyHtml: html })}
                      />
                    ) : (
                      <textarea
                        value={editor.bodyHtml}
                        onChange={(e) => updateDraftFields({ bodyHtml: e.target.value })}
                        rows={10}
                        style={textareaStyle}
                      />
                    )}
                  </div>

                  {draftPreview && (
                    <div>
                      <div style={labelStyle}>Preview</div>
                      <div
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          padding: 12,
                          color: "#e5e7eb",
                          fontSize: 13,
                          lineHeight: 1.45,
                          maxHeight: 240,
                          overflowY: "auto",
                          overflowX: "auto",
                        }}
                      >
                        <div dangerouslySetInnerHtml={undefined} />
                        <div dangerouslySetInnerHTML={safeInnerHtml(editor.bodyHtml || "")} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                Tip: use “Rich text” mode for normal writing. Use “HTML source” only if needed.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Rich text editor
   ========================= */

function RichTextEditor({ html, onChangeHtml }) {
  const ref = useRef(null);

  // Sync editor when selecting different email/draft (avoid cursor jumps)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if ((el.innerHTML || "") !== (html || "")) el.innerHTML = html || "";
  }, [html]);

  function emit() {
    const el = ref.current;
    if (!el) return;
    onChangeHtml(el.innerHTML);
  }

  function exec(cmd, value = null) {
    try {
      document.execCommand(cmd, false, value);
      emit();
    } catch {
      // ignore
    }
  }

  function addLink() {
    const url = window.prompt("Enter link URL (https://...)");
    if (!url) return;
    exec("createLink", url);
  }

  function insertBr() {
    // more reliable than insertLineBreak
    exec("insertHTML", "<br/>");
  }

  function clearFormatting() {
    exec("removeFormat");
    exec("unlink");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button type="button" style={miniBtnStyle} onClick={() => exec("bold")}>
          <b>B</b>
        </button>
        <button type="button" style={miniBtnStyle} onClick={() => exec("italic")}>
          <i>I</i>
        </button>
        <button type="button" style={miniBtnStyle} onClick={() => exec("underline")}>
          <u>U</u>
        </button>
        <button type="button" style={miniBtnStyle} onClick={() => exec("insertUnorderedList")}>
          • List
        </button>
        <button type="button" style={miniBtnStyle} onClick={() => exec("insertOrderedList")}>
          1. List
        </button>
        <button type="button" style={miniBtnStyle} onClick={addLink}>
          Link
        </button>
        <button type="button" style={miniBtnStyle} onClick={insertBr}>
          ↵
        </button>
        <button type="button" style={miniBtnStyle} onClick={clearFormatting}>
          Clear
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        style={{
          width: "100%",
          minHeight: 180,
          background: "rgba(255,255,255,0.04)",
          color: "#e5e7eb",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 12,
          padding: "10px 12px",
          fontSize: 13,
          outline: "none",
          lineHeight: 1.55,
          overflowY: "auto",
          overflowX: "auto",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      />
    </div>
  );
}

/* =========================
   Small UI helpers
   ========================= */

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function btnStyle(variant) {
  const base = {
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 750,
    border: "1px solid rgba(255,255,255,0.12)",
  };

  if (variant === "primary") return { ...base, background: "#2563eb", color: "#e5e7eb" };
  if (variant === "disabled")
    return {
      ...base,
      background: "rgba(255,255,255,0.06)",
      color: "#94a3b8",
      cursor: "not-allowed",
    };
  return { ...base, background: "rgba(255,255,255,0.06)", color: "#e5e7eb" };
}

const miniBtnStyle = {
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  fontWeight: 750,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#e5e7eb",
};

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 14,
};

const subCardStyle = {
  background: "rgba(0,0,0,0.10)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 12,
};

const labelStyle = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 750,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
};

const textareaStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  resize: "vertical",
};
