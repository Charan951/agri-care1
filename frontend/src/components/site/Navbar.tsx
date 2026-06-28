import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully.");
    navigate({ to: "/" });
  };

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
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold hover:bg-muted">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs text-brand-foreground">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user?.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2.5 py-1.5 text-xs text-muted-foreground border-b border-border mb-1">
                  Role: <span className="font-semibold text-foreground">{user?.role}</span>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_USER') && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer font-medium">
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.role === 'FARMER' && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer font-medium">
                      Farmer Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.role === 'MERCHANT' && (
                  <DropdownMenuItem asChild>
                    <Link to="/merchant" className="cursor-pointer font-medium">
                      Merchant Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 font-medium">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
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
            </>
          )}
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
            
            {isAuthenticated ? (
              <div className="mt-2 border-t border-border pt-3 space-y-2">
                <div className="px-3 text-xs text-muted-foreground">
                  Signed in as <span className="font-semibold text-foreground">{user?.name} ({user?.role})</span>
                </div>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_USER') && (
                  <Link
                    to="/admin"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {user?.role === 'FARMER' && (
                  <Link
                    to="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Farmer Dashboard
                  </Link>
                )}
                {user?.role === 'MERCHANT' && (
                  <Link
                    to="/merchant"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Merchant Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-muted"
                >
                  Sign out
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </header>
  );
}
