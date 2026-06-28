import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { Newsletter } from "@/components/site/Newsletter";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — AgriCare" },
      { name: "description", content: "Crop advisories, technology deep dives, and policy explainers for Indian agriculture." },
      { property: "og:image", content: IMG.ricefield },
    ],
  }),
  component: Blog,
});

const FEATURED = [
  { slug: "nitrogen-deficiency-paddy", tag: "Advisory", title: "5 signs of nitrogen deficiency in paddy fields", read: "6 min read", img: IMG.ricefield, author: "Dr. Priya Iyer" },
  { slug: "computer-vision-leaf-disease", tag: "Technology", title: "How computer vision spots leaf disease before symptoms", read: "8 min read", img: IMG.ai, author: "Rohan Mehta" },
];

const CATEGORIES = ["All", "Advisory", "Technology", "Policy", "Marketplace", "Stories"];

const POSTS = [
  { slug: "pm-kisan-2026", tag: "Policy", title: "PM-KISAN 2026: what changes for small farmers", read: "5 min read", img: IMG.farmerPhone },
  { slug: "drip-irrigation-roi", tag: "Advisory", title: "Drip irrigation ROI: a 3-acre case study", read: "7 min read", img: IMG.irrigation },
  { slug: "monsoon-2026-outlook", tag: "Advisory", title: "Monsoon 2026 outlook and crop planning", read: "9 min read", img: IMG.weather },
  { slug: "vermicompost-guide", tag: "Advisory", title: "A practical guide to vermicompost on small farms", read: "6 min read", img: IMG.organic },
  { slug: "drone-spraying", tag: "Technology", title: "Drone spraying: economics for marginal farmers", read: "10 min read", img: IMG.equipment },
  { slug: "farmer-producer-org", tag: "Stories", title: "How an FPO in Vidarbha doubled member incomes", read: "8 min read", img: IMG.farmer1 },
];

function Blog() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Field-tested insights."
        description="Advisories, technology deep dives, and policy explainers written by agronomists and engineers."
        image={IMG.ricefield}
        imageAlt="Paddy field at golden hour"
        compact
      />

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURED.map((p) => (
            <Link to="/blog/$slug" params={{ slug: p.slug }} key={p.slug} className="card-soft card-soft-hover overflow-hidden">
              <img src={p.img} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="p-7">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">{p.tag}</span>
                <h3 className="mt-2 text-xl font-semibold leading-snug">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{p.author} · {p.read}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="card-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search articles…" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c, i) => (
              <button key={c} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${i === 0 ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}>{c}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Latest" title="Recent articles." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <Link to="/blog/$slug" params={{ slug: p.slug }} key={p.slug} className="card-soft card-soft-hover overflow-hidden">
              <img src={p.img} alt="" className="aspect-[16/10] w-full object-cover" />
              <div className="p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">{p.tag}</span>
                <h3 className="mt-2 text-base font-semibold leading-snug">{p.title}</h3>
                <p className="mt-3 text-xs text-muted-foreground">{p.read}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Newsletter />
    </>
  );
}
