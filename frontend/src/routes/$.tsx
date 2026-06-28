import { createFileRoute, Link } from "@tanstack/react-router";
import { IMG } from "@/lib/site";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page not found — AgriCare" },
      { name: "description", content: "The page you're looking for doesn't exist." },
    ],
  }),
  component: NotFound,
});

function NotFound() {
  return (
    <section className="grid min-h-[70vh] place-items-center px-6 py-20">
      <div className="grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="eyebrow">404</span>
          <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">This field is fallow.</h1>
          <p className="mt-4 text-lg text-muted-foreground">The page you're looking for doesn't exist or has been moved. Let's get you back to growing.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">Back to home</Link>
            <Link to="/contact" className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-muted">Contact support</Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <img src={IMG.notFound} alt="An empty field at sunset" className="aspect-[4/3] w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
