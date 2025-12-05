// src/api.js
const API_BASE = "https://col-ops-b.onrender.com";

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
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // important for cookie
    body: JSON.stringify({ username, password }),
  });

  if (!resp.ok) {
    // backend returns 401 on bad credentials
    const msg =
      resp.status === 401
        ? "Invalid username or password"
        : await readError(resp, "Login failed");
    throw new Error(msg);
  }

  // { status: "ok" }
  return resp.json();
}

export async function apiLogout() {
  const resp = await fetch(`${API_BASE}/api/logout`, {
    method: "POST",
    credentials: "include",
  });

  // ignore errors for logout, just best-effort
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
  const resp = await fetch(`${API_BASE}/api/outlook-to-excel-payments`, {
    credentials: "include",
  });
  if (!resp.ok) {
    throw new Error(await readError(resp, "fetchOutlookAuto failed"));
  }
  // { email_subject, email_id, amounts, matches, updated_rows }
  return resp.json();
}

export async function fetchOutlookPreview() {
  const resp = await fetch(`${API_BASE}/api/outlook-payments-preview`, {
    credentials: "include",
  });
  if (!resp.ok) {
    throw new Error(await readError(resp, "fetchOutlookPreview failed"));
  }
  // { email_subject, email_id?, amounts, matches }
  return resp.json();
}

export async function confirmPaymentMatch({ amount_detected, row_index }) {
  const resp = await fetch(`${API_BASE}/api/payments/confirm-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
  const resp = await fetch(`${API_BASE}/api/pending-operations`, {
    credentials: "include",
  });
  if (!resp.ok) {
    throw new Error("getPendingOperations failed");
  }
  return resp.json();
}

export async function confirmOperation(id) {
  const resp = await fetch(`${API_BASE}/api/operations/${id}/confirm`, {
    method: "POST",
    credentials: "include",
  });
  if (!resp.ok) {
    throw new Error("confirmOperation failed");
  }
  return resp.json();
}

export async function cancelOperation(id) {
  const resp = await fetch(`${API_BASE}/api/operations/${id}/cancel`, {
    method: "POST",
    credentials: "include",
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

  const resp = await fetch(`${API_BASE}/api/process-images`, {
    method: "POST",
    credentials: "include",
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
  const resp = await fetch(`${API_BASE}/api/payments-log?limit=${limit}`, {
    credentials: "include",
  });
  if (!resp.ok) {
    throw new Error("API error fetching payments log");
  }
  return resp.json(); // { entries: [...] }
}
