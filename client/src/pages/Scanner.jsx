import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Upload, RotateCcw, CheckCircle2, AlertTriangle, AlertCircle, X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "../contexts/SupabaseAuthContext";
import { toast } from "sonner";

// ── Disease config ─────────────────────────────────────────────────────────────
const DISEASE_CONFIG = {
  "Healthy": {
    icon: CheckCircle2,
    color: "var(--color-healthy)",
    bg: "var(--color-healthy-bg)",
    border: "var(--color-healthy)",
    severity: "healthy",
    urgency: { en: "No action needed", ne: "कुनै कार्य आवश्यक छैन" },
    timeline: { en: "Continue monitoring weekly", ne: "साप्ताहिक निगरानी जारी राख्नुहोस्" },
    lassoColor: null,
    treatment: {
      en: ["Maintain good drainage", "Rotate crops next season", "Apply balanced fertilizer", "Monitor regularly"],
      ne: ["राम्रो निकास राख्नुहोस्", "अर्को मौसममा बाली परिवर्तन गर्नुहोस्", "सन्तुलित मल प्रयोग गर्नुहोस्", "नियमित निगरानी गर्नुहोस्"],
    },
  },
  "Early Blight": {
    icon: AlertTriangle,
    color: "var(--color-warning-agri)",
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-agri)",
    severity: "warning",
    urgency: { en: "Act within 7 days", ne: "७ दिनभित्र कार्य गर्नुहोस्" },
    timeline: { en: "Apply treatment within 7 days to prevent spread", ne: "फैलावट रोक्न ७ दिनभित्र उपचार गर्नुहोस्" },
    lassoColor: "#D97706",
    regionLabel: { en: "✂ Trim / Remove this area", ne: "✂ यो भाग काट्नुहोस्" },
    treatment: {
      en: [
        "Remove and destroy infected leaves immediately",
        "Apply copper-based fungicide (e.g., Mancozeb)",
        "Ensure proper plant spacing for air circulation",
        "Avoid overhead watering — use drip irrigation",
        "Repeat fungicide every 7–10 days",
      ],
      ne: [
        "संक्रमित पातहरू तुरुन्त हटाउनुहोस् र नष्ट गर्नुहोस्",
        "तामा-आधारित ढुसीनाशक (जस्तै म्यान्कोजेब) लगाउनुहोस्",
        "हावा प्रवाहको लागि उचित दूरी राख्नुहोस्",
        "माथिबाट पानी नदिनुहोस् — ड्रिप सिंचाइ प्रयोग गर्नुहोस्",
        "७–१० दिनमा ढुसीनाशक दोहोर्याउनुहोस्",
      ],
    },
  },
  "Late Blight": {
    icon: AlertCircle,
    color: "var(--color-critical)",
    bg: "var(--color-critical-bg)",
    border: "var(--color-critical)",
    severity: "critical",
    urgency: { en: "URGENT: Act within 2–3 days!", ne: "अत्यावश्यक: २–३ दिनभित्र कार्य गर्नुहोस्!" },
    timeline: { en: "Crop may perish in 2–3 days without treatment", ne: "उपचार नगरे २–३ दिनमा बाली नष्ट हुन सक्छ" },
    lassoColor: "#DC2626",
    regionLabel: { en: "🔥 DESTROY — Remove & burn immediately", ne: "🔥 नष्ट गर्नुहोस् — तुरुन्त हटाउनुहोस्" },
    treatment: {
      en: [
        "⚠️ URGENT: Apply systemic fungicide immediately (Metalaxyl + Mancozeb)",
        "Remove ALL visibly infected plants and burn them",
        "Stop all irrigation immediately",
        "Apply preventive spray to neighboring healthy plants",
        "Consult local agricultural extension officer",
        "Consider early harvest if >30% plants affected",
      ],
      ne: [
        "⚠️ अत्यावश्यक: तुरुन्त प्रणालीगत ढुसीनाशक लगाउनुहोस् (मेटालाक्सिल + म्यान्कोजेब)",
        "सबै संक्रमित बिरुवाहरू हटाउनुहोस् र जलाउनुहोस्",
        "सबै सिंचाइ तुरुन्त बन्द गर्नुहोस्",
        "छिमेकी स्वस्थ बिरुवाहरूमा निवारक स्प्रे लगाउनुहोस्",
        "स्थानीय कृषि विस्तार अधिकारीसँग परामर्श गर्नुहोस्",
        "३०% भन्दा बढी बिरुवा प्रभावित भए अगाडि नै काट्ने विचार गर्नुहोस्",
      ],
    },
  },
};

// ── Lasso Canvas Overlay ───────────────────────────────────────────────────────
function LassoOverlay({ imageData, regions, lassoColor, regionLabel, lang }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const animFrameRef = useRef(null);
  const dashOffsetRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Clear and draw image
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);

    if (!regions || regions.length === 0 || !lassoColor) return;

    // Darken non-infected areas slightly to focus attention
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, W, H);
    // Restore infected regions by clipping
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    regions.forEach(region => {
      if (!region.points || region.points.length < 3) return;
      ctx.beginPath();
      region.points.forEach(([rx, ry], i) => {
        const px = rx * W;
        const py = ry * H;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // Draw dotted lasso polygons
    dashOffsetRef.current = (dashOffsetRef.current + 0.5) % 24;

    regions.forEach((region, idx) => {
      if (!region.points || region.points.length < 3) return;

      const pts = region.points.map(([rx, ry]) => [rx * W, ry * H]);

      // Outer glow
      ctx.save();
      ctx.beginPath();
      pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
      ctx.closePath();
      ctx.strokeStyle = lassoColor + "55";
      ctx.lineWidth = 8;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();

      // Animated dashed border
      ctx.save();
      ctx.beginPath();
      pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
      ctx.closePath();
      ctx.strokeStyle = lassoColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.lineDashOffset = -dashOffsetRef.current;
      ctx.stroke();
      ctx.restore();

      // Dots at polygon vertices
      pts.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = lassoColor;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      });

      // Label above the bounding box
      if (regionLabel && idx === 0) {
        const bbox = region.bbox;
        const lx = bbox.x * W;
        const ly = Math.max(bbox.y * H - 10, 20);
        const label = regionLabel[lang] || regionLabel.en;

        ctx.save();
        ctx.font = "bold 11px 'Noto Sans', sans-serif";
        const tw = ctx.measureText(label).width;
        const pad = 6;
        const bx = Math.min(lx, W - tw - pad * 2 - 4);
        const by = ly - 18;

        // Label background pill
        ctx.fillStyle = lassoColor + "ee";
        const rx2 = 6;
        const bw = tw + pad * 2;
        const bh = 22;
        ctx.beginPath();
        ctx.moveTo(bx + rx2, by);
        ctx.lineTo(bx + bw - rx2, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + rx2);
        ctx.lineTo(bx + bw, by + bh - rx2);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - rx2, by + bh);
        ctx.lineTo(bx + rx2, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - rx2);
        ctx.lineTo(bx, by + rx2);
        ctx.quadraticCurveTo(bx, by, bx + rx2, by);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, bx + pad, by + 15);
        ctx.restore();
      }
    });

    animFrameRef.current = requestAnimationFrame(draw);
  }, [regions, lassoColor, regionLabel, lang]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const start = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = img.naturalWidth  || img.width  || 512;
      canvas.height = img.naturalHeight || img.height || 512;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    if (img.complete) start();
    else img.addEventListener("load", start);
    return () => {
      img.removeEventListener("load", start);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw, imageData]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ background: "#000" }}>
      {/* Hidden source image for drawing */}
      <img
        ref={imgRef}
        src={imageData}
        alt="source"
        className="absolute opacity-0 pointer-events-none"
        style={{ width: 1, height: 1 }}
        crossOrigin="anonymous"
      />
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ display: "block", maxHeight: "320px", objectFit: "contain" }}
      />
      {/* Region count badge */}
      {regions && regions.length > 0 && lassoColor && (
        <div
          className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: lassoColor, color: "#fff" }}
        >
          {regions.length} {lang === "ne" ? "संक्रमित क्षेत्र" : `infected region${regions.length > 1 ? "s" : ""}`}
        </div>
      )}
    </div>
  );
}

// ── Main Scanner Component ─────────────────────────────────────────────────────
export default function Scanner() {
  const { t, i18n } = useTranslation();
  const { user } = useSupabaseAuth();
  const lang = i18n.language;

  const [mode, setMode] = useState("upload");
  const [imageData, setImageData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const predictMutation = trpc.detect.predict.useMutation();

  // ── File Upload ──────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error(lang === "ne" ? "कृपया तस्वीर फाइल छान्नुहोस्" : "Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target.result);
      setImageFile(file);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Camera ───────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error(lang === "ne" ? "क्यामेरा पहुँच अस्वीकृत" : "Camera access denied");
    }
  };

  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setImageData(canvas.toDataURL("image/jpeg", 0.92));
    setResult(null);
    stopCamera();
  };

  // ── Analyze ──────────────────────────────────────────────────────────────────
  const analyze = async () => {
    if (!imageData) { toast.error(t("imageRequired")); return; }
    try {
      const res = await predictMutation.mutateAsync({
        imageBase64: imageData,
        mimeType: imageFile?.type || "image/jpeg",
        userId: user?.id,
        saveToHistory: !!user,
      });
      if (!res.success) { toast.error(res.error || t("errorOccurred")); return; }
      setResult(res);
      if (user) toast.success(lang === "ne" ? "इतिहासमा सुरक्षित भयो" : "Saved to history");
    } catch {
      toast.error(t("errorOccurred"));
    }
  };

  const reset = () => {
    setImageData(null);
    setImageFile(null);
    setResult(null);
    stopCamera();
  };

  // ── Result View ──────────────────────────────────────────────────────────────
  if (result?.success) {
    const config = DISEASE_CONFIG[result.prediction] || DISEASE_CONFIG["Healthy"];
    const Icon = config.icon;
    const breakdown = result.confidence_breakdown || {};
    const treatments = config.treatment[lang] || config.treatment.en;
    const hasRegions = result.regions && result.regions.length > 0;

    return (
      <div className="page-container animate-fadeInUp">
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
          {t("result")}
        </h1>

        {/* Main Result Card */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: config.bg, border: `2px solid ${config.border}` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: config.color + "22" }}
            >
              <Icon size={28} style={{ color: config.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {t(result.prediction)}
              </div>
              <div className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
                {config.urgency[lang] || config.urgency.en}
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm font-bold mb-1.5" style={{ color: "var(--foreground)" }}>
              <span>{t("confidence")}</span>
              <span style={{ color: config.color }}>{result.confidence?.toFixed(1)}%</span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${result.confidence}%`, background: config.color }} />
            </div>
          </div>

          {/* Timeline */}
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold"
            style={{ background: config.color + "18", color: config.color }}
          >
            <AlertCircle size={16} />
            {config.timeline[lang] || config.timeline.en}
          </div>
        </div>

        {/* ── Lasso Overlay Image ─────────────────────────────────────────────── */}
        {imageData && (
          <div className="agri-card mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold" style={{ color: "var(--muted-foreground)" }}>
                {lang === "ne" ? "संक्रमित क्षेत्र पहिचान" : "Infected Region Detection"}
              </div>
              {hasRegions && (
                <div
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: config.color + "22", color: config.color }}
                >
                  {lang === "ne" ? "लासो ओभरले सक्रिय" : "Lasso Active"}
                </div>
              )}
            </div>

            {hasRegions ? (
              <>
                <LassoOverlay
                  imageData={imageData}
                  regions={result.regions}
                  lassoColor={config.lassoColor}
                  regionLabel={config.regionLabel}
                  lang={lang}
                />
                <div
                  className="mt-2 flex items-start gap-2 p-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: config.color + "15", color: config.color }}
                >
                  <span style={{ fontSize: "1rem" }}>🎯</span>
                  <span>
                    {lang === "ne"
                      ? `${result.regions.length} संक्रमित क्षेत्रहरू पहिचान गरियो — बिन्दुहरूले घेरिएका भागहरू काट्नुहोस् वा नष्ट गर्नुहोस्`
                      : `${result.regions.length} infected region${result.regions.length > 1 ? "s" : ""} detected — trim or remove the dotted-outlined areas`}
                  </span>
                </div>
              </>
            ) : (
              <>
                <img
                  src={imageData}
                  alt="Scanned leaf"
                  className="w-full rounded-xl object-cover"
                  style={{ maxHeight: "280px" }}
                />
                {result.prediction === "Healthy" && (
                  <div
                    className="mt-2 flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--color-healthy-bg)", color: "var(--color-healthy)" }}
                  >
                    <CheckCircle2 size={14} />
                    {lang === "ne" ? "कुनै संक्रमित क्षेत्र फेला परेन — बिरुवा स्वस्थ देखिन्छ!" : "No infected regions found — plant appears healthy!"}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Confidence Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="agri-card mb-4">
            <div className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>
              {t("confidenceBreakdown")}
            </div>
            {Object.entries(breakdown).map(([cls, pct]) => {
              const cfg = DISEASE_CONFIG[cls];
              return (
                <div key={cls} className="mb-2">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span style={{ color: cfg?.color || "var(--foreground)" }}>{t(cls)}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>{Number(pct).toFixed(1)}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${pct}%`, background: cfg?.color || "var(--color-forest)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Treatment Steps */}
        <div className="agri-card mb-4">
          <div className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>
            {t("treatment")}
          </div>
          <ol className="space-y-2">
            {treatments.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: config.color + "22", color: config.color }}
                >
                  {i + 1}
                </span>
                <span style={{ color: "var(--foreground)" }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <RotateCcw size={16} />
            {t("retake")}
          </button>
        </div>
      </div>
    );
  }

  // ── Upload / Camera UI ───────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        {t("scanTitle")}
      </h1>

      {/* Mode Toggle */}
      <div className="flex rounded-xl p-1 mb-5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
        {[
          { id: "upload", label: t("uploadPhoto"), icon: Upload },
          { id: "camera", label: t("takePhoto"), icon: Camera },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id); if (id === "camera") startCamera(); else stopCamera(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: mode === id ? "var(--color-forest)" : "transparent",
              color: mode === id ? "oklch(0.97 0.01 80)" : "var(--muted-foreground)",
              border: "none",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Camera Mode */}
      {mode === "camera" && (
        <div className="mb-5">
          {cameraActive ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ background: "#000" }}>
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full rounded-2xl"
                style={{ maxHeight: "320px", objectFit: "cover" }}
              />
              {/* Leaf guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-48 h-48 rounded-full"
                  style={{
                    border: "2px dashed oklch(0.97 0.01 80 / 0.7)",
                    boxShadow: "0 0 0 9999px oklch(0.18 0.02 250 / 0.35)",
                  }}
                />
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 p-3 text-center text-xs font-semibold"
                style={{ background: "oklch(0.18 0.02 250 / 0.6)", color: "oklch(0.97 0.01 80)" }}
              >
                {lang === "ne" ? "पातलाई गोलोभित्र राख्नुहोस्" : "Place leaf inside the circle"}
              </div>
              <button
                onClick={capturePhoto}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "oklch(0.97 0.01 80)",
                  border: "4px solid oklch(0.97 0.01 80 / 0.5)",
                  boxShadow: "0 4px 16px oklch(0.18 0.02 250 / 0.4)",
                }}
              >
                <Camera size={24} style={{ color: "var(--color-forest-dark)" }} />
              </button>
              <button
                onClick={stopCamera}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.18 0.02 250 / 0.6)", border: "none" }}
              >
                <X size={16} style={{ color: "oklch(0.97 0.01 80)" }} />
              </button>
            </div>
          ) : (
            <button
              onClick={startCamera}
              className="w-full flex flex-col items-center justify-center gap-3 py-12 rounded-2xl"
              style={{ background: "var(--secondary)", border: "2px dashed var(--border)" }}
            >
              <Camera size={40} style={{ color: "var(--color-forest)" }} />
              <span className="font-bold text-sm" style={{ color: "var(--color-forest)" }}>
                {lang === "ne" ? "क्यामेरा खोल्नुहोस्" : "Open Camera"}
              </span>
            </button>
          )}
          <canvas ref={captureCanvasRef} className="hidden" />
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && !imageData && (
        <div
          className={`upload-zone flex flex-col items-center justify-center gap-3 py-12 mb-5 ${isDragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--color-healthy-bg)" }}>
            <Upload size={28} style={{ color: "var(--color-forest)" }} />
          </div>
          <div className="text-center">
            <div className="font-bold text-sm mb-1" style={{ color: "var(--color-forest)" }}>{t("dragDrop")}</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("orClick")}</div>
          </div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>JPG, PNG — Max 10MB</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview */}
      {imageData && mode === "upload" && (
        <div className="relative mb-5 rounded-2xl overflow-hidden">
          <img
            src={imageData}
            alt="Leaf preview"
            className="w-full object-cover rounded-2xl"
            style={{ maxHeight: "280px" }}
          />
          <button
            onClick={() => { setImageData(null); setImageFile(null); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.18 0.02 250 / 0.7)", border: "none" }}
          >
            <X size={16} style={{ color: "oklch(0.97 0.01 80)" }} />
          </button>
        </div>
      )}

      {/* Analyze Button */}
      {imageData && (
        <button
          onClick={analyze}
          disabled={predictMutation.isPending}
          className="btn-primary w-full mb-3"
          style={{ fontSize: "1.05rem" }}
        >
          {predictMutation.isPending ? (
            <><Loader2 size={20} className="animate-spin" />{t("analyzing")}</>
          ) : (
            <><CheckCircle2 size={20} />{t("analyzeButton")}</>
          )}
        </button>
      )}

      {/* Model not ready warning */}
      {result?.model_ready === false && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl mt-3"
          style={{ background: "var(--color-warning-bg)", border: "1.5px solid var(--color-warning-agri)" }}
        >
          <AlertTriangle size={18} style={{ color: "var(--color-warning-agri)", flexShrink: 0 }} />
          <div className="text-sm" style={{ color: "var(--foreground)" }}>{result.error}</div>
        </div>
      )}

      {/* Tips */}
      <div className="agri-card mt-4">
        <div className="text-xs font-bold mb-2" style={{ color: "var(--muted-foreground)" }}>
          {lang === "ne" ? "राम्रो नतिजाको लागि सुझाव" : "Tips for best results"}
        </div>
        <ul className="space-y-1">
          {(lang === "ne" ? [
            "🌿 एउटा पात स्पष्ट रूपमा देखिने गरी फोटो खिच्नुहोस्",
            "☀️ राम्रो प्रकाशमा फोटो खिच्नुहोस्",
            "📏 पातलाई नजिकबाट खिच्नुहोस्",
            "🚫 धमिलो वा अस्पष्ट फोटो नखिच्नुहोस्",
          ] : [
            "🌿 Capture one leaf clearly in frame",
            "☀️ Take photo in good lighting",
            "📏 Get close to the leaf",
            "🚫 Avoid blurry or dark photos",
          ]).map((tip, i) => (
            <li key={i} className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
