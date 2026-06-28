import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle, Star, TrendingUp } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeader } from "@/components/site/Section";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/success-stories")({
  head: () => ({
    meta: [
      { title: "Farmer Success Stories — AgriSphere" },
      { name: "description", content: "Real before-and-after stories from farmers using AgriSphere." },
      { property: "og:image", content: IMG.farmer1 },
    ],
  }),
  component: Stories,
});

const STORIES = [
  { name: "Ramesh Patil", state: "Maharashtra", crop: "Cotton", before: "₹38,000/acre", after: "₹62,000/acre", img: IMG.farmer1, quote: "Caught early bollworm; saved 40% of my yield." },
  { name: "Sunita Devi", state: "Bihar", crop: "Vegetables", before: "₹52,000/acre", after: "₹98,000/acre", img: IMG.farmer2, quote: "Soil report to seed selection — everything in one app." },
  { name: "Karthik R.", state: "Tamil Nadu", crop: "Paddy", before: "₹41,000/acre", after: "₹67,000/acre", img: IMG.farmer3, quote: "Fair pricing and on-time delivery, every order." },
];

function Stories() {
  return (
    <>
      <PageHero
        eyebrow="Success stories"
        title="Real farmers. Real outcomes."
        description="A glimpse of what's possible when modern tools reach the field."
        image={IMG.farmer1}
        imageAlt="Smiling farmer in front of a healthy field"
        compact
      />

      <Section>
        <SectionHeader eyebrow="Featured video" title="Watch how Ramesh saved his cotton crop." align="center" />
        <div className="mx-auto mt-10 aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-card">
          <iframe
            src="https://www.youtube.com/embed/ScMzIvxBSi4"
            title="Farmer success story"
            className="h-full w-full"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Case studies" title="Before & after." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s) => (
            <article key={s.name} className="card-soft overflow-hidden">
              <img src={s.img} alt={s.name} className="aspect-[4/3] w-full object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold">{s.name}</p>
                  <span className="text-xs text-muted-foreground">{s.state}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.crop} grower</p>
                <blockquote className="mt-4 border-l-2 border-brand pl-3 text-sm text-foreground">"{s.quote}"</blockquote>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Before</p>
                    <p className="mt-0.5 font-semibold">{s.before}</p>
                  </div>
                  <div className="rounded-lg border border-brand/30 bg-accent p-3">
                    <p className="flex items-center gap-1 text-xs text-brand"><TrendingUp className="h-3.5 w-3.5" /> After</p>
                    <p className="mt-0.5 font-semibold text-brand">{s.after}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Gallery" title="From the field." />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[IMG.ricefield, IMG.wheat, IMG.fruits, IMG.vegetables].map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-border">
              <img src={src} alt="" className="aspect-square w-full object-cover" />
              <PlayCircle className="absolute inset-0 m-auto h-10 w-10 text-white/90 drop-shadow" />
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Testimonials" title="In their own words." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STORIES.map((s) => (
            <figure key={s.name} className="card-soft p-7">
              <div className="flex gap-0.5 text-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <blockquote className="mt-4 text-[15px] leading-relaxed">"{s.quote}"</blockquote>
              <figcaption className="mt-5 text-sm">
                <p className="font-semibold">{s.name}</p>
                <p className="text-muted-foreground">{s.crop} · {s.state}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <CTA />
    </>
  );
}
