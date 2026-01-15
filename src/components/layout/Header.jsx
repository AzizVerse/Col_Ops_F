// src/components/layout/Header.jsx
import React from "react";

export function Header({ onLogout }) {
  return (
    <header
      className="colops-header-root"
      style={{ marginBottom: 24, position: "relative" }}
    >
      {/* --- Animated CSS injected locally --- */}
      <style>{`
        .colops-header-root {
          position: relative;
          overflow: hidden;
        }

        /* Soft animated "aurora" background behind the header */
        .colops-header-bg {
          position: absolute;
          inset: -40px;
          background:
            radial-gradient(circle at 0% 0%, rgba(56,189,248,0.20), transparent 55%),
            radial-gradient(circle at 100% 10%, rgba(59,130,246,0.18), transparent 55%),
            radial-gradient(circle at 50% 100%, rgba(34,197,94,0.20), transparent 60%);
          opacity: 0.6;
          filter: blur(32px);
          pointer-events: none;
          z-index: -1;
          animation: colopsAurora 16s ease-in-out infinite alternate;
        }

        @keyframes colopsAurora {
          0% {
            transform: translate3d(-8%, -4%, 0) scale(1.02);
          }
          50% {
            transform: translate3d(6%, 4%, 0) scale(1.03);
          }
          100% {
            transform: translate3d(-4%, 0%, 0) scale(1.01);
          }
        }

        /* Logo: subtle floating + glow */
        .colops-logo-wrapper {
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.55);
          animation: colopsLogoFloat 6s ease-in-out infinite;
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        }

        .colops-logo-wrapper:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 18px 40px rgba(59,130,246,0.55);
        }

        @keyframes colopsLogoFloat {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }

        /* Status dot on Logout: pulse */
        .colops-status-dot {
          animation: colopsStatusPulse 2.4s ease-out infinite;
        }

        @keyframes colopsStatusPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34,197,94,0.55);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(34,197,94,0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34,197,94,0);
          }
        }

        /* Pills row: shimmer on hover */
        .colops-pill {
          position: relative;
          overflow: hidden;
        }

        .colops-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            rgba(255,255,255,0.0),
            rgba(255,255,255,0.25),
            rgba(255,255,255,0.0)
          );
          transform: translateX(-60%);
          opacity: 0;
        }

        .colops-pill:hover::before {
          opacity: 1;
          animation: colopsPillShimmer 1.3s ease-out;
        }

        @keyframes colopsPillShimmer {
          0%   { transform: translateX(-60%); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateX(60%); opacity: 0; }
        }

        /* Cards: slight fade-in + slide */
        .colops-card {
          animation: colopsCardIn 0.5s ease-out both;
        }

        .colops-card:nth-of-type(2) {
          animation-delay: 0.08s;
        }

        @keyframes colopsCardIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Tiny animated underline under COL-OPS name (optional) */
        .colops-underline {
          position: relative;
          margin-top: 3px;
          width: 130px;
          height: 2px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(15,23,42,0.9);
        }

        .colops-underline::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(56,189,248,0.0),
            rgba(56,189,248,0.7),
            rgba(129,140,248,0.8),
            rgba(16,185,129,0.7),
            rgba(56,189,248,0.0)
          );
          transform: translateX(-40%);
          animation: colopsUnderline 2.8s linear infinite;
        }

        @keyframes colopsUnderline {
          0%   { transform: translateX(-40%); }
          100% { transform: translateX(40%); }
        }
      `}</style>

      {/* Animated glowing background */}
      <div className="colops-header-bg" />

      {/* Top row: logo + title + logout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
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
            className="colops-logo-wrapper"
            style={{
              width: 100,
              height: 100,
              borderRadius: 18,
              overflow: "hidden",
              background: "#020617",
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
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#6b7280",
                marginBottom: 2,
              }}
            >
              Colombus Capital · Internal console
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 0,
                lineHeight: 1.2,
              }}
            >
              Colombus Operations Platform System{" "}
              <span style={{ opacity: 0.7 }}>(COL-OPS)</span>
            </h1>
            {/* animated underline under title */}
            <div className="colops-underline" />
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                margin: "6px 0 0 0",
                maxWidth: 640,
              }}
            >
              Unified back-office console for{" "}
              <strong>payment detection</strong>,{" "}
              <strong>invoice reminders</strong> and{" "}
              <strong>manual validation</strong> across Colombus systems.
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
              background: "rgba(15,23,42,0.98)",
              color: "#e5e7eb",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
            }}
          >
            <span
              className="colops-status-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: "999px",
                background: "#22c55e",
              }}
            />
            Log out
          </button>
        )}
      </div>

      {/* Second row: pills + module description label */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span
            className="colops-pill"
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "#020617",
              color: "#e5e7eb",
              position: "relative",
            }}
          >
            Back-office only · Restricted access
          </span>
          <span
            className="colops-pill"
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #0f172a",
              background:
                "linear-gradient(90deg, rgba(37,99,235,0.18), rgba(56,189,248,0.12))",
              color: "#bfdbfe",
              position: "relative",
            }}
          >
            AI-assisted reconciliation &amp; reminders
          </span>
        </div>
      </div>

      {/* Third row: modules summary (cards with fade-in) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          className="colops-card"
          style={{
            flex: 1,
            minWidth: 260,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "rgba(2,6,23,0.96)",
          }}
        >
          <p
            style={{
              color: "#e5e7eb",
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Payment Detection &amp; Matching Module
          </p>
          <p
            style={{
              color: "#9ca3af",
              fontSize: 12,
              margin: 0,
            }}
          >
            Live monitoring of <strong>bank alert emails</strong> and{" "}
            <strong>manual OCR uploads</strong>. New payments are added to a{" "}
            <b>Pending queue</b> and must be validated or cancelled within{" "}
            <strong>24h</strong>.
          </p>
        </div>

        <div
          className="colops-card"
          style={{
            flex: 1,
            minWidth: 260,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "rgba(2,6,23,0.96)",
          }}
        >
          <p
            style={{
              color: "#e5e7eb",
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Invoice Reminder Engine
          </p>
          <p
            style={{
              color: "#9ca3af",
              fontSize: 12,
              margin: 0,
            }}
          >
            Sync with <strong>Notion invoices</strong> and schedule up to{" "}
            <strong>3 reminder emails</strong> (30&nbsp;days, then 15&nbsp;days,
            then 15&nbsp;days) with <strong>pause</strong>,{" "}
            <strong>manual send</strong> and <strong>Telegram alerts</strong>.
          </p>
        </div>
      </div>
    </header>
  );
}
