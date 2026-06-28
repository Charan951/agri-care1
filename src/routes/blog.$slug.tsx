import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, User } from "lucide-react";
import { Section } from "@/components/site/Section";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — AgriSphere Blog` },
      { name: "description", content: "Field-tested insights from AgriSphere agronomists and engineers." },
      { property: "og:image", content: IMG.ricefield },
    ],
  }),
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <>
      <article className="border-b border-border bg-card">
        <div className="container-page max-w-3xl py-14 md:py-20">
          <span className="eyebrow">Advisory</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
          <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> Dr. Priya Iyer</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> 7 min read</span>
            <span>· June 28, 2026</span>
          </div>
        </div>
      </article>

      <Section>
        <div className="mx-auto max-w-3xl">
          <img src={IMG.ricefield} alt="" className="aspect-[16/9] w-full rounded-2xl border border-border object-cover" />
          <div className="prose-content mt-10 space-y-6 text-[17px] leading-relaxed text-foreground">
            <p>
              In the early weeks of the kharif season, even experienced farmers miss the first signs of trouble.
              The good news: with a clear framework — and a smartphone — most issues can be caught long before they
              affect yield.
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Why early detection matters</h2>
            <p>
              Studies across Punjab and Tamil Nadu show that a 7-day head start on pest or nutrient stress can save up
              to 40% of expected yield. That's the difference between a profitable year and a difficult one.
            </p>
            <h2 className="text-2xl font-bold tracking-tight">A simple checklist</h2>
            <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
              <li>Walk the field at sunrise — colour is most accurate then.</li>
              <li>Compare against last week's photos in the AgriSphere app.</li>
              <li>Sample five points across the field, not just the edges.</li>
              <li>Log everything; patterns only emerge over weeks.</li>
            </ul>
            <p>
              When in doubt, scan a leaf. The AI is fast, free for farmers, and improves every week.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            <p className="text-sm font-semibold">Share this article</p>
            <div className="flex gap-2 text-sm">
              {["Twitter", "WhatsApp", "LinkedIn", "Copy link"].map((b) => (
                <button key={b} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted">{b}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">Related reading</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {[
              { slug: "computer-vision-leaf-disease", title: "How computer vision spots leaf disease before symptoms", img: IMG.ai },
              { slug: "vermicompost-guide", title: "A practical guide to vermicompost on small farms", img: IMG.organic },
            ].map((p) => (
              <Link to="/blog/$slug" params={{ slug: p.slug }} key={p.slug} className="card-soft card-soft-hover overflow-hidden">
                <img src={p.img} alt="" className="aspect-[16/10] w-full object-cover" />
                <div className="p-5">
                  <p className="text-sm font-semibold">{p.title}</p>
                </div>
              </Link>
            ))}
          </div>

          <h2 className="mt-12 text-2xl font-bold tracking-tight">Comments</h2>
          <div className="mt-4 space-y-4">
            {[
              { name: "Anil G.", body: "Great practical advice — I'll start the sunrise walk tomorrow." },
              { name: "Rekha S.", body: "The 7-day window matches my experience exactly. Thank you." },
            ].map((c) => (
              <div key={c.name} className="card-soft p-5">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CTA title="Want this in your inbox?" description="Get weekly advisories tailored to your crops and village." primary={{ label: "Subscribe", to: "/register" }} secondary={{ label: "Browse blog", to: "/blog" }} />
    </>
  );
}
