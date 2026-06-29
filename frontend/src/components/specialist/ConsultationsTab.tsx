import { Search, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ConsultationsTabProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  districtFilter: string;
  setDistrictFilter: (val: string) => void;
  assignedConsultations: any[];
  handleAccept: (id: string) => void;
  handleRejectClick: (id: string) => void;
  selectConsultation: (id: string) => void;
}

export function ConsultationsTab({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  districtFilter,
  setDistrictFilter,
  assignedConsultations,
  handleAccept,
  handleRejectClick,
  selectConsultation
}: ConsultationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Search and Filters bar */}
      <Card className="shadow-sm border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases by farmer name, crop disease..."
            className="pl-9 h-10 bg-background text-foreground border-border"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 text-xs bg-background text-foreground border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] h-10 text-xs bg-background text-foreground border-border">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            placeholder="Filter by District..."
            className="h-10 text-xs w-[160px] bg-background text-foreground border-border"
          />
        </div>
      </Card>

      {/* Consultation List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assignedConsultations.map((c: any) => (
          <Card key={c._id} className="shadow-sm border-border hover:shadow-md transition-all bg-card flex flex-col justify-between">
            <CardHeader className="pb-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant={c.reportId?.priority === "HIGH" ? "destructive" : "secondary"} className="text-[10px] font-bold">
                    {c.reportId?.priority || "MEDIUM"}
                  </Badge>
                  <CardTitle className="text-base font-bold text-foreground mt-2 truncate max-w-[180px]">
                    {c.reportId?.cropName || "Crop"} Consultation
                  </CardTitle>
                </div>
                <Badge className="text-[10px] font-bold uppercase">{c.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3 text-xs text-left space-y-2">
              <p><span className="font-semibold text-muted-foreground">Farmer:</span> {c.farmerId?.name || "N/A"}</p>
              <p className="truncate"><span className="font-semibold text-muted-foreground">Symptoms:</span> {c.reportId?.symptoms || "N/A"}</p>
              <p><span className="font-semibold text-muted-foreground">Assigned:</span> {new Date(c.createdAt).toLocaleDateString()}</p>
            </CardContent>
            <div className="border-t border-border p-3.5 bg-muted/10 flex items-center justify-between">
              {c.status === "PENDING" ? (
                <div className="flex items-center gap-2 w-full justify-between">
                  <Button onClick={() => handleAccept(c._id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 border-0 cursor-pointer">
                    Accept
                  </Button>
                  <Button onClick={() => handleRejectClick(c._id)} size="sm" variant="ghost" className="text-red-500 font-bold text-xs h-8 hover:bg-red-50 cursor-pointer">
                    Reject
                  </Button>
                </div>
              ) : (
                <Button onClick={() => selectConsultation(c._id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 border-0 cursor-pointer flex items-center justify-center">
                  Open Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>
          </Card>
        ))}
        {assignedConsultations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center col-span-full py-10">No consultations match your search filters.</p>
        )}
      </div>
    </div>
  );
}
