import { useState } from "react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="border-y border-border bg-accent/40">
      <div className="container-page py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Get the AgriSphere weekly
          </h3>
          <p className="mt-3 text-muted-foreground">
            Crop advisories, market prices, scheme alerts, and product launches — straight to your inbox.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              toast.success("Subscribed! Check your inbox to confirm.");
              setEmail("");
            }}
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">Email</label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 flex-1 rounded-lg border border-border bg-background px-4 text-sm outline-none ring-ring/40 placeholder:text-muted-foreground focus:ring-2"
            />
            <button
              type="submit"
              className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
