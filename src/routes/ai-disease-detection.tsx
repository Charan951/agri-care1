import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, ScanLine, FileText, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/ai-disease-detection")({
  head: () => ({
    meta: [
      { title: "AI Crop Disease Detection — AgriSphere" },
      { name: "description", content: "Snap a leaf, get a diagnosis and treatment plan in 3 seconds. 40+ crops, 96.4% accuracy." },
      { property: "og:image", content: IMG.ai },
    ],
  }),
  component: Detection,
});

const STEPS = [
  { icon: Upload, title: "Upload a photo", body: "Take a clear photo of the affected leaf in daylight." },
  { icon: ScanLine, title: "AI scans in 3s", body: "Computer-vision model trained on 2M+ field images." },
  { icon: FileText, title: "Get treatment", body: "Localized treatment in 10 Indian languages, with input links." },
];

const CROPS = ["Paddy","Wheat","Cotton","Maize","Tomato","Potato","Chilli","Sugarcane","Soybean","Banana","Mango","Grape","Onion","Brinjal","Okra","Groundnut"];

const FAQS = [
  { q: "Does it work offline?", a: "Yes — our mobile app caches the last 30 days of models, so you can scan without connectivity. Results sync when you're back online." },
  { q: "What if the AI is wrong?", a: "Every low-confidence scan is reviewed by a human agronomist within 2 hours, free of cost. You'll get a follow-up notification." },
  { q: "Is my data private?", a: "Images are stored encrypted (AES-256) and never shared without consent. You can delete your data at any time." },
];

function Detection() {
  return (
    <>
      <PageHero
        eyebrow="AI Disease Detection"
        title={<>Spot disease <span className="text-brand">before</span> it spreads.</>}
        description="Trained on 2 million field images across India's agro-climatic zones — accurate, multilingual, and free for farmers."
        image={IMG.ai}
        imageAlt="Farmer scanning a leaf with a smartphone"
        actions={
          <>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
              Try the demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">
              Talk to an agronomist
            </Link>
          </>
        }
      />

      <Section>
        <SectionHeader eyebrow="Demo" title="See it work." description="A 60-second walkthrough of the scanning experience." align="center" />
        <div className="mx-auto mt-10 aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-card">
          <iframe
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="AgriSphere AI demo"
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="How it works" title="From photo to plan in 3 steps." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="card-soft p-7">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-brand"><s.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Crops" title="40+ supported crops, growing every month." />
        <div className="mt-8 flex flex-wrap gap-2">
          {CROPS.map((c) => (
            <span key={c} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">{c}</span>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { stat: "96.4%", label: "Top-1 accuracy" },
            { stat: "3s", label: "Average scan time" },
            { stat: "2M+", label: "Field images trained on" },
          ].map((s) => (
            <div key={s.label} className="card-soft p-7 text-center">
              <p className="text-4xl font-bold tracking-tight text-brand">{s.stat}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Benefits" title="Why farmers love it." />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { icon: Sparkles, title: "Catch disease early", body: "Average 9-day head start vs. visual diagnosis — that's often the difference between a saved and lost crop." },
            { icon: ShieldCheck, title: "Avoid input waste", body: "Targeted treatment cuts pesticide overuse by up to 35%, saving cost and improving soil health." },
          ].map((b) => (
            <div key={b.title} className="card-soft p-7">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-brand"><b.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader eyebrow="FAQ" title="Questions, answered." />
          <FAQ items={FAQS} />
        </div>
      </Section>

      <CTA />
    </>
  );
}
