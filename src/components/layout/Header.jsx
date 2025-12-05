// src/components/layout/Header.jsx
export function Header({ onLogout }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 6,
          justifyContent: "space-between",
        }}
      >
        {/* left: logo + title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
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
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>
              Colombus Operations Platform System{" "}
              <span style={{ opacity: 0.7 }}>(COL-OPS)</span>
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
              AI engine ready for integration with Colombus systems: payment
              alerts via email and manual uploads, routed to mentors for
              validation.
            </p>
          </div>
        </div>



        {/* right: logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "#0f172a",
              color: "#e5e7eb",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        )}
      </div>

       <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 4 }}>
        <strong>Payment Detection &amp; Matching Module</strong>
      </p>
      <p style={{ color: "#9ca3af", fontSize: 13 }}>
        Live monitoring of bank alert emails. New payments are added to a{" "}
        <b>Pending queue</b>. The mentor validates or cancels each match within
        24 hours.
      </p>
    </header>
  );
}
