import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Leaf, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { NAV_LINKS, NavItem, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (item: NavItem) => {
    if (item.to) {
      return pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
    }
    if (item.children) {
      return item.children.some((child) => child.to && (pathname === child.to || pathname.startsWith(child.to)));
    }
    return false;
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    if (item.children) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(item)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {item.children.map((child) => (
              <DropdownMenuItem key={child.to} asChild>
                <Link to={child.to!} className="cursor-pointer">
                  {child.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    if (item.to) {
      return (
        <Link
          to={item.to}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive(item)
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      );
    }
    return null;
  };

  const MobileNavItem = ({ item }: { item: NavItem }) => {
    if (item.children) {
      return (
        <div className="flex flex-col gap-1">
          <div className="px-3 py-2 text-sm font-semibold text-foreground">
            {item.label}
          </div>
          {item.children.map((child) => (
            <Link
              key={child.to}
              to={child.to!}
              className="rounded-md px-6 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {child.label}
            </Link>
          ))}
        </div>
      );
    }
    if (item.to) {
      return (
        <Link
          to={item.to}
          className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          {item.label}
        </Link>
      );
    }
    return null;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur transition-shadow",
        scrolled ? "border-border shadow-soft" : "border-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-[17px] tracking-tight">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((l, i) => (
            <NavItemComponent key={i} item={l} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-md border border-border text-foreground lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((l, i) => (
              <MobileNavItem key={i} item={l} />
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              <Link
                to="/login"
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-foreground"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
