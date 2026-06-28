import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Plus, Edit2, Trash2, FileBarChart, RefreshCw, X, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

interface ChartDataPoint {
  name?: string;
  Farmers?: number;
  region?: string;
  Reports?: number;
  Sales?: number;
  Revenue?: number;
}

interface AnalyticsPayload {
  farmerAnalytics: ChartDataPoint[];
  diseaseAnalytics: ChartDataPoint[];
  merchantAnalytics: ChartDataPoint[];
  revenueAnalytics: ChartDataPoint[];
}

interface CustomReportRecord {
  id: string;
  title: string;
  type: string;
  dateRange: string;
  fileSize: string;
  createdAt: string;
}

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Custom Reports CRUD State
  const [reports, setReports] = useState<CustomReportRecord[]>([
    { id: "REP_001", title: "Q1 Fertilizer Sales Audit", type: "Merchant Analytics", dateRange: "Jan 2026 - Mar 2026", fileSize: "1.4 MB", createdAt: new Date(Date.now() - 3600000 * 24 * 5).toLocaleString() },
    { id: "REP_002", title: "Monsoon Paddy Disease Survey", type: "Disease Analytics", dateRange: "May 2026 - Jun 2026", fileSize: "820 KB", createdAt: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString() }
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReportRecord | null>(null);

  // Form Fields
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("Revenue Analytics");
  const [reportRange, setReportRange] = useState("Last 30 Days");

  const fetchAnalytics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const payload = await response.json();
        setData(payload);
      } else {
        toast.error("Failed to load platform analytics.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(true);
  };

  // CRUD Actions
  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) {
      toast.error("Report Title is required.");
      return;
    }

    const newReport: CustomReportRecord = {
      id: `REP_${Math.floor(100 + Math.random() * 900)}`,
      title: reportTitle,
      type: reportType,
      dateRange: reportRange,
      fileSize: `${(1.0 + Math.random() * 3.5).toFixed(1)} MB`,
      createdAt: new Date().toLocaleString()
    };

    setReports(prev => [newReport, ...prev]);
    setIsCreateOpen(false);
    toast.success("Analytical report queued and compiled successfully.");
  };

  const handleUpdateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport || !reportTitle.trim()) return;

    setReports(prev => prev.map(r => 
      r.id === editingReport.id 
        ? { ...r, title: reportTitle, type: reportType, dateRange: reportRange } 
        : r
    ));
    setIsEditOpen(false);
    toast.success("Report parameters updated successfully.");
  };

  const handleDeleteReport = (id: string) => {
    if (!confirm("Are you sure you want to delete this compiled report from the platform archive?")) return;
    setReports(prev => prev.filter(r => r.id !== id));
    toast.success("Report deleted successfully.");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Reports & Aggregations</h3>
          <p className="text-xs text-muted-foreground">Interactive analytics and statistical visualisations.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Sync Reports
        </button>
      </div>

      {/* CHARTS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CHART 1: Revenue Trends */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h4 className="text-sm font-bold border-b border-border pb-3">Monthly Gross Payouts (Revenue)</h4>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenueAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Revenue" stroke="#059669" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Farmer registrations */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h4 className="text-sm font-bold border-b border-border pb-3">Farmer Registrations Growth</h4>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.farmerAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Farmers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Disease outbreaks by Region */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h4 className="text-sm font-bold border-b border-border pb-3">Active Crop Diseases by Territory</h4>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.diseaseAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Reports" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Top Merchants */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h4 className="text-sm font-bold border-b border-border pb-3">Top Storefront Sales Leaders (Gross Sales)</h4>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.merchantAnalytics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Sales" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CUSTOM COMPILED REPORTS CRUD SECTION */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <FileBarChart className="h-4.5 w-4.5 text-brand" />
            Report Exporters & Archive
          </h4>
          <button
            onClick={() => {
              setReportTitle("");
              setReportType("Revenue Analytics");
              setReportRange("Last 30 Days");
              setIsCreateOpen(true);
            }}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Custom Report
          </button>
        </div>

        {/* ARCHIVE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase">
                <th className="px-4 py-3">Report Document</th>
                <th className="px-4 py-3">Metric Scope</th>
                <th className="px-4 py-3">Range Scope</th>
                <th className="px-4 py-3">File Size</th>
                <th className="px-4 py-3">Generated At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-muted/15 transition-colors">
                  <td className="px-4 py-3 font-bold text-foreground flex items-center gap-2">
                    <FileBarChart className="h-4 w-4 text-muted-foreground" />
                    <span>{rep.title}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{rep.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rep.dateRange}</td>
                  <td className="px-4 py-3 font-semibold">{rep.fileSize}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rep.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => toast.success("Downloading report...")}
                        className="cursor-pointer rounded border border-border p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Download CSV/PDF"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingReport(rep);
                          setReportTitle(rep.title);
                          setReportType(rep.type);
                          setReportRange(rep.dateRange);
                          setIsEditOpen(true);
                        }}
                        className="cursor-pointer rounded border border-border p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Update report metadata"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="cursor-pointer rounded border border-border p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-600"
                        title="Delete report"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsCreateOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-brand" />
              Generate Analytical Report
            </h4>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Report Title</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  placeholder="e.g. Q2 Farmer Growth Audit"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="Revenue Analytics">Revenue Analytics</option>
                    <option value="Farmer Analytics">Farmer Analytics</option>
                    <option value="Disease Analytics">Disease Analytics</option>
                    <option value="Merchant Analytics">Merchant Analytics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Timeline Range</label>
                  <select
                    value={reportRange}
                    onChange={(e) => setReportRange(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Full Year (2026)">Full Year (2026)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Compile & Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsEditOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Edit2 className="h-4.5 w-4.5 text-brand" />
              Update Archive Parameters
            </h4>

            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Report Title</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="Revenue Analytics">Revenue Analytics</option>
                    <option value="Farmer Analytics">Farmer Analytics</option>
                    <option value="Disease Analytics">Disease Analytics</option>
                    <option value="Merchant Analytics">Merchant Analytics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Timeline Range</label>
                  <select
                    value={reportRange}
                    onChange={(e) => setReportRange(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Full Year (2026)">Full Year (2026)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
