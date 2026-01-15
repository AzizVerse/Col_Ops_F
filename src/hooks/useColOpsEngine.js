// src/hooks/useColOpsEngine.js
import { useEffect, useState } from "react";
import {
  fetchOutlookAuto,
  fetchOutlookPreview,
  getPendingOperations,
  confirmOperation,
  cancelOperation,
  processImages,
  confirmPaymentMatch,
  fetchPaymentsLog,
} from "../api";

const MATCHES_STORAGE_KEY = "colops_latest_matches";
const AUTO_MODE_STORAGE_KEY = "colops_auto_mode";

export function useColOpsEngine({ enabled = true } = {}) {
  const [result, setResult] = useState(null);

  // track latest Outlook email (or signature if id missing)
  const [lastEmailId, setLastEmailId] = useState(null);

  // old ML/OCR queue (pending operations from /api/pending-operations)
  const [pending, setPending] = useState([]);

  // manual Excel matches (preview mode, waiting for admin confirm)
  const [paymentsPending, setPaymentsPending] = useState([]);

  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");
  const [lastCheck, setLastCheck] = useState(null);
  const [justUpdated, setJustUpdated] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [manualHistory, setManualHistory] = useState([]);

  const [autoMode, setAutoMode] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(AUTO_MODE_STORAGE_KEY);
    if (saved === "0") return false;
    return true;
  });

  const [matches, setMatches] = useState([]);

  const [historyRaw, setHistoryRaw] = useState([]);
  const [historyClientFilter, setHistoryClientFilter] = useState("");
  const [historyMatchType, setHistoryMatchType] = useState("all");
  const [historySource, setHistorySource] = useState("all");

  // Load last matches from localStorage once (for MatchesActivityCard)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MATCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMatches(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // History: only when enabled
  useEffect(() => {
    if (!enabled) {
      setHistoryRaw([]);
      return;
    }

    const loadHistory = async () => {
      try {
        const data = await fetchPaymentsLog(300);
        setHistoryRaw(data.entries || []);
      } catch (e) {
        console.error("Error loading payments log", e);
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  const refreshPendingQueue = async () => {
    if (!enabled) {
      setPending([]);
      return;
    }

    try {
      const pendingResp = await getPendingOperations();
      setPending(pendingResp.pending || []);
    } catch (e) {
      console.error("Error fetching pending operations", e);
      setPending([]);
    }
  };

  // Poll Outlook + pending queue
  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setError("");
        setLastCheck(new Date());

        if (autoMode) {
          // AUTO: backend updates Notion directly
          const data = await fetchOutlookAuto();

          const subject = data.email_subject || "";
          const amounts = data.amounts || [];
          const fallbackSig = subject + "|" + amounts.join(",");

          const emailId = data.email_id || fallbackSig;

          if (!lastEmailId || (emailId && emailId !== lastEmailId)) {
            setResult(data);
            setLastEmailId(emailId);

            const newMatches = Array.isArray(data.matches)
              ? data.matches
              : [];

            // only overwrite matches if we actually got some
            if (newMatches.length > 0) {
              setMatches(newMatches);
              setPaymentsPending([]); // nothing to validate in auto mode

              try {
                window.localStorage.setItem(
                  MATCHES_STORAGE_KEY,
                  JSON.stringify(newMatches)
                );
              } catch {
                // ignore
              }
            }

            setJustUpdated(true);
            setTimeout(() => setJustUpdated(false), 4000);
          }
        } else {
          // MANUAL: preview only, Notion untouched
          const data = await fetchOutlookPreview();

          const subject = data.email_subject || "";
          const amounts = data.amounts || [];
          const dates = Array.isArray(data.dates) ? data.dates : [];
          const fallbackSig = subject + "|" + amounts.join(",");

          const emailId = data.email_id || fallbackSig;

          if (!lastEmailId || (emailId && emailId !== lastEmailId)) {
            setResult(data);
            setLastEmailId(emailId);

            const newMatches = Array.isArray(data.matches)
              ? data.matches
              : [];
            setMatches(newMatches);

            // build local "pending payments" list for admin validation
            const localPending = newMatches.map((m, idx) => {
              const amt = Number(m.amount_detected ?? m.amount ?? 0) || 0;
              const diff = Number(m.diff ?? 0) || 0;
              const conf = m.match_type === "exact" ? 1.0 : 0.9;
              const txDate = dates[idx] || "-";

              return {
                id: idx + 1,
                date: txDate, // no invoice date in preview
                amount_tnd: amt,
                matched_client: m.client || "",
                nearest_diff: diff,
                confidence: conf,
                hours_left: 24.0,
                row_index: m.row_index,
                status: "pending",
              };
            });

            setPaymentsPending(localPending);

            try {
              window.localStorage.setItem(
                MATCHES_STORAGE_KEY,
                JSON.stringify(newMatches)
              );
            } catch {
              // ignore
            }

            setJustUpdated(true);
            setTimeout(() => setJustUpdated(false), 4000);
          }
        }

        // keep ML/OCR queue in sync in both modes
        await refreshPendingQueue();
      } catch (e) {
        console.error(e);
        setError("Error fetching latest bank alert / pending operations");
      }
    };

    setLoading(true);
    fetchData().finally(() => setLoading(false));

    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
    // depend on email id, not on signature
  }, [autoMode, lastEmailId, enabled]);

  // ---- confirm / cancel handlers ----

  const handleConfirm = async (id) => {
    if (!enabled) return;

    try {
      setConfirmingId(id);

      // 1) If this id exists in the OCR/ML queue -> use queue API
      const queueItem = pending.find((p) => p.id === id);
      if (queueItem) {
        await confirmOperation(id);
        await refreshPendingQueue();
        return;
      }

      // 2) Otherwise, treat it as an Outlook manual-preview payment
      const item = paymentsPending.find((p) => p.id === id);
      if (!item) return;

      await confirmPaymentMatch({
        amount_detected: item.amount_tnd,
        row_index: item.row_index,
      });

      setPaymentsPending((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "confirmed" } : p
        )
      );
    } catch (e) {
      console.error(e);
      setError("Error confirming operation");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!enabled) return;

    try {
      setCancellingId(id);

      // 1) If this id exists in the OCR/ML queue -> cancel via backend
      const queueItem = pending.find((p) => p.id === id);
      if (queueItem) {
        await cancelOperation(id);
        await refreshPendingQueue();
        return;
      }

      // 2) Otherwise, it’s an Outlook manual-preview item -> mark cancelled locally
      setPaymentsPending((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "cancelled" } : p
        )
      );
    } catch (e) {
      console.error(e);
      setError("Error cancelling operation");
    } finally {
      setCancellingId(null);
    }
  };

  // ---- OCR upload flow ----

  const handleFilesSelected = async (filesList) => {
    if (!enabled) return;

    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError("");
    try {
      const data = await processImages(files);

      setResult(data);

      const total =
  data?.meta?.ocr_total ??
  (data.operations || []).reduce(
    (sum, op) => sum + (op.amount_tnd || 0),
    0
  );

setManualHistory((prev) => [
  {
    id: data.meta?.message_id || `manual-${Date.now()}`,
    ts: new Date(),
    imagesCount: files.length,
    opsCount: (data.operations || []).filter(
      (op) => op.row_index != null
    ).length,
    totalAmount: total,
    unmatched: data.unmatched || [],   // 👈 store suggestions
  },
  ...prev,
]);


      await refreshPendingQueue();
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

  const history = historyRaw.filter((row) => {
    const clientOk = historyClientFilter
      ? (row.client || "").toLowerCase().includes(historyClientFilter.toLowerCase())
      : true;
    const typeOk = historyMatchType === "all"
      ? true
      : (row.match_type || "") === historyMatchType;
    const sourceOk = historySource === "all"
      ? true
      : (row.source || "") === historySource;
    return clientOk && typeOk && sourceOk;
  });

  // ---- totals & derived data ----

  // UI pending list depends on mode
  const uiPending = pending;
  const nextPending = uiPending.length > 0 ? uiPending[0] : null;

  let totalAmount = 0;

  if (autoMode) {
    // AUTO MODE: sum of matched amounts (what actually went to Notion)
    if (matches && matches.length > 0) {
      totalAmount = matches.reduce(
        (sum, m) =>
          sum +
          Number(
            m.amount_detected ??
            m.amount ??
            0
          ),
        0
      );
    } else {
      totalAmount = 0; // no fallback to result.amounts to avoid 66M bug
    }
  } else {
    // MANUAL MODE: sum of items waiting in UI pending list
    if (uiPending && uiPending.length > 0) {
      totalAmount = uiPending.reduce(
        (s, op) => s + Number(op.amount_tnd || 0),
        0
      );
    } else if (result?.operations && Array.isArray(result.operations)) {
      // fallback for pure OCR uploads
      totalAmount = result.operations.reduce(
        (s, op) => s + Number(op.amount_tnd || 0),
        0
      );
    }
  }

  const statusText = (() => {
    if (!enabled) return "Please login to start the listener.";
    if (error) return "Error while listening";
    if (loading && !result) return "Starting listener…";
    if (autoMode && justUpdated) return "New bank alert processed!";
    if (autoMode) return "Auto mode: listening for bank alerts…";
    if (justUpdated) return "Manual mode: new preview loaded.";
    return "Manual mode: awaiting actions.";
  })();

  const statusColor = (() => {
    if (!enabled) return "#6b7280";
    if (error) return "#f97373";
    if (autoMode && justUpdated) return "#4ade80";
    if (autoMode) return "#38bdf8";
    return "#facc15";
  })();

  const latestSubject =
    result && "email_subject" in result
      ? result.email_subject || "—"
      : result?.meta?.subject || "—";

  const toggleAutoMode = () => {
    setAutoMode((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(
          AUTO_MODE_STORAGE_KEY,
          next ? "1" : "0"
        );
      } catch {
        // ignore
      }
      // reset email id so first poll after switch is treated as "new"
      setLastEmailId(null);
      return next;
    });
  };

  return {
    result,
    pending: uiPending,
    nextPending,
    // Raw OCR queue from /api/pending-operations (always)
    ocrPending: pending,
    loading,
    error,
    lastCheck,
    justUpdated,
    totalAmount,
    statusText,
    statusColor,
    latestSubject,
    uploading,
    uploadError,
    dragActive,
    manualHistory,
    confirmingId,
    cancellingId,
    autoMode,
    matches,

    history,
    historyClientFilter,
    historyMatchType,
    historySource,
    setHistoryClientFilter,
    setHistoryMatchType,
    setHistorySource,

    handleConfirm,
    handleCancel,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    toggleAutoMode,
  };
}
