import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  MessageSquare,
  Cpu,
  Store,
  ShoppingCart,
  CreditCard,
  BarChart3,
  LogOut,
  UserCheck,
  Bell,
  Activity,
  User as UserIcon,
  Leaf,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Tab Components
import { OverviewTab } from "@/components/admin/OverviewTab";
import { UserManagementTab } from "@/components/admin/UserManagementTab";
import { DiseaseReportTab } from "@/components/admin/DiseaseReportTab";
import { ConsultationTab } from "@/components/admin/ConsultationTab";
import { AIMonitoringTab } from "@/components/admin/AIMonitoringTab";
import { MerchantMonitoringTab } from "@/components/admin/MerchantMonitoringTab";
import { OrderManagementTab } from "@/components/admin/OrderManagementTab";
import { PaymentManagementTab } from "@/components/admin/PaymentManagementTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — AgriCare" },
    ],
  }),
  component: AdminDashboard,
});

type TabType =
  | "overview"
  | "users"
  | "reports"
  | "consultations"
  | "ai"
  | "merchants"
  | "orders"
  | "payments"
  | "analytics";

function AdminDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "SUPER_USER"))) {
      toast.error("Unauthorized access to admin portal.");
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, user, navigate]);

  useEffect(() => {
    // Fetch notifications count
    const fetchNotificationsCount = async () => {
      try {
        const response = await fetch("/api/admin/overview");
        if (response.ok) {
          const data = await response.json();
          const unread = data.notifications?.length || 0;
          setUnreadNotifications(unread);
        }
      } catch (err) {
        console.error("Error loading notification count", err);
      }
    };
    if (isAuthenticated && (user?.role === "ADMIN" || user?.role === "SUPER_USER")) {
      fetchNotificationsCount();
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "SUPER_USER")) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">Access Denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You do not have administrative privileges to view this portal. If you think this is a mistake, please sign in with an administrator account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogoutClick = async () => {
    await logout();
    toast.success("Logged out from Admin Portal.");
    navigate({ to: "/login" });
  };

  const menuItems = [
    { id: "overview" as TabType, label: "Overview", icon: LayoutDashboard, roles: ["ADMIN", "SUPER_USER"] },
    { id: "users" as TabType, label: "User Management", icon: Users, roles: ["ADMIN", "SUPER_USER"] },
    { id: "reports" as TabType, label: "Disease Reports", icon: AlertTriangle, roles: ["ADMIN", "SUPER_USER", "AGRI_SPECIALIST"] },
    { id: "consultations" as TabType, label: "Consultation Admin", icon: MessageSquare, roles: ["ADMIN", "SUPER_USER", "AGRI_SPECIALIST"] },
    { id: "ai" as TabType, label: "AI Predictions", icon: Cpu, roles: ["ADMIN", "SUPER_USER"] },
    { id: "merchants" as TabType, label: "Merchant Monitoring", icon: Store, roles: ["ADMIN", "SUPER_USER"] },
    { id: "orders" as TabType, label: "Order Management", icon: ShoppingCart, roles: ["ADMIN", "SUPER_USER"] },
    { id: "payments" as TabType, label: "Payment Management", icon: CreditCard, roles: ["ADMIN"] },
    { id: "analytics" as TabType, label: "Reports & Analytics", icon: BarChart3, roles: ["ADMIN", "SUPER_USER"] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40 text-foreground">
      {/* SIDEBAR */}
      <aside className="w-64 h-full border-r border-border bg-card hidden lg:flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar pr-1">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-3 py-1 border-b border-border pb-4">
              <span className="grid h-8.5 w-8.5 place-items-center rounded-lg bg-brand text-brand-foreground">
                <Leaf className="h-4.5 w-4.5" />
              </span>
              <span className="font-bold text-base tracking-tight text-foreground">AgriCare Admin</span>
            </div>

            <nav className="space-y-1">
              {menuItems
                .filter((item) => item.roles.includes(user.role))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-brand text-brand-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
            </nav>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            {/* User Profile Summary inside Sidebar */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 border border-border/40 rounded-lg bg-muted/20">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <UserIcon className="h-4.5 w-4.5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold leading-none text-foreground truncate">{user.name}</p>
                <p className="mt-1.5 text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Exit Portal
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/85 backdrop-blur px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold capitalize">
              {activeTab.replace("reports", "disease reports").replace("ai", "AI prediction monitoring").replace("consultations", "consultations")}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Exit/Logout Button (Visible ONLY on mobile/tablets where sidebar is hidden) */}
            <button
              onClick={handleLogoutClick}
              title="Logout"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors lg:hidden"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
                <Bell className="h-4.5 w-4.5" />
              </button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground ring-2 ring-card animate-bounce">
                  {unreadNotifications}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* MOBILE MENU NAV BAR */}
        <div className="border-b border-border bg-card p-2.5 overflow-x-auto whitespace-nowrap lg:hidden flex-shrink-0">
          <div className="flex gap-1.5">
            {menuItems
              .filter((item) => item.roles.includes(user.role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      isActive
                        ? "bg-brand text-brand-foreground"
                        : "border border-border text-muted-foreground bg-card hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
          </div>
        </div>

        {/* MAIN TAB CONTENT */}
        <main className="flex-grow p-6 overflow-y-auto no-scrollbar">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <UserManagementTab />}
          {activeTab === "reports" && <DiseaseReportTab />}
          {activeTab === "consultations" && <ConsultationTab />}
          {activeTab === "ai" && <AIMonitoringTab />}
          {activeTab === "merchants" && <MerchantMonitoringTab />}
          {activeTab === "orders" && <OrderManagementTab />}
          {activeTab === "payments" && <PaymentManagementTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </main>
      </div>
    </div>
  );
}
