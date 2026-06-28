import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Video Library — AgriCare" },
      { name: "description", content: "Tutorials, disease awareness, farmer stories, product demos and government program walkthroughs." },
      { property: "og:image", content: IMG.specialist },
    ],
  }),
  component: Videos,
});

const SECTIONS = [
  { title: "Disease awareness", items: [IMG.ai, IMG.ricefield, IMG.wheat] },
  { title: "Tutorials", items: [IMG.farmerPhone, IMG.equipment, IMG.irrigation] },
  { title: "Farmer stories", items: [IMG.farmer1, IMG.farmer2, IMG.farmer3] },
  { title: "Government programs", items: [IMG.specialist, IMG.organic, IMG.weather] },
  { title: "Product demos", items: [IMG.marketplace, IMG.warehouse, IMG.delivery] },
];

function VideoCard({ src }: { src: string }) {
  return (
    <div className="card-soft card-soft-hover group overflow-hidden">
      <div className="relative">
        <img src={src} alt="" className="aspect-video w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/15 opacity-90">
          <PlayCircle className="h-12 w-12 text-white drop-shadow" />
        </span>
      </div>
      <div className="p-5">
        <p className="text-sm font-semibold">5-minute walkthrough</p>
        <p className="mt-1 text-xs text-muted-foreground">AgriCare Studios</p>
      </div>
    </div>
  );
}

function Videos() {
  return (
    <>
      <PageHero
        eyebrow="Video library"
        title="Learn at your pace."
        description="Over 250 hours of free content — in 10 Indian languages."
        compact
      />

      <Section>
        <SectionHeader eyebrow="Featured" title="This week's picks." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[IMG.ai, IMG.farmerPhone, IMG.equipment].map((s, i) => <VideoCard key={i} src={s} />)}
        </div>
      </Section>

      {SECTIONS.map((s) => (
        <Section key={s.title} className="!pt-0">
          <SectionHeader eyebrow="Category" title={s.title} />
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {s.items.map((it, i) => <VideoCard key={i} src={it} />)}
          </div>
        </Section>
      ))}
    </>
  );
}
