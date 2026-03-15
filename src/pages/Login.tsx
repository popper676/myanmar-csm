import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<"en" | "mm">("en");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const t = {
    en: { login: "Login", email: "Username / Email", password: "Password", forgot: "Forgot password?", remember: "Remember me", subtitle: "Supply Chain Management System" },
    mm: { login: "မှတ်ပုံတင်ဝင်ရောက်မည်", email: "အသုံးပြုသူအမည် / အီးမေးလ်", password: "စကားဝှက်", forgot: "စကားဝှက်မေ့နေသည်", remember: "မှတ်ထားမည်", subtitle: "ထောက်ပံ့ရေးကွင်းဆက် စီမံခန့်ခွဲမှုစနစ်" },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(153 55% 23%) 0%, hsl(153 55% 15%) 50%, hsl(153 40% 10%) 100%)" }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")` }} />

      <div className="absolute top-4 right-4">
        <button onClick={() => setLang(lang === "en" ? "mm" : "en")} className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" style={{ background: "hsla(0,0%,100%,0.15)", color: "hsl(60 24% 96%)" }}>
          {lang === "en" ? "မြန်မာဘာသာ" : "English"}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <form onSubmit={handleLogin} className="bg-card rounded-xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg">
              <Package className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-xl font-bold">Myanmar SCM</h1>
            <p className={`text-sm text-muted-foreground ${lang === "mm" ? "font-myanmar" : ""}`}>{t[lang].subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${lang === "mm" ? "font-myanmar" : ""}`}>{t[lang].email}</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="admin" />
            </div>
            <div>
              <label className={`text-sm font-medium ${lang === "mm" ? "font-myanmar" : ""}`}>{t[lang].password}</label>
              <div className="relative">
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} className="w-full mt-1 px-3 py-2.5 pr-10 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground mt-0.5">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                <span className={lang === "mm" ? "font-myanmar" : ""}>{t[lang].remember}</span>
              </label>
              <button type="button" onClick={() => navigate("/forgot-password")} className={`text-sm text-accent hover:underline ${lang === "mm" ? "font-myanmar" : ""}`}>
                {t[lang].forgot}
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full gold-button py-2.5 text-center font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span className={lang === "mm" ? "font-myanmar" : ""}>{t[lang].login}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
