import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IMG } from "@/lib/site";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriCare" },
      { name: "description", content: "Sign in to your AgriCare account." },
    ],
  }),
  component: Login,
});

function Login() {
  const [tab, setTab] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_USER') {
        navigate({ to: '/admin' });
      } else if (user.role === 'FARMER') {
        navigate({ to: '/dashboard' });
      } else if (user.role === 'AGRI_SPECIALIST') {
        navigate({ to: '/specialist' });
      } else if (user.role === 'MERCHANT') {
        navigate({ to: '/merchant' });
      }
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "otp") {
      toast.info("Mobile OTP authentication is a demo feature. Please sign in with email and password.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      
      // Fetch me is done automatically in AuthProvider, check role to navigate
      // Wait a tick to let state update or redirect directly based on email/role
      setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            const role = data.user?.role;
            if (role === 'ADMIN' || role === 'SUPER_USER') {
              navigate({ to: '/admin' });
            } else if (role === 'FARMER') {
              navigate({ to: '/dashboard' });
            } else if (role === 'AGRI_SPECIALIST') {
              navigate({ to: '/specialist' });
            } else if (role === 'MERCHANT') {
              navigate({ to: '/merchant' });
            } else {
              navigate({ to: '/' });
            }
          } else {
            navigate({ to: '/' });
          }
        } catch (err) {
          navigate({ to: '/' });
        }
      }, 100);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <img src={IMG.loginSide} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-3xl font-bold leading-tight">Smarter farms, better seasons.</p>
          <p className="mt-3 max-w-md text-sm text-white/90">Join 50,000+ farmers growing with AI-powered advisory.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground"><Leaf className="h-5 w-5" /></span>
            AgriCare
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>

          <div className="mt-8 flex rounded-lg border border-border p-1 text-sm">
            <button onClick={() => setTab("email")} className={`flex-1 rounded-md px-3 py-2 font-semibold ${tab === "email" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Email</button>
            <button onClick={() => setTab("otp")} className={`flex-1 rounded-md px-3 py-2 font-semibold ${tab === "otp" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>OTP</button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {tab === "email" ? (
              <>
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">Password</label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-brand hover:underline">Forgot?</Link>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-card pl-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-ring/40"
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
              </>
            ) : (
              <div>
                <label className="text-sm font-semibold">Mobile number</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="+91 98765 43210"
                />
                <p className="mt-2 text-xs text-muted-foreground">We'll send a 6-digit OTP via SMS.</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : tab === "email" ? "Sign in" : "Send OTP"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to AgriCare?{" "}
            <Link to="/register" className="font-semibold text-brand hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
