import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "../contexts/SupabaseAuthContext";
import { CheckCircle2, AlertTriangle, AlertCircle, Trash2, Camera, Calendar, MapPin, Cloud, HardDrive } from "lucide-react";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  healthy:  { icon: CheckCircle2, color: "var(--color-healthy)",      bg: "var(--color-healthy-bg)",  label: "Healthy" },
  warning:  { icon: AlertTriangle, color: "var(--color-warning-agri)", bg: "var(--color-warning-bg)",  label: "Warning" },
  critical: { icon: AlertCircle,   color: "var(--color-critical)",     bg: "var(--color-critical-bg)", label: "Critical" },
};

function ScanCard({ scan, onDelete, lang }) {
  const { t } = useTranslation();
  const cfg = SEVERITY_CONFIG[scan.severity] || SEVERITY_CONFIG.healthy;
  const Icon = cfg.icon;
  const date = new Date(scan.createdAt);

  return (
    <div
      className="agri-card mb-3 animate-fadeInUp"
      style={{ borderLeft: `4px solid ${cfg.color}` }}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: cfg.bg }}
        >
          {scan.imageUrl ? (
            <img src={scan.imageUrl} alt="scan" className="w-full h-full object-cover" />
          ) : (
            <Icon size={24} style={{ color: cfg.color }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div
              className="font-bold text-sm"
              style={{ color: cfg.color }}
            >
              {t(scan.prediction)}
            </div>
            <button
              onClick={() => onDelete(scan.id)}
              className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
              style={{ background: "none", border: "none", color: "var(--muted-foreground)" }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="confidence-bar flex-1" style={{ height: "6px" }}>
              <div
                className="confidence-fill"
                style={{ width: `${scan.confidence}%`, background: cfg.color }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: cfg.color }}>
              {scan.confidence?.toFixed(0)}%
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Calendar size={11} />
              {date.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
                month: "short", day: "numeric", year: "numeric"
              })}
            </span>
            {scan.location && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <MapPin size={11} />
                {scan.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: scan.synced === "synced" ? "var(--color-info)" : "var(--muted-foreground)" }}>
              {scan.synced === "synced" ? <Cloud size={11} /> : <HardDrive size={11} />}
              {scan.synced === "synced" ? t("synced") : t("savedLocally")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const lang = i18n.language;

  const { data: scans, isLoading, refetch } = trpc.scans.list.useQuery(
    { userId: user?.id },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.scans.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success(lang === "ne" ? "स्क्यान मेटियो" : "Scan deleted");
    },
  });

  const handleDelete = (id) => {
    if (confirm(lang === "ne" ? "के तपाईं यो स्क्यान मेट्न चाहनुहुन्छ?" : "Delete this scan?")) {
      deleteMutation.mutate({ id, userId: user?.id });
    }
  };

  // Stats
  const total = scans?.length || 0;
  const healthy = scans?.filter(s => s.severity === "healthy").length || 0;
  const diseased = scans?.filter(s => s.severity !== "healthy").length || 0;
  const lastScan = scans?.[0]?.createdAt;

  if (!isAuthenticated) {
    return (
      <div className="page-container flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--color-healthy-bg)" }}
        >
          <Camera size={36} style={{ color: "var(--color-forest)" }} />
        </div>
        <h2 className="text-lg font-bold mb-2 text-center" style={{ color: "var(--foreground)" }}>
          {lang === "ne" ? "इतिहास हेर्न लग इन गर्नुहोस्" : "Login to View History"}
        </h2>
        <p className="text-sm text-center mb-5" style={{ color: "var(--muted-foreground)" }}>
          {lang === "ne"
            ? "आफ्ना स्क्यान इतिहास सुरक्षित राख्न खाता बनाउनुहोस्।"
            : "Create an account to save and track your scan history."}
        </p>
        <button onClick={() => navigate("/login")} className="btn-primary">
          {t("login")}
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
        {t("historyTitle")}
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: t("totalScans"), value: total, color: "var(--color-forest)" },
          { label: t("healthyCount"), value: healthy, color: "var(--color-healthy)" },
          { label: t("blightCount"), value: diseased, color: "var(--color-critical)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="agri-card text-center"
            style={{ padding: "0.75rem 0.5rem" }}
          >
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Last Scan */}
      {lastScan && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-semibold"
          style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}
        >
          <Calendar size={14} />
          {t("lastScan")}: {new Date(lastScan).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", {
            weekday: "short", month: "short", day: "numeric", year: "numeric"
          })}
        </div>
      )}

      {/* Scan List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="agri-card animate-pulse" style={{ height: "88px" }} />
          ))}
        </div>
      ) : !scans?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--secondary)" }}
          >
            <Camera size={28} style={{ color: "var(--muted-foreground)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
            {t("noHistory")}
          </p>
          <button
            onClick={() => navigate("/scan")}
            className="btn-primary mt-4"
            style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}
          >
            {t("startScanning")}
          </button>
        </div>
      ) : (
        <div>
          {scans.map(scan => (
            <ScanCard key={scan.id} scan={scan} onDelete={handleDelete} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
