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
  RefreshCw,
  Calendar,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { translations } from "./translations";

interface OverviewTabProps {
  language: "en" | "te";
  setActiveTab: (tab: any) => void;
  setSelectedOrder: (order: any) => void;
  setSelectedConsultation: (consultation: any) => void;
}

export function OverviewTab({ language, setActiveTab, setSelectedOrder, setSelectedConsultation }: OverviewTabProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTrackerIdx, setCurrentTrackerIdx] = useState(0);

  const fetchOverviewData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await apiFetch("/api/customer/dashboard-summary");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error("Error loading dashboard details", err);
      if (!isSilent) toast.error("Failed to load dashboard details");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchOverviewData(true);
    };

    socket.on("order_updated", handleUpdate);
    socket.on("ticket_status_updated", handleUpdate);
    socket.on("ticket_chat_updated", handleUpdate);
    socket.on("consultation_updated", handleUpdate);
    socket.on("consultation_chat_updated", handleUpdate);
    socket.on("report_created", handleUpdate);
    socket.on("report_updated", handleUpdate);

    return () => {
      socket.off("order_updated", handleUpdate);
      socket.off("ticket_status_updated", handleUpdate);
      socket.off("ticket_chat_updated", handleUpdate);
      socket.off("consultation_updated", handleUpdate);
      socket.off("consultation_chat_updated", handleUpdate);
      socket.off("report_created", handleUpdate);
      socket.off("report_updated", handleUpdate);
    };
  }, [socket]);

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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    } catch (e) {
      return "";
    }
  };

  const totalOngoingCount = (dashboardData.ongoingOrders?.length || 0) + (dashboardData.ongoingConsultations?.length || 0);

  return (
    <div className="space-y-6">
      {/* Welcome Card replaced with plain text IST greeting */}
      <div className="py-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {getISTGreeting()}, {user.name}!
        </h1>
      </div>

      {/* Ongoing Tracking Section (Carousel) */}
      {(() => {
        const ongoingTrackers = [
          ...(dashboardData?.ongoingOrders || []).map((o: any) => ({ type: 'ORDER', data: o })),
          ...(dashboardData?.ongoingConsultations || []).map((c: any) => ({ type: 'CONSULTATION', data: c }))
        ];

        if (ongoingTrackers.length === 0) return null;

        const safeIdx = currentTrackerIdx >= ongoingTrackers.length ? 0 : currentTrackerIdx;
        const activeTracker = ongoingTrackers[safeIdx];

        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-muted-foreground tracking-wider uppercase">
                {language === "en" ? "Ongoing Trackers" : "కొనసాగుతున్న ట్రాకర్లు"}
              </h3>
              {ongoingTrackers.length > 1 && (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {safeIdx + 1} / {ongoingTrackers.length}
                </span>
              )}
            </div>
            
            <div className="relative group w-full">
              {/* Left Chevron Button */}
              {ongoingTrackers.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTrackerIdx(prev => (prev - 1 + ongoingTrackers.length) % ongoingTrackers.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm cursor-pointer border-0 shadow-soft hover:scale-105 active:scale-95 transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Right Chevron Button */}
              {ongoingTrackers.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTrackerIdx(prev => (prev + 1) % ongoingTrackers.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm cursor-pointer border-0 shadow-soft hover:scale-105 active:scale-95 transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Card Content */}
              {activeTracker.type === 'ORDER' ? (
                <div 
                  onClick={() => {
                    setSelectedOrder(activeTracker.data);
                    setActiveTab("orders");
                  }}
                  className="bg-brand bg-gradient-to-br from-brand to-brand-secondary text-white rounded-2xl p-5 md:p-6 shadow-card hover:shadow-lift transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer hover:scale-[1.005] duration-200 min-h-[160px]"
                >
                  <div className="absolute top-5 right-5 hidden md:block">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white border border-white/10 font-bold text-[10px] uppercase tracking-wider">
                      {activeTracker.data.status}
                    </span>
                  </div>

                  <div className="space-y-3 px-2 md:px-10">
                    <div>
                      <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
                        {language === "en" ? "Ongoing Order" : "కొనసాగుతున్న ఆర్డర్"}
                      </p>
                      <h2 className="text-white text-lg md:text-xl font-extrabold tracking-tight mt-1 truncate max-w-[80%]">
                        {activeTracker.data.items[0]?.product} {activeTracker.data.items.length > 1 ? `+${activeTracker.data.items.length - 1} more` : ""}
                      </h2>
                    </div>

                    <div className="block md:hidden">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/10 font-bold text-[10px] uppercase tracking-wider">
                        {activeTracker.data.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/90">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{formatDate(activeTracker.data.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{formatTime(activeTracker.data.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-1 md:mt-6 px-2 md:px-10 text-left">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(activeTracker.data);
                        setActiveTab("orders");
                      }}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-brand font-bold text-xs rounded-xl shadow-soft hover:bg-white/95 active:scale-95 transition-all cursor-pointer border-0"
                    >
                      {language === "en" ? "Track Order" : "ఆర్డర్ ట్రాక్ చేయండి"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setSelectedConsultation(activeTracker.data);
                    setActiveTab("consultations");
                  }}
                  className="bg-brand bg-gradient-to-br from-brand to-emerald-600 text-white rounded-2xl p-5 md:p-6 shadow-card hover:shadow-lift transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer hover:scale-[1.005] duration-200 min-h-[160px]"
                >
                  <div className="absolute top-5 right-5 hidden md:block">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-white border border-white/10 font-bold text-[10px] uppercase tracking-wider">
                      {activeTracker.data.status === 'PENDING' ? 'Created' : activeTracker.data.status}
                    </span>
                  </div>

                  <div className="space-y-3 px-2 md:px-10">
                    <div>
                      <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">
                        {language === "en" ? "Ongoing Service" : "కొనసాగుతున్న సేవ"}
                      </p>
                      <h2 className="text-white text-lg md:text-xl font-extrabold tracking-tight mt-1 truncate max-w-[80%]">
                        {activeTracker.data.reportId?.cropName ? `${activeTracker.data.reportId.cropName.toUpperCase()} CONSULTATION` : "CROP CONSULTATION"}
                      </h2>
                    </div>

                    <div className="block md:hidden">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/10 font-bold text-[10px] uppercase tracking-wider">
                        {activeTracker.data.status === 'PENDING' ? 'Created' : activeTracker.data.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/90">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{formatDate(activeTracker.data.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{formatTime(activeTracker.data.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-1 md:mt-6 px-2 md:px-10 text-left">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConsultation(activeTracker.data);
                        setActiveTab("consultations");
                      }}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-brand font-bold text-xs rounded-xl shadow-soft hover:bg-white/95 active:scale-95 transition-all cursor-pointer border-0"
                    >
                      {language === "en" ? "Track Service" : "సేవను ట్రాక్ చేయండి"} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination Dots */}
              {ongoingTrackers.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3 shrink-0">
                  {ongoingTrackers.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTrackerIdx(dotIdx);
                      }}
                      className={`h-1.5 rounded-full transition-all border-0 p-0 cursor-pointer ${
                        safeIdx === dotIdx ? "w-4 bg-brand" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-card border border-border rounded-xl shadow-soft hover:shadow-card hover:border-brand/40 transition-all text-center sm:text-left cursor-pointer outline-none w-full"
            >
              <div className={`p-2 sm:p-2.5 rounded-lg ${action.color} shrink-0`}>
                <action.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <span className="font-bold text-[10px] sm:text-xs tracking-tight leading-tight">{translations[language][action.key] || action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather Row */}
      <div className="w-full">
        {/* Weather card */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft w-full">
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
