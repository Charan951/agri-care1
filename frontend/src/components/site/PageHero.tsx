import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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
  const containerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Create scroll parallax effect for the hero image, text, and decorative background
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Balanced responsive parallax ranges to prevent overlap on stacked mobile screens
  const textY = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 15 : 40]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 25 : 80]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 35 : 100]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  return (
    <section 
      ref={containerRef}
      className={cn("relative overflow-hidden border-b border-border bg-card/60 backdrop-blur-xs", compact ? "py-12" : "py-16 md:py-24 lg:py-28")}
    >
      {/* Decorative animated mesh grids for parallax parallel motion */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
      />
      <motion.div 
        style={{ y: bgY }}
        className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-brand/5 blur-3xl" 
      />
      
      <div className="container-page relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div 
            style={{ y: textY, opacity }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="max-w-xl flex flex-col items-center lg:items-start text-center lg:text-left mx-auto lg:mx-0"
          >
            {eyebrow && (
              <span className="eyebrow inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold text-xs tracking-wider">
                {eyebrow}
              </span>
            )}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
              {title}
            </h1>
            {description && (
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">{description}</p>
            )}
            {actions && (
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3 w-full">
                {actions}
              </div>
            )}
          </motion.div>
          
          {image && (
            <motion.div 
              style={{ y: imageY }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 90, damping: 18 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-lift w-full max-w-lg mx-auto"
            >
              <img
                src={image}
                alt={imageAlt ?? ""}
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
