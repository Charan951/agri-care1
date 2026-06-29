import { Download } from "lucide-react";
import { toast } from "sonner";

export function ReportsTab() {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">Generate daily, weekly, monthly and profit-analysis reports for audits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground">Export Sales Reports</h3>
          <p className="text-xs text-muted-foreground font-medium">Download full transaction statistics, GST breakdowns and sales values in spreadsheet structure.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => toast.info("Exporting Daily Sales Log...")}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5 bg-card text-foreground cursor-pointer"
            >
              <Download className="h-4 w-4" /> Daily Sales (CSV)
            </button>
            <button
              onClick={() => toast.info("Exporting Monthly Business Audit...")}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5 bg-card text-foreground cursor-pointer"
            >
              <Download className="h-4 w-4" /> Monthly Audit (PDF)
            </button>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground">Inventory Turnover Reports</h3>
          <p className="text-xs text-muted-foreground font-medium">Analyze low-performance inventory list and product restocking cycles.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => toast.info("Exporting Low Stock Audits...")}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5 bg-card text-foreground cursor-pointer"
            >
              <Download className="h-4 w-4" /> Low Stock Audits (CSV)
            </button>
            <button
              onClick={() => toast.info("Exporting Product Performance Reports...")}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5 bg-card text-foreground cursor-pointer"
            >
              <Download className="h-4 w-4" /> Performance Reports (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
