import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  LayoutDashboard, User as UserIcon, ScanLine, MessageSquare, Ticket as TicketIcon,
  Store, ShoppingCart, Package, CreditCard, History, CloudSun, Heart,
  HelpCircle, LogOut, Menu, Sparkles, Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Tab imports
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { DetectTab } from "@/components/dashboard/DetectTab";
import { ConsultationsTab } from "@/components/dashboard/ConsultationsTab";
import { TicketsTab } from "@/components/dashboard/TicketsTab";
import { MarketplaceTab } from "@/components/dashboard/MarketplaceTab";
import { CartTab } from "@/components/dashboard/CartTab";
import { OrdersTab } from "@/components/dashboard/OrdersTab";
import { PaymentsTab } from "@/components/dashboard/PaymentsTab";
import { CropHistoryTab } from "@/components/dashboard/CropHistoryTab";
import { WeatherTab } from "@/components/dashboard/WeatherTab";
import { WishlistTab } from "@/components/dashboard/WishlistTab";

import { translations } from "@/components/dashboard/translations";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Farmer Dashboard — AgriCare" }
    ],
  }),
  component: CustomerDashboard,
});

type TabType =
  | "overview"
  | "profile"
  | "detect"
  | "consultations"
  | "tickets"
  | "marketplace"
  | "cart"
  | "orders"
  | "payments"
  | "crop-history"
  | "weather"
  | "wishlist";

function CustomerDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [wishlistItemsCount, setWishlistItemsCount] = useState<number>(0);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  const fetchCartAndWishlistCount = async () => {
    try {
      const cartRes = await apiFetch("/api/customer/cart");
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        const items = cartData.cart || [];
        setCartItemsCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0));
      }

      const wishlistRes = await apiFetch("/api/customer/wishlist");
      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json();
        const items = wishlistData.wishlist || [];
        setWishlistItemsCount(items.length);
        setWishlistIds(items.map((item: any) => item._id));
      }
    } catch (err) {
      console.error("Error fetching cart/wishlist count", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "FARMER") {
      fetchCartAndWishlistCount();
    }
  }, [isAuthenticated, user]);

  // Shared states for redirection actions
  const [selectedCrop, setSelectedCrop] = useState<string>("Paddy (Rice)");
  const [cropImageUrl, setCropImageUrl] = useState<string>("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [detectWorkflowStep, setDetectWorkflowStep] = useState<"category" | "info" | "upload" | "analyzing" | "report">("category");
  
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const setDetectState = (state: { cropName: string; imageUrl: string; detectWorkflowStep: any; scanResult: any }) => {
    setSelectedCrop(state.cropName);
    setCropImageUrl(state.imageUrl);
    setDetectWorkflowStep(state.detectWorkflowStep);
    setScanResult(state.scanResult);
  };

  const handleLogoutClick = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate({ to: "/" });
  };

  if (!isAuthenticated || user?.role !== "FARMER") {
    return null;
  }

  // Sidebar navigation menu options
  const menuItems = [
    { id: "overview" as TabType, label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "detect" as TabType, label: "AI Disease Detection", icon: ScanLine },
    { id: "consultations" as TabType, label: "Agronomist Consultations", icon: MessageSquare },
    { id: "marketplace" as TabType, label: "Marketplace Shop", icon: Store },
    { id: "cart" as TabType, label: "Shopping Cart", icon: ShoppingCart, badge: cartItemsCount },
    { id: "orders" as TabType, label: "My Orders", icon: Package },
    { id: "wishlist" as TabType, label: "My Wishlist", icon: Heart, badge: wishlistItemsCount },
    { id: "tickets" as TabType, label: "Support Tickets", icon: TicketIcon },
    { id: "crop-history" as TabType, label: "Crop Care History", icon: History },
    { id: "payments" as TabType, label: "Payments Logs", icon: CreditCard },
    { id: "weather" as TabType, label: "Weather Forecast", icon: CloudSun },
    { id: "profile" as TabType, label: "Farms & Profile", icon: UserIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="w-68 h-full border-r border-border bg-card hidden lg:flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-border pb-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="text-left">
                <span className="font-bold text-[15px] tracking-tight text-foreground block leading-none">AgriCare</span>
                <span className="text-[10px] text-muted-foreground mt-1 block">Farmer Portal</span>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-colors border-0 ${
                      isActive
                        ? "bg-brand text-brand-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4.5 w-4.5" />
                      {translations[language][item.id + "_menu"] || item.label}
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-brand-foreground text-brand" : "bg-brand text-brand-foreground"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 border border-border/40 rounded-lg bg-muted/20">
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold leading-none text-foreground truncate">{user.name}</p>
                <p className="mt-1 text-[9px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogoutClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10 transition-colors border-0 bg-transparent"
            >
              <LogOut className="h-4.5 w-4.5" />
              {translations[language].exitPortal || "Exit Portal"}
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-sm">
          <div className="w-64 bg-card h-full p-4 flex flex-col justify-between border-r border-border animate-in slide-in-from-left">
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
                <span className="font-bold text-md text-brand">Customer Dashboard</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-muted rounded-full border-0 bg-transparent cursor-pointer">
                  <span className="text-lg">✕</span>
                </button>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors border-0 ${
                        isActive
                          ? "bg-brand text-brand-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {translations[language][item.id + "_menu"] || item.label}
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? "bg-brand-foreground text-brand" : "bg-brand text-brand-foreground"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 border-0 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              {translations[language].exitPortal || "Exit Portal"}
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 h-full flex flex-col overflow-hidden pb-16 lg:pb-0">
        
        {/* HEADER */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/85 backdrop-blur px-6 flex-shrink-0 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 hover:bg-muted rounded-md lg:hidden border-0 bg-transparent cursor-pointer">
              <Menu className="h-5.5 w-5.5 text-foreground" />
            </button>
          </div>

          {/* Brand Name in Middle */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 font-black text-base tracking-tight text-brand">
            AgriCare
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selection */}
            <button
              onClick={() => setLanguage(prev => prev === "en" ? "te" : "en")}
              className="flex items-center gap-1 text-xs font-bold border border-brand/20 bg-brand/5 text-brand px-3 py-1.5 rounded-full hover:bg-brand/10 transition-all cursor-pointer shadow-soft"
            >
              🌐 {translations[language].toggleLanguage}
            </button>

            {/* Notification Bell */}
            <button className="relative p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full border-0 bg-transparent cursor-pointer transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* MAIN Dynamic Tab Panel */}
        <main className="flex-grow p-4 md:p-6 overflow-y-auto no-scrollbar bg-muted/20">
          {activeTab === "overview" && (
            <OverviewTab
              language={language}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab />
          )}

          {activeTab === "detect" && (
            <DetectTab
              language={language}
              setActiveTab={setActiveTab}
              setSelectedConsultation={setSelectedConsultation}
              selectedCrop={selectedCrop}
              setSelectedCrop={setSelectedCrop}
              cropImageUrl={cropImageUrl}
              setCropImageUrl={setCropImageUrl}
              scanResult={scanResult}
              setScanResult={setScanResult}
              detectWorkflowStep={detectWorkflowStep}
              setDetectWorkflowStep={setDetectWorkflowStep}
            />
          )}

          {activeTab === "consultations" && (
            <ConsultationsTab
              language={language}
            />
          )}

          {activeTab === "tickets" && (
            <TicketsTab />
          )}

          {activeTab === "marketplace" && (
            <MarketplaceTab
              wishlistIds={wishlistIds}
              onCartOrWishlistUpdate={fetchCartAndWishlistCount}
            />
          )}

          {activeTab === "cart" && (
            <CartTab
              setActiveTab={setActiveTab}
              onCartOrWishlistUpdate={fetchCartAndWishlistCount}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab />
          )}

          {activeTab === "payments" && (
            <PaymentsTab />
          )}

          {activeTab === "crop-history" && (
            <CropHistoryTab
              language={language}
              setActiveTab={setActiveTab}
              setDetectState={setDetectState}
              setSelectedConsultation={setSelectedConsultation}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {activeTab === "weather" && (
            <WeatherTab />
          )}

          {activeTab === "wishlist" && (
            <WishlistTab
              onCartOrWishlistUpdate={fetchCartAndWishlistCount}
            />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 h-16 bg-card border-t border-border flex items-center justify-around z-40 lg:hidden shadow-lift shrink-0">
        {[
          { id: "overview" as TabType, label: "Home", icon: LayoutDashboard },
          { id: "detect" as TabType, label: "Detect", icon: ScanLine },
          { id: "marketplace" as TabType, label: "Shop", icon: Store },
          { id: "orders" as TabType, label: "Orders", icon: Package },
          { id: "profile" as TabType, label: "Profile", icon: UserIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 p-2 transition-colors cursor-pointer border-0 bg-transparent ${
                isActive ? "text-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold tracking-tight">
                {translations[language][tab.id + "_bottom"] || tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
