import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYSIS_INTERVAL_MS = 220;
const REQUIRED_STABLE_FRAMES = 3;
const MIN_BRIGHTNESS = 40;
const MIN_DETAIL_SCORE = 8;
const MAX_DIFF_FOR_STABLE = 18;

function computeFrameMetrics(imageData) {
  const data = imageData.data;
  const pixelCount = data.length / 4;

  let brightnessSum = 0;
  let detailSum = 0;
  let prevGray = null;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const gray = 0.299 * red + 0.587 * green + 0.114 * blue;

    brightnessSum += gray;

    if (prevGray !== null) {
      detailSum += Math.abs(gray - prevGray);
    }

    prevGray = gray;
  }

  return {
    brightness: brightnessSum / Math.max(pixelCount, 1),
    detailScore: detailSum / Math.max(pixelCount - 1, 1),
  };
}

function computeAverageDifference(current, previous) {
  if (!current || !previous || current.data.length !== previous.data.length) {
    return Infinity;
  }

  let sum = 0;
  const len = current.data.length;

  for (let i = 0; i < len; i += 4) {
    const currentGray =
      0.299 * current.data[i] +
      0.587 * current.data[i + 1] +
      0.114 * current.data[i + 2];

    const previousGray =
      0.299 * previous.data[i] +
      0.587 * previous.data[i + 1] +
      0.114 * previous.data[i + 2];

    sum += Math.abs(currentGray - previousGray);
  }

  return sum / Math.max(len / 4, 1);
}

export default function CameraCapturePanel({
  isBusy,
  onCapture,
  defaultMode = "ai",
  canAutoResume = true,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const analysisTimerRef = useRef(null);
  const previousFrameRef = useRef(null);
  const stableFrameCountRef = useRef(0);
  const autoCaptureLockRef = useRef(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captureMode, setCaptureMode] = useState(defaultMode);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);

  const [liveStatus, setLiveStatus] = useState("Camera closed");
  const [liveHint, setLiveHint] = useState("Open camera to begin scanning.");
  const [frameStats, setFrameStats] = useState({
    brightness: 0,
    detailScore: 0,
    diffScore: 999,
    stableFrames: 0,
  });

  const statusTone = useMemo(() => {
    const low = String(liveStatus || "").toLowerCase();
    if (low.includes("ready")) return "success";
    if (low.includes("capturing") || low.includes("scanning")) return "info";
    return "neutral";
  }, [liveStatus]);

  const stopAnalysisLoop = useCallback(() => {
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);

  const resetAnalysisState = useCallback(() => {
    previousFrameRef.current = null;
    stableFrameCountRef.current = 0;
    autoCaptureLockRef.current = false;
    setFrameStats({
      brightness: 0,
      detailScore: 0,
      diffScore: 999,
      stableFrames: 0,
    });
  }, []);

  const stopCamera = useCallback(() => {
    stopAnalysisLoop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    resetAnalysisState();
    setCameraOpen(false);
    setLiveStatus("Camera closed");
    setLiveHint("Open camera to begin scanning.");
  }, [resetAnalysisState, stopAnalysisLoop]);

  const startCamera = useCallback(async () => {
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera access.");
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraOpen(true);
      setLiveStatus("Searching for card");
      setLiveHint("Place one business card inside the guide box.");
    } catch (err) {
      setCameraError(err?.message || "Failed to open camera.");
      setCameraOpen(false);
      setLiveStatus("Camera unavailable");
      setLiveHint("Please allow camera access and try again.");
    }
  }, [stopCamera]);

  const captureFrame = useCallback(
    async (trigger = "manual") => {
      setCameraError("");

      try {
        const video = videoRef.current;
        if (!video || !cameraOpen) {
          throw new Error("Camera is not ready.");
        }

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;

        if (!sourceWidth || !sourceHeight) {
          throw new Error("Camera frame is not ready yet.");
        }

        const cropWidth = sourceWidth * 0.72;
        const cropHeight = cropWidth / 1.65;
        const cropX = (sourceWidth - cropWidth) / 2;
        const cropY = (sourceHeight - cropHeight) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(cropWidth);
        canvas.height = Math.round(cropHeight);

        const context = canvas.getContext("2d");
        context.drawImage(
          video,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.95)
        );

        if (!blob) {
          throw new Error("Could not capture camera image.");
        }

        const file = new File(
          [blob],
          `camera-card-${trigger}-${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.jpg`,
          { type: "image/jpeg" }
        );

        autoCaptureLockRef.current = true;
        setLiveStatus("Scanning card");
        setLiveHint("Image captured. Waiting for OCR result...");

        await onCapture(file, captureMode);

        setLiveStatus("Review ready");
        setLiveHint("Result is shown below. Review and save, then continue.");
      } catch (err) {
        autoCaptureLockRef.current = false;
        setCameraError(err?.message || "Capture failed.");
        setLiveStatus("Capture failed");
        setLiveHint("Please try again.");
        throw err;
      }
    },
    [cameraOpen, captureMode, onCapture]
  );

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!cameraOpen || isBusy || autoCaptureLockRef.current || !canAutoResume) {
      stopAnalysisLoop();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setLiveStatus("Searching for card");
    setLiveHint("Place one business card inside the guide box.");

    analysisTimerRef.current = setInterval(async () => {
      try {
        const currentVideo = videoRef.current;
        if (!currentVideo) return;
        if (
          !currentVideo.videoWidth ||
          !currentVideo.videoHeight ||
          currentVideo.readyState < 2
        ) {
          return;
        }

        const analysisCanvas =
          analysisCanvasRef.current || document.createElement("canvas");
        analysisCanvasRef.current = analysisCanvas;

        const guideWidth = 260;
        const guideHeight = 160;

        analysisCanvas.width = guideWidth;
        analysisCanvas.height = guideHeight;

        const context = analysisCanvas.getContext("2d", {
          willReadFrequently: true,
        });

        const sourceWidth = currentVideo.videoWidth;
        const sourceHeight = currentVideo.videoHeight;

        const cropWidth = sourceWidth * 0.58;
        const cropHeight = cropWidth / 1.65;
        const cropX = (sourceWidth - cropWidth) / 2;
        const cropY = (sourceHeight - cropHeight) / 2;

        context.drawImage(
          currentVideo,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          guideWidth,
          guideHeight
        );

        const currentFrame = context.getImageData(0, 0, guideWidth, guideHeight);
        const metrics = computeFrameMetrics(currentFrame);
        const diffScore = computeAverageDifference(
          currentFrame,
          previousFrameRef.current
        );

        previousFrameRef.current = currentFrame;

        const brightEnough = metrics.brightness >= MIN_BRIGHTNESS;
        const enoughDetail = metrics.detailScore >= MIN_DETAIL_SCORE;
        const stableEnough = diffScore <= MAX_DIFF_FOR_STABLE;

        const usableFrame =
          brightEnough && (enoughDetail || diffScore <= MAX_DIFF_FOR_STABLE * 0.75);

        if (usableFrame && stableEnough) {
          stableFrameCountRef.current += 1;
        } else if (usableFrame) {
          stableFrameCountRef.current = Math.max(
            stableFrameCountRef.current - 1,
            0
          );
        } else {
          stableFrameCountRef.current = 0;
        }

        setFrameStats({
          brightness: Number(metrics.brightness.toFixed(1)),
          detailScore: Number(metrics.detailScore.toFixed(1)),
          diffScore: Number(
            Number.isFinite(diffScore) ? diffScore.toFixed(1) : 999
          ),
          stableFrames: stableFrameCountRef.current,
        });

        if (!brightEnough) {
          setLiveStatus("Searching for card");
          setLiveHint("Increase light or move the card closer to the center.");
          return;
        }

        if (!enoughDetail && diffScore > MAX_DIFF_FOR_STABLE * 1.2) {
          setLiveStatus("Searching for card");
          setLiveHint("Place the card fully inside the guide box.");
          return;
        }

        if (!stableEnough) {
          setLiveStatus("Hold still");
          setLiveHint("Card detected. Keep it steady for automatic capture.");
          return;
        }

        if (stableFrameCountRef.current < REQUIRED_STABLE_FRAMES) {
          setLiveStatus("Hold still");
          setLiveHint("Card looks good. Holding steady before capture...");
          return;
        }

        if (autoCaptureEnabled && !autoCaptureLockRef.current) {
          autoCaptureLockRef.current = true;
          setLiveStatus("Capturing automatically");
          setLiveHint("Card is stable. Capturing now...");
          stopAnalysisLoop();
          await captureFrame("auto");
        }
      } catch (err) {
        setCameraError(err?.message || "Live analysis failed.");
      }
    }, ANALYSIS_INTERVAL_MS);

    return () => {
      stopAnalysisLoop();
    };
  }, [
    cameraOpen,
    isBusy,
    autoCaptureEnabled,
    canAutoResume,
    captureFrame,
    stopAnalysisLoop,
  ]);

  useEffect(() => {
    if (!cameraOpen) return;
    if (!canAutoResume) return;
    if (isBusy) return;
    if (!autoCaptureLockRef.current) return;

    autoCaptureLockRef.current = false;
    stableFrameCountRef.current = 0;
    previousFrameRef.current = null;

    setLiveStatus("Searching for card");
    setLiveHint("Ready for the next card.");
  }, [cameraOpen, canAutoResume, isBusy]);

  return (
    <div style={styles.shell}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>Smart camera mode</div>
          <div style={styles.subtle}>
            The camera watches the live frame, waits until the card is clear and
            stable, then captures automatically and shows the extracted result below.
          </div>
        </div>

        <div style={styles.actions}>
          <select
            value={captureMode}
            onChange={(e) => setCaptureMode(e.target.value)}
            style={styles.select}
            disabled={isBusy}
          >
            <option value="normal">OCR only</option>
            <option value="ai">AI-assisted</option>
          </select>

          <label style={styles.toggleWrap}>
            <input
              type="checkbox"
              checked={autoCaptureEnabled}
              onChange={(e) => setAutoCaptureEnabled(e.target.checked)}
              disabled={isBusy}
            />
            <span>Auto-capture</span>
          </label>

          {!cameraOpen ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={isBusy}
              style={{
                ...styles.btnSecondary,
                opacity: isBusy ? 0.6 : 1,
                cursor: isBusy ? "not-allowed" : "pointer",
              }}
            >
              Open camera
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              disabled={isBusy}
              style={{
                ...styles.btnGhost,
                opacity: isBusy ? 0.6 : 1,
                cursor: isBusy ? "not-allowed" : "pointer",
              }}
            >
              Close camera
            </button>
          )}

          <button
            type="button"
            onClick={() => captureFrame("manual")}
            disabled={!cameraOpen || isBusy}
            style={{
              ...styles.btnPrimary,
              opacity: !cameraOpen || isBusy ? 0.6 : 1,
              cursor: !cameraOpen || isBusy ? "not-allowed" : "pointer",
            }}
          >
            {isBusy
              ? captureMode === "ai"
                ? "Scanning with AI..."
                : "Scanning..."
              : "Capture now"}
          </button>
        </div>
      </div>

      <div style={styles.statusCard(statusTone)}>
        <div>
          <div style={styles.statusTitle}>{liveStatus}</div>
          <div style={styles.statusHint}>{liveHint}</div>
        </div>

        <div style={styles.statPills}>
          <span style={styles.pill}>
            Brightness: <b>{frameStats.brightness}</b>
          </span>
          <span style={styles.pill}>
            Detail: <b>{frameStats.detailScore}</b>
          </span>
          <span style={styles.pill}>
            Motion: <b>{frameStats.diffScore}</b>
          </span>
          <span style={styles.pill}>
            Stable: <b>{frameStats.stableFrames}/{REQUIRED_STABLE_FRAMES}</b>
          </span>
        </div>
      </div>

      <div style={styles.previewShell}>
        <div style={styles.previewWrap}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />

          <div style={styles.overlay}>
            <div style={styles.guideBox}>
              <div style={styles.guideText}>Place business card inside frame</div>
            </div>
          </div>

          {!cameraOpen && (
            <div style={styles.emptyOverlay}>
              Camera is closed. Click <b>Open camera</b> to start smart scanning.
            </div>
          )}
        </div>
      </div>

      {cameraError ? <div style={styles.errorBox}>{cameraError}</div> : null}
    </div>
  );
}

const styles = {
  shell: {
    marginTop: 18,
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "linear-gradient(180deg, rgba(15,23,42,0.76), rgba(2,6,23,0.82))",
    boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: 18,
    marginBottom: 4,
  },
  subtle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: 780,
  },
  actions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  select: {
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.24)",
    background: "rgba(2,6,23,0.45)",
    color: "#F8FAFC",
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
  },
  toggleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(148,163,184,0.22)",
    background: "rgba(2,6,23,0.24)",
  },
  btnPrimary: {
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(59,130,246,0.55)",
    background: "linear-gradient(180deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))",
    color: "white",
    fontWeight: 800,
    boxShadow: "0 10px 24px rgba(37,99,235,0.25)",
  },
  btnSecondary: {
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(15,23,42,0.55)",
    color: "#E5E7EB",
    fontWeight: 700,
  },
  btnGhost: {
    padding: "11px 16px",
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(2,6,23,0.18)",
    color: "#E5E7EB",
    fontWeight: 700,
  },
  statusCard: (tone) => ({
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    border:
      tone === "success"
        ? "1px solid rgba(16,185,129,0.35)"
        : tone === "info"
        ? "1px solid rgba(59,130,246,0.35)"
        : "1px solid rgba(148,163,184,0.20)",
    background:
      tone === "success"
        ? "linear-gradient(180deg, rgba(6,78,59,0.38), rgba(5,46,22,0.28))"
        : tone === "info"
        ? "linear-gradient(180deg, rgba(30,64,175,0.25), rgba(15,23,42,0.35))"
        : "rgba(15,23,42,0.45)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  }),
  statusTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 4,
  },
  statusHint: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 1.5,
  },
  statPills: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(2,6,23,0.40)",
    border: "1px solid rgba(148,163,184,0.16)",
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: 700,
  },
  previewShell: {
    width: "100%",
  },
  previewWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    minHeight: 320,
    borderRadius: 18,
    overflow: "hidden",
    background: "#020617",
    border: "1px solid rgba(148,163,184,0.16)",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "#000",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  guideBox: {
    width: "68%",
    maxWidth: 720,
    aspectRatio: "1.65 / 1",
    border: "2px solid rgba(125,211,252,0.85)",
    borderRadius: 18,
    boxShadow: "0 0 0 9999px rgba(2,6,23,0.30)",
    position: "relative",
  },
  guideText: {
    position: "absolute",
    left: "50%",
    bottom: -34,
    transform: "translateX(-50%)",
    color: "#E0F2FE",
    fontSize: 12,
    fontWeight: 700,
    background: "rgba(2,6,23,0.70)",
    padding: "6px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  emptyOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#CBD5E1",
    background: "rgba(2,6,23,0.72)",
    textAlign: "center",
    padding: 24,
    fontSize: 14,
  },
  errorBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(239,68,68,0.40)",
    background: "rgba(127,29,29,0.25)",
    color: "#FCA5A5",
    fontWeight: 700,
  },
};