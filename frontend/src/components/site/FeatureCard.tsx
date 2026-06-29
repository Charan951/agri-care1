import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

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
      <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-brand transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {to && (
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors group-hover:text-brand/85">
          Learn more <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      )}
    </>
  );
  
  const base = "card-soft block p-6 group h-full text-left";

  if (to) {
    return (
      <Link to={to} className="h-full block">
        <motion.div
          whileHover={{ y: -6, scale: 1.015, boxShadow: "var(--shadow-lift)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={base}
        >
          {inner}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01, boxShadow: "var(--shadow-lift)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={base}
    >
      {inner}
    </motion.div>
  );
}
