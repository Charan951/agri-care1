import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import { Navbar } from '@/components/site/Navbar';
import { Footer } from '@/components/site/Footer';
import { motion, AnimatePresence } from 'framer-motion';

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
  const location = useLocation();
  const isHideLayout = location.pathname.startsWith('/admin') || 
                       location.pathname.startsWith('/dashboard') || 
                       location.pathname.startsWith('/specialist') || 
                       location.pathname.startsWith('/merchant');

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {!isHideLayout && <Navbar />}
      <main id="main" className="flex-1 overflow-x-hidden relative">
        {isHideLayout ? (
          <Outlet />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      {!isHideLayout && <Footer />}
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
