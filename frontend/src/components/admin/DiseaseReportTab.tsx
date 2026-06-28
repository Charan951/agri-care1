import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Eye, X, ShieldAlert, Cpu, User, AlertCircle, Plus, ArrowLeft, Calendar, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface Specialist {
  _id: string;
  name: string;
  specialization?: string;
}

interface Farmer {
  _id: string;
  name: string;
  email: string;
  mobile: string;
}

interface DiseaseReportRecord {
  _id: string;
  farmerId: Farmer;
  cropName: string;
  symptoms: string;
  imageUrl: string;
  aiPrediction: {
    disease: string;
    confidence: number;
    pesticides: string[];
  };
  specialistDiagnosis?: {
    disease: string;
    diagnosis: string;
    pesticides: string[];
    diagnosedBy: any;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  assignedSpecialistId?: Specialist;
  createdAt: string;
}

export function DiseaseReportTab() {
  const [reports, setReports] = useState<DiseaseReportRecord[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Detailed view Drawer / Modal
  const [selectedReport, setSelectedReport] = useState<DiseaseReportRecord | null>(null);
  
  // Create Mode
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFarmerId, setCreateFarmerId] = useState("");
  const [createCropName, setCreateCropName] = useState("");
  const [createSymptoms, setCreateSymptoms] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("https://images.unsplash.com/photo-1599599810769-bcde5a160d32");
  const [createPriority, setCreatePriority] = useState<DiseaseReportRecord['priority']>("MEDIUM");
  const [createStatus, setCreateStatus] = useState<DiseaseReportRecord['status']>("OPEN");
  const [createSpecialistId, setCreateSpecialistId] = useState("");
  const [createAiDisease, setCreateAiDisease] = useState("Alternaria Leaf Spot");
  const [createAiConfidence, setCreateAiConfidence] = useState(0.95);
  const [createAiPesticides, setCreateAiPesticides] = useState("Copper Oxychloride, Mancozeb");

  // Edit / Action Mode
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editReport, setEditReport] = useState<DiseaseReportRecord | null>(null);
  const [editPriority, setEditPriority] = useState<DiseaseReportRecord['priority']>("MEDIUM");
  const [editStatus, setEditStatus] = useState<DiseaseReportRecord['status']>("OPEN");
  const [editSpecialistId, setEditSpecialistId] = useState("");
  const [diagDisease, setDiagDisease] = useState("");
  const [diagText, setDiagText] = useState("");
  const [diagPesticides, setDiagPesticides] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/reports?status=${statusFilter}&priority=${priorityFilter}&search=${search}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        toast.error("Failed to load disease reports.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialists = async () => {
    try {
      const response = await fetch("/api/admin/users?role=AGRI_SPECIALIST");
      if (response.ok) {
        const data = await response.json();
        setSpecialists(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=FARMER");
      if (response.ok) {
        const data = await response.json();
        setFarmers(data);
        if (data.length > 0) setCreateFarmerId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSpecialists();
    fetchFarmers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, priorityFilter]);

  const openCreateModal = () => {
    fetchFarmers();
    setCreateCropName("");
    setCreateSymptoms("");
    setCreateImageUrl("https://images.unsplash.com/photo-1599599810769-bcde5a160d32");
    setCreatePriority("MEDIUM");
    setCreateStatus("OPEN");
    setCreateSpecialistId("");
    setCreateAiDisease("Alternaria Leaf Spot");
    setCreateAiConfidence(0.95);
    setCreateAiPesticides("Copper Oxychloride, Mancozeb");
    setIsCreateModalOpen(true);
  };

  const openEditModal = (report: DiseaseReportRecord) => {
    setEditReport(report);
    setEditPriority(report.priority);
    setEditStatus(report.status);
    setEditSpecialistId(report.assignedSpecialistId?._id || "");
    setDiagDisease(report.specialistDiagnosis?.disease || "");
    setDiagText(report.specialistDiagnosis?.diagnosis || "");
    setDiagPesticides(report.specialistDiagnosis?.pesticides.join(", ") || "");
    setIsEditModalOpen(true);
  };

  const handleUpdateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReport) return;

    // Automatically transition status to ASSIGNED if specialist is added to OPEN report
    let targetStatus = editStatus;
    if (editSpecialistId && editStatus === "OPEN") {
      targetStatus = "ASSIGNED";
    }

    const payload: any = {
      priority: editPriority,
      status: targetStatus,
      assignedSpecialistId: editSpecialistId || null
    };

    if (diagDisease || diagText) {
      payload.specialistDiagnosis = {
        disease: diagDisease,
        diagnosis: diagText,
        pesticides: diagPesticides ? diagPesticides.split(",").map(p => p.trim()) : [],
        diagnosedBy: editSpecialistId || null
      };
      
      // Automatically resolve report if diagnosis is provided
      if (targetStatus === "ASSIGNED" || targetStatus === "OPEN") {
        payload.status = "RESOLVED";
      }
    }

    try {
      const response = await fetch(`/api/admin/reports/${editReport._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Disease report updated successfully.");
        setIsEditModalOpen(false);
        if (selectedReport?._id === editReport._id) {
          // Refresh drawer details
          const updated = await response.json();
          setSelectedReport(updated.report);
        }
        fetchReports();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update disease report.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFarmerId) {
      toast.error("Please select a farmer.");
      return;
    }
    if (!createCropName) {
      toast.error("Please specify a crop name.");
      return;
    }
    
    const payload = {
      farmerId: createFarmerId,
      cropName: createCropName,
      symptoms: createSymptoms,
      imageUrl: createImageUrl,
      priority: createPriority,
      status: createStatus,
      assignedSpecialistId: createSpecialistId || null,
      aiPrediction: {
        disease: createAiDisease,
        confidence: Number(createAiConfidence),
        pesticides: createAiPesticides ? createAiPesticides.split(",").map(p => p.trim()) : []
      }
    };

    try {
      const response = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Disease report created successfully.");
        setIsCreateModalOpen(false);
        fetchReports();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to create disease report.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this disease report record?")) return;

    try {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Disease report deleted.");
        if (selectedReport?._id === id) setSelectedReport(null);
        fetchReports();
      } else {
        toast.error("Failed to delete record.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {selectedReport ? (
        <div className="space-y-6 animate-fade-in bg-card p-6 rounded-2xl border border-border shadow-soft">
          {/* Back navigation & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand transition-colors cursor-pointer w-fit"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Disease Reports
              </button>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Disease Diagnosis Report
                </h2>
                <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-md border border-border/60">
                  ID: {selectedReport._id}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEditModal(selectedReport)}
                className="h-10 cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 shadow-soft transition-colors flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Update / Diagnose
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReport(selectedReport._id)}
                className="h-10 cursor-pointer rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Crop Image, Info and Symptoms (Col span 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Visual Header */}
              <div className="flex flex-col sm:flex-row gap-6 bg-muted/20 p-5 rounded-xl border border-border/50">
                <div className="relative h-44 w-full sm:w-44 shrink-0 rounded-lg overflow-hidden border border-border shadow-soft group">
                  <img
                    src={selectedReport.imageUrl}
                    alt={selectedReport.cropName}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <span className="eyebrow mb-2">
                      {selectedReport.cropName}
                    </span>
                    <h3 className="text-xl font-bold text-foreground mt-1">
                      Farmer Submitted Details
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase shadow-sm ${
                        selectedReport.priority === 'HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                        selectedReport.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          selectedReport.priority === 'HIGH' ? 'bg-red-600' :
                          selectedReport.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-600'
                        }`} />
                        {selectedReport.priority} Priority
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase shadow-sm ${
                        selectedReport.status === 'CLOSED' ? 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20' :
                        selectedReport.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        selectedReport.status === 'ASSIGNED' ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20' :
                        'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                          selectedReport.status === 'CLOSED' ? 'bg-zinc-600' :
                          selectedReport.status === 'RESOLVED' ? 'bg-emerald-600' :
                          selectedReport.status === 'ASSIGNED' ? 'bg-indigo-600' : 'bg-orange-600'
                        }`} />
                        {selectedReport.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Submitted: {new Date(selectedReport.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symptoms Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Reported Symptoms</h4>
                <div className="bg-muted/10 p-5 rounded-xl border border-border leading-relaxed text-sm text-foreground/90 italic">
                  "{selectedReport.symptoms}"
                </div>
              </div>

              {/* AI Diagnosis Panel */}
              <div className="bg-brand-soft/20 rounded-xl border border-brand/20 p-6 shadow-soft hover:shadow-card transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-brand" />
                    <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                      Computer Vision AI Diagnosis
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-brand/10 text-brand px-3 py-1 rounded-full border border-brand/20">
                    {Math.round(selectedReport.aiPrediction.confidence * 100)}% Confidence Match
                  </span>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-lg font-bold text-foreground">
                    {selectedReport.aiPrediction.disease}
                  </h5>
                  <div className="mt-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      AI Recommended Treatment / Pesticides
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.aiPrediction.pesticides.map((pest, i) => (
                        <span key={i} className="rounded-lg bg-card border border-border px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                          {pest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialist Diagnosis Panel */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-soft hover:shadow-card transition-shadow">
                <div className="flex items-center gap-2 border-b border-border/80 pb-4 mb-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
                    Agronomist Specialist Review
                  </span>
                </div>

                {selectedReport.specialistDiagnosis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Diagnosed Disease
                        </span>
                        <p className="text-base font-bold text-foreground mt-0.5">
                          {selectedReport.specialistDiagnosis.disease}
                        </p>
                      </div>
                      {selectedReport.assignedSpecialistId && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Diagnosed By
                          </span>
                          <p className="text-sm font-semibold text-foreground mt-0.5">
                            {selectedReport.assignedSpecialistId.name} ({selectedReport.assignedSpecialistId.specialization || "General Specialist"})
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Diagnosis Details & Instructions
                      </span>
                      <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed bg-muted/10 p-4 rounded-lg border border-border">
                        {selectedReport.specialistDiagnosis.diagnosis}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Prescribed Treatments
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.specialistDiagnosis.pesticides.map((pest, i) => (
                          <span key={i} className="rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-foreground border border-border">
                            {pest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-500/5 text-amber-700 p-5 rounded-xl border border-amber-500/20">
                    <AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
                    <div className="flex-1 text-center sm:text-left">
                      <h5 className="font-bold text-sm">Review Pending</h5>
                      <p className="text-xs text-amber-600/90 mt-0.5">
                        This report has not been diagnosed by an agronomist yet. Assign a specialist to provide the official diagnosis and prescription.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedReport)}
                      className="cursor-pointer shrink-0 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-soft transition-colors"
                    >
                      Provide Diagnosis
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Meta Info Card (Col span 1) */}
            <div className="space-y-6">
              {/* Farmer Profile Card */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80 pb-3 mb-4">
                  Farmer Profile
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                    {selectedReport.farmerId?.name ? selectedReport.farmerId.name[0].toUpperCase() : 'F'}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-foreground">
                      {selectedReport.farmerId?.name || "Unknown Farmer"}
                    </h5>
                    <span className="text-[10px] text-muted-foreground">AgriCare Registered Farmer</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${selectedReport.farmerId?.email}`} className="hover:underline text-foreground/90 truncate">
                      {selectedReport.farmerId?.email || "No Email"}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${selectedReport.farmerId?.mobile}`} className="hover:underline text-foreground/90">
                      {selectedReport.farmerId?.mobile || "No Mobile"}
                    </a>
                  </div>
                </div>
              </div>

              {/* Assignment & Tracking Card */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80 pb-3 mb-4">
                  Assignment & Specialist
                </h4>
                {selectedReport.assignedSpecialistId ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedReport.assignedSpecialistId.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-foreground">
                          {selectedReport.assignedSpecialistId.name}
                        </h5>
                        <p className="text-[10px] text-muted-foreground">
                          {selectedReport.assignedSpecialistId.specialization || "General Specialist"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/40 text-xs flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold text-brand">Assigned for Review</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <User className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">No Specialist Assigned</p>
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedReport)}
                      className="mt-3 cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Assign Specialist Now
                    </button>
                  </div>
                )}
              </div>

              {/* System Log / Metadata */}
              <div className="bg-card rounded-xl border border-border p-5 shadow-soft text-xs space-y-3">
                <h4 className="font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80 pb-3 mb-4">
                  Diagnostic Metadata
                </h4>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Report ID</span>
                  <span className="font-mono text-[10.5px] font-semibold text-foreground/80">{selectedReport._id}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Date Submitted</span>
                  <span className="font-semibold text-foreground/85">
                    {new Date(selectedReport.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Time Submitted</span>
                  <span className="font-semibold text-foreground/85">
                    {new Date(selectedReport.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Submission Type</span>
                  <span className="font-semibold text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/10">App Upload</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* FILTER & ACTIONS BAR */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by crop name, symptoms, or farmer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-muted/30 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open (New)</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed (Resolved)</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

              <button
                type="button"
                onClick={openCreateModal}
                className="h-10 cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Report
              </button>
            </div>
          </div>

          {/* REPORTS LISTING */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                  Loading crop disease reports...
                </div>
              </div>
            ) : reports.length ? (
              reports.map((report) => (
                <div key={report._id} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-soft hover:shadow-soft-hover hover:border-brand/40 transition-all">
                  {/* Image Preview */}
                  <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden">
                    <img
                      src={report.imageUrl}
                      alt={report.cropName}
                      className="h-full w-full object-cover"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold text-white uppercase shadow-lift ${
                        report.priority === 'HIGH' ? 'bg-red-600' :
                        report.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}>
                        {report.priority} Priority
                      </span>
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold text-white uppercase shadow-lift ${
                        report.status === 'CLOSED' ? 'bg-zinc-600' :
                        report.status === 'RESOLVED' ? 'bg-emerald-600' :
                        report.status === 'ASSIGNED' ? 'bg-indigo-600' : 'bg-orange-500'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-5">
                    <p className="text-xs font-bold text-brand uppercase">{report.cropName}</p>
                    <p className="mt-1 text-sm font-bold text-foreground line-clamp-1">{report.symptoms}</p>
                    <p className="mt-2 text-xs text-muted-foreground font-medium">Submitted by: {(report.farmerId as any)?.name || 'Farmer'}</p>

                    {/* Predictions Summary */}
                    <div className="mt-4 border-t border-border/60 pt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-brand font-semibold">
                        <Cpu className="h-3.5 w-3.5" />
                        <span>AI: {report.aiPrediction.disease}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">({Math.round(report.aiPrediction.confidence * 100)}%)</span>
                    </div>

                    {report.assignedSpecialistId && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Agronomist: {report.assignedSpecialistId.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="border-t border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Diagnosis
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(report)}
                        className="cursor-pointer rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground"
                        title="Update Assignment & Diagnosis"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReport(report._id)}
                        className="cursor-pointer rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                        title="Delete Report"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
                No disease reports match current filters.
              </div>
            )}
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lift relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-brand" />
              Update Assignment & Diagnosis
            </h4>

            <form onSubmit={handleUpdateReport} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Report Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Report Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="OPEN">Open (New)</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed (Resolved)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Assign Agriculture Specialist (Agronomist)</label>
                <select
                  value={editSpecialistId}
                  onChange={(e) => setEditSpecialistId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Select Specialist --</option>
                  {specialists.map(spec => (
                    <option key={spec._id} value={spec._id}>
                      {spec.name} ({spec.specialization || "General Specialist"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialist Diagnosis input */}
              <div className="border-t border-border pt-4 space-y-4">
                <span className="block text-xs font-bold text-foreground">Write/Override Agronomist Diagnosis (Resolves Report)</span>
                
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Confirmed Disease Name</label>
                  <input
                    type="text"
                    value={diagDisease}
                    onChange={(e) => setDiagDisease(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="e.g. Alternaria Leaf Spot"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Diagnosis Description / Treatment Advice</label>
                  <textarea
                    value={diagText}
                    onChange={(e) => setDiagText(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/10 p-3 text-sm outline-none"
                    placeholder="Write instructions for the farmer..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Prescribed Pesticides / Pesticides (Comma-separated)</label>
                  <input
                    type="text"
                    value={diagPesticides}
                    onChange={(e) => setDiagPesticides(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="e.g. Copper Oxychloride, Mancozeb"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-10 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 cursor-pointer rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lift relative max-h-[90vh] overflow-y-auto animate-scale-in">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-foreground mb-4">Create New Crop Disease Report</h3>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Select Farmer *</label>
                <select
                  required
                  value={createFarmerId}
                  onChange={(e) => setCreateFarmerId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                >
                  {farmers.map((farmer) => (
                    <option key={farmer._id} value={farmer._id}>
                      {farmer.name} ({farmer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Crop Name *</label>
                <input
                  type="text"
                  required
                  value={createCropName}
                  onChange={(e) => setCreateCropName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  placeholder="e.g. Cotton, Paddy Rice, Tomato"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Symptoms *</label>
                <textarea
                  required
                  value={createSymptoms}
                  onChange={(e) => setCreateSymptoms(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-muted/10 p-3 text-sm outline-none"
                  placeholder="Describe the symptoms of the crop..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Image URL</label>
                <input
                  type="url"
                  value={createImageUrl}
                  onChange={(e) => setCreateImageUrl(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  placeholder="Image URL displaying crop condition..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Status</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  >
                    <option value="OPEN">Open (New)</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Assign Specialist (Optional)</label>
                <select
                  value={createSpecialistId}
                  onChange={(e) => setCreateSpecialistId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                >
                  <option value="">No Specialist Assigned</option>
                  {specialists.map((spec) => (
                    <option key={spec._id} value={spec._id}>
                      {spec.name} ({spec.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <span className="block text-xs font-bold text-foreground">AI Prediction Summary</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">AI Predicted Disease</label>
                    <input
                      type="text"
                      value={createAiDisease}
                      onChange={(e) => setCreateAiDisease(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">AI Confidence (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={createAiConfidence}
                      onChange={(e) => setCreateAiConfidence(Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">AI Recommended Pesticides (Comma-separated)</label>
                  <input
                    type="text"
                    value={createAiPesticides}
                    onChange={(e) => setCreateAiPesticides(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="e.g. Copper Oxychloride, Mancozeb"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-10 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 cursor-pointer rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Create Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
