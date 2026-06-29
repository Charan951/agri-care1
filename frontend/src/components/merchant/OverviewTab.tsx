import { TrendingUp, Landmark, ShoppingCart, AlertTriangle, Star, Bell } from "lucide-react";

interface OverviewTabProps {
  stats: any;
}

export function OverviewTab({ stats }: OverviewTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Overview Dashboard</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Summary insights, revenue data, and real-time alerts.</p>
        </div>
        <div className="text-xs text-muted-foreground font-semibold bg-card px-3 py-1.5 rounded-lg border border-border">
          Last Sync: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Gross Revenues</span>
            <h3 className="text-2xl font-black mt-1 text-foreground">₹{(stats?.stats?.totalRevenue || 0).toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1 inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +14.2% MoM</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center"><Landmark className="h-5.5 w-5.5" /></div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Today's Orders</span>
            <h3 className="text-2xl font-black mt-1 text-foreground">{stats?.stats?.todayOrders || 0}</h3>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 inline-block">New items requiring pack</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center"><ShoppingCart className="h-5.5 w-5.5" /></div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Low Stock alerts</span>
            <h3 className="text-2xl font-black mt-1 text-destructive">{stats?.stats?.lowStock || 0}</h3>
            <span className="text-[10px] text-destructive font-semibold mt-1 inline-block">Immediate restock needed</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-destructive/10 text-destructive grid place-items-center"><AlertTriangle className="h-5.5 w-5.5" /></div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Store Feedback Rating</span>
            <h3 className="text-2xl font-black mt-1 text-foreground">{stats?.stats?.averageRating || 5.0} ★</h3>
            <span className="text-[10px] text-muted-foreground font-semibold mt-1 inline-block">From {stats?.stats?.reviewCount || 0} total reviews</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center"><Star className="h-5.5 w-5.5" /></div>
        </div>
      </div>

      {/* Graphic Chart + Best Sellers */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
            <h3 className="text-sm font-bold text-foreground">Sales Trend Overview</h3>
            <span className="text-[11px] text-muted-foreground font-semibold">Past 6 Months</span>
          </div>
          <div className="h-56 w-full flex flex-col justify-between pt-2">
            <div className="flex-1 relative overflow-hidden rounded-xl bg-muted/5">
              <svg className="absolute inset-0 w-full h-full overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand, #4CAF50)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--brand, #4CAF50)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d="M 0 80 Q 20 40, 40 50 T 80 20 T 100 30" fill="none" stroke="var(--brand, #4CAF50)" strokeWidth="3" />
                <path d="M 0 80 Q 20 40, 40 50 T 80 20 T 100 30 L 100 100 L 0 100 Z" fill="url(#chartGrad)" />
              </svg>
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-border/30 w-full" />
                <div className="border-t border-border/30 w-full" />
                <div className="border-t border-border/30 w-full" />
                <div className="border-t border-border/30 w-full" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground pt-3 border-t border-border">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border mb-3">Best Sellers</h3>
          <div className="space-y-4">
            {stats?.bestSellingProducts?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                  <img src={item.imageUrl || "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200"} className="h-full w-full object-cover" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate text-foreground">{item.name}</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold block">{item.quantity} items sold</span>
                </div>
                <span className="text-xs font-bold text-brand">₹{item.sales}</span>
              </div>
            ))}
            {(!stats?.bestSellingProducts || stats.bestSellingProducts.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-8">No selling metrics recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Reviews Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border mb-3">Customer Feedbacks</h3>
          <div className="space-y-3">
            {stats?.recentReviews?.map((r: any, idx: number) => (
              <div key={idx} className="border-b border-border/40 pb-3 last:border-0 last:pb-0 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{r.reviewerName}</span>
                  <span className="text-xs text-yellow-500 font-bold">{"★".repeat(Math.round(r.rating))}</span>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">Product: {r.productName}</span>
                <p className="text-xs text-muted-foreground/90 italic mt-1 font-medium bg-muted/30 p-2 rounded-lg">"{r.comment}"</p>
              </div>
            ))}
            {(!stats?.recentReviews || stats.recentReviews.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-8">No feedback responses recorded.</p>
            )}
          </div>
        </div>

        {/* Notifications Alert Feed */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border mb-3">Real-time Alert Feed</h3>
          <div className="space-y-3">
            {stats?.recentNotifications?.map((n: any, idx: number) => (
              <div key={idx} className="flex gap-3 items-start border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="p-1.5 rounded-lg bg-brand/10 text-brand mt-0.5 flex-shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[9px] text-muted-foreground/60 font-bold block mt-1">
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.recentNotifications || stats.recentNotifications.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-8">No notifications currently pending.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
