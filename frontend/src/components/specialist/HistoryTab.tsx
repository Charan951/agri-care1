import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HistoryTabProps {
  assignedConsultations: any[];
  selectConsultation: (id: string) => void;
}

export function HistoryTab({ assignedConsultations, selectConsultation }: HistoryTabProps) {
  const completedCases = assignedConsultations.filter(c => c.status === "COMPLETED");

  return (
    <Card className="shadow-sm border-border bg-card text-foreground">
      <CardHeader className="py-4 border-b border-border/60 text-left">
        <CardTitle className="text-sm font-bold text-emerald-800">Closed & Completed Consultation Records</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/60">
          {completedCases.map((c: any) => (
            <div key={c._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left overflow-hidden">
                <h4 className="font-bold text-sm text-foreground">{c.reportId?.cropName || "Cotton"} Case Record</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Farmer: {c.farmerId?.name} &bull; Closed: {new Date(c.updatedAt).toLocaleDateString()}
                </p>
                {c.diagnosisDetails?.disease && (
                  <Badge variant="outline" className="mt-2 text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/25">
                    Diagnosed: {c.diagnosisDetails.disease}
                  </Badge>
                )}
              </div>
              <Button 
                onClick={() => selectConsultation(c._id)} 
                variant="outline" 
                className="h-8 text-xs font-bold border-border cursor-pointer bg-transparent text-foreground hover:bg-muted"
              >
                View Details & Prescription
              </Button>
            </div>
          ))}
          {completedCases.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No historical consultation records found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
