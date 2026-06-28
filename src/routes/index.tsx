import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, ScanLine, Store, CloudSun, Sprout, Landmark,
  GraduationCap, HeartHandshake, Microscope, Truck, ShieldCheck, Star, PlayCircle,
} from "lucide-react";
import { IMG, HERO_VIDEO } from "@/lib/site";
import { Section, SectionHeader } from "@/components/site/Section";
import { Stats } from "@/components/site/Stats";
import { FeatureCard } from "@/components/site/FeatureCard";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { Newsletter } from "@/components/site/Newsletter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriSphere — AI-powered farming for India" },
      { name: "description", content: "Detect crop disease with AI, buy quality inputs, access schemes, and consult agronomists — all on one trusted platform." },
      { property: "og:title", content: "AgriSphere — AI-powered farming for India" },
      { property: "og:description", content: "Detect crop disease, buy inputs, access schemes, and consult experts." },
      { property: "og:image", content: IMG.heroDrone },
    ],
  }),
  component: Home,
});

const SERVICES = [
  { icon: ScanLine, title: "AI Disease Detection", description: "Snap a leaf, get a diagnosis and treatment plan in under 3 seconds.", to: "/ai-disease-detection" },
  { icon: Store, title: "Trusted Marketplace", description: "Seeds, fertilizers, tools and machinery from verified merchants.", to: "/marketplace" },
  { icon: CloudSun, title: "Weather & Advisory", description: "Hyperlocal forecasts and crop advisory by your village pincode.", to: "/services" },
  { icon: Sprout, title: "Soil Health", description: "Lab-grade soil tests with personalized nutrient recommendations.", to: "/services" },
  { icon: Landmark, title: "Government Schemes", description: "Match, apply, and track Central and State scheme benefits.", to: "/schemes" },
  { icon: HeartHandshake, title: "Expert Consultation", description: "Talk to certified agronomists in 10+ Indian languages.", to: "/services" },
];

const STEPS = [
  { n: "01", title: "Create your farm profile", body: "Add land size, crops, and location in under 2 minutes." },
  { n: "02", title: "Get AI-powered insights", body: "Daily advisory, disease alerts and market price signals." },
  { n: "03", title: "Act with confidence", body: "Buy inputs, apply to schemes, or book an expert call." },
];

const TESTIMONIALS = [
  { name: "Ramesh Patil", role: "Cotton farmer, Maharashtra", quote: "AgriSphere caught early bollworm in my crop. The advisory saved nearly 40% of my yield this season.", img: IMG.farmer1 },
  { name: "Sunita Devi", role: "Vegetable grower, Bihar", quote: "From soil report to seed selection — everything in one app. My income has nearly doubled.", img: IMG.farmer2 },
  { name: "Karthik R.", role: "Paddy farmer, Tamil Nadu", quote: "The marketplace pricing is fair and delivery is always on time. I trust them completely.", img: IMG.farmer3 },
];

const BLOGS = [
  { tag: "Advisory", title: "5 signs of nitrogen deficiency in paddy fields", read: "6 min read", img: IMG.ricefield },
  { tag: "Technology", title: "How computer vision spots leaf disease before symptoms", read: "8 min read", img: IMG.ai },
  { tag: "Policy", title: "PM-KISAN 2026: what changes for small farmers", read: "5 min read", img: IMG.farmerPhone },
];

const FAQS = [
  { q: "Is AgriSphere free for farmers?", a: "Core features — disease detection, advisory, and scheme matching — are free for individual farmers. Premium agronomy and bulk procurement are paid." },
  { q: "Which Indian languages do you support?", a: "Hindi, English, Marathi, Tamil, Telugu, Kannada, Bengali, Gujarati, Punjabi and Odia, with more on the way." },
  { q: "How accurate is the AI disease detection?", a: "Our models are trained on 2M+ field images across 40 crops and average 96.4% top-1 accuracy across India's agro-climatic zones." },
  { q: "Do you deliver to my village?", a: "We ship across 28 states with last-mile partners. Enter your pincode at checkout to see options." },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <span className="eyebrow"><Sprout className="h-3.5 w-3.5" /> AgriTech, designed for India</span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AI-powered farming, <br className="hidden sm:block" />
              <span className="text-brand">end to end.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Detect crop disease in seconds, buy quality inputs from verified merchants, access government schemes,
              and consult certified agronomists — all from a single trusted platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/ai-disease-detection" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted">
                <PlayCircle className="h-4 w-4" /> See it in action
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> ISO 27001 secure</span>
              <span className="inline-flex items-center gap-1.5"><Microscope className="h-4 w-4 text-brand" /> 96.4% AI accuracy</span>
              <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-brand" /> Pan-India delivery</span>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-lift">
              <video
                src={HERO_VIDEO}
                poster={IMG.heroDrone}
                autoPlay
                muted
                loop
                playsInline
                className="aspect-[4/3] w-full object-cover"
                aria-label="Aerial view of farmland"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card p-4 shadow-card sm:block">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-brand"><ScanLine className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold">Leaf scanned</p>
                  <p className="text-xs text-muted-foreground">Late Blight · 92% confidence</p>
                </div>
              </div>
            </div>
          </div>
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
          {SERVICES.map((s) => <FeatureCard key={s.title} {...s} />)}
        </div>
      </Section>

      {/* AI DETECTION PREVIEW */}
      <Section className="!pt-0">
        <div className="grid items-center gap-12 rounded-2xl border border-border bg-card p-8 shadow-card lg:grid-cols-2 lg:p-14">
          <div>
            <span className="eyebrow">AI Disease Detection</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Spot disease before it spreads.</h2>
            <p className="mt-4 text-muted-foreground">
              Upload a photo of any leaf. Our computer-vision models trained on 2M+ field images return a diagnosis,
              severity score and treatment plan in under 3 seconds — even on a 2G connection.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {["40+ crops supported", "96.4% top-1 accuracy", "Offline-first mobile app", "Treatment in 10 Indian languages"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> {t}</li>
              ))}
            </ul>
            <Link to="/ai-disease-detection" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
              Try the demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={IMG.ai} alt="AI-assisted crop diagnosis on a smartphone" className="aspect-[4/3] w-full object-cover" />
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
            <Link to="/marketplace" key={c.title} className="card-soft card-soft-hover group overflow-hidden">
              <div className="overflow-hidden">
                <img src={c.img} alt={c.title} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground">{c.count}</p>
                <p className="mt-1 text-base font-semibold">{c.title}</p>
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
            <div key={s.n} className="card-soft p-7">
              <span className="text-sm font-semibold text-brand">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SCHEMES STRIP */}
      <Section className="!pt-0">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <span className="eyebrow">Government schemes</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Never miss a benefit you qualify for.</h2>
            <p className="mt-4 text-muted-foreground">
              Match against 200+ Central and State schemes, get document checklists, and apply in minutes.
            </p>
            <Link to="/schemes" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">
              Browse schemes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { name: "PM-KISAN", body: "₹6,000/year income support" },
              { name: "PMFBY", body: "Crop insurance at low premium" },
              { name: "KCC", body: "Kisan Credit Card up to ₹3 lakh" },
              { name: "Soil Health Card", body: "Free soil testing and advisory" },
            ].map((s) => (
              <li key={s.name} className="card-soft p-5">
                <div className="flex items-center gap-2 text-brand"><Landmark className="h-4 w-4" /> <span className="text-xs font-semibold uppercase tracking-wider">{s.name}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* WHY US */}
      <Section className="!pt-0">
        <SectionHeader eyebrow="Why AgriSphere" title="Built like enterprise software. Priced for farmers." align="center" />
        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Bank-grade security", body: "ISO 27001 and SOC 2 Type II controls protect every farm record." },
            { icon: Microscope, title: "Real research", body: "Models validated with ICAR and 4 state agricultural universities." },
            { icon: GraduationCap, title: "Always learning", body: "Free training in 10 languages — over 250 hours of content." },
          ].map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section className="!pt-0">
        <SectionHeader eyebrow="Loved by farmers" title="What growers say." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="card-soft p-7">
              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* BLOGS */}
      <Section className="!pt-0">
        <div className="flex items-end justify-between gap-6">
          <SectionHeader eyebrow="From the blog" title="Latest insights." />
          <Link to="/blog" className="hidden text-sm font-semibold text-brand hover:underline sm:inline">View all →</Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {BLOGS.map((b) => (
            <Link to="/blog/$slug" params={{ slug: b.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }} key={b.title} className="card-soft card-soft-hover overflow-hidden">
              <div className="overflow-hidden">
                <img src={b.img} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">{b.tag}</span>
                <h3 className="mt-2 text-base font-semibold leading-snug">{b.title}</h3>
                <p className="mt-3 text-xs text-muted-foreground">{b.read}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="!pt-0">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader eyebrow="FAQ" title="Questions, answered." />
          <FAQ items={FAQS} />
        </div>
      </Section>

      <CTA />
      <Newsletter />
    </>
  );
}
