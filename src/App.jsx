// src/App.jsx
import { useEffect, useState } from "react";
import {
  processLatestEmailFromGmail,
  getPendingOperations,
  confirmOperation,
  cancelOperation,
  processImages,
} from "./api";

function App() {
  const [result, setResult] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [lastCheck, setLastCheck] = useState(null);
  const [justUpdated, setJustUpdated] = useState(false);

  // Manual upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [manualHistory, setManualHistory] = useState([]);

  // Poll backend every 15 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const data = await processLatestEmailFromGmail();
        setLastCheck(new Date());

        const newId = data.meta?.message_id || null;
        if (!lastMessageId || (newId && newId !== lastMessageId)) {
          setResult(data);
          setLastMessageId(newId);
          setJustUpdated(true);
          setTimeout(() => setJustUpdated(false), 4000);
        }

        const pendingResp = await getPendingOperations();
        setPending(pendingResp.pending || []);
      } catch (e) {
        console.error(e);
        setError("Error fetching latest Gmail alert / pending operations");
      }
    };

    setLoading(true);
    fetchData().finally(() => setLoading(false));

    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [lastMessageId]);

  const totalAmount =
    result?.operations?.reduce((sum, op) => sum + op.amount_tnd, 0) ?? 0;

  const nextPending = pending.length > 0 ? pending[0] : null;

  const statusText = (() => {
    if (error) return "Error while listening";
    if (!result) return "Waiting for first alert...";
    if (justUpdated) return "New alert received!";
    return "Listening for new alerts...";
  })();

  const statusColor = (() => {
    if (error) return "#f97373";
    if (justUpdated) return "#4ade80";
    return "#38bdf8";
  })();

  const refreshPending = async () => {
    const pendingResp = await getPendingOperations();
    setPending(pendingResp.pending || []);
  };

  const handleConfirm = async (id) => {
    try {
      setConfirmingId(id);
      await confirmOperation(id);
      await refreshPending();
    } catch (e) {
      console.error(e);
      setError("Error confirming operation");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (id) => {
    try {
      setCancellingId(id);
      await cancelOperation(id);
      await refreshPending();
    } catch (e) {
      console.error(e);
      setError("Error cancelling operation");
    } finally {
      setCancellingId(null);
    }
  };

  // ========= Manual image upload handlers =========

  const handleFilesSelected = async (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError("");
    try {
      const data = await processImages(files);

      setResult(data);
      const msgId = data.meta?.message_id || null;
      if (msgId) setLastMessageId(msgId);

      const total = data.operations?.reduce(
        (sum, op) => sum + op.amount_tnd,
        0
      );

      setManualHistory((prev) => [
        {
          id: msgId || `manual-${Date.now()}`,
          ts: new Date(),
          imagesCount: files.length,
          opsCount: data.operations?.length || 0,
          totalAmount: total || 0,
        },
        ...prev,
      ]);

      await refreshPending();
    } catch (e) {
      console.error(e);
      setUploadError("Error processing images (OCR / matching).");
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e) => {
    handleFilesSelected(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // =======================================

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        padding: "24px 16px",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* make content full width */}
      <div style={{ width: "100%", margin: "0 auto" }}>
        {/* Header with logo spot */}
        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <div
  style={{
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: "hidden",
    background: "#020617",
    boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
              <img
    src="https://colombus-capital.com/assets/white-U3yFFFky.png"
    alt="Colombus Capital"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
    }}
  />
            </div>

            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>
                Colombus Operations Platform System{" "}
                <span style={{ opacity: 0.7 }}>(COL-OPS)</span>
              </h1>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                AI engine ready for integration with Colombus systems:  
                payment alerts via email and manual uploads, routed to mentors
                for validation.
              </p>
            </div>
          </div>

          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 4 }}>
            <strong>Payment Detection &amp; Matching Module</strong>
          </p>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>
            Live monitoring of bank alert emails. New payments are added to a{" "}
            <b>Pending queue</b>. The mentor validates or cancels each match
            within 24 hours.
          </p>
        </header>

        {/* ====== ROW: Monitor (left) + Manual upload (right) ====== */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "stretch",
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          {/* LEFT: monitoring card */}
          <div
            style={{
              flex: 2,
              minWidth: 420,
              padding: 18,
              borderRadius: 16,
              background: "#020617",
              border: "1px solid #1f2937",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "stretch",
                flexWrap: "wrap",
              }}
            >
              {/* Status block */}
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: 14,
                  borderRadius: 12,
                  background: "#0f172a",
                }}
              >
                <div style={{ fontSize: 14, color: "#9ca3af" }}>Status</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 18,
                    fontWeight: 700,
                    color: statusColor,
                  }}
                >
                  {statusText}
                </div>
                {lastCheck && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Last check: {lastCheck.toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Latest email/meta */}
              <div
                style={{
                  flex: 2,
                  minWidth: 260,
                  padding: 14,
                  borderRadius: 12,
                  background: "#020617",
                  border: "1px dashed #1f2937",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 3 }}>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      Latest subject
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontWeight: 600,
                        color: "#e5e7eb",
                        fontSize: 14,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "1.3",
                        maxHeight: "2.6em",
                      }}
                      title={result?.meta?.subject || ""}
                    >
                      {result?.meta?.subject || "—"}
                    </div>
                  </div>
                  <div style={{ flex: 2, textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      Total amount in latest alert
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontWeight: 700,
                        fontSize: 16,
                        color: totalAmount ? "#22c55e" : "#6b7280",
                      }}
                    >
                      {totalAmount
                        ? totalAmount.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                          }) + " TND"
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Queue info */}
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: 14,
                  borderRadius: 12,
                  background: "#0f172a",
                }}
              >
                <div style={{ fontSize: 14, color: "#9ca3af" }}>Queue</div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 18,
                    fontWeight: 700,
                    color: pending.length > 0 ? "#facc15" : "#4ade80",
                  }}
                >
                  {pending.length} pending
                </div>
                {nextPending && (
                  <div
                    style={{ marginTop: 6, fontSize: 12, color: "#9ca3af" }}
                  >
                    Next:{" "}
                    {nextPending.amount_tnd.toLocaleString("fr-FR", {
                      minimumFractionDigits: 3,
                    })}{" "}
                    TND – {nextPending.date}
                    <br />
                    Time left: {nextPending.hours_left.toFixed(1)} h
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Manual upload section (OCR) */}
          <div
            style={{
              flex: 1,
              minWidth: 300,
              padding: 16,
              borderRadius: 16,
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
              Manual upload (screenshots)
            </h2>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
              Drag &amp; drop bank screenshots here, or click to select files.
              The engine will run OCR, extract amounts, match clients, and push
              results into the Pending queue.
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                borderRadius: 12,
                border: dragActive
                  ? "2px dashed #38bdf8"
                  : "2px dashed #1f2937",
                background: "#020617",
                padding: "24px 16px",
                textAlign: "center",
                cursor: uploading ? "default" : "pointer",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              onClick={() => {
                if (!uploading) {
                  document.getElementById("file-input-hidden")?.click();
                }
              }}
            >
              <input
                id="file-input-hidden"
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />
              <div style={{ fontSize: 14, marginBottom: 4 }}>
                {uploading
                  ? "Processing images..."
                  : "Drop files here or click to browse"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                JPG, PNG, etc. You can upload several images at once.
              </div>
            </div>

            {uploadError && (
              <p style={{ color: "#f97373", marginTop: 8, fontSize: 13 }}>
                {uploadError}
              </p>
            )}

            {manualHistory.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    marginBottom: 4,
                  }}
                >
                  Recent manual uploads
                </div>
                <div
                  style={{
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    overflow: "hidden",
                    fontSize: 12,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "6px 8px",
                            borderBottom: "1px solid #1f2937",
                          }}
                        >
                          Time
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "6px 8px",
                            borderBottom: "1px solid #1f2937",
                          }}
                        >
                          Images
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "6px 8px",
                            borderBottom: "1px solid #1f2937",
                          }}
                        >
                          Ops
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "6px 8px",
                            borderBottom: "1px solid #1f2937",
                          }}
                        >
                          Total (TND)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualHistory.map((h) => (
                        <tr key={h.id}>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                            }}
                          >
                            {h.ts.toLocaleTimeString()}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                              textAlign: "right",
                            }}
                          >
                            {h.imagesCount}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                              textAlign: "right",
                            }}
                          >
                            {h.opsCount}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              borderBottom: "1px solid #020617",
                              textAlign: "right",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {h.totalAmount.toLocaleString("fr-FR", {
                              minimumFractionDigits: 3,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p style={{ color: "#f97373", marginTop: 10, fontSize: 14 }}>
            {error}
          </p>
        )}

        {/* Next pending card */}
        {nextPending && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 16,
              background: "#0f172a",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Next pending matching
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 8 }}>
              Review this payment and confirm that the matched client is
              correct, or cancel if the match is not valid.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>Date</div>
                <div style={{ fontWeight: 600 }}>{nextPending.date}</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                  Amount
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#22c55e",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {nextPending.amount_tnd.toLocaleString("fr-FR", {
                    minimumFractionDigits: 3,
                  })}{" "}
                  TND
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  Matched client
                </div>
                <div style={{ fontWeight: 600 }}>
                  {nextPending.matched_client || "—"}
                </div>

                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                  Confidence
                </div>
                <div style={{ fontWeight: 600 }}>
                  {(((nextPending.confidence ?? 0) * 100).toFixed(0))}%
                </div>

                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                  Diff to nearest
                </div>
                <div style={{ fontWeight: 600 }}>
                  {(nextPending.nearest_diff ?? 0).toFixed(3)} TND
                </div>

                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                  Time left before expiry
                </div>
                <div style={{ fontWeight: 600 }}>
                  {nextPending.hours_left.toFixed(1)} hours
                </div>
              </div>

              <div
                style={{
                  alignSelf: "center",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => handleConfirm(nextPending.id)}
                  disabled={confirmingId === nextPending.id}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "none",
                    background:
                      confirmingId === nextPending.id ? "#6b7280" : "#22c55e",
                    color: "#020617",
                    fontWeight: 700,
                    cursor:
                      confirmingId === nextPending.id ? "default" : "pointer",
                  }}
                >
                  {confirmingId === nextPending.id
                    ? "Confirming..."
                    : "Confirm match"}
                </button>

                <button
                  onClick={() => handleCancel(nextPending.id)}
                  disabled={cancellingId === nextPending.id}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    border: "1px solid #f97373",
                    background:
                      cancellingId === nextPending.id ? "#111827" : "#0f172a",
                    color: "#f97373",
                    fontWeight: 700,
                    cursor:
                      cancellingId === nextPending.id ? "default" : "pointer",
                  }}
                >
                  {cancellingId === nextPending.id ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending list */}
        {pending.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              All pending operations
            </h2>
            <div
              style={{
                overflowX: "auto",
                borderRadius: 12,
                border: "1px solid #1f2937",
                background: "#020617",
              }}
            >
              <table
                cellPadding="8"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  color: "#e5e7eb",
                }}
              >
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    <th
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Amount (TND)
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Matched client
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Diff
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Conf.
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Hours left
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        borderBottom: "1px solid #1f2937",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pending.map((op) => (
                    <tr key={op.id}>
                      <td style={{ borderBottom: "1px solid #0f172a" }}>
                        {op.id}
                      </td>
                      <td style={{ borderBottom: "1px solid #0f172a" }}>
                        {op.date}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #0f172a",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {op.amount_tnd.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                        })}
                      </td>
                      <td style={{ borderBottom: "1px solid #0f172a" }}>
                        {op.matched_client || "—"}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #0f172a",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {(op.nearest_diff ?? 0).toFixed(3)}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #0f172a",
                          textAlign: "right",
                        }}
                      >
                        {(((op.confidence ?? 0) * 100).toFixed(0))}%
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #0f172a",
                          textAlign: "right",
                        }}
                      >
                        {op.hours_left.toFixed(1)}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #0f172a",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            onClick={() => handleConfirm(op.id)}
                            disabled={confirmingId === op.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 999,
                              border: "none",
                              background:
                                confirmingId === op.id ? "#6b7280" : "#22c55e",
                              color: "#020617",
                              fontWeight: 600,
                              cursor:
                                confirmingId === op.id ? "default" : "pointer",
                              fontSize: 12,
                            }}
                          >
                            {confirmingId === op.id ? "..." : "Confirm"}
                          </button>

                          <button
                            onClick={() => handleCancel(op.id)}
                            disabled={cancellingId === op.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 999,
                              border: "1px solid #f97373",
                              background:
                                cancellingId === op.id ? "#111827" : "#0f172a",
                              color: "#f97373",
                              fontWeight: 600,
                              cursor:
                                cancellingId === op.id ? "default" : "pointer",
                              fontSize: 12,
                            }}
                          >
                            {cancellingId === op.id ? "..." : "Cancel"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pending.length === 0 && !error && (
          <p style={{ marginTop: 24, color: "#9ca3af", fontSize: 14 }}>
            No pending operations. Waiting for next bank alert.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
