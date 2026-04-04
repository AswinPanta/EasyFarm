import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, CloudOff, Cloud } from "lucide-react";

export default function OfflineIndicator() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-bold tracking-wide text-white transition-all duration-300`}
      style={{
        background: isOnline
          ? "var(--color-info)"
          : "oklch(0.45 0.02 250)",
      }}
    >
      {isOnline ? (
        <>
          <Cloud size={13} />
          <span>{t("synced")} — {t("online")}</span>
        </>
      ) : (
        <>
          <CloudOff size={13} />
          <span>{t("savedLocally")} — {t("offline")}</span>
        </>
      )}
    </div>
  );
}
