export async function processLatestEmailFromGmail() {
  const resp = await fetch("http://127.0.0.1:8000/api/process-latest-email", {
    method: "GET",
  });

  if (!resp.ok) {
    throw new Error("API error");
  }
  return resp.json();
}

export async function getPendingOperations() {
  const resp = await fetch("http://127.0.0.1:8000/api/pending-operations");
  if (!resp.ok) throw new Error("API error");
  return resp.json();
}

export async function confirmOperation(id) {
  const resp = await fetch(`http://127.0.0.1:8000/api/operations/${id}/confirm`, {
    method: "POST",
  });
  if (!resp.ok) throw new Error("API error");
  return resp.json();
}

export async function cancelOperation(id) {
  const resp = await fetch(`http://127.0.0.1:8000/api/operations/${id}/cancel`, {
    method: "POST",
  });
  if (!resp.ok) throw new Error("API error");
  return resp.json();
}
// src/api.js

const API_BASE = "http://127.0.0.1:8000";

// ... you already have processLatestEmailFromGmail, getPendingOperations, etc.

export async function processImages(files) {
  const formData = new FormData();
  for (const f of files) {
    formData.append("files", f);
  }

  const res = await fetch(`${API_BASE}/api/process-images`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`processImages failed: ${res.status} ${txt}`);
  }

  return res.json(); // EmailAnalysisResponse
}
