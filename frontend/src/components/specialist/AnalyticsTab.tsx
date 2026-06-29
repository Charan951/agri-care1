import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsTabProps {
  stats: any;
}

export function AnalyticsTab({ stats }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* KPI card row */}
      <div className="grid grid-cols-3 gap-5">
        <Card className="shadow-sm border-border bg-card text-foreground">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground font-semibold">Total Completed</p>
            <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">{stats.completed}</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-card text-foreground">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground font-semibold">Resolution Speed (Avg)</p>
            <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">12.5 hrs</h3>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-card text-foreground">
          <CardContent className="p-5 text-center">
            <p className="text-xs text-muted-foreground font-semibold">Total Revenue Share</p>
            <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">₹{stats.earnings}</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly case volume chart */}
        <Card className="shadow-sm border-border bg-card text-foreground">
          <CardHeader className="py-4 border-b border-border text-left">
            <CardTitle className="text-sm font-bold text-emerald-800">Monthly Consultations Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48 flex items-end gap-5 justify-center border-b border-border pb-2">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 bg-emerald-600 rounded-t-md h-12" />
                <span className="text-[10px] text-muted-foreground">April</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 bg-emerald-600 rounded-t-md h-24" />
                <span className="text-[10px] text-muted-foreground">May</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 bg-emerald-700 rounded-t-md h-36" />
                <span className="text-[10px] text-muted-foreground">June</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common disease frequency */}
        <Card className="shadow-sm border-border bg-card text-foreground">
          <CardHeader className="py-4 border-b border-border text-left">
            <CardTitle className="text-sm font-bold text-emerald-800">Crop Disease Diagnostic Frequency</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs text-left">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Alternaria Leaf Spot</span>
                <span>64%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full w-[64%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Bacterial Leaf Blight</span>
                <span>22%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full w-[22%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Tomato Early Blight</span>
                <span>14%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full w-[14%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
