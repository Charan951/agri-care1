import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Truck, ShieldCheck, X } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/marketplace/")({
  head: () => ({
    meta: [
      { title: "Marketplace — AgriCare" },
      { name: "description", content: "Trusted inputs at fair prices. Seeds, fertilizers, equipment and irrigation from verified merchants." },
      { property: "og:image", content: IMG.marketplace },
    ],
  }),
  component: Marketplace,
});

const CATEGORIES = [
  { name: "Seeds & Saplings", img: IMG.vegetables },
  { name: "Fertilizers", img: IMG.organic },
  { name: "Pesticides", img: IMG.wheat },
  { name: "Equipment", img: IMG.equipment },
  { name: "Irrigation", img: IMG.irrigation },
  { name: "Animal Feed", img: IMG.fruits },
];

const PRODUCTS = [
  { id: "p-1", name: "Hybrid Tomato Seeds (10g)", price: "₹240", rating: 4.8, img: IMG.vegetables, badge: "Best seller", category: "Seeds & Saplings" },
  { id: "p-2", name: "Organic Vermicompost (25kg)", price: "₹540", rating: 4.7, img: IMG.organic, badge: "Eco", category: "Fertilizers" },
  { id: "p-3", name: "Drip Irrigation Kit (1 acre)", price: "₹18,900", rating: 4.9, img: IMG.irrigation, badge: "Pro", category: "Irrigation" },
  { id: "p-4", name: "Cordless Sprayer 16L", price: "₹3,450", rating: 4.6, img: IMG.equipment, badge: "New", category: "Equipment" },
  { id: "p-5", name: "Wheat Seed HD-3226 (40kg)", price: "₹1,650", rating: 4.7, img: IMG.wheat, badge: "Top pick", category: "Seeds & Saplings" },
  { id: "p-6", name: "NPK 19-19-19 (50kg)", price: "₹1,420", rating: 4.5, img: IMG.organic, badge: "Bulk", category: "Fertilizers" },
  { id: "p-7", name: "Mini Power Tiller", price: "₹52,000", rating: 4.8, img: IMG.equipment, badge: "Pro", category: "Equipment" },
  { id: "p-8", name: "Drone Sprayer 10L", price: "₹2,40,000", rating: 4.9, img: IMG.ai, badge: "Premium", category: "Equipment" },
];

function Marketplace() {
  const search = Route.useSearch();
  const selectedCategory = search.category as string | undefined;
  
  const filteredProducts = selectedCategory 
    ? PRODUCTS.filter(p => p.category === selectedCategory) 
    : PRODUCTS;

  return (
    <>
      <PageHero
        eyebrow="Marketplace"
        title="Trusted inputs. Fair prices."
        description="Every listing is from a verified merchant, price-matched and quality-assured. Pan-India delivery."
        image={IMG.marketplace}
        imageAlt="Agriculture marketplace"
      />

      <Section>
        <SectionHeader eyebrow="Categories" title="Shop by category." />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link 
              key={c.name} 
              to="/marketplace" 
              search={{ category: c.name }} 
              className="card-soft card-soft-hover group overflow-hidden"
            >
              <div className="overflow-hidden">
                <img src={c.img} alt={c.name} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 text-center text-sm font-semibold">{c.name}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="flex items-end justify-between gap-6">
          <div>
            <SectionHeader 
              eyebrow={selectedCategory ? `Category: ${selectedCategory}` : "Featured"} 
              title={selectedCategory ? `${selectedCategory} Products` : "Top-rated products."} 
            />
            {selectedCategory && (
              <Link 
                to="/marketplace" 
                className="mt-2 inline-flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <X className="h-3.5 w-3.5" /> Clear filter
              </Link>
            )}
          </div>
          <Link to="/marketplace" className="hidden text-sm font-semibold text-brand sm:inline">View all →</Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <Link to="/marketplace/$id" params={{ id: p.id }} key={p.id} className="card-soft card-soft-hover group overflow-hidden">
              <div className="relative overflow-hidden">
                <img src={p.img} alt={p.name} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-md bg-card px-2 py-1 text-[11px] font-semibold text-brand shadow-soft">{p.badge}</span>
              </div>
              <div className="p-5">
                <h3 className="text-sm font-semibold leading-snug">{p.name}</h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {p.rating} · Verified
                </div>
                <p className="mt-3 text-base font-bold">{p.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Verified merchants", body: "Every seller passes KYC, quality and price-match checks." },
            { icon: Truck, title: "Pan-India delivery", body: "Same-day in 80 cities; 3–5 days everywhere else." },
            { icon: Star, title: "Easy returns", body: "7-day no-questions-asked returns on most categories." },
          ].map((b) => (
            <div key={b.title} className="card-soft p-7">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-brand"><b.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
