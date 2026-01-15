// src/App.jsx
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
// en haut du fichier
import InvoiceReminders from "./components/InvoiceReminders.jsx";
import BusinessCardUploader from "./components/BusinessCardUploader.jsx";

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
      <InvoiceReminders />
      <BusinessCardUploader />
    </AppShell>
    
  );
}

export default App;
