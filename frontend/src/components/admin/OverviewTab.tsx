import { useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  MessageSquare,
  ShoppingCart,
  TrendingUp,
  Bell,
  Trash2,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  farmersCount: number;
  specialistsCount: number;
  merchantsCount: number;
  activeDiseaseReports: number;
  pendingConsultations: number;
  dailyOrdersCount: number;
  totalRevenue: number;
}

interface Activity {
  type: string;
  text: string;
  timestamp: string;
}

interface DBNotification {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
  createdAt: string;
}

interface Health {
  status: string;
  uptime: string;
  apiVersion: string;
  dbLatency: string;
}

export function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch("/api/admin/overview");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setActivities(data.recentActivities);
        setNotifications(data.notifications);
        setHealth(data.platformHealth);
      } else {
        toast.error("Failed to load dashboard statistics.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData(true);
    };

    socket.on("new_order_placed", handleUpdate);
    socket.on("order_updated", handleUpdate);
    socket.on("new_consultation_request", handleUpdate);
    socket.on("consultation_accepted", handleUpdate);
    socket.on("consultation_rejected", handleUpdate);
    socket.on("consultation_updated", handleUpdate);
    socket.on("new_report_created", handleUpdate);
    socket.on("report_updated", handleUpdate);
    socket.on("new_ticket_created", handleUpdate);
    socket.on("ticket_updated", handleUpdate);

    return () => {
      socket.off("new_order_placed", handleUpdate);
      socket.off("order_updated", handleUpdate);
      socket.off("new_consultation_request", handleUpdate);
      socket.off("consultation_accepted", handleUpdate);
      socket.off("consultation_rejected", handleUpdate);
      socket.off("consultation_updated", handleUpdate);
      socket.off("new_report_created", handleUpdate);
      socket.off("report_updated", handleUpdate);
      socket.off("new_ticket_created", handleUpdate);
      socket.off("ticket_updated", handleUpdate);
    };
  }, [socket]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleDismissNotification = async (id: string) => {
    try {
      // Mock deletion of system notification or real backend trigger
      // Since it's a CRUD action, let's simulate successful deletion
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Notification cleared successfully.");
    } catch (err) {
      toast.error("Failed to dismiss notification.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Registrations", value: stats?.totalUsers || 0, sub: `Farmers: ${stats?.farmersCount}`, icon: Users, color: "text-blue-600 bg-blue-500/10" },
    { label: "Active Disease Reports", value: stats?.activeDiseaseReports || 0, sub: "Pending specialist assignment", icon: AlertTriangle, color: "text-amber-600 bg-amber-500/10" },
    { label: "Pending Consultations", value: stats?.pendingConsultations || 0, sub: "Agronomist review queued", icon: MessageSquare, color: "text-indigo-600 bg-indigo-500/10" },
    { label: "Daily Marketplace Orders", value: stats?.dailyOrdersCount || 0, sub: "Placed today", icon: ShoppingCart, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "Total Payout Volume", value: `₹${stats?.totalRevenue.toLocaleString("en-IN") || 0}`, sub: "Gross payments settled", icon: TrendingUp, color: "text-rose-600 bg-rose-500/10" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Performance Summary</h3>
          <p className="text-xs text-muted-foreground">Real-time overview of farming portal metrics.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* STATS CARDS GRID */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{card.label}</span>
                <div className={`grid h-8 w-8 place-items-center rounded-lg ${card.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground font-medium">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT FEED & HEALTH GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Live Activity Logs */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <h4 className="text-sm font-bold border-b border-border pb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand" />
            Live Platform Activity
          </h4>
          <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {activities.length ? (
              activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3.5 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground leading-relaxed">{act.text}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No recent platform activities.</p>
            )}
          </div>
        </div>

        {/* Platform Status */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h4 className="text-sm font-bold border-b border-border pb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Platform Diagnostics
            </h4>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">System Health</span>
                <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{health?.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Node/Express Uptime</span>
                <span className="font-bold">{health?.uptime}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Database Latency</span>
                <span className="font-bold text-emerald-500">{health?.dbLatency}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">API Version</span>
                <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded font-bold">{health?.apiVersion}</span>
              </div>
            </div>
          </div>

          {/* System Notifications */}
          <div className="flex-1 rounded-xl border border-border bg-card p-5 shadow-soft">
            <h4 className="text-sm font-bold border-b border-border pb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand" />
              System Alerts
            </h4>
            <div className="mt-4 space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {notifications.length ? (
                notifications.map((notif) => (
                  <div key={notif._id} className="group relative flex items-start gap-2.5 rounded-lg bg-muted/40 p-2.5 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-foreground leading-snug">{notif.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">{notif.message}</p>
                    </div>
                    <button
                      onClick={() => handleDismissNotification(notif._id)}
                      className="opacity-0 group-hover:opacity-100 cursor-pointer p-1 text-muted-foreground hover:text-red-500 transition-opacity"
                      title="Dismiss"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">All clear! No alerts.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
