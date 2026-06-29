import { useEffect, useState } from "react";
import {
  Sparkles,
  ScanLine,
  Store,
  Camera,
  Ticket as TicketIcon,
  MessageSquare,
  CloudSun,
  AlertTriangle,
  Package,
  RefreshCw
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { translations } from "./translations";

interface OverviewTabProps {
  language: "en" | "te";
  setActiveTab: (tab: any) => void;
}

export function OverviewTab({ language, setActiveTab }: OverviewTabProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const response = await apiFetch("/api/customer/dashboard-summary");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Error loading dashboard details", err);
      toast.error("Failed to load dashboard details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        toast.success("Product added to cart!");
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!dashboardData || !user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No dashboard data available.
      </div>
    );
  }

  const farmsCount = dashboardData.farmsCount || 0;

  // Get dynamic greeting based on IST hour
  const getISTGreeting = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (3600000 * 5.5));
    const hours = istDate.getHours();
    
    if (language === "te") {
      if (hours >= 5 && hours < 12) return "శుభోదయం";
      if (hours >= 12 && hours < 17) return "శుభ మధ్యాహ్నం";
      return "శుభ సాయంత్రం";
    } else {
      if (hours >= 5 && hours < 12) return "Good morning";
      if (hours >= 12 && hours < 17) return "Good afternoon";
      return "Good evening";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card replaced with plain text IST greeting */}
      <div className="py-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {getISTGreeting()}, {user.name}!
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {language === "en" 
            ? `Welcome to your farm advisor platform. You currently have ${farmsCount} registered fields.`
            : `మీ వ్యవసాయ సలహాదారు ప్లాట్‌ఫారమ్‌కు స్వాగతం. మీకు ప్రస్తుతం ${farmsCount} నమోదిత ఫీల్డ్‌లు ఉన్నాయి.`}
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-muted-foreground tracking-wider uppercase">{translations[language].quickActions}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Scan Crop", icon: Camera, color: "bg-emerald-50 text-emerald-700", tab: "detect", key: "actionScan" },
            { label: "Raise Ticket", icon: TicketIcon, color: "bg-blue-50 text-blue-700", tab: "tickets", key: "actionTicket" },
            { label: "Chat Specialist", icon: MessageSquare, color: "bg-purple-50 text-purple-700", tab: "consultations", key: "actionChat" },
            { label: "Buy Products", icon: Store, color: "bg-amber-50 text-amber-700", tab: "marketplace", key: "actionBuy" }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(action.tab)}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-soft hover:shadow-card hover:border-brand/40 transition-all text-left cursor-pointer outline-none"
            >
              <div className={`p-2.5 rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="font-bold text-xs tracking-tight">{translations[language][action.key] || action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather & Active Counts Row */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Weather card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-brand" />
              <span className="font-bold text-sm">Hyperlocal Weather</span>
            </div>
            <button onClick={() => setActiveTab("weather")} className="text-xs text-brand font-semibold hover:underline bg-transparent border-0 cursor-pointer">
              Full 7-Day Forecast &rarr;
            </button>
          </div>
          {dashboardData.weatherInfo && (
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-3xl font-extrabold text-foreground">{dashboardData.weatherInfo.temp}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Humidity: {dashboardData.weatherInfo.humidity} | Wind: {dashboardData.weatherInfo.windSpeed}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] uppercase">
                  {dashboardData.weatherInfo.rainForecast}
                </span>
              </div>
            </div>
          )}
          {dashboardData.weatherInfo?.alerts && (
            <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-xl flex gap-2.5 items-start">
              <AlertTriangle className="h-4.5 w-4.5 text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-warning-foreground font-semibold">
                {dashboardData.weatherInfo.alerts}
              </p>
            </div>
          )}
        </div>

        {/* Stats counters */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Package className="h-5 w-5 text-brand" />
            <span className="font-bold text-sm">Pending Actions</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div onClick={() => setActiveTab("tickets")} className="p-3 bg-muted/30 border border-border rounded-xl cursor-pointer hover:border-brand/40">
              <p className="text-2xl font-extrabold text-foreground">{dashboardData.openTicketsCount}</p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-1">Open Tickets</p>
            </div>
            <div onClick={() => setActiveTab("consultations")} className="p-3 bg-muted/30 border border-border rounded-xl cursor-pointer hover:border-brand/40">
              <p className="text-2xl font-extrabold text-foreground">{dashboardData.activeConsultationsCount}</p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-1">Active Consults</p>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Health Summary & Recent Scans */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <span className="font-bold text-sm">Recent Leaf Diagnoses</span>
          <button onClick={() => setActiveTab("crop-history")} className="text-xs text-brand font-semibold hover:underline bg-transparent border-0 cursor-pointer">
            View History &rarr;
          </button>
        </div>
        {!dashboardData.recentReports || dashboardData.recentReports.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No crop disease reports submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentReports.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border/60 rounded-xl hover:bg-muted/10">
                <div className="flex items-center gap-3">
                  <img src={r.imageUrl} alt="" className="h-10 w-10 object-cover rounded-lg border bg-muted" />
                  <div>
                    <h4 className="font-bold text-xs">{r.cropName}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Prediction: {r.aiPrediction?.disease}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  r.status === 'RESOLVED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
