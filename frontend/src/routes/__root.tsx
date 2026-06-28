import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { Navbar } from '@/components/site/Navbar';
import { Footer } from '@/components/site/Footer';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        title: 'AgriCare - AI-powered farming for India',
      },
      {
        name: 'description',
        content: 'Detect crop disease with AI, buy quality inputs, and consult agronomists — all on one trusted platform.',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
