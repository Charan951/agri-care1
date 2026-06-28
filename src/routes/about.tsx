import { createFileRoute } from "@tanstack/react-router";
import { Target, Eye, Heart, Award, Handshake, Globe2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { CTA } from "@/components/site/CTA";
import { FeatureCard } from "@/components/site/FeatureCard";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AgriSphere — Our mission to modernize Indian farming" },
      { name: "description", content: "We're building the operating system for India's 140 million farmers." },
      { property: "og:title", content: "About AgriSphere" },
      { property: "og:image", content: IMG.organic },
    ],
  }),
  component: About,
});

const VALUES = [
  { icon: Heart, title: "Farmer first", description: "Every decision is judged by whether it improves the farmer's livelihood." },
  { icon: Award, title: "Earned trust", description: "We publish data, verify merchants, and stand behind every recommendation." },
  { icon: Handshake, title: "Partnership", description: "Built with ICAR, state universities, and grassroots cooperatives." },
  { icon: Globe2, title: "Built for Bharat", description: "Designed for low bandwidth, multiple languages, and real field conditions." },
];

const TIMELINE = [
  { year: "2021", title: "Founded in Bengaluru", body: "Three agronomists and two engineers set out to fix the input-supply problem." },
  { year: "2022", title: "AI lab launched", body: "First disease-detection models released for paddy and cotton." },
  { year: "2023", title: "10,000 farmers", body: "Expanded to 6 states and onboarded our first 200 verified merchants." },
  { year: "2024", title: "Series B funding", body: "Raised ₹180Cr to scale advisory and warehouse infrastructure." },
  { year: "2026", title: "50,000+ farmers", body: "Now serving 28 states with multilingual AI and same-day delivery." },
];

const TEAM = [
  { name: "Dr. Anika Sharma", role: "Co-founder & CEO", img: IMG.team1 },
  { name: "Rohan Mehta", role: "Co-founder & CTO", img: IMG.team2 },
  { name: "Priya Iyer", role: "Head of Agronomy", img: IMG.team3 },
  { name: "Vikram Singh", role: "Head of Operations", img: IMG.team4 },
];

function About() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={<>Modernizing India's farms, <span className="text-brand">one season at a time.</span></>}
        description="AgriSphere is an enterprise AgriTech platform helping 50,000+ farmers grow better with AI, data, and a trusted supply chain."
        image={IMG.organic}
        imageAlt="Organic farm landscape at sunrise"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow"><Target className="h-3.5 w-3.5" /> Mission</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Make modern agronomy accessible to every farmer.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              140 million Indians depend on agriculture. They deserve the same quality of tools, capital, and expertise
              that powers the world's most productive farms. AgriSphere is building that operating system.
            </p>
          </div>
          <div>
            <span className="eyebrow"><Eye className="h-3.5 w-3.5" /> Vision</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">A profitable, sustainable farm in every village.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              By 2030 we aim to serve 5 million farmers, reduce input waste by 30%, and put ₹10,000 crore of additional
              income into rural India.
            </p>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Our values" title="What we stand for." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => <FeatureCard key={v.title} {...v} />)}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Timeline" title="Our journey so far." />
        <ol className="mt-10 space-y-6 border-l border-border pl-6">
          {TIMELINE.map((t) => (
            <li key={t.year} className="relative">
              <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand ring-4 ring-background" />
              <p className="text-sm font-semibold text-brand">{t.year}</p>
              <h3 className="mt-1 text-lg font-semibold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Leadership" title="The team behind AgriSphere." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((m) => (
            <div key={m.name} className="card-soft overflow-hidden">
              <img src={m.img} alt={m.name} className="aspect-square w-full object-cover" />
              <div className="p-5">
                <p className="text-base font-semibold">{m.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Office" title="Where we work." />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[IMG.specialist, IMG.warehouse, IMG.equipment, IMG.farmerPhone].map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Partners" title="Backed by institutions we admire." />
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-5">
          {["ICAR", "IIT Bombay", "TANUVAS", "NABARD", "UNDP India"].map((p) => (
            <div key={p} className="bg-card px-6 py-10 text-center text-sm font-semibold tracking-wide text-muted-foreground">{p}</div>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
