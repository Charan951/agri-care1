import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, ShieldCheck, Truck, MapPin, ChevronRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/marketplace/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Product ${params.id} — AgriSphere Marketplace` },
      { name: "description", content: "View product details, reviews and merchant info on AgriSphere." },
      { property: "og:image", content: IMG.marketplace },
    ],
  }),
  component: ProductDetails,
});

const GALLERY = [IMG.vegetables, IMG.organic, IMG.equipment, IMG.fruits];

function ProductDetails() {
  const { id } = Route.useParams();
  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="container-page py-4 text-sm text-muted-foreground">
          <nav className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/marketplace" className="hover:text-foreground">Marketplace</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{id}</span>
          </nav>
        </div>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={GALLERY[0]} alt="Product" className="aspect-square w-full object-cover" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {GALLERY.map((g, i) => (
                <button key={i} className="overflow-hidden rounded-lg border border-border bg-card hover:border-brand">
                  <img src={g} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="eyebrow">Best seller</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Hybrid Tomato Seeds — Pusa Ruby (10g)</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" /> 4.8 (1,240 reviews)</span>
              <span>·</span>
              <span>SKU AGS-{id}</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-4xl font-bold">₹240</p>
              <p className="text-base text-muted-foreground line-through">₹320</p>
              <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-brand">Save 25%</span>
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">
              High-yielding hybrid tomato seeds suited for Kharif and Rabi seasons. Disease-resistant, uniform fruit size,
              ideal for both fresh market and processing.
            </p>

            <ul className="mt-6 space-y-2 text-sm">
              {["Germination ≥ 90%", "Days to maturity: 70–75", "Yield: 35–45 tonnes/ha", "Resistant to TYLCV & bacterial wilt"].map((s) => (
                <li key={s} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> {s}</li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">Add to cart</button>
              <button className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted">Buy now</button>
            </div>

            <div className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-5 text-sm">
              <div className="flex items-center gap-3"><Truck className="h-4 w-4 text-brand" /> Free delivery in 3–5 days</div>
              <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand" /> Verified merchant · 7-day returns</div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-brand" /> Ships from Bengaluru, KA</div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Specifications</h2>
            <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-card">
              {[
                ["Pack size", "10g (~3,000 seeds)"],
                ["Crop season", "Kharif, Rabi"],
                ["Spacing", "60 × 45 cm"],
                ["Storage", "Cool, dry place < 25°C"],
                ["Country of origin", "India"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-4 px-5 py-4 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">Reviews</h2>
            <div className="mt-5 space-y-4">
              {[
                { name: "Mahesh K.", body: "Excellent germination, almost 95% sprouted. Will buy again.", stars: 5 },
                { name: "Suresh P.", body: "Good quality and fast delivery. Plants are healthy.", stars: 4 },
              ].map((r) => (
                <div key={r.name} className="card-soft p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <div className="flex text-gold">
                      {Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="card-soft p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sold by</p>
              <p className="mt-2 text-lg font-semibold">Green Valley Agritech</p>
              <p className="mt-1 text-sm text-muted-foreground">Verified merchant · 8 years on AgriSphere</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-gold text-gold" /> 4.9 · 12,400 orders
              </div>
              <button className="mt-5 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">View store</button>
            </div>
          </aside>
        </div>
      </Section>

      <Section className="!pt-0">
        <h2 className="text-2xl font-bold tracking-tight">Related products</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map((g, i) => (
            <Link to="/marketplace/$id" params={{ id: `r-${i}` }} key={i} className="card-soft card-soft-hover overflow-hidden">
              <img src={g} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="p-5">
                <p className="text-sm font-semibold">Related product {i + 1}</p>
                <p className="mt-2 text-base font-bold">₹{(i + 2) * 199}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
