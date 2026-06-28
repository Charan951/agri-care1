import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — AgriCare" },
      { name: "description", content: "Reset your AgriCare password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground"><Leaf className="h-5 w-5" /></span>
          AgriCare
        </Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>

        <form onSubmit={(e) => { e.preventDefault(); toast.success("Check your inbox for the reset link."); }} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input type="email" required className="mt-1.5 h-11 w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40" placeholder="you@example.com" />
          </div>
          <button type="submit" className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-brand-foreground hover:bg-brand/90">Send reset link</button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it? <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
