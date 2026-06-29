import { Clipboard, Activity, MessageSquare, Star, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OverviewTabProps {
  stats: any;
  recentActivities: any[];
  assignedConsultations: any[];
  handleAccept: (id: string) => void;
  handleRejectClick: (id: string) => void;
  selectConsultation: (id: string) => void;
  setActiveTab: (tab: any) => void;
}

export function OverviewTab({
  stats,
  recentActivities,
  assignedConsultations,
  handleAccept,
  handleRejectClick,
  selectConsultation,
  setActiveTab
}: OverviewTabProps) {
  const activeOrPending = assignedConsultations.filter(
    (c) => c.status === "PENDING" || c.status === "ACTIVE"
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Assigned</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-800 dark:text-emerald-400">{stats.totalAssigned}</h3>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
              <Clipboard className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pending Acceptance</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</h3>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
              <Activity className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Consults</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{stats.active}</h3>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Average Rating</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                {stats.avgRating} <Star className="h-5 w-5 fill-current text-yellow-500 inline shrink-0" />
              </h3>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-yellow-500/10 text-yellow-600">
              <Star className="h-5 w-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Action needed List */}
        <Card className="lg:col-span-2 shadow-sm border-border bg-card">
          <CardHeader className="py-4 border-b border-border/60 text-left">
            <CardTitle className="text-sm font-bold text-emerald-800">Pending & Active Consultation Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {activeOrPending.slice(0, 5).map((c: any) => (
                <div key={c._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-bold text-foreground truncate">{c.reportId?.cropName || "Unknown Crop"} Diagnosis</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Farmer: {c.farmerId?.name || "Farmer"} &bull; {c.reportId?.priority || "MEDIUM"} Priority
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.status === "PENDING" ? (
                      <>
                        <Button
                          onClick={() => handleAccept(c._id)}
                          className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-3 border-0 cursor-pointer"
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectClick(c._id)}
                          variant="ghost"
                          className="h-8 text-red-500 text-xs font-bold hover:bg-red-50 cursor-pointer"
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => selectConsultation(c._id)}
                        className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-3 border-0 cursor-pointer flex items-center"
                      >
                        Open Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {activeOrPending.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No pending or active consultations assigned.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="py-4 border-b border-border/60 text-left">
            <CardTitle className="text-sm font-bold text-emerald-800">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-4 text-xs">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="font-semibold text-foreground truncate">{act.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(act.timestamp).toLocaleDateString()} &bull; {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No recent activity logs.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
