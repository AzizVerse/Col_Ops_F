// src/hooks/useNegotiations.js
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchNegotiationPending,
  fetchNegotiationItem,
  sendNegotiationReply,
  pollNegotiationsNow, // ✅ add in api.js
} from "../api";

function parseEmailsInput(s) {
  if (!s) return [];
  return s
    .replace(/;/g, ",")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function useNegotiations({ enabled = true, refreshIntervalMs = 20000 } = {}) {
  const [pending, setPending] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const pendingCount = pending.length;

  // ✅ store selectedId in a ref to avoid “jump back to #1” on interval refresh
  const selectedIdRef = useRef(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  async function refresh() {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNegotiationPending();
      const list = data?.pending || [];

      setPending(list);
      setLastRefresh(new Date());

      // ✅ keep the current selection if it still exists
      const current = selectedIdRef.current;
      const exists =
        current !== null && list.some((x) => Number(x.id) === Number(current));

      if (!exists) {
        setSelectedId(list.length ? Number(list[0].id) : null);
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // ✅ Poll now (manual trigger)
  async function pollNow() {
    if (!enabled) return;
    setError(null);
    try {
      await pollNegotiationsNow();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  // initial + interval refresh
  useEffect(() => {
    if (!enabled) return;

    refresh();
    const t = setInterval(() => {
      refresh();
    }, refreshIntervalMs);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refreshIntervalMs]);

  // load selected item details
  useEffect(() => {
    if (!enabled) return;

    if (!selectedId) {
      setItem(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoadingItem(true);
      setError(null);
      try {
        const data = await fetchNegotiationItem(selectedId);
        if (cancelled) return;

        const draft = data?.draft || {};
        const to = Array.isArray(draft.to_emails) ? draft.to_emails : [];
        const cc = Array.isArray(draft.cc_emails) ? draft.cc_emails : [];

        setItem({
          ...data,
          draft: {
            ...draft,
            to_emails: to,
            cc_emails: cc,
            subject: draft.subject || "",
            body_html: draft.body_html || "",
          },
        });
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoadingItem(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, selectedId]);

  // editor-friendly fields
  const editor = useMemo(() => {
    if (!item?.draft) {
      return { toText: "", ccText: "", subject: "", bodyHtml: "" };
    }
    return {
      toText: (item.draft.to_emails || []).join(", "),
      ccText: (item.draft.cc_emails || []).join(", "),
      subject: item.draft.subject || "",
      bodyHtml: item.draft.body_html || "",
    };
  }, [item]);

  function updateDraftFields({ toText, ccText, subject, bodyHtml }) {
    setItem((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        draft: {
          ...prev.draft,
          to_emails: toText !== undefined ? parseEmailsInput(toText) : prev.draft.to_emails,
          cc_emails: ccText !== undefined ? parseEmailsInput(ccText) : prev.draft.cc_emails,
          subject: subject !== undefined ? subject : prev.draft.subject,
          body_html: bodyHtml !== undefined ? bodyHtml : prev.draft.body_html,
        },
      };
    });
  }

  async function sendCurrent() {
    if (!item?.id) return;
    setSending(true);
    setError(null);

    try {
      const payload = {
        to_emails: item.draft.to_emails || [],
        cc_emails: item.draft.cc_emails || [],
        subject: item.draft.subject || "",
        body_html: item.draft.body_html || "",
      };

      await sendNegotiationReply(item.id, payload);

      // refresh list after send
      await refresh();

      // mark as replied locally
      setPending((prev) => prev.filter((x) => Number(x.id) !== Number(item.id)));
      setSelectedId(null);
      setItem(null);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  return {
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
    pollNow, // ✅ exposed for “Poll now” button
    editor,
    updateDraftFields,
    sendCurrent,
  };
}
