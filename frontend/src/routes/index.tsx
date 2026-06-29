import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight, Sprout, GraduationCap, Microscope, Truck, ShieldCheck, Star, PlayCircle,
  BrainCircuit, ShoppingBag, BadgeCheck, Droplets, Activity, Sparkles, ChevronRight
} from "lucide-react";
import { IMG } from "@/lib/site";
import { Section, SectionHeader } from "@/components/site/Section";
import { Stats } from "@/components/site/Stats";
import { FeatureCard } from "@/components/site/FeatureCard";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { Newsletter } from "@/components/site/Newsletter";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriCare — AI-powered farming for India" },
      { name: "description", content: "Detect crop disease with AI, buy quality inputs, and consult agronomists — all on one trusted platform." },
      { property: "og:title", content: "AgriCare — AI-powered farming for India" },
      { property: "og:description", content: "Detect crop disease, buy inputs, and consult experts." },
      { property: "og:image", content: IMG.organic },
    ],
  }),
  component: Home,
});

const SERVICES = [
  { icon: BrainCircuit, title: "AI Disease Detection", description: "Snap a leaf, get a diagnosis and treatment plan in under 3 seconds.", to: "/ai-disease-detection" },
  { icon: ShoppingBag, title: "Trusted Marketplace", description: "Seeds, fertilizers, tools and machinery from verified merchants.", to: "/marketplace" },
  { icon: Activity, title: "Weather & Advisory", description: "Hyperlocal forecasts and crop advisory by your village pincode.", to: "/services" },
  { icon: Droplets, title: "Soil Health", description: "Lab-grade soil tests with personalized nutrient recommendations.", to: "/services" },
  { icon: BadgeCheck, title: "Expert Consultation", description: "Talk to certified agronomists in 10+ Indian languages.", to: "/services" },
];

const STEPS = [
  { n: "01", title: "Create your farm profile", body: "Add land size, crops, and location in under 2 minutes." },
  { n: "02", title: "Get AI-powered insights", body: "Daily advisory, disease alerts and market price signals." },
  { n: "03", title: "Act with confidence", body: "Buy inputs or book an expert call." },
];

const TESTIMONIALS = [
  { name: "Ramesh Patil", role: "Cotton farmer, Maharashtra", quote: "AgriCare caught early bollworm in my crop. The advisory saved nearly 40% of my yield this season.", img: IMG.farmer1 },
  { name: "Sunita Devi", role: "Vegetable grower, Bihar", quote: "From soil report to seed selection — everything in one app. My income has nearly doubled.", img: IMG.farmer2 },
  { name: "Karthik R.", role: "Paddy farmer, Tamil Nadu", quote: "The marketplace pricing is fair and delivery is always on time. I trust them completely.", img: IMG.farmer3 },
];

const BLOGS = [
  { tag: "Advisory", title: "5 signs of nitrogen deficiency in paddy fields", read: "6 min read", img: IMG.ricefield },
  { tag: "Technology", title: "How computer vision spots leaf disease before symptoms", read: "8 min read", img: IMG.ai },
  { tag: "Policy", title: "PM-KISAN 2026: what changes for small farmers", read: "5 min read", img: IMG.farmerPhone },
];

const FAQS = [
  { q: "Is AgriCare free for farmers?", a: "Core features — disease detection, advisory, and scheme matching — are free for individual farmers. Premium agronomy and bulk procurement are paid." },
  { q: "Which Indian languages do you support?", a: "Hindi, English, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati, Punjabi and Odia, with more on the way." },
  { q: "How accurate is the AI disease detection?", a: "Our models are trained on 2M+ field images across 40 crops and average 96.4% top-1 accuracy across India's agro-climatic zones." },
  { q: "Do you deliver to my village?", a: "We ship across 28 states with last-mile partners. Enter your pincode at checkout to see options." },
];

function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
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
  }, [user, isAuthenticated, loading, navigate]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 15 : 40]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 35 : 100]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  return (
    <>
      {/* HERO */}
      <section 
        ref={containerRef}
        className="relative overflow-hidden border-b border-border bg-card/40 py-16 lg:py-24"
      >
        {/* Animated Background Mesh & Gradients */}
        <motion.div 
          style={{ y: bgY }}
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        />
        
        <motion.div 
          style={{ y: bgY }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.45, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-1/2 -translate-x-1/2 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" 
        />

        <div className="container-page relative z-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
          {/* Left Column */}
          <motion.div 
            style={{ y: textY, opacity }}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="eyebrow inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold text-xs tracking-wider"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AgriTech, designed for India
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 90, damping: 18 }}
              className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] text-foreground"
            >
              AI-powered farming, <br />
              <span className="bg-gradient-to-r from-brand via-emerald-600 to-green-600 bg-clip-text text-transparent">end to end.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 90, damping: 18 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
            >
              Detect crop disease in seconds, buy quality inputs from verified merchants,
              and consult certified agronomists — all from a single trusted platform.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 90, damping: 18 }}
              className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-brand-foreground hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                Start free <ArrowRight className="h-4.5 w-4.5" />
              </Link>
              <Link to="/ai-disease-detection" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-bold hover:bg-muted hover:scale-[1.02] active:scale-[0.98] transition-all">
                <PlayCircle className="h-4.5 w-4.5 text-brand" /> See it in action
              </Link>
            </motion.div>

            {/* Quick trust metrics grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-10 w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3"
            >
              {[
                { icon: ShieldCheck, title: "ISO 27001 Secure" },
                { icon: Microscope, title: "96.4% Accuracy" },
                { icon: Truck, title: "Pan-India Delivery" },
                { icon: BadgeCheck, title: "Verified Inputs" }
              ].map((metric, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-xs hover:border-brand/35 transition-colors text-left">
                  <metric.icon className="h-4.5 w-4.5 text-brand shrink-0" />
                  <span className="font-bold text-[10px] text-foreground tracking-tight">{metric.title}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Desktop Header Image (hidden on mobile) */}
          <motion.div 
            style={{ y: imageY }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 80, damping: 18 }}
            className="relative hidden lg:block"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-lift">
              <img
                src={IMG.heroDrone}
                alt="AgriCare drone mapping farmland"
                className="aspect-[4/3] w-full object-cover animate-[pulse_6s_infinite_alternate]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Floating scanned badge with hover motion */}
            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="absolute -bottom-5 -left-5 rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3 text-left"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-brand"><BrainCircuit className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold text-foreground">AI Leaf Diagnosis</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Late Blight · 96.4% confidence</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <Section>
        <Stats
          items={[
            { value: "50K+", label: "Farmers onboard" },
            { value: "2M+", label: "Scans processed" },
            { value: "1,200+", label: "Merchants" },
            { value: "₹120Cr", label: "GMV facilitated" },
          ]}
        />
      </Section>

      {/* SERVICES */}
      <Section className="!pt-0">
        <SectionHeader
          eyebrow="What we offer"
          title="Everything a modern farm needs, in one place."
          description="Production-grade tools that work on a ₹5,000 smartphone — built with and for India's farming community."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <FeatureCard key={s.title} {...s} />
          ))}
        </div>
      </Section>

      {/* AI DETECTION PREVIEW */}
      <Section className="!pt-0">
        <div className="grid items-center gap-12 rounded-2xl border border-border bg-card p-8 shadow-card lg:grid-cols-2 lg:p-14">
          <div className="text-left">
            <span className="eyebrow">AI Disease Detection</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Spot disease before it spreads.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Upload a photo of any leaf. Our computer-vision models trained on 2M+ field images return a diagnosis,
              severity score and treatment plan in under 3 seconds — even on a 2G connection.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["40+ crops supported", "96.4% top-1 accuracy", "Offline-first mobile app", "Treatment in 10 Indian languages"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}</li>
              ))}
            </ul>
            <Link to="/ai-disease-detection" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 transition-all">
              Try the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border bg-muted shadow-soft">
            <img src={IMG.ai} alt="AI crop diagnosis" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
      </Section>

      {/* MARKETPLACE PREVIEW */}
      <Section className="!pt-0">
        <SectionHeader
          eyebrow="Marketplace"
          title="Trusted inputs, fair prices."
          description="From hybrid seeds to drip systems — every listing is verified and price-matched."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Seeds & Saplings", img: IMG.vegetables, count: "1,240 SKUs" },
            { title: "Fertilizers", img: IMG.organic, count: "860 SKUs" },
            { title: "Equipment", img: IMG.equipment, count: "420 SKUs" },
            { title: "Irrigation", img: IMG.irrigation, count: "310 SKUs" },
          ].map((c) => (
            <Link to="/marketplace" key={c.title} className="card-soft card-soft-hover group overflow-hidden block">
              <div className="overflow-hidden">
                <img src={c.img} alt={c.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5 text-left">
                <p className="text-sm text-muted-foreground">{c.count}</p>
                <p className="mt-1 text-base font-semibold text-foreground group-hover:text-brand transition-colors">{c.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* AGRICULTURE SPECIALISTS PREVIEW */}
      <Section className="!pt-0">
        <div className="flex items-end justify-between gap-6">
          <SectionHeader
            eyebrow="Agriculture Specialists"
            title="Expert advice when you need it."
            description="Connect with certified agronomists in your language for personalized consultation."
          />
          <Link to="/agriculture-specialists" className="hidden text-sm font-semibold text-brand hover:underline sm:inline-flex items-center gap-0.5">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Dr. Anika Sharma", qualification: "Ph.D. in Agronomy", experience: "12 years", specialization: ["Crop Disease", "Soil Health"], rating: 4.9, img: IMG.team1, location: "Punjab" },
            { name: "Rajesh Patel", qualification: "M.Sc. in Horticulture", experience: "8 years", specialization: ["Vegetables", "Fruits"], rating: 4.8, img: IMG.team2, location: "Gujarat" },
            { name: "Priya Iyer", qualification: "Ph.D. in Plant Pathology", experience: "10 years", specialization: ["Rice", "Wheat"], rating: 4.95, img: IMG.team3, location: "Tamil Nadu" },
          ].map((s) => (
            <Link to="/agriculture-specialists" key={s.name} className="card-soft card-soft-hover overflow-hidden group block text-left">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <img src={s.img} alt={s.name} className="h-16 w-16 rounded-full object-cover border" />
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.qualification}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.specialization.slice(0, 2).map((spec) => (
                        <span key={spec} className="text-[10px] rounded-full bg-accent px-2 py-0.5 text-accent-foreground font-semibold">{spec}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {s.rating}
                  </div>
                  <div className="text-muted-foreground text-xs">{s.location}</div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{s.experience} experience</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="!pt-0">
        <SectionHeader eyebrow="How it works" title="Three steps to a smarter farm." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card-soft p-7 text-left">
              <span className="text-sm font-extrabold text-brand bg-brand/10 px-2.5 py-1 rounded-lg">{s.n}</span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* WHY US */}
      <Section className="!pt-0">
        <SectionHeader eyebrow="Why AgriCare" title="Built like enterprise software. Priced for farmers." align="center" />
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Bank-grade security", description: "ISO 27001 and SOC 2 Type II controls protect every farm record." },
            { icon: Microscope, title: "Real research", description: "Models validated with ICAR and 4 state agricultural universities." },
            { icon: GraduationCap, title: "Always learning", description: "Free training in 10 languages — over 250 hours of content." },
          ].map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="!pt-0">
        <SectionHeader eyebrow="Loved by farmers" title="What growers say." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card-soft p-7 text-left flex flex-col justify-between">
              <div>
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="mt-4 text-[14px] leading-relaxed text-foreground font-medium italic">"{t.quote}"</blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                <img src={t.img} alt="" className="h-10 w-10 rounded-full object-cover border" />
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
