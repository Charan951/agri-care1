import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IMG } from "@/lib/site";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — AgriCare" },
      { name: "description", content: "Register as a farmer on AgriCare." },
    ],
  }),
  component: Register,
});

function Register() {
  const [type, setType] = useState<"farmer" | "merchant">("farmer");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [land, setLand] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { registerFarmer, user, isAuthenticated, loading: authLoading } = useAuth();
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

    if (type === "merchant") {
      toast.error("Merchant self-registration is disabled. Merchant accounts must be created by the Admin.");
      return;
    }

    setLoading(true);
    const result = await registerFarmer({
      name,
      email,
      password,
      mobile,
      workingRegion: state,
      landAcres: Number(land) || 0
    });
    setLoading(false);

    if (result.success) {
      toast.success("Account created successfully!");
      navigate({ to: '/dashboard' });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground"><Leaf className="h-5 w-5" /></span>
            AgriCare
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free for farmers. Merchant accounts are created by administrators.</p>

          <div className="mt-8 grid grid-cols-2 gap-2 rounded-lg border border-border p-1 text-sm">
            <button onClick={() => setType("farmer")} className={`rounded-md px-3 py-2 font-semibold ${type === "farmer" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Farmer</button>
            <button onClick={() => setType("merchant")} className={`rounded-md px-3 py-2 font-semibold ${type === "merchant" ? "bg-brand text-brand-foreground animate-pulse" : "text-muted-foreground"}`}>Merchant</button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {type === "farmer" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">Full name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Mobile</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">State</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Land (acres)</label>
                    <input
                      type="number"
                      required
                      placeholder="2.5"
                      value={land}
                      onChange={(e) => setLand(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  </div>
                </div>
                 <div>
                   <label className="text-sm font-semibold">Password</label>
                   <div className="relative mt-1.5">
                     <input
                       type={showPassword ? "text" : "password"}
                       required
                       placeholder="At least 8 characters"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="h-11 w-full rounded-lg border border-border bg-card pl-4 pr-11 text-sm outline-none focus:ring-2 focus:ring-ring/40"
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
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--brand)]" />
                  I agree to the <Link to="/terms" className="text-brand hover:underline">terms</Link> and <Link to="/privacy" className="text-brand hover:underline">privacy policy</Link>.
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </>
            ) : (
              <div className="rounded-lg border border-red-200/50 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
                <p className="font-semibold">Self-Registration Restricted</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  In order to maintain strict marketplace compliance and protect farmers from fraudulent traders, Merchant registrations are not permitted publicly.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Please contact the AgriCare Platform Administrator directly at <span className="font-semibold">admin@agricare.com</span> to submit your business details, GSTIN, and register your storefront.
                </p>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img src={IMG.organic} alt="" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
