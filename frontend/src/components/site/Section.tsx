import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("section-y", className)}>
      <motion.div 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="container-page"
      >
        {children}
      </motion.div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 100, damping: 22 }}
      className={cn("max-w-2xl text-left", align === "center" && "mx-auto text-center")}
    >
      {eyebrow && (
        <span className="eyebrow inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold text-xs tracking-wider mb-2">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </motion.div>
  );
}
