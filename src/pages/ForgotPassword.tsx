import { useState } from "react";
import { motion } from "framer-motion";
import { Package, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email"); return; }
    setLoading(true);
    setError("");
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, hsl(153 55% 23%) 0%, hsl(153 55% 15%) 50%, hsl(153 40% 10%) 100%)" }}>
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")` }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="bg-card rounded-xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg">
              <Package className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted-foreground font-myanmar">စကားဝှက်အသစ်ပြန်လည်သတ်မှတ်ရန်</p>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <p className="font-semibold">Reset Link Sent!</p>
              <p className="text-sm text-muted-foreground">Check your email for the password reset link.</p>
              <p className="text-xs text-muted-foreground font-myanmar">စကားဝှက်ပြန်သတ်မှတ်ရန်လင့်ခ်ကို သင်၏အီးမေးလ်တွင် စစ်ဆေးပါ။</p>
              <button onClick={() => navigate("/login")} className="w-full gold-button py-2.5">Back to Login</button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">{error}</div>
              )}
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="your@email.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full gold-button py-2.5 flex items-center justify-center gap-2 disabled:opacity-70">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
              <button type="button" onClick={() => navigate("/login")} className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
