import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Camera, Zap, BookOpen, CloudOff, ChevronRight, Leaf, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const diseases = [
  {
    name: "Healthy",
    icon: CheckCircle2,
    color: "var(--color-healthy)",
    bg: "var(--color-healthy-bg)",
    border: "var(--color-healthy)",
    desc: { en: "No disease detected. Continue regular monitoring.", ne: "कुनै रोग छैन। नियमित निगरानी जारी राख्नुहोस्।" },
  },
  {
    name: "Early Blight",
    icon: AlertTriangle,
    color: "var(--color-warning-agri)",
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-agri)",
    desc: { en: "Fungal disease. Apply fungicide within 7 days.", ne: "ढुसी रोग। ७ दिनभित्र ढुसीनाशक लगाउनुहोस्।" },
  },
  {
    name: "Late Blight",
    icon: AlertCircle,
    color: "var(--color-critical)",
    bg: "var(--color-critical-bg)",
    border: "var(--color-critical)",
    desc: { en: "Critical! Treat within 2–3 days or crop may perish.", ne: "गम्भीर! २–३ दिनभित्र उपचार नगरे बाली नष्ट हुन सक्छ।" },
  },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const [, navigate] = useLocation();
  const { data: modelStatus } = trpc.detect.modelStatus.useQuery();

  const lang = i18n.language;

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="animate-fadeInUp" style={{ paddingTop: "1.5rem" }}>
        {/* Model Status Badge */}
        <div className="flex justify-center mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: modelStatus?.modelReady ? "var(--color-healthy-bg)" : "var(--color-warning-bg)",
              color: modelStatus?.modelReady ? "var(--color-healthy)" : "var(--color-warning-agri)",
              border: `1px solid ${modelStatus?.modelReady ? "var(--color-healthy)" : "var(--color-warning-agri)"}`,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: modelStatus?.modelReady ? "var(--color-healthy)" : "var(--color-warning-agri)",
                animation: modelStatus?.modelReady ? "none" : "pulse 1.5s infinite",
              }}
            />
            {modelStatus?.modelReady ? t("modelReady") : t("modelTraining")}
          </span>
        </div>

        {/* Hero Card */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: "linear-gradient(135deg, var(--color-forest-dark) 0%, var(--color-forest) 60%, var(--color-forest-light) 100%)",
            boxShadow: "0 8px 32px oklch(0.22 0.08 145 / 0.35)",
          }}
        >
          <div className="p-6 text-center">
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663385121564/uDlNDITTbxMXXOWq.png"
              alt="PotatoDoc"
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              style={{ border: "3px solid oklch(0.97 0.01 80 / 0.5)", boxShadow: "0 4px 16px oklch(0.18 0.02 250 / 0.3)" }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "oklch(0.97 0.01 80)" }}
            >
              {t("heroTitle")}
            </h1>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: "oklch(0.88 0.04 145)" }}
            >
              {t("heroSubtitle")}
            </p>
            <button
              onClick={() => navigate("/scan")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all hover:scale-105 active:scale-95"
              style={{
                background: "oklch(0.97 0.01 80)",
                color: "var(--color-forest-dark)",
                boxShadow: "0 4px 12px oklch(0.18 0.02 250 / 0.25)",
              }}
            >
              <Camera size={20} />
              {t("startScanning")}
            </button>
          </div>
        </div>

        {/* Disease Cards */}
        <h2 className="text-base font-bold mb-3" style={{ color: "var(--foreground)" }}>
          {lang === "ne" ? "पहिचान गर्न सकिने रोगहरू" : "Detectable Diseases"}
        </h2>
        <div className="grid grid-cols-1 gap-3 mb-6">
          {diseases.map(({ name, icon: Icon, color, bg, border, desc }) => (
            <div
              key={name}
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: bg, border: `1.5px solid ${border}` }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: color + "22" }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div className="font-bold text-sm mb-0.5" style={{ color }}>
                  {t(name)}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {desc[lang] || desc.en}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <h2 className="text-base font-bold mb-3" style={{ color: "var(--foreground)" }}>
          {lang === "ne" ? "विशेषताहरू" : "Features"}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Zap, key: "feature1", color: "var(--color-forest)" },
            { icon: BookOpen, key: "feature2", color: "var(--color-warning-agri)" },
            { icon: Camera, key: "feature3", color: "var(--color-info)" },
            { icon: CloudOff, key: "feature4", color: "var(--muted-foreground)" },
          ].map(({ icon: Icon, key, color }) => (
            <div
              key={key}
              className="agri-card flex flex-col gap-2"
              style={{ padding: "1rem" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: color + "18" }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                {t(`${key}Title`)}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                {t(`${key}Desc`)}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/scan")}
          className="w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{
            background: "var(--color-forest)",
            color: "oklch(0.97 0.01 80)",
            border: "none",
          }}
        >
          <span className="flex items-center gap-2">
            <Leaf size={18} />
            {lang === "ne" ? "अहिले स्क्यान गर्नुहोस्" : "Scan a Leaf Now"}
          </span>
          <ChevronRight size={18} />
        </button>
      </section>
    </div>
  );
}
