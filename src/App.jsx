// src/App.jsx
import { useState } from "react";

import { AppShell } from "./components/layout/AppShell";
import { Header } from "./components/layout/Header";
import { MonitorPanel } from "./components/monitor/MonitorPanel";
import { ManualUploadPanel } from "./components/manual-upload/ManualUploadPanel";
import { NextPendingCard } from "./components/pending/NextPendingCard";
import { PendingTable } from "./components/pending/PendingTable";
import { useColOpsEngine } from "./hooks/useColOpsEngine";
import { PaymentsHistoryTable } from "./components/history/PaymentsHistoryTable";
import { LoginPanel } from "./components/user/LoginPanel";
import { useAuth } from "./components/auth/AuthContext";

import InvoiceReminders from "./components/InvoiceReminders.jsx";
import BusinessCardUploader from "./components/BusinessCardUploader.jsx";
import DailyDigestPanel from "./components/digest/DailyDigestPanel.jsx";

function App() {
  const { isAuthenticated, checkingAuth, logout } = useAuth();

  // Hook is enabled only when authenticated
  const engine = useColOpsEngine({ enabled: isAuthenticated });

  const {
    pending,
    error,
    nextPending,
    statusText,
    statusColor,
    lastCheck,
    latestSubject,
    totalAmount,
    uploading,
    uploadError,
    dragActive,
    manualHistory,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleConfirm,
    handleCancel,
    confirmingId,
    cancellingId,
    toggleAutoMode,
    matches,
    autoMode,
    history,
    historyClientFilter,
    historyMatchType,
    historySource,
    setHistoryClientFilter,
    setHistoryMatchType,
    setHistorySource,
  } = engine;

  // ✅ Tabs state (must be inside App(), before return)
  const [activeTab, setActiveTab] = useState("ops");

  // While we’re checking if the cookie is valid
  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}
      >
        Checking session…
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoginPanel />
      </div>
    );
  }

  // Authenticated dashboard
  return (
    <AppShell>
      <Header onLogout={logout} />

      {/* ✅ Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 10,
          flexWrap: "wrap",
        }}
      >
        <TabButton
          label="Ops"
          active={activeTab === "ops"}
          onClick={() => setActiveTab("ops")}
        />
        <TabButton
          label="Daily Digest"
          active={activeTab === "digest"}
          onClick={() => setActiveTab("digest")}
        />
        <TabButton
          label="Reminders"
          active={activeTab === "reminders"}
          onClick={() => setActiveTab("reminders")}
        />
        <TabButton
          label="Business Cards"
          active={activeTab === "cards"}
          onClick={() => setActiveTab("cards")}
        />
      </div>

      {/* ✅ OPS TAB */}
      {activeTab === "ops" && (
        <>
          {/* Monitor + manual upload + history row */}
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "stretch",
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            <MonitorPanel
              statusText={statusText}
              statusColor={statusColor}
              lastCheck={lastCheck}
              latestSubject={latestSubject}
              totalAmount={totalAmount}
              pending={pending}
              nextPending={nextPending}
              autoMode={autoMode}
              toggleAutoMode={toggleAutoMode}
              matches={matches}
            />

            <PaymentsHistoryTable
              history={history}
              historyClientFilter={historyClientFilter}
              historyMatchType={historyMatchType}
              historySource={historySource}
              setHistoryClientFilter={setHistoryClientFilter}
              setHistoryMatchType={setHistoryMatchType}
              setHistorySource={setHistorySource}
            />

            <ManualUploadPanel
              uploading={uploading}
              uploadError={uploadError}
              dragActive={dragActive}
              manualHistory={manualHistory}
              handleFileInputChange={handleFileInputChange}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
            />
          </div>

          {error && (
            <p style={{ color: "#f97373", marginTop: 10, fontSize: 14 }}>
              {error}
            </p>
          )}

          <NextPendingCard
            nextPending={nextPending}
            handleConfirm={handleConfirm}
            handleCancel={handleCancel}
            confirmingId={confirmingId}
            cancellingId={cancellingId}
          />

          <PendingTable
            pending={pending}
            error={error}
            handleConfirm={handleConfirm}
            handleCancel={handleCancel}
            confirmingId={confirmingId}
            cancellingId={cancellingId}
          />
        </>
      )}

      {/* ✅ DIGEST TAB */}
      {activeTab === "digest" && <DailyDigestPanel />}

      {/* ✅ REMINDERS TAB */}
      {activeTab === "reminders" && <InvoiceReminders />}

      {/* ✅ CARDS TAB */}
      {activeTab === "cards" && <BusinessCardUploader />}
    </AppShell>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#2563eb" : "rgba(255,255,255,0.06)",
        color: "#e5e7eb",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: 650,
      }}
    >
      {label}
    </button>
  );
}

export default App;
