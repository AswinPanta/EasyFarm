import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useSupabaseAuth } from "../contexts/SupabaseAuthContext";
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { t, i18n } = useTranslation();
  const { signUp } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const lang = i18n.language;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error(lang === "ne" ? "सबै फिल्ड भर्नुहोस्" : "Please fill all fields");
      return;
    }
    if (password.length < 6) {
      toast.error(lang === "ne" ? "पासवर्ड कम्तिमा ६ अक्षर हुनुपर्छ" : "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      toast.error(error.message || (lang === "ne" ? "दर्ता असफल" : "Registration failed"));
    } else {
      toast.success(lang === "ne" ? "खाता बनाइयो! इमेल जाँच गर्नुहोस्।" : "Account created! Check your email to verify.");
      navigate("/login");
    }
  };

  const inputStyle = {
    background: "var(--secondary)",
    border: "1.5px solid var(--border)",
    color: "var(--foreground)",
    outline: "none",
  };

  return (
    <div className="page-container flex flex-col justify-center" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div className="flex flex-col items-center mb-8">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663385121564/uDlNDITTbxMXXOWq.png" alt="PotatoDoc" className="w-20 h-20 rounded-full mb-3 object-cover"
          style={{ border: "3px solid var(--color-forest)", boxShadow: "0 4px 16px oklch(0.32 0.10 145 / 0.25)" }} />
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-forest)" }}>{t("appName")}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {lang === "ne" ? "नयाँ खाता बनाउनुहोस्" : "Create a new account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="agri-card">
        <h2 className="text-lg font-bold mb-5" style={{ color: "var(--foreground)" }}>
          {lang === "ne" ? "दर्ता गर्नुहोस्" : "Register"}
        </h2>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--foreground)" }}>
            {lang === "ne" ? "पूरा नाम" : "Full Name"}
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder={lang === "ne" ? "तपाईंको नाम" : "Your full name"}
              className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium" style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--color-forest)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--foreground)" }}>
            {lang === "ne" ? "इमेल" : "Email"}
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-medium" style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--color-forest)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--foreground)" }}>
            {lang === "ne" ? "पासवर्ड" : "Password"}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
            <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-3 rounded-xl text-sm font-medium" style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--color-forest)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ background: "none", border: "none", color: "var(--muted-foreground)" }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {lang === "ne" ? "कम्तिमा ६ अक्षर" : "Minimum 6 characters"}
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? <><Loader2 size={18} className="animate-spin" />{lang === "ne" ? "दर्ता हुँदैछ..." : "Creating account..."}</>
            : (lang === "ne" ? "दर्ता गर्नुहोस्" : "Create Account")}
        </button>
      </form>

      <p className="text-center text-sm mt-4" style={{ color: "var(--muted-foreground)" }}>
        {lang === "ne" ? "पहिले नै खाता छ?" : "Already have an account?"}{" "}
        <button onClick={() => navigate("/login")} className="font-bold"
          style={{ background: "none", border: "none", color: "var(--color-forest)", textDecoration: "underline" }}>
          {t("login")}
        </button>
      </p>
    </div>
  );
}
