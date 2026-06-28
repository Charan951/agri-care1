import { createFileRoute } from "@tanstack/react-router";
import {
  ScanLine, HeartHandshake, Store, CloudSun, Sprout, BookOpen, Landmark, GraduationCap, LifeBuoy,
} from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { FeatureCard } from "@/components/site/FeatureCard";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — AgriSphere" },
      { name: "description", content: "Nine integrated services to run a modern farm: AI detection, advisory, marketplace, schemes and more." },
      { property: "og:image", content: IMG.specialist },
    ],
  }),
  component: Services,
});

const SERVICES = [
  { icon: ScanLine, title: "AI Crop Disease Detection", description: "Diagnose 40+ crops with 96.4% accuracy. Free for individual farmers.", to: "/ai-disease-detection" },
  { icon: HeartHandshake, title: "Agriculture Consultation", description: "Talk to certified agronomists in 10 languages. Voice or video.", to: "/contact" },
  { icon: Store, title: "Marketplace", description: "Seeds, fertilizers, tools and machinery from verified merchants.", to: "/marketplace" },
  { icon: CloudSun, title: "Weather Monitoring", description: "Hyperlocal 14-day forecasts with rain and pest probability scores.", to: "/services" },
  { icon: Sprout, title: "Soil Health", description: "Lab-grade soil tests with crop-wise nutrient recommendations.", to: "/services" },
  { icon: BookOpen, title: "Crop Advisory", description: "Sowing-to-harvest plans tuned to your village and soil type.", to: "/services" },
  { icon: Landmark, title: "Government Scheme Guidance", description: "Match, apply, and track 200+ Central and State schemes.", to: "/schemes" },
  { icon: GraduationCap, title: "Training Programs", description: "Free courses on modern practices in 10 Indian languages.", to: "/videos" },
  { icon: LifeBuoy, title: "Farmer Support", description: "WhatsApp and phone support, 7 AM – 9 PM, every day of the week.", to: "/contact" },
];

function Services() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Nine services. One platform."
        description="A complete toolkit to plan, protect, and profit from every season."
        image={IMG.specialist}
        imageAlt="Agriculture specialist with a farmer in the field"
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => <FeatureCard key={s.title} {...s} />)}
        </div>
      </Section>
      <Section className="!pt-0">
        <SectionHeader eyebrow="The stack" title="Designed to work together." description="Every service shares the same farm profile, language, and notifications — so you never repeat yourself." align="center" />
      </Section>
      <CTA />
    </>
  );
}
