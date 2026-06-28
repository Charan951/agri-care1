import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  actions,
  compact = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  image?: string;
  imageAlt?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("border-b border-border bg-card", compact ? "py-14" : "py-20 md:py-28")}>
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {description && (
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{description}</p>
            )}
            {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
          </div>
          {image && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-card">
              <img
                src={image}
                alt={imageAlt ?? ""}
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
