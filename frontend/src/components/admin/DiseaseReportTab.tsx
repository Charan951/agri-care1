import { useEffect, useState } from "react";
import { Search, Edit, Trash2, Eye, X, ShieldAlert, Cpu, User, AlertCircle, Plus, ArrowLeft, Calendar, Mail, Phone, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { useSocket } from "@/context/SocketContext";
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
    causes?: string;
    symptoms?: string;
    symptomsDetail?: string;
    prevention?: string;
    fertilizers?: string[];
    dosage?: string;
    recoveryTimeline?: string;
    organicTreatment?: string;
    applicationMethod?: string;
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
  const [activeSheetTab, setActiveSheetTab] = useState<"profile" | "questionnaire" | "gallery" | "diagnosis">("profile");
  
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

  const { socket } = useSocket();

  const parseFarmerResponses = (symptomsStr?: string) => {
    const responses: Record<string, string> = {};
    if (!symptomsStr) return responses;
    const parts = symptomsStr.split("Farmer Responses:");
    if (parts[1]) {
      const lines = parts[1].split(/[•\n]/);
      lines.forEach((line: string) => {
        const cleanLine = line.trim();
        if (cleanLine && cleanLine.includes(":")) {
          const colonIdx = cleanLine.indexOf(":");
          const k = cleanLine.substring(0, colonIdx).trim().toLowerCase();
          const v = cleanLine.substring(colonIdx + 1).trim();
          responses[k] = v;
        }
      });
    }
    return responses;
  };

  const fetchReports = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const url = `/api/admin/reports?status=${statusFilter}&priority=${priorityFilter}&search=${search}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const reportsData = data.reports || data;
        setReports(reportsData);
        if (search && search.length === 24 && reportsData.length === 1) {
          setSelectedReport(reportsData[0]);
          setActiveSheetTab("profile");
        }
      } else {
        if (!isSilent) toast.error("Failed to load disease reports.");
      }
    } catch (err) {
      if (!isSilent) toast.error("Error connecting to server.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    const adminReportSearch = sessionStorage.getItem("admin_report_search");
    if (adminReportSearch) {
      setSearch(adminReportSearch);
      sessionStorage.removeItem("admin_report_search");
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchReports(true);
    };

    socket.on("new_report_created", handleUpdate);
    socket.on("report_updated", handleUpdate);
    socket.on("report_deleted", handleUpdate);

    return () => {
      socket.off("new_report_created", handleUpdate);
      socket.off("report_updated", handleUpdate);
      socket.off("report_deleted", handleUpdate);
    };
  }, [socket, statusFilter, priorityFilter, search]);

  const fetchSpecialists = async () => {
    try {
      const response = await fetch("/api/admin/users?role=AGRI_SPECIALIST&limit=100");
      if (response.ok) {
        const data = await response.json();
        setSpecialists(data.users || data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=FARMER&limit=100");
      if (response.ok) {
        const data = await response.json();
        const farmersData = data.users || data;
        setFarmers(farmersData);
        if (farmersData.length > 0) setCreateFarmerId(farmersData[0]._id);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null);
                  if (search && search.length === 24) setSearch("");
                }}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand transition-colors cursor-pointer w-fit"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Disease Reports
              </button>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Case File</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground m-0 mt-0.5">
                    {(selectedReport.cropName || "CROP").toUpperCase()} DIAGNOSIS SHEET
                  </h2>
                </div>
                <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-md border border-border/60">
                  ID: {selectedReport._id}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                  selectedReport.status === 'RESOLVED' || selectedReport.status === 'CLOSED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                    : selectedReport.status === 'ASSIGNED'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50'
                      : 'bg-orange-50 text-orange-700 border-orange-200/50'
                }`}>
                  {selectedReport.status}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-1.5 pb-2.5">
                {[
                  { id: "profile", label: "1. Farmer Profile" },
                  { id: "questionnaire", label: "2. Crop Questionnaire" },
                  { id: "gallery", label: "3. Leaf Image Gallery" },
                  { id: "diagnosis", label: "4. Diagnosis & Prescriptions" }
                ].map((tabItem) => (
                  <button
                    key={tabItem.id}
                    onClick={() => setActiveSheetTab(tabItem.id as any)}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all border-0 flex-shrink-0 ${
                      activeSheetTab === tabItem.id
                        ? "bg-brand text-brand-foreground shadow-soft"
                        : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeSheetTab === "profile" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                      <User className="h-4.5 w-4.5 text-brand" />
                      <span className="font-extrabold text-xs text-foreground">Farmer Profile Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farmer Name</p>
                        <p className="font-bold text-foreground mt-0.5">{selectedReport.farmerId?.name || "Unknown Farmer"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</p>
                        <p className="font-bold text-foreground mt-0.5">{selectedReport.farmerId?.mobile || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                        <p className="font-bold text-foreground mt-0.5 truncate" title={selectedReport.farmerId?.email || ""}>{selectedReport.farmerId?.email || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">District / State</p>
                        <p className="font-bold text-foreground mt-0.5">{(selectedReport.farmerId as any)?.district || "Pune, Maharashtra"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Village</p>
                        <p className="font-bold text-foreground mt-0.5">{(selectedReport.farmerId as any)?.village || "Wadgaon"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farm Size</p>
                        <p className="font-bold text-foreground mt-0.5">{(selectedReport.farmerId as any)?.farmSize || "12 Acres"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSheetTab === "questionnaire" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                      <CheckCircle2 className="h-4.5 w-4.5 text-brand" />
                      <span className="font-extrabold text-xs text-foreground">Crop Information & Symptoms Questionnaire</span>
                    </div>
                    {(() => {
                      const responses = parseFarmerResponses(selectedReport.symptoms);
                      const farmerSymptoms = selectedReport.symptoms.split("Farmer Responses:")[0]?.trim() || selectedReport.symptoms;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Crop Name</span>
                              <span className="font-bold text-foreground mt-0.5 block">{selectedReport.cropName}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Growth Stage</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["growth stage"] || responses["stage"] || "Flowering"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Sowing / Apply Date</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["fertilizer apply date"] || responses["date"] || new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Irrigation Method</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["irrigation method"] || "Drip Irrigation"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Pesticides Sprayed</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["pesticide used"] || "Not specified"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Soil Texture</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["soil type"] || (selectedReport.farmerId as any)?.soilTexture || "Clay Black"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Weather Condition</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["weather conditions"] || "Humid"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Disease Duration</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["disease duration"] || "1-2 Days"}</span>
                            </div>
                          </div>

                          <div className="p-3.5 bg-brand/[0.02] border border-brand/10 rounded-xl text-xs space-y-1.5 text-left">
                            <span className="text-[9px] font-extrabold text-brand uppercase tracking-wider">Farmer Stated Symptoms</span>
                            <p className="text-muted-foreground leading-relaxed m-0">{farmerSymptoms || "N/A"}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeSheetTab === "gallery" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="font-extrabold text-xs text-foreground">Initial Inspection Leaf Scans</span>
                        <button
                          onClick={() => toast.info("Downloading case images...")}
                          className="text-[10px] font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer p-0"
                        >
                          Download Case Images
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="col-span-2 sm:col-span-2 relative rounded-xl overflow-hidden border border-border/80 aspect-video bg-muted shadow-soft">
                          <img
                            src={selectedReport.imageUrl}
                            alt="Primary Scan"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[8px] font-bold text-white rounded uppercase tracking-wider">
                            Primary Leaf Scan
                          </span>
                        </div>

                        {[
                          "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300",
                          selectedReport.imageUrl,
                          "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=300",
                          "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=300"
                        ].map((imgUrl, thumbIdx) => (
                          <div
                            key={thumbIdx}
                            className="col-span-1 relative rounded-lg overflow-hidden border border-border/80 aspect-square bg-muted cursor-pointer hover:border-brand transition-colors"
                          >
                            <img
                              src={imgUrl}
                              alt={`Leaf Detail ${thumbIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-[6px] font-bold text-white px-1 rounded-sm">
                              Zoom
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSheetTab === "diagnosis" && (
                  <div className="space-y-6 animate-fadeIn">
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
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-muted text-muted-foreground text-[9px] font-bold px-2.5 py-1 rounded uppercase border border-border/60">Crop: {selectedReport.cropName}</span>
                          <span className="bg-red-50 text-red-600 text-[9px] font-bold px-2.5 py-1 rounded uppercase border border-red-200/40">Severity: High</span>
                          <span className="bg-yellow-50 text-yellow-700 text-[9px] font-bold px-2.5 py-1 rounded uppercase border border-yellow-200/40">Risk: Moderate</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs border-t border-brand/10 pt-4 mt-4">
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Possible Causes</span>
                            <p className="text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.causes || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Observed Symptoms</span>
                            <p className="text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.symptomsDetail || selectedReport.aiPrediction.symptoms || selectedReport.symptoms || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Preventive Measures</span>
                            <p className="text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.prevention || "N/A"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand/10 mt-4">
                          <div className="p-3.5 bg-card border border-border rounded-xl space-y-2 text-left">
                            <p className="font-bold text-brand text-xs">Chemical Fungicide treatment</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedReport.aiPrediction.pesticides || []).map((pest: string, idx: number) => (
                                <span key={idx} className="bg-brand/10 text-brand text-[9px] font-bold px-2.5 py-0.5 rounded border border-brand/20">{pest}</span>
                              ))}
                              {(selectedReport.aiPrediction.fertilizers || []).map((fert: string, idx: number) => (
                                <span key={idx} className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2.5 py-0.5 rounded border border-blue-200/40">{fert}</span>
                              ))}
                            </div>
                            {selectedReport.aiPrediction.dosage && (
                              <p className="text-[10px] text-muted-foreground mt-2"><span className="font-bold">Dosage:</span> {selectedReport.aiPrediction.dosage}</p>
                            )}
                            {selectedReport.aiPrediction.recoveryTimeline && (
                              <p className="text-[10px] text-muted-foreground"><span className="font-bold">Spray Schedule:</span> {selectedReport.aiPrediction.recoveryTimeline}</p>
                            )}
                          </div>

                          <div className="p-3.5 bg-card border border-border rounded-xl space-y-2 text-left">
                            <p className="font-bold text-emerald-600 text-xs">Organic Remedy alternatives</p>
                            <p className="text-[11px] text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.organicTreatment || "N/A"}</p>
                            {selectedReport.aiPrediction.applicationMethod && (
                              <p className="text-[10px] text-muted-foreground mt-2"><span className="font-bold">Application Method:</span> {selectedReport.aiPrediction.applicationMethod}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

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
                            {selectedReport.assignedSpecialistId && typeof selectedReport.assignedSpecialistId === 'object' && (selectedReport.assignedSpecialistId as any).name && (
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Diagnosed By
                                </span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                  {(selectedReport.assignedSpecialistId as any).name} ({(selectedReport.assignedSpecialistId as any).specialization || "General Specialist"})
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
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground m-0">
                      {(selectedReport.assignedSpecialistId as any)?.name || "Agronomist Expert"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(selectedReport.assignedSpecialistId as any)?.specialization || "Crop Protection"}
                    </p>
                  </div>
                  {(selectedReport.status === "ASSIGNED" || selectedReport.status === "OPEN") && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse shrink-0" title="Active" />
                  )}
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Report Priority</span>
                    <span className={`font-bold ${
                      selectedReport.priority === 'HIGH' ? 'text-red-600' :
                      selectedReport.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                    }`}>{selectedReport.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Submitted</span>
                    <span className="font-bold text-foreground">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80 pb-3 mb-4">
                  Farmer Contact
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                    {selectedReport.farmerId?.name ? selectedReport.farmerId.name[0].toUpperCase() : 'F'}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-foreground truncate" title={selectedReport.farmerId?.name || ""}>
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

              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2.5">
                  <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider m-0">
                    Quick Preview
                  </h4>
                  <span className="px-2 py-0.5 bg-brand/10 text-brand text-[8px] font-bold uppercase rounded">
                    {selectedReport.cropName}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/20 border border-border flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider m-0">AI Prediction</p>
                    <p className="font-extrabold text-foreground m-0 mt-0.5 truncate" title={selectedReport.aiPrediction.disease}>
                      {selectedReport.aiPrediction.disease}
                    </p>
                    <p className="text-[10px] text-muted-foreground m-0 mt-0.5">
                      {Math.round(selectedReport.aiPrediction.confidence * 100)}% match
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-border pt-3">
                  <span className="text-muted-foreground">Report ID</span>
                  <span className="font-mono text-[10px] font-semibold text-foreground/80">{selectedReport._id}</span>
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

                    {report.assignedSpecialistId && typeof report.assignedSpecialistId === 'object' && report.assignedSpecialistId.name && (
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
                      onClick={() => {
                        setSelectedReport(report);
                        setActiveSheetTab("profile");
                      }}
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
