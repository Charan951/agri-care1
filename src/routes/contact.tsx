import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { FAQ } from "@/components/site/FAQ";
import { SITE, IMG } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AgriSphere" },
      { name: "description", content: "Reach AgriSphere support, sales, and partnerships. Phone, email, WhatsApp." },
      { property: "og:image", content: IMG.specialist },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", topic: "support", message: "" });
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We're here to help."
        description="Reach us by phone, email or WhatsApp. Our team answers in 10 Indian languages, 7 AM – 9 PM, every day."
        compact
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent. We'll reply within one business day.");
              setForm({ name: "", email: "", topic: "support", message: "" });
            }}
            className="card-soft space-y-5 p-7"
          >
            <h2 className="text-2xl font-bold tracking-tight">Send us a message</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-semibold">Name</label>
                <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold">Email</label>
                <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
              </div>
            </div>
            <div>
              <label htmlFor="topic" className="text-sm font-semibold">Topic</label>
              <select id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40">
                <option value="support">Farmer support</option>
                <option value="merchant">Merchant onboarding</option>
                <option value="sales">Enterprise sales</option>
                <option value="press">Press</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-semibold">Message</label>
              <textarea id="message" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">Send message</button>
          </form>

          <div className="space-y-5">
            <div className="card-soft p-6">
              <h3 className="text-base font-semibold">Get in touch</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-brand" /> {SITE.phone}</li>
                <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-brand" /> {SITE.email}</li>
                <li className="flex items-center gap-3"><MessageCircle className="h-4 w-4 text-brand" /> WhatsApp {SITE.whatsapp}</li>
                <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {SITE.address}</li>
                <li className="flex items-center gap-3"><Clock className="h-4 w-4 text-brand" /> 7 AM – 9 PM, all days</li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="AgriSphere HQ"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.5946%2C12.9716%2C77.6946%2C13.0716&layer=mapnik"
                className="h-64 w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { city: "Bengaluru", body: "Prestige Tech Park, ORR — HQ" },
            { city: "Pune", body: "Magarpatta City, Hadapsar" },
            { city: "Delhi NCR", body: "Cyber Hub, Gurugram" },
          ].map((o) => (
            <div key={o.city} className="card-soft p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand">{o.city}</p>
              <p className="mt-2 text-sm text-muted-foreground">{o.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Before you write.</h2>
          </div>
          <FAQ items={[
            { q: "How fast do you respond?", a: "Within one business day for email, within 5 minutes on WhatsApp during business hours." },
            { q: "Do you have an office I can visit?", a: "Yes — Bengaluru, Pune and Gurugram. Please book a slot in advance." },
            { q: "How do I become a merchant?", a: "Choose 'Merchant onboarding' in the form. Our team reviews applications within 3 working days." },
          ]} />
        </div>
      </Section>
    </>
  );
}
