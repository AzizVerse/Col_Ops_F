// src/api.js:
const API_BASE = "https://col-ops-b-1.onrender.com";
//const API_BASE = "http://localhost:8000";
let SESSION_ID = null;
function getSessionId() {
  if (SESSION_ID) return SESSION_ID;
  if (typeof window !== "undefined") {
    SESSION_ID = window.localStorage.getItem("colops_session_id");
  }
  return SESSION_ID;
}

function setSessionId(id) {
  SESSION_ID = id;
  if (typeof window !== "undefined") {
    if (id) {
      window.localStorage.setItem("colops_session_id", id);
    } else {
      window.localStorage.removeItem("colops_session_id");
    }
  }
}

function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const sid = getSessionId();
  if (sid) {
    headers["X-Session-Id"] = sid;   // 👈 magic line
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

// Small helper to read error text
async function readError(resp, defaultMessage) {
  let txt = "";
  try {
    txt = await resp.text();
  } catch {
    // ignore
  }
  return `${defaultMessage}: ${resp.status} ${txt}`;
}

/* ======================
 * AUTH
 * ====================== */

export async function apiLogin(username, password) {
  const resp = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) {
    const msg =
      resp.status === 401
        ? "Invalid username or password"
        : await readError(resp, "Login failed");
    throw new Error(msg);
  }

  const data = await resp.json();

  if (data.session_id) {
    setSessionId(data.session_id);   // 👈 store it for next calls
  }

  return data;
}

export async function apiLogout() {
  setSessionId(null); // clear header session

  const resp = await authFetch(`${API_BASE}/api/logout`, {
    method: "POST",
  });

  try {
    return await resp.json();
  } catch {
    return {};
  }
}


/* ======================
 * Outlook payments (auto / manual)
 * ====================== */
export async function fetchOutlookAuto() {
  const resp = await authFetch(`${API_BASE}/api/outlook-to-excel-payments`);

  // 404 == no bank email yet → not a technical error
  if (resp.status === 404) {
    return {
      noEmail: true,
      updated_rows: 0,
      email_subject: null,
      email_id: null,
      amounts: [],
      matches: [],
    };
  }

  if (!resp.ok) {
    throw new Error(await readError(resp, "fetchOutlookAuto failed"));
  }
  return resp.json();
}

export async function fetchOutlookPreview() {
  const resp = await authFetch(`${API_BASE}/api/outlook-payments-preview`);

  // Same idea: no latest Outlook email → empty preview, not an error
  if (resp.status === 404) {
    return {
      noEmail: true,
      email_subject: null,
      email_received_at: null,
      amounts: [],
      dates: [],
      matches: [],
    };
  }

  if (!resp.ok) {
    throw new Error(await readError(resp, "fetchOutlookPreview failed"));
  }
  return resp.json();
}


export async function confirmPaymentMatch({ amount_detected, row_index }) {
  const resp = await authFetch(`${API_BASE}/api/payments/confirm-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount_detected, row_index }),
  });
  if (!resp.ok) {
    throw new Error(await readError(resp, "confirmPaymentMatch failed"));
  }
  return resp.json();
}

/* ======================
 * Old queue endpoints (ML / OCR pending ops)
 * ====================== */

export async function getPendingOperations() {
  const resp = await authFetch(`${API_BASE}/api/pending-operations`);
  if (!resp.ok) {
    throw new Error("getPendingOperations failed");
  }
  return resp.json();
}

export async function confirmOperation(id) {
  const resp = await authFetch(`${API_BASE}/api/operations/${id}/confirm`, {
    method: "POST",
    
  });
  if (!resp.ok) {
    throw new Error("confirmOperation failed");
  }
  return resp.json();
}

export async function cancelOperation(id) {
  const resp = await authFetch(`${API_BASE}/api/operations/${id}/cancel`, {
    method: "POST",
    
  });
  if (!resp.ok) {
    throw new Error("cancelOperation failed");
  }
  return resp.json();
}

/* ======================
 * OCR images
 * ====================== */

export async function processImages(files) {
  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f);
  }

  const resp = await authFetch(`${API_BASE}/api/process-images`, {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    throw new Error(await readError(resp, "processImages failed"));
  }

  // EmailAnalysisResponse
  return resp.json();
}

/* ======================
 * Payments log (history)
 * ====================== */

export async function fetchPaymentsLog(limit = 200) {
  const resp = await authFetch(`${API_BASE}/api/payments-log?limit=${limit}`);
  if (!resp.ok) {
    throw new Error("API error fetching payments log");
  }
  return resp.json(); // { entries: [...] }
}

// ======================
// INVOICE REMINDERS
// ======================

export async function fetchUnpaidInvoices() {
  const resp = await authFetch(`${API_BASE}/api/invoices/unpaid`);
  if (!resp.ok) {
    throw new Error(await readError(resp, "fetchUnpaidInvoices failed"));
  }
  // { invoices: [...] }
  return resp.json();
}

export async function toggleInvoiceReminder(row_index, active) {
  const resp = await authFetch(
    `${API_BASE}/api/invoices/${row_index}/reminder`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    }
  );

  if (!resp.ok) {
    throw new Error(await readError(resp, "toggleInvoiceReminder failed"));
  }
  // { status: "ok", state: {...} }
  return resp.json();
}

export async function runRemindersNow() {
  const resp = await authFetch(`${API_BASE}/api/reminders/run`, {
    method: "POST",
  });

  if (!resp.ok) {
    throw new Error(await readError(resp, "runRemindersNow failed"));
  }
  // { status: "ok", actions: [...] }
  return resp.json();
}

export async function toggleInvoiceReminderPause(rowIndex, paused) {
  const resp = await authFetch(
    `${API_BASE}/api/invoices/${rowIndex}/reminder/pause`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused }),
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `toggleInvoiceReminderPause failed: ${resp.status} ${text}`
    );
  }

  return resp.json();
}

export async function sendInvoiceReminder(rowIndex) {
  const resp = await authFetch(
    `${API_BASE}/api/invoices/${rowIndex}/reminder/send`,
    {
      method: "POST",
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `sendInvoiceReminder failed: ${resp.status} ${text}`
    );
  }

  return resp.json();
}
/* ======================
 * Business Cards OCR -> OneDrive
 * ====================== */

export async function uploadBusinessCards(files) {
  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f); // must be "files"
  }

  const resp = await authFetch(`${API_BASE}/api/cards/upload`, {
    method: "POST",
    body: formData,
  });

  // If you still see 404, it means backend route isn't there or wrong backend base.
  if (!resp.ok) {
    throw new Error(await readError(resp, "uploadBusinessCards failed"));
  }

  return resp.json(); // { uploaded, processed_ok, processed_failed, results }
}
/* ======================
 * DAILY DIGEST
 * ====================== */

export async function fetchDigestSchedule() {
  const resp = await authFetch(`${API_BASE}/api/digest/schedule`);
  if (!resp.ok) {
    throw new Error(await readError(resp, "fetchDigestSchedule failed"));
  }
  return resp.json();
}

export async function updateDigestSchedule({ enabled, hour, minute }) {
  const resp = await authFetch(`${API_BASE}/api/digest/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, hour, minute }),
  });

  if (!resp.ok) {
    throw new Error(await readError(resp, "updateDigestSchedule failed"));
  }
  return resp.json();
}

export async function previewDailyDigest() {
  const resp = await authFetch(`${API_BASE}/api/digest/preview`);
  if (!resp.ok) {
    throw new Error(await readError(resp, "previewDailyDigest failed"));
  }
  return resp.json(); // { text, pending_by_month, inflows, ... }
}

export async function sendDailyDigestNow() {
  const resp = await authFetch(`${API_BASE}/api/digest/send-now`, {
    method: "POST",
  });
  if (!resp.ok) {
    throw new Error(await readError(resp, "sendDailyDigestNow failed"));
  }
  return resp.json(); // { status: "sent", today: "YYYY-MM-DD" }
}
