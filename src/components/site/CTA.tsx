import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA({
  title = "Ready to grow with AgriSphere?",
  description = "Join 50,000+ farmers, agronomists, and merchants building the future of Indian agriculture.",
  primary = { label: "Get started", to: "/register" as const },
  secondary = { label: "Talk to an expert", to: "/contact" as const },
}: {
  title?: string;
  description?: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="section-y">
      <div className="container-page">
        <div className="rounded-2xl border border-border bg-card p-10 shadow-card sm:p-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                to={primary.to}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
              >
                {primary.label} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={secondary.to}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {secondary.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
