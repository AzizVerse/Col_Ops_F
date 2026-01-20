// src/hooks/useColOpsEngine.js
import { useEffect, useMemo, useState } from "react";
import {
  fetchOutlookAuto,
  fetchOutlookPreview,
  getPendingOperations,
  confirmOperation,
  cancelOperation,
  processImages,
  fetchPaymentsLog,
} from "../api";

const MATCHES_STORAGE_KEY = "colops_latest_matches";
const AUTO_MODE_STORAGE_KEY = "colops_auto_mode";

export function useColOpsEngine({ enabled = true } = {}) {
  const [result, setResult] = useState(null);

  // track latest Outlook email (or signature if id missing)
  const [lastEmailId, setLastEmailId] = useState(null);

  // ✅ single source of truth for the UI queue: backend queue
  const [backendPending, setBackendPending] = useState([]);

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

  // Load last matches from localStorage once
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

  // --- backend pending queue ---
  const refreshBackendQueue = async () => {
    if (!enabled) {
      setBackendPending([]);
      return;
    }
    try {
      const pendingResp = await getPendingOperations();
      setBackendPending(pendingResp.pending || []);
    } catch (e) {
      console.error("Error fetching pending operations", e);
      setBackendPending([]);
    }
  };

  // Poll Outlook + backend pending queue
  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setError("");
        setLastCheck(new Date());

        if (autoMode) {
          // AUTO: backend updates invoices directly
          const data = await fetchOutlookAuto();

          const subject = data.email_subject || "";
          const amounts = data.amounts || [];
          const fallbackSig = subject + "|" + amounts.join(",");
          const emailId = data.email_id || fallbackSig;

          if (!lastEmailId || (emailId && emailId !== lastEmailId)) {
            setResult(data);
            setLastEmailId(emailId);

            const newMatches = Array.isArray(data.matches) ? data.matches : [];

            // only overwrite matches if we actually got some
            if (newMatches.length > 0) {
              setMatches(newMatches);

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
          // MANUAL: preview only, nothing is applied until confirm
          // IMPORTANT: backend preview endpoint should populate backend queue
          const data = await fetchOutlookPreview();

          const subject = data.email_subject || "";
          const amounts = data.amounts || [];
          const fallbackSig = subject + "|" + amounts.join(",");
          const emailId = data.email_id || fallbackSig;

          if (!lastEmailId || (emailId && emailId !== lastEmailId)) {
            setResult(data);
            setLastEmailId(emailId);

            const newMatches = Array.isArray(data.matches) ? data.matches : [];
            setMatches(newMatches);

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

        // always keep backend queue in sync
        await refreshBackendQueue();
      } catch (e) {
        console.error(e);
        setError("Error fetching latest bank alert / pending operations");
      }
    };

    setLoading(true);
    fetchData().finally(() => setLoading(false));

    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [autoMode, lastEmailId, enabled]); // keep as you had it

  // ✅ ONE UI queue: backend only (Outlook preview items must be inserted in backend queue by the API)
  const pending = useMemo(() => {
    if (!enabled) return [];
    return (backendPending || []).map((p) => ({ ...p, kind: "backend" }));
  }, [enabled, backendPending]);

  const nextPending = pending.length > 0 ? pending[0] : null;

  // ---- confirm / cancel handlers ----
  const handleConfirm = async (id) => {
    if (!enabled) return;

    try {
      setConfirmingId(id);
      await confirmOperation(id); // /api/operations/{id}/confirm
      await refreshBackendQueue();
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
      await cancelOperation(id); // /api/operations/{id}/cancel
      await refreshBackendQueue();
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
        (data.operations || []).reduce((sum, op) => sum + (op.amount_tnd || 0), 0);

      setManualHistory((prev) => [
        {
          id: data.meta?.message_id || `manual-${Date.now()}`,
          ts: new Date(),
          imagesCount: files.length,
          opsCount: (data.operations || []).filter((op) => op.row_index != null).length,
          totalAmount: total,
          unmatched: data.unmatched || [],
        },
        ...prev,
      ]);

      await refreshBackendQueue();
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

    const typeOk =
      historyMatchType === "all" ? true : (row.match_type || "") === historyMatchType;

    const sourceOk =
      historySource === "all" ? true : (row.source || "") === historySource;

    return clientOk && typeOk && sourceOk;
  });

  // ---- totals ----
  let totalAmount = 0;

  if (autoMode) {
    if (matches && matches.length > 0) {
      totalAmount = matches.reduce(
        (sum, m) => sum + Number(m.amount_detected ?? m.amount ?? 0),
        0
      );
    } else {
      totalAmount = 0;
    }
  } else {
    // manual mode: total is pending queue total
    if (pending && pending.length > 0) {
      totalAmount = pending.reduce((s, op) => s + Number(op.amount_tnd || 0), 0);
    } else {
      totalAmount = 0;
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
        window.localStorage.setItem(AUTO_MODE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      setLastEmailId(null);
      return next;
    });
  };

  return {
    result,

    // ✅ ONE unified queue for the UI
    pending,
    nextPending,

    // debug
    backendPending,

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
