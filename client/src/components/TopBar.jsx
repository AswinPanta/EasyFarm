import { useTranslation } from "react-i18next";
import { useSupabaseAuth } from "../contexts/SupabaseAuthContext";
import { useLocation } from "wouter";
import { useState } from "react";
import { Sun, Contrast, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { user, signOut, isAuthenticated } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const [highContrast, setHighContrast] = useState(false);

  const toggleLang = () => {
    const newLang = i18n.language === "en" ? "ne" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  const toggleHighContrast = () => {
    setHighContrast(v => !v);
    document.documentElement.classList.toggle("high-contrast");
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t("logoutSuccess"));
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5"
      style={{
        background: "var(--color-forest)",
        boxShadow: "0 2px 8px oklch(0.18 0.02 250 / 0.20)",
      }}
    >
      {/* Logo + Name */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        style={{ background: "none", border: "none" }}
      >
        <img
          src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663385121564/uDlNDITTbxMXXOWq.png"
          alt="PotatoDoc Logo"
          className="w-9 h-9 rounded-full object-cover"
          style={{ border: "2px solid oklch(0.97 0.01 80 / 0.4)" }}
        />
        <div className="flex flex-col leading-none">
          <span
            className="font-bold text-base tracking-tight"
            style={{ color: "oklch(0.97 0.01 80)" }}
          >
            {t("appName")}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(0.85 0.04 145)" }}
          >
            {i18n.language === "ne" ? "आलु रोग पहिचान" : "Potato Disease AI"}
          </span>
        </div>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          title={highContrast ? "Normal Mode" : "High Contrast (Outdoor)"}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: highContrast ? "oklch(0.97 0.01 80 / 0.2)" : "transparent",
            color: "oklch(0.97 0.01 80)",
            border: "none",
          }}
        >
          <Contrast size={18} />
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={{
            background: "oklch(0.97 0.01 80 / 0.15)",
            color: "oklch(0.97 0.01 80)",
            border: "1px solid oklch(0.97 0.01 80 / 0.3)",
          }}
        >
          {i18n.language === "en" ? "नेपाली" : "EN"}
        </button>

        {/* Auth */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold"
                style={{
                  background: "oklch(0.97 0.01 80 / 0.15)",
                  color: "oklch(0.97 0.01 80)",
                  border: "1px solid oklch(0.97 0.01 80 / 0.3)",
                }}
              >
                <User size={14} />
                <span className="max-w-[80px] truncate">
                  {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive gap-2">
                <LogOut size={14} />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold"
            style={{
              background: "oklch(0.97 0.01 80)",
              color: "var(--color-forest)",
              border: "none",
            }}
          >
            {t("login")}
          </button>
        )}
      </div>
    </header>
  );
}
