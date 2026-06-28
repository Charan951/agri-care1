import { createFileRoute } from "@tanstack/react-router";
import { Search, Filter, Landmark, FileCheck2, Users } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { FAQ } from "@/components/site/FAQ";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes — AgriSphere" },
      { name: "description", content: "200+ Central and State schemes, matched to your eligibility with document checklists." },
      { property: "og:image", content: IMG.farmerPhone },
    ],
  }),
  component: Schemes,
});

const SCHEMES = [
  { name: "PM-KISAN", body: "₹6,000/year direct income support to small and marginal farmers.", tag: "Income" },
  { name: "PMFBY", body: "Crop insurance at subsidized premium for natural calamities.", tag: "Insurance" },
  { name: "Kisan Credit Card", body: "Easy short-term credit up to ₹3 lakh at concessional interest.", tag: "Credit" },
  { name: "Soil Health Card", body: "Free soil testing and customized nutrient recommendations.", tag: "Advisory" },
  { name: "PMKSY", body: "Per-drop-more-crop micro-irrigation subsidies up to 55%.", tag: "Irrigation" },
  { name: "PM-FME", body: "Credit-linked subsidies for food-processing micro-enterprises.", tag: "Enterprise" },
];

const STEPS = [
  { icon: Users, title: "Tell us about your farm", body: "Land size, crops, state and income — 2 minutes." },
  { icon: Landmark, title: "Get matched", body: "We surface every scheme you're eligible for." },
  { icon: FileCheck2, title: "Apply with help", body: "Document checklists and expert support throughout." },
];

const FAQS = [
  { q: "Do I need documents to apply?", a: "Yes. Most schemes need an Aadhaar, land record, and bank passbook. We'll generate a personalized checklist." },
  { q: "Is there any fee?", a: "Browsing and matching is free. Some application-support services are paid; we'll always show the price upfront." },
  { q: "How long does approval take?", a: "It varies by scheme — from 2 weeks (PM-KISAN re-enrollment) to 90 days (PMFBY claims). We track every application for you." },
];

function Schemes() {
  return (
    <>
      <PageHero
        eyebrow="Government schemes"
        title="Never miss a benefit you qualify for."
        description="Match against 200+ Central and State schemes, get document checklists, and apply with expert help."
        image={IMG.farmerPhone}
        imageAlt="Farmer reviewing scheme details on a smartphone"
      />

      <Section>
        <div className="card-soft p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search schemes…" />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold hover:bg-muted">
              <Filter className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Featured" title="Most-applied schemes." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SCHEMES.map((s) => (
            <div key={s.name} className="card-soft card-soft-hover p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand">{s.tag}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <button className="mt-5 text-sm font-semibold text-brand hover:underline">Check eligibility →</button>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Application process" title="Three simple steps." />
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
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader eyebrow="FAQ" title="Common questions." />
          <FAQ items={FAQS} />
        </div>
      </Section>

      <CTA />
    </>
  );
}
