import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Home, Camera, ClipboardList, BarChart2 } from "lucide-react";

const navItems = [
  { path: "/",        icon: Home,          key: "home" },
  { path: "/scan",    icon: Camera,        key: "scan" },
  { path: "/history", icon: ClipboardList, key: "history" },
  { path: "/metrics", icon: BarChart2,     key: "metrics" },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, key }) => {
        const isActive = location === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`nav-item ${isActive ? "active" : ""}`}
            style={{ background: "none", border: "none" }}
            aria-label={t(key)}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              style={{ color: isActive ? "var(--color-forest)" : "var(--muted-foreground)" }}
            />
            <span style={{ color: isActive ? "var(--color-forest)" : "var(--muted-foreground)" }}>
              {t(key)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
