import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface NotificationsTabProps {
  notifications: any[];
  setNotifications: (val: any) => void;
}

export function NotificationsTab({ notifications, setNotifications }: NotificationsTabProps) {
  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await apiFetch(`/api/merchant/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        setNotifications((prev: any[]) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/merchant/notifications/read-all", { method: "PUT" });
      if (res.ok) {
        setNotifications((prev: any[]) => prev.map(n => ({ ...n, isRead: true })));
        toast.success("Marked all notifications as read");
      }
    } catch (err) {
      toast.error("Failed to mark notifications read.");
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Alert Feeds</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">View real-time stock, order, and platform transaction notification items.</p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted bg-card text-foreground cursor-pointer"
        >
          Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleMarkNotificationRead(n._id)}
            className={`p-4 border rounded-xl shadow-soft flex items-start gap-4 transition-all cursor-pointer ${
              n.isRead ? "bg-card/60 border-border/60 opacity-80" : "bg-brand/5 border-brand/20 shadow-md"
            }`}
          >
            <div className="p-2 rounded-lg bg-brand/10 text-brand mt-0.5">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-foreground">{n.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{n.message}</p>
              <span className="text-[10px] text-muted-foreground/60 font-semibold mt-1 inline-block">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-12 bg-card p-4 rounded-xl border font-semibold">No notification items pending.</p>
        )}
      </div>
    </div>
  );
}
