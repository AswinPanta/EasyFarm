import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  const { i18n } = useTranslation();
  const [, navigate] = useLocation();
  const lang = i18n.language;

  return (
    <div className="page-container flex flex-col items-center justify-center text-center" style={{ minHeight: "60vh" }}>
      <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663385121564/uDlNDITTbxMXXOWq.png" alt="PotatoDoc" className="w-20 h-20 rounded-full mb-4 object-cover opacity-50" />
      <h1 className="text-6xl font-bold mb-2" style={{ color: "var(--color-forest)" }}>404</h1>
      <p className="text-lg font-bold mb-1" style={{ color: "var(--foreground)" }}>
        {lang === "ne" ? "पृष्ठ फेला परेन" : "Page Not Found"}
      </p>
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ne" ? "तपाईंले खोज्नुभएको पृष्ठ अवस्थित छैन।" : "The page you're looking for doesn't exist."}
      </p>
      <button onClick={() => navigate("/")} className="btn-primary">
        <Home size={18} />
        {lang === "ne" ? "गृहपृष्ठमा जानुहोस्" : "Go Home"}
      </button>
    </div>
  );
}
