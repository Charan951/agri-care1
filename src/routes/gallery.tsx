import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — AgriSphere" },
      { name: "description", content: "Professional agriculture photography: drone, farmers, crops, marketplace and equipment." },
      { property: "og:image", content: IMG.heroDrone },
    ],
  }),
  component: Gallery,
});

const FILTERS = ["All", "Drone", "Farmers", "Crops", "Marketplace", "Equipment", "Experts"];

const ITEMS = [
  { src: IMG.heroDrone, cat: "Drone" },
  { src: IMG.ricefield, cat: "Crops" },
  { src: IMG.wheat, cat: "Crops" },
  { src: IMG.vegetables, cat: "Crops" },
  { src: IMG.fruits, cat: "Crops" },
  { src: IMG.organic, cat: "Crops" },
  { src: IMG.farmer1, cat: "Farmers" },
  { src: IMG.farmer2, cat: "Farmers" },
  { src: IMG.farmer3, cat: "Farmers" },
  { src: IMG.farmerPhone, cat: "Farmers" },
  { src: IMG.specialist, cat: "Experts" },
  { src: IMG.marketplace, cat: "Marketplace" },
  { src: IMG.warehouse, cat: "Marketplace" },
  { src: IMG.equipment, cat: "Equipment" },
  { src: IMG.irrigation, cat: "Equipment" },
  { src: IMG.weather, cat: "Drone" },
];

function Gallery() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? ITEMS : ITEMS.filter((i) => i.cat === active);
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="A visual look at AgriSphere."
        description="Photography from across India — fields, farmers, partners, and the platform in action."
        compact
      />
      <Section>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${active === f ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card hover:bg-muted"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((it, i) => (
            <div key={i} className="group overflow-hidden rounded-xl border border-border bg-card">
              <img src={it.src} alt={it.cat} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
