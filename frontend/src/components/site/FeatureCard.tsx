import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: string;
}) {
  const inner = (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {to && (
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Learn more <ArrowUpRight className="h-4 w-4" />
        </span>
      )}
    </>
  );
  const base = "card-soft card-soft-hover block p-6";
  if (to) return <Link to={to} className={base}>{inner}</Link>;
  return <div className={base}>{inner}</div>;
}
