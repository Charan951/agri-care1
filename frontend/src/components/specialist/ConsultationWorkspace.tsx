import { useState, useEffect, useRef } from "react";
import {
  Brain, ShieldCheck, Sprout, ShoppingBag, MessageSquare, Mic,
  Send, Square, Calendar, ZoomIn, Download, Search, CheckCircle,
  FileText, X, Clock, User as UserIcon, Tag, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { VoiceCallOverlay } from "../dashboard/VoiceCallOverlay";

interface ConsultationWorkspaceProps {
  activeConsultation: any;
  farmerHistory: any[];
  farmerOrders: any[];
  user: any;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  chatMessage: string;
  setChatMessage: (msg: string) => void;
  sendText: (text?: string) => void;
  triggerMediaRequest: (type: "images" | "videos" | "progress") => void;
  handleAccept: (id: string) => void;
  handleRejectClick: (id: string) => void;
  selectConsultation: (id: string) => void;
  setSelectedConsultationId: (id: string | null) => void;
  setActiveConsultation: (c: any) => void;
  loadDashboardData: () => void;
  loadConsultations: () => void;
}

export function ConsultationWorkspace({
  activeConsultation,
  farmerHistory,
  farmerOrders,
  user,
  isRecording,
  startRecording,
  stopRecording,
  chatMessage,
  setChatMessage,
  sendText,
  triggerMediaRequest,
  handleAccept,
  handleRejectClick,
  selectConsultation,
  setSelectedConsultationId,
  setActiveConsultation,
  loadDashboardData,
  loadConsultations
}: ConsultationWorkspaceProps) {
  const { socket } = useSocket();
  // Form details states
  const [diseaseInput, setDiseaseInput] = useState("");
  const [severityInput, setSeverityInput] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [causesInput, setCausesInput] = useState("");
  const [prevMeasuresInput, setPrevMeasuresInput] = useState("");
  const [timelineInput, setTimelineInput] = useState("7-14 Days");
  const [notesInput, setNotesInput] = useState("");

  const [recFertilizers, setRecFertilizers] = useState("");
  const [recPesticides, setRecPesticides] = useState("");
  const [recFungicides, setRecFungicides] = useState("");
  const [recOrganic, setRecOrganic] = useState("");
  const [recBioFert, setRecBioFert] = useState("");
  const [dosageInstructions, setDosageInstructions] = useState("");
  const [spraySchedule, setSpraySchedule] = useState("");
  const [irrigationAdvice, setIrrigationAdvice] = useState("");
  const [soilAdvice, setSoilAdvice] = useState("");
  const [careTips, setCareTips] = useState("");

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReminder, setFollowUpReminder] = useState("");

  // Product recommendation states
  const [productQuery, setProductQuery] = useState("");
  const [productsList, setProductsList] = useState<any[]>([]);
  const [recommendedProductIds, setRecommendedProductIds] = useState<string[]>([]);

  // Lightbox & Compare states
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [compareImages, setCompareImages] = useState<boolean>(false);

  // Tab state in workspace view
  const [activeTab, setActiveTab] = useState<"profile" | "questionnaire" | "gallery" | "diagnosis">("profile");

  // Floating Chat toggle
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  const consultChatEndRef = useRef<HTMLDivElement>(null);

  // Prepopulate form on activeConsultation change
  useEffect(() => {
    if (activeConsultation) {
      setDiseaseInput(activeConsultation.diagnosisDetails?.disease || "");
      setSeverityInput(activeConsultation.diagnosisDetails?.severity || "MEDIUM");
      setSymptomsInput(activeConsultation.diagnosisDetails?.symptoms?.join(", ") || "");
      setCausesInput(activeConsultation.diagnosisDetails?.causes?.join(", ") || "");
      setPrevMeasuresInput(activeConsultation.diagnosisDetails?.preventiveMeasures?.join(", ") || "");
      setTimelineInput(activeConsultation.diagnosisDetails?.recoveryTimeline || "7-14 Days");
      setNotesInput(activeConsultation.internalNotes || "");

      setRecFertilizers(activeConsultation.treatmentRecommendation?.fertilizers?.join(", ") || "");
      setRecPesticides(activeConsultation.treatmentRecommendation?.pesticides?.join(", ") || "");
      setRecFungicides(activeConsultation.treatmentRecommendation?.fungicides?.join(", ") || "");
      setRecOrganic(activeConsultation.treatmentRecommendation?.organicAlternatives?.join(", ") || "");
      setRecBioFert(activeConsultation.treatmentRecommendation?.bioFertilizers?.join(", ") || "");
      setDosageInstructions(activeConsultation.treatmentRecommendation?.dosageInstructions || "");
      setSpraySchedule(activeConsultation.treatmentRecommendation?.spraySchedule || "");
      setIrrigationAdvice(activeConsultation.treatmentRecommendation?.irrigationAdvice || "");
      setSoilAdvice(activeConsultation.treatmentRecommendation?.soilImprovementAdvice || "");
      setCareTips(activeConsultation.treatmentRecommendation?.cropCareTips || "");

      setRecommendedProductIds(activeConsultation.recommendedProducts?.map((p: any) => p._id || p) || []);
      
      if (activeConsultation.followUp?.scheduledDate) {
        setFollowUpDate(new Date(activeConsultation.followUp.scheduledDate).toISOString().split("T")[0]);
        setFollowUpReminder(activeConsultation.followUp.reminderNote || "");
      } else {
        setFollowUpDate("");
        setFollowUpReminder("");
      }
    }
  }, [activeConsultation]);

  // Load marketplace products list
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const query = productQuery ? `?search=${productQuery}` : "";
        const res = await apiFetch(`/api/specialist/products${query}`);
        if (res.ok) {
          const data = await res.json();
          setProductsList(data.products || []);
        }
      } catch (err) {
        console.error("Error loading specialist merchant products", err);
      }
    };
    fetchCatalog();
  }, [productQuery]);

  // Auto-scroll chat inside floating popover
  useEffect(() => {
    consultChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConsultation?.chatHistory, isRecording, showFloatingChat]);

  const isDiagnosisUnsaved = 
    diseaseInput !== (activeConsultation?.diagnosisDetails?.disease || "") ||
    severityInput !== (activeConsultation?.diagnosisDetails?.severity || "MEDIUM") ||
    symptomsInput !== (activeConsultation?.diagnosisDetails?.symptoms?.join(", ") || "") ||
    causesInput !== (activeConsultation?.diagnosisDetails?.causes?.join(", ") || "") ||
    prevMeasuresInput !== (activeConsultation?.diagnosisDetails?.preventiveMeasures?.join(", ") || "") ||
    timelineInput !== (activeConsultation?.diagnosisDetails?.recoveryTimeline || "7-14 Days") ||
    notesInput !== (activeConsultation?.internalNotes || "");

  const handleSaveDiagnosis = async () => {
    if (!diseaseInput.trim()) {
      toast.error("Validation Error: 'Confirmed Disease Name' is required.");
      return;
    }
    if (!symptomsInput.trim()) {
      toast.error("Validation Error: Please list the key 'Symptoms Observed'.");
      return;
    }
    if (!causesInput.trim()) {
      toast.error("Validation Error: Please specify the 'Pathogen / Causes'.");
      return;
    }
    if (!prevMeasuresInput.trim()) {
      toast.error("Validation Error: Please enter 'Preventive Care Guidelines'.");
      return;
    }
    if (!timelineInput.trim()) {
      toast.error("Validation Error: Please specify the 'Expected Recovery Timeline'.");
      return;
    }

    try {
      const res = await apiFetch(`/api/specialist/consultations/${activeConsultation._id}/diagnosis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disease: diseaseInput,
          severity: severityInput,
          symptoms: symptomsInput.split(",").map(s => s.trim()).filter(Boolean),
          causes: causesInput.split(",").map(c => c.trim()).filter(Boolean),
          preventiveMeasures: prevMeasuresInput.split(",").map(p => p.trim()).filter(Boolean),
          recoveryTimeline: timelineInput,
          internalNotes: notesInput
        })
      });
      if (res.ok) {
        toast.success("Expert diagnosis saved successfully.");
        selectConsultation(activeConsultation._id);
      } else {
        toast.error("Failed to save diagnosis.");
      }
    } catch (err) {
      toast.error("Error saving diagnosis.");
    }
  };

  const handleConfirmAI = () => {
    if (!activeConsultation?.reportId?.aiPrediction) {
      toast.info("No AI predictions available to confirm.");
      return;
    }
    const ai = activeConsultation.reportId.aiPrediction;
    setDiseaseInput(ai.disease || "");
    setSymptomsInput(ai.symptomsDetail || activeConsultation.reportId.symptoms || "");
    setCausesInput(ai.causes || "");
    setPrevMeasuresInput(ai.prevention || "");
    setTimelineInput(ai.recoveryTimeline || "7-14 Days");

    setRecFertilizers(ai.fertilizers?.join(", ") || "");
    setRecPesticides(ai.pesticides?.join(", ") || "");
    setRecOrganic(ai.organicTreatment || "");
    setDosageInstructions(ai.dosage || "");
    setSpraySchedule(ai.applicationMethod || "");
    setCareTips(ai.safetyPrecautions || "");

    toast.success("AI predictions copied into formulation forms. Modify as needed.");
  };

  const handleSaveTreatment = async () => {
    if (!recPesticides.trim() && !recFungicides.trim() && !recFertilizers.trim() && !recOrganic.trim() && !recBioFert.trim()) {
      toast.error("Validation Error: Please fill in at least one recommendation field (Pesticide, Fungicide, Fertilizer, Organic, or Bio-Fertilizer).");
      return;
    }
    if (!dosageInstructions.trim()) {
      toast.error("Validation Error: 'Dosage Instructions' field is required.");
      return;
    }
    if (!spraySchedule.trim()) {
      toast.error("Validation Error: 'Spray Timeline Schedule' field is required.");
      return;
    }

    try {
      const res = await apiFetch(`/api/specialist/consultations/${activeConsultation._id}/treatment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fertilizers: recFertilizers.split(",").map(f => f.trim()).filter(Boolean),
          pesticides: recPesticides.split(",").map(p => p.trim()).filter(Boolean),
          fungicides: recFungicides.split(",").map(f => f.trim()).filter(Boolean),
          organicAlternatives: recOrganic.split(",").map(o => o.trim()).filter(Boolean),
          bioFertilizers: recBioFert.split(",").map(b => b.trim()).filter(Boolean),
          dosageInstructions,
          spraySchedule,
          irrigationAdvice,
          soilImprovementAdvice: soilAdvice,
          cropCareTips: careTips
        })
      });
      if (res.ok) {
        toast.success("Treatment recommendations sent. Consultation completed.");
        selectConsultation(activeConsultation._id);
        loadDashboardData();
        loadConsultations();
      } else {
        toast.error("Failed to submit treatment recommendations.");
      }
    } catch (err) {
      toast.error("Error submitting treatment.");
    }
  };

  const toggleRecommendProduct = async (pId: string) => {
    let updated = [...recommendedProductIds];
    if (updated.includes(pId)) {
      updated = updated.filter(id => id !== pId);
    } else {
      updated.push(pId);
    }
    setRecommendedProductIds(updated);

    try {
      const res = await apiFetch(`/api/specialist/consultations/${activeConsultation._id}/recommend-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: updated })
      });
      if (res.ok) {
        toast.success("Product recommendation list updated.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveFollowUp = async () => {
    if (!followUpDate) {
      toast.error("Validation Error: Please select a Follow-up Checkup Date.");
      return;
    }
    if (!followUpReminder.trim()) {
      toast.error("Validation Error: Please enter Checkup Reminder Notes.");
      return;
    }

    try {
      const res = await apiFetch(`/api/specialist/consultations/${activeConsultation._id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: followUpDate,
          reminderNote: followUpReminder,
          status: "SCHEDULED"
        })
      });
      if (res.ok) {
        toast.success("Follow-up appointment scheduled.");
        selectConsultation(activeConsultation._id);
      }
    } catch (err) {
      toast.error("Error setting follow-up.");
    }
  };

  const handleCloseFollowUp = async () => {
    try {
      const res = await apiFetch(`/api/specialist/consultations/${activeConsultation._id}/follow-up/close`, {
        method: "PUT"
      });
      if (res.ok) {
        toast.success("Follow-up closed successfully.");
        selectConsultation(activeConsultation._id);
      }
    } catch (err) {
      toast.error("Error closing follow-up.");
    }
  };

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

  const chatSharedImages = activeConsultation
    ? (activeConsultation.chatHistory || [])
        .filter((msg: any) => msg.message?.startsWith("data:image/") || msg.message?.includes("📷") || msg.message?.includes("Attached"))
        .map((msg: any, idx: number) => {
          if (msg.message?.startsWith("data:image/")) {
            return {
              url: msg.message,
              timestamp: msg.timestamp
            };
          }
          const mockImages = [
            "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300"
          ];
          return {
            url: mockImages[idx % mockImages.length],
            timestamp: msg.timestamp
          };
        })
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start relative text-left">
      
      {/* Left Column (col-span-2, Tabbed workspace) */}
      <div className="lg:col-span-2 space-y-6">
        
        {activeConsultation.reportId && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">
            
            {/* Header Title */}
            <div className="flex justify-between items-center border-b border-border pb-3.5">
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Case Workspace</span>
                <h2 className="text-lg font-extrabold text-foreground tracking-tight m-0 mt-0.5">
                  {(activeConsultation.reportId.cropName || "CROP").toUpperCase()} DIAGNOSIS SHEET
                </h2>
              </div>
              <Badge variant={activeConsultation.status === "PENDING" ? "secondary" : "default"} className="font-bold py-1 px-2.5 uppercase">
                {activeConsultation.status}
              </Badge>
            </div>

            {/* RESPONSIVE TABS HEADER */}
            <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-1.5 pb-2.5">
              {[
                { id: "profile", label: "1. Farmer Profile" },
                { id: "questionnaire", label: "2. Crop Questionnaire" },
                { id: "gallery", label: "3. Leaf Image Gallery" },
                { id: "diagnosis", label: "4. Expert Diagnosis & Prescriptions" }
              ].map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setActiveTab(tabItem.id as any)}
                  className={`px-3 py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all border-0 flex-shrink-0 ${
                    activeTab === tabItem.id
                      ? "bg-emerald-600 text-white shadow-soft"
                      : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="space-y-4">
              
              {/* Tab 1: Farmer Profile */}
              {activeTab === "profile" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                    <UserIcon className="h-4.5 w-4.5 text-emerald-600" />
                    <span className="font-extrabold text-xs text-foreground">Farmer Profile Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farmer Name</p>
                      <p className="font-bold text-foreground mt-0.5">{activeConsultation.farmerId?.name || "N/A"}</p>
                    </div>
                    <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</p>
                      <p className="font-bold text-foreground mt-0.5">{activeConsultation.farmerId?.mobile || "N/A"}</p>
                    </div>
                    <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">District / State</p>
                      <p className="font-bold text-foreground mt-0.5">
                        {activeConsultation.farmerId?.savedAddresses?.[0]?.city || "Pune"}, {activeConsultation.farmerId?.savedAddresses?.[0]?.state || "Maharashtra"}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Village</p>
                      <p className="font-bold text-foreground mt-0.5">{activeConsultation.farmerId?.savedAddresses?.[0]?.street || "Wadgaon"}</p>
                    </div>
                    <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farm Size</p>
                      <p className="font-bold text-foreground mt-0.5">{activeConsultation.farmerId?.farms?.[0]?.size ? `${activeConsultation.farmerId.farms[0].size} Acres` : "12 Acres"}</p>
                    </div>
                    <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Soil Texture</p>
                      <p className="font-bold text-foreground mt-0.5">{activeConsultation.farmerId?.farms?.[0]?.soilType || "Clay Black"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Crop Information & Symptoms Questionnaire */}
              {activeTab === "questionnaire" && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                    <span className="font-extrabold text-xs text-foreground">Crop Information & Symptoms Questionnaire</span>
                  </div>
                  {(() => {
                    const responses = parseFarmerResponses(activeConsultation.reportId.symptoms);
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                          <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-[9px] font-bold text-muted-foreground block uppercase">Crop Name</span>
                            <span className="font-bold text-foreground mt-0.5 block">{activeConsultation.reportId.cropName}</span>
                          </div>
                          <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-[9px] font-bold text-muted-foreground block uppercase">Growth Stage</span>
                            <span className="font-bold text-foreground mt-0.5 block">{responses["growth stage"] || responses["stage"] || "Flowering"}</span>
                          </div>
                          <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-[9px] font-bold text-muted-foreground block uppercase">Sowing / Apply Date</span>
                            <span className="font-bold text-foreground mt-0.5 block">{responses["fertilizer apply date"] || responses["date"] || "15 May 2026"}</span>
                          </div>
                          <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-[9px] font-bold text-muted-foreground block uppercase">Irrigation Method</span>
                            <span className="font-bold text-foreground mt-0.5 block">{responses["irrigation method"] || "Drip Irrigation"}</span>
                          </div>
                          <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-[9px] font-bold text-muted-foreground block uppercase">Pesticides Sprayed</span>
                            <span className="font-bold text-foreground mt-0.5 block">{responses["pesticide used"] || "Neem Oil (10 Days ago)"}</span>
                          </div>
                          <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                            <span className="text-[9px] font-bold text-muted-foreground block uppercase">Soil Texture</span>
                            <span className="font-bold text-foreground mt-0.5 block">{responses["soil type"] || "Clay Black"}</span>
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

                        <div className="p-3.5 bg-emerald-600/[0.02] border border-emerald-600/10 rounded-xl text-xs space-y-1.5 text-left">
                          <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider">Farmer Stated Symptoms</span>
                          <p className="text-muted-foreground leading-relaxed m-0">"{activeConsultation.reportId.symptoms.split("Farmer Responses:")[0]?.trim() || "No symptoms description provided."}"</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab 3: Leaf Image Gallery & AI Report */}
              {activeTab === "gallery" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Initial Leaf Scans (5 Photos Grid) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1">
                      <span className="font-extrabold text-xs text-foreground">Initial Inspection Leaf Scans (5 Photos)</span>
                      <button 
                        onClick={() => setCompareImages(!compareImages)}
                        className="text-[10px] font-bold text-emerald-600 hover:underline bg-transparent border-0 cursor-pointer p-0"
                      >
                        {compareImages ? "Single View" : "Compare Images Side-by-Side"}
                      </button>
                    </div>

                    {compareImages ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-border/80 rounded-lg overflow-hidden relative bg-black flex items-center justify-center group h-56 cursor-zoom-in">
                          <img 
                            src={activeConsultation.reportId?.imageUrl} 
                            alt="Original Scan" 
                            className="max-h-full object-contain"
                            onClick={() => setLightboxImage(activeConsultation.reportId?.imageUrl)}
                          />
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">Original Case Scan</div>
                        </div>
                        <div className="border border-border/80 rounded-lg overflow-hidden relative bg-black flex items-center justify-center group h-56 cursor-zoom-in">
                          <img 
                            src="https://images.unsplash.com/photo-1592417817098-8f3d6eb19675" 
                            alt="Library Reference" 
                            className="max-h-full object-contain"
                            onClick={() => setLightboxImage("https://images.unsplash.com/photo-1592417817098-8f3d6eb19675")}
                          />
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">Library Reference</div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="col-span-2 sm:col-span-2 relative rounded-xl overflow-hidden border border-border/80 aspect-video bg-muted shadow-soft cursor-zoom-in">
                          <img 
                            src={activeConsultation.reportId.imageUrl} 
                            alt="Primary Scan" 
                            className="w-full h-full object-cover" 
                            onClick={() => setLightboxImage(activeConsultation.reportId.imageUrl)}
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[8px] font-bold text-white rounded uppercase tracking-wider">
                            Primary Leaf Scan
                          </span>
                        </div>
                        
                        {/* Detail Inspection zooms */}
                        {[
                          "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675",
                          "https://images.unsplash.com/photo-1598902108854-10e335adac99",
                          activeConsultation.reportId.imageUrl,
                          "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2"
                        ].map((imgUrl, thumbIdx) => (
                          <div 
                            key={thumbIdx} 
                            className="col-span-1 relative rounded-lg overflow-hidden border border-border/80 aspect-square bg-muted cursor-zoom-in hover:border-emerald-500 transition-colors"
                          >
                            <img 
                              src={imgUrl} 
                              alt={`Leaf Detail ${thumbIdx + 1}`} 
                              className="w-full h-full object-cover" 
                              onClick={() => setLightboxImage(imgUrl)}
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-[6px] font-bold text-white px-1 rounded-sm">
                              Zoom
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section B: Shared During Conversation */}
                  <div className="space-y-3 pt-4 border-t border-border/60">
                    <div className="flex justify-between items-center pb-1">
                      <span className="font-extrabold text-[11px] text-foreground">Photos Shared During Conversation</span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {chatSharedImages.length} Photos
                      </span>
                    </div>
                    {chatSharedImages.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic m-0 bg-muted/5 p-3.5 border border-dashed rounded-xl text-center">
                        No photos shared during the chat conversation yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {chatSharedImages.map((img: any, sIdx: number) => (
                          <div 
                            key={sIdx} 
                            className="relative rounded-lg overflow-hidden border border-border/80 aspect-square bg-muted cursor-zoom-in hover:border-emerald-500 transition-colors"
                          >
                            <img 
                              src={img.url} 
                              alt={`Shared Detail ${sIdx + 1}`} 
                              className="w-full h-full object-cover" 
                              onClick={() => setLightboxImage(img.url)}
                            />
                            <span className="absolute bottom-1 right-1 bg-black/60 text-[6.5px] font-bold text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Shared
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI pathology card */}
                  {activeConsultation.reportId.aiPrediction && (
                    <div className="p-4 bg-emerald-950/5 border border-emerald-500/20 border-l-4 border-l-emerald-600 rounded-xl space-y-3 text-xs mt-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-4.5 w-4.5 text-emerald-600" />
                          <span className="font-extrabold text-xs text-emerald-800 font-bold">AI Pathology Assessment Report</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600 font-black text-[10px]">
                          {Math.round(activeConsultation.reportId.aiPrediction.confidence * 100)}% Confidence
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed">
                        <div>
                          <p className="text-muted-foreground m-0">Predicted Crop Disease</p>
                          <p className="font-extrabold text-foreground mt-0.5 text-xs">{activeConsultation.reportId.aiPrediction.disease}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground m-0">AI Suggested Sprays</p>
                          <p className="font-bold text-emerald-600 mt-0.5">{activeConsultation.reportId.aiPrediction.pesticides?.join(", ") || "Fungicide, Neem Spray"}</p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2 border-t border-border/30">
                        <button
                          onClick={handleConfirmAI}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg border-0 cursor-pointer shadow-soft"
                        >
                          Confirm AI Result & Pre-fill Forms
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Expert Diagnosis & Prescriptions Forms */}
              {activeTab === "diagnosis" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Expert Diagnosis Form */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-2.5">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                      <span className="font-extrabold text-xs text-foreground">4. Expert Disease Diagnosis & Analysis</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Confirmed Disease Name *</label>
                        <Input 
                          value={diseaseInput} 
                          onChange={(e) => setDiseaseInput(e.target.value)} 
                          placeholder="e.g. Tomato Early Blight" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Severity Level</label>
                        <Select 
                          value={severityInput} 
                          onValueChange={(val: any) => setSeverityInput(val)}
                        >
                          <SelectTrigger className="bg-background text-foreground border-border text-xs">
                            <SelectValue placeholder="Select Severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low / Mild</SelectItem>
                            <SelectItem value="MEDIUM">Medium / Moderate</SelectItem>
                            <SelectItem value="HIGH">High / Severe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Key Symptoms Observed (Comma separated)</label>
                        <textarea 
                          value={symptomsInput} 
                          onChange={(e) => setSymptomsInput(e.target.value)} 
                          rows={2} 
                          className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Brown spots, yellow halo, concentric rings" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Pathogen / Causes (Comma separated)</label>
                        <textarea 
                          value={causesInput} 
                          onChange={(e) => setCausesInput(e.target.value)} 
                          rows={2} 
                          className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Alternaria solani, high leaf moisture" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Preventive Care Guidelines</label>
                        <textarea 
                          value={prevMeasuresInput} 
                          onChange={(e) => setPrevMeasuresInput(e.target.value)} 
                          rows={2} 
                          className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Foliar pruning, drip irrigation only" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Expected Recovery Timeline</label>
                        <Input 
                          value={timelineInput} 
                          onChange={(e) => setTimelineInput(e.target.value)} 
                          placeholder="e.g. 10-14 Days" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Private Internal Specialist Notes (Not visible to farmer)</label>
                      <textarea 
                        value={notesInput} 
                        onChange={(e) => setNotesInput(e.target.value)} 
                        rows={2} 
                        className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                        placeholder="Private notes..." 
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={handleSaveDiagnosis} 
                        disabled={!isDiagnosisUnsaved}
                        className={`font-bold px-5 border-0 ${
                          isDiagnosisUnsaved 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer" 
                            : "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                        }`}
                      >
                        {isDiagnosisUnsaved ? "Save Diagnosis Sheet" : "Diagnosis Saved"}
                      </Button>
                    </div>
                  </div>

                  {/* Treatment Prescriptions Form */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-2.5">
                      <Sprout className="h-4.5 w-4.5 text-emerald-600" />
                      <span className="font-extrabold text-xs text-foreground">5. Formulation Treatment & Crop Care Prescriptions</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Recommended Chemical Pesticides</label>
                        <Input 
                          value={recPesticides} 
                          onChange={(e) => setRecPesticides(e.target.value)} 
                          placeholder="Mancozeb 75% WP, Chlorothalonil" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Recommended Fungicides</label>
                        <Input 
                          value={recFungicides} 
                          onChange={(e) => setRecFungicides(e.target.value)} 
                          placeholder="Copper Oxychloride" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Chemical Fertilizers</label>
                        <Input 
                          value={recFertilizers} 
                          onChange={(e) => setRecFertilizers(e.target.value)} 
                          placeholder="NPK 19:19:19, Urea" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Organic Biocides / Alternatives</label>
                        <Input 
                          value={recOrganic} 
                          onChange={(e) => setRecOrganic(e.target.value)} 
                          placeholder="Neem seed oil spray" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Bio Fertilizers</label>
                        <Input 
                          value={recBioFert} 
                          onChange={(e) => setRecBioFert(e.target.value)} 
                          placeholder="Trichoderma viride, Compost" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Dosage Instructions</label>
                        <textarea 
                          value={dosageInstructions} 
                          onChange={(e) => setDosageInstructions(e.target.value)} 
                          rows={2} 
                          className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Mix 2.5g Copper Oxychloride per Liter. Spray thoroughly." 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Spray Timeline Schedule</label>
                        <textarea 
                          value={spraySchedule} 
                          onChange={(e) => setSpraySchedule(e.target.value)} 
                          rows={2} 
                          className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Foliar spray twice at 7-day interval." 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Irrigation Advice</label>
                        <Input 
                          value={irrigationAdvice} 
                          onChange={(e) => setIrrigationAdvice(e.target.value)} 
                          placeholder="Avoid late-evening watering" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">Soil Improvement Advice</label>
                        <Input 
                          value={soilAdvice} 
                          onChange={(e) => setSoilAdvice(e.target.value)} 
                          placeholder="Apply Trichoderma vermicompost" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase">General Crop Care Tips</label>
                        <Input 
                          value={careTips} 
                          onChange={(e) => setCareTips(e.target.value)} 
                          placeholder="Prune lower infected leaves up to 1 ft" 
                          className="bg-background text-foreground border-border text-xs py-1.5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border/40">
                      <Button 
                        onClick={handleSaveTreatment} 
                        disabled={activeConsultation.status === "COMPLETED"}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6 border-0 cursor-pointer"
                      >
                        {activeConsultation.status === "COMPLETED" 
                          ? "Consultation Completed" 
                          : "Submit Treatment & Complete Ticket"
                        }
                      </Button>
                    </div>
                  </div>

                  {/* Merchant Inventory Product Recommendations */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-4">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-2.5">
                      <ShoppingBag className="h-4.5 w-4.5 text-emerald-600" />
                      <span className="font-extrabold text-xs text-foreground">6. Recommend Prescription Products</span>
                    </div>

                    <div className="flex items-center gap-2 relative text-xs">
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3" />
                      <Input 
                        value={productQuery} 
                        onChange={(e) => setProductQuery(e.target.value)} 
                        placeholder="Search fertilizers, pesticides, sprays from merchant catalog..." 
                        className="pl-9 bg-background text-foreground border-border text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
                      {productsList.map(prod => {
                        const isRecommended = recommendedProductIds.includes(prod._id);
                        return (
                          <div 
                            key={prod._id} 
                            onClick={() => toggleRecommendProduct(prod._id)}
                            className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all text-xs ${
                              isRecommended 
                                ? "bg-emerald-600/10 border-emerald-500 shadow-sm font-semibold" 
                                : "bg-card border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden text-left">
                              <img src={prod.imageUrl} className="h-10 w-10 object-cover rounded bg-muted border shrink-0" />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold leading-tight truncate">{prod.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{prod.category} — ₹{prod.price}</p>
                              </div>
                            </div>
                            <Badge variant={isRecommended ? "default" : "outline"} className="text-[10px] font-bold">
                              {isRecommended ? "Recommended" : "Add"}
                            </Badge>
                          </div>
                        );
                      })}
                      {productsList.length === 0 && (
                        <p className="text-xs text-muted-foreground col-span-full text-center py-4">No marketplace products found.</p>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Right Column (col-span-1, narrow Specialist Actions + Follow-up details) */}
      <div className="space-y-6">
        
        {/* Accept/Reject Pending Actions Bar */}
        {activeConsultation.status === "PENDING" && (
          <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 border p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 text-left leading-relaxed">
              This assigned case is pending your confirmation. Accept to unlock communication and diagnosis workspace.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => handleAccept(activeConsultation._id)} className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs border-0 cursor-pointer">
                Accept Case
              </Button>
              <Button onClick={() => handleRejectClick(activeConsultation._id)} variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100 text-xs font-bold cursor-pointer">
                Reject Case
              </Button>
            </div>
          </Card>
        )}

        {/* Follow-up management card */}
        <Card className="shadow-sm border-border bg-card text-foreground">
          <CardHeader className="py-3.5 border-b border-border/60 text-left">
            <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-emerald-600" />
              Follow-up & Checkups
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {activeConsultation.followUp?.status === "SCHEDULED" ? (
              <div className="bg-emerald-600/5 border border-emerald-500/20 p-3 rounded-lg text-xs space-y-2 text-left">
                <p className="font-bold text-emerald-800">Scheduled Follow-up Date:</p>
                <p className="font-bold text-emerald-700">
                  {new Date(activeConsultation.followUp.scheduledDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {activeConsultation.followUp.reminderNote && (
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">Note: "{activeConsultation.followUp.reminderNote}"</p>
                )}
                <Button 
                  onClick={handleCloseFollowUp} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 h-7 mt-2 border-0 cursor-pointer"
                >
                  Mark Follow-up Closed
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-left">
                <div>
                  <label className="font-bold text-muted-foreground mb-1 block uppercase">Select Follow-up Checkup Date</label>
                  <Input 
                    type="date" 
                    value={followUpDate} 
                    onChange={(e) => setFollowUpDate(e.target.value)} 
                    className="h-8 text-xs bg-background text-foreground border-border" 
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground mb-1 block uppercase">Checkup Reminder Notes</label>
                  <textarea 
                    value={followUpReminder} 
                    onChange={(e) => setFollowUpReminder(e.target.value)} 
                    rows={2} 
                    placeholder="e.g. Check leaf buds for recovery and upload 2 clear photos."
                    className="w-full text-xs rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
                  />
                </div>
                <Button onClick={saveFollowUp} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 h-8 border-0 cursor-pointer">
                  Schedule Follow-up
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Close Workspace button */}
        <Button 
          onClick={() => { setSelectedConsultationId(null); setActiveConsultation(null); }} 
          variant="outline" 
          className="w-full font-bold border-border cursor-pointer bg-transparent text-foreground hover:bg-muted"
        >
          Close Workspace & Back
        </Button>
      </div>

      {/* FLOATING CHAT BUBBLE TRIGGER */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowFloatingChat(!showFloatingChat)}
          className="h-14 w-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-105 duration-200 cursor-pointer border-0 relative"
          title="Open Farmer Chat"
        >
          {showFloatingChat ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          {activeConsultation.status !== 'COMPLETED' && (
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-success ring-2 ring-white animate-pulse" />
          )}
        </button>
      </div>

      {/* FLOATING CHAT BOX POPUP WIDGET */}
      <div 
        className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[480px] bg-card border border-border rounded-2xl shadow-lift z-50 flex flex-col overflow-hidden transition-all duration-200 ${
          showFloatingChat ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none translate-y-4"
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/10 shrink-0">
          <div className="text-left flex items-center gap-2">
            <div className="relative">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-[11px] text-foreground m-0">
                {activeConsultation.farmerId?.name || "Farmer Client"}
              </h3>
              <p className="text-[8px] text-muted-foreground m-0 mt-0.5">Online</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeConsultation.status !== 'COMPLETED' && (
              <VoiceCallOverlay
                socket={socket}
                userId={user.id}
                userName={user.name}
                consultationId={activeConsultation._id}
                recipientId={activeConsultation.farmerId?._id || activeConsultation.farmerId}
                recipientName={activeConsultation.farmerId?.name || "Farmer Client"}
                consultationType={activeConsultation.consultationType}
                onIncomingCall={() => setShowFloatingChat(true)}
              />
            )}
              <button 
                onClick={() => setShowFloatingChat(false)} 
                className="p-1 hover:bg-muted rounded-full border-0 bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-muted/5">
            {activeConsultation.chatHistory?.map((chat: any, idx: number) => {
              const isMe = chat.senderId?._id === user.id || chat.senderId === user.id || chat.senderId?.role === "AGRI_SPECIALIST";
              return (
                <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-[11px] leading-relaxed ${
                    isMe 
                      ? "bg-emerald-600 text-white rounded-br-none text-right font-semibold" 
                      : "bg-card text-foreground rounded-bl-none border border-border text-left"
                  }`}>
                     <p className="font-bold text-[8.5px] mb-1 opacity-90">
                      {isMe ? "You (Specialist)" : (chat.senderId?.name || "Farmer")}
                    </p>
                    {chat.message?.startsWith("data:image/") ? (
                      <img
                        src={chat.message}
                        alt="Shared leaf"
                        className="max-w-[160px] max-h-[160px] rounded-xl object-cover mt-0.5 border cursor-pointer hover:opacity-90 animate-fadeIn"
                        onClick={() => {
                          const w = window.open();
                          if (w) w.document.write(`<img src="${chat.message}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                        }}
                      />
                    ) : chat.message?.startsWith("data:audio/") ? (
                      <audio 
                        controls 
                        src={chat.message} 
                        className="max-w-[200px] mt-1 accent-emerald-600 block outline-none text-foreground bg-transparent"
                      />
                    ) : (
                      <p className="m-0 leading-relaxed">{chat.message}</p>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-1 px-1">
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {(!activeConsultation.chatHistory || activeConsultation.chatHistory.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-6">No chat history. Send a message to connect.</p>
            )}
            <div ref={consultChatEndRef} />
          </div>

          {/* Request Templates Shortcuts */}
          <div className="border-t border-border/50 p-2 bg-muted/10 flex flex-wrap gap-1.5 justify-center shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => triggerMediaRequest("images")} 
              className="h-6 text-[9px] font-bold border border-emerald-600/20 text-emerald-700 bg-card hover:bg-emerald-50 cursor-pointer"
            >
              + Request Images
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => triggerMediaRequest("videos")} 
              className="h-6 text-[9px] font-bold border border-emerald-600/20 text-emerald-700 bg-card hover:bg-emerald-50 cursor-pointer"
            >
              + Request Videos
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => triggerMediaRequest("progress")} 
              className="h-6 text-[9px] font-bold border border-emerald-600/20 text-emerald-700 bg-card hover:bg-emerald-50 cursor-pointer"
            >
              + Ask Progress
            </Button>
          </div>

          {/* Input sending panel */}
          <div className="border-t border-border/60 p-2.5 bg-card flex items-center gap-2 shrink-0">
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-8 w-8 shrink-0 cursor-pointer ${isRecording ? "bg-red-500/10 text-red-600 animate-pulse hover:bg-red-500/20" : "text-muted-foreground hover:bg-muted"}`}
            >
              {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </Button>

            <Input 
              value={chatMessage} 
              onChange={(e) => setChatMessage(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type message to farmer..." 
              className="h-8 text-xs bg-background text-foreground border-border text-foreground" 
              disabled={activeConsultation.status === "PENDING"}
            />
            <Button 
              type="button" 
              size="icon" 
              onClick={() => sendText()}
              className="h-8 w-8 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 border-0 cursor-pointer flex items-center justify-center"
              disabled={activeConsultation.status === "PENDING"}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

      {/* Lightbox Dialog */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 cursor-pointer" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-3xl max-h-[80vh]">
            <img src={lightboxImage} className="max-h-[80vh] object-contain rounded-lg border border-border" />
          </div>
        </div>
      )}

    </div>
  );
}
