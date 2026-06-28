import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — AgriCare" },
      { name: "description", content: "Register as a farmer or merchant on AgriCare." },
    ],
  }),
  component: Register,
});

function Register() {
  const [type, setType] = useState<"farmer" | "merchant">("farmer");
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground"><Leaf className="h-5 w-5" /></span>
            AgriCare
          </Link>
          <h1 className="mt-8 text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free for farmers. Merchant accounts are reviewed in 3 working days.</p>

          <div className="mt-8 grid grid-cols-2 gap-2 rounded-lg border border-border p-1 text-sm">
            <button onClick={() => setType("farmer")} className={`rounded-md px-3 py-2 font-semibold ${type === "farmer" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Farmer</button>
            <button onClick={() => setType("merchant")} className={`rounded-md px-3 py-2 font-semibold ${type === "merchant" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Merchant</button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); toast.success(type === "farmer" ? "Account created!" : "Application submitted for review."); }} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" type="text" />
              <Field label="Mobile" type="tel" placeholder="+91" />
            </div>
            <Field label="Email" type="email" placeholder="you@example.com" />
            {type === "farmer" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="State" type="text" placeholder="e.g. Maharashtra" />
                <Field label="Land (acres)" type="number" placeholder="2.5" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business name" type="text" />
                <Field label="GSTIN" type="text" placeholder="29ABCDE1234F1Z5" />
              </div>
            )}
            <Field label="Password" type="password" placeholder="At least 8 characters" />
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--brand)]" />
              I agree to the <Link to="/terms" className="text-brand hover:underline">terms</Link> and <Link to="/privacy" className="text-brand hover:underline">privacy policy</Link>.
            </label>
            <button type="submit" className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:bg-brand/90">
              {type === "farmer" ? "Create account" : "Request merchant access"}
            </button>
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

function Field({ label, type, placeholder }: { label: string; type: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        type={type}
        required
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}
