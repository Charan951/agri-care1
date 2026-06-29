import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Eye, EyeOff, KeyRound, Mail, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — AgriCare" },
      { name: "description", content: "Reset your AgriCare password using email OTP." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "OTP sent successfully to your email.");
        setStep(2);
      } else {
        toast.error(data.message || "Failed to send reset OTP.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Password reset successful!");
        navigate({ to: "/login" });
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-card/10 px-6 py-16 text-left">
      <div className="w-full max-w-sm border border-border bg-card p-8 rounded-2xl shadow-lift space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            AgriCare
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-4">
            {step === 1 ? "Forgot password?" : "Reset your password"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {step === 1 
              ? "Enter your registered email and we'll send a 6-digit verification OTP."
              : `Enter the 6-digit OTP code sent to ${email} to set a new password.`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Send Reset OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" /> 6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm font-semibold tracking-widest text-center outline-none focus:ring-2 focus:ring-ring/40"
                placeholder="000000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background pl-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground hover:text-foreground cursor-pointer border-0 bg-transparent"
                >
                  {showPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:bg-brand/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Reset Password"}
            </button>

            <div className="flex justify-between items-center text-xs mt-3">
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                className="font-semibold text-brand hover:underline border-0 bg-transparent cursor-pointer"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-semibold text-muted-foreground hover:text-foreground border-0 bg-transparent cursor-pointer"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground border-t border-border/60 pt-4">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
