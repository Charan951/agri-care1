import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, User as UserIcon, MessageSquare, Clipboard,
  Brain, ShieldCheck, Sprout, ShoppingBag, Calendar, Activity,
  BookOpen, Bell, Star, Settings, LogOut, Search, Filter,
  CheckCircle, XCircle, Trash2, Camera, Upload, Send, Mic, Play, Square,
  ZoomIn, ArrowRight, BookOpenText, Award, Layers, Plus, ExternalLink, Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/specialist")({
  head: () => ({
    meta: [
      { title: "Specialist Workspace — AgriCare" }
    ],
  }),
  component: SpecialistDashboard,
});

type TabType =
  | "overview"
  | "consultations"
  | "history"
  | "analytics"
  | "knowledge"
  | "profile"
  | "settings";

function SpecialistDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<any>({
    totalAssigned: 0,
    pending: 0,
    active: 0,
    waitingFarmer: 0,
    completed: 0,
    todayCount: 0,
    avgRating: 5.0,
    earnings: 0
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [assignedConsultations, setAssignedConsultations] = useState<any[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cropFilter, setCropFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("");

  // Active consultation details workspace
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [farmerHistory, setFarmerHistory] = useState<any[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<any[]>([]);

  // Rejection Modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Image lightbox & Compare images
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [compareImages, setCompareImages] = useState<boolean>(false);

  // Chat message & voice note state
  const [chatMessage, setChatMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Diagnosis and Treatment Form
  const [diseaseInput, setDiseaseInput] = useState("");
  const [severityInput, setSeverityInput] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [causesInput, setCausesInput] = useState("");
  const [prevMeasuresInput, setPrevMeasuresInput] = useState("");
  const [timelineInput, setTimelineInput] = useState("7-14 Days");
  const [notesInput, setNotesInput] = useState("");

  // Detailed Recommendations
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

  // Marketplace search
  const [productQuery, setProductQuery] = useState("");
  const [productsList, setProductsList] = useState<any[]>([]);
  const [recommendedProductIds, setRecommendedProductIds] = useState<string[]>([]);

  // Follow-up state
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpReminder, setFollowUpReminder] = useState("");

  // Knowledge base search
  const [knowledgeSearch, setKnowledgeSearch] = useState("");

  // Profile Form state
  const [profileName, setProfileName] = useState("");
  const [profileMobile, setProfileMobile] = useState("");
  const [profileRegion, setProfileRegion] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileQuals, setProfileQuals] = useState("");
  const [profileLanguages, setProfileLanguages] = useState("");
  const [profileAvail, setProfileAvail] = useState<"AVAILABLE" | "UNAVAILABLE" | "ON_LEAVE">("AVAILABLE");

  // Settings state
  const [settingsLanguage, setSettingsLanguage] = useState("English");
  const [settingsOldPass, setSettingsOldPass] = useState("");
  const [settingsNewPass, setSettingsNewPass] = useState("");

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "AGRI_SPECIALIST")) {
      toast.error("Unauthorized. Please log in as an Agriculture Specialist.");
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, user, navigate]);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      const statsRes = await apiFetch("/api/specialist/dashboard-stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setRecentActivities(data.recentActivities);
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Error loading specialist statistics", err);
    }
  };

  // Load Consultation List
  const loadConsultations = async () => {
    try {
      const q = new URLSearchParams();
      if (searchQuery) q.append("search", searchQuery);
      if (statusFilter !== "ALL") q.append("status", statusFilter);
      if (cropFilter !== "ALL") q.append("crop", cropFilter);
      if (priorityFilter !== "ALL") q.append("priority", priorityFilter);
      if (districtFilter) q.append("district", districtFilter);

      const res = await apiFetch(`/api/specialist/consultations?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssignedConsultations(data.consultations);
      }
    } catch (err) {
      console.error("Error loading consultations list", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "AGRI_SPECIALIST") {
      loadDashboardData();
      loadConsultations();
    }
  }, [isAuthenticated, user, searchQuery, statusFilter, cropFilter, priorityFilter, districtFilter]);

  // Load Selected Consultation Workspace
  const selectConsultation = async (id: string) => {
    try {
      setSelectedConsultationId(id);
      const res = await apiFetch(`/api/specialist/consultations/${id}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.consultation;
        setActiveConsultation(c);
        setFarmerHistory(data.farmerHistory);
        setFarmerOrders(data.farmerOrders);

        // Pre-fill Diagnosis forms
        setDiseaseInput(c.diagnosisDetails?.disease || "");
        setSeverityInput(c.diagnosisDetails?.severity || "MEDIUM");
        setSymptomsInput(c.diagnosisDetails?.symptoms?.join(", ") || "");
        setCausesInput(c.diagnosisDetails?.causes?.join(", ") || "");
        setPrevMeasuresInput(c.diagnosisDetails?.preventiveMeasures?.join(", ") || "");
        setTimelineInput(c.diagnosisDetails?.recoveryTimeline || "7-14 Days");
        setNotesInput(c.internalNotes || "");

        // Pre-fill Treatment recommendations
        setRecFertilizers(c.treatmentRecommendation?.fertilizers?.join(", ") || "");
        setRecPesticides(c.treatmentRecommendation?.pesticides?.join(", ") || "");
        setRecFungicides(c.treatmentRecommendation?.fungicides?.join(", ") || "");
        setRecOrganic(c.treatmentRecommendation?.organicAlternatives?.join(", ") || "");
        setRecBioFert(c.treatmentRecommendation?.bioFertilizers?.join(", ") || "");
        setDosageInstructions(c.treatmentRecommendation?.dosageInstructions || "");
        setSpraySchedule(c.treatmentRecommendation?.spraySchedule || "");
        setIrrigationAdvice(c.treatmentRecommendation?.irrigationAdvice || "");
        setSoilAdvice(c.treatmentRecommendation?.soilImprovementAdvice || "");
        setCareTips(c.treatmentRecommendation?.cropCareTips || "");

        // Pre-fill Marketplace recommendations
        const pIds = c.recommendedProducts?.map((p: any) => p._id || p) || [];
        setRecommendedProductIds(pIds);

        // Pre-fill Follow-up
        if (c.followUp?.scheduledDate) {
          setFollowUpDate(new Date(c.followUp.scheduledDate).toISOString().split("T")[0]);
        } else {
          setFollowUpDate("");
        }
        setFollowUpReminder(c.followUp?.reminderNote || "");

        // Reset compare state
        setCompareImages(false);
      }
    } catch (err) {
      toast.error("Failed to load consultation details.");
    }
  };

  // Socket chat messaging listener
  useEffect(() => {
    if (socket && selectedConsultationId) {
      const handleChatUpdate = (data: any) => {
        if (data.consultationId === selectedConsultationId) {
          setActiveConsultation((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              chatHistory: data.chatHistory
            };
          });
        }
      };

      const handleConsultationUpdate = (data: any) => {
        if (data.consultationId === selectedConsultationId) {
          setActiveConsultation((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              status: data.status
            };
          });
          loadDashboardData();
          loadConsultations();
        }
      };

      socket.on("consultation_chat_updated", handleChatUpdate);
      socket.on("consultation_updated", handleConsultationUpdate);

      return () => {
        socket.off("consultation_chat_updated", handleChatUpdate);
        socket.off("consultation_updated", handleConsultationUpdate);
      };
    }
  }, [socket, selectedConsultationId]);

  // Load Marketplace products lists
  const searchMarketplaceProducts = async () => {
    try {
      const res = await apiFetch(`/api/specialist/products?search=${productQuery}`);
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedConsultationId) {
      searchMarketplaceProducts();
    }
  }, [productQuery, selectedConsultationId]);

  // Accept/Reject buttons
  const handleAccept = async (id: string) => {
    try {
      const res = await apiFetch(`/api/specialist/consultations/${id}/accept`, {
        method: "PUT"
      });
      if (res.ok) {
        toast.success("Consultation accepted. Workspace is now active.");
        loadDashboardData();
        loadConsultations();
        selectConsultation(id);
      } else {
        toast.error("Failed to accept consultation.");
      }
    } catch (err) {
      toast.error("Error accepting consultation.");
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectId(id);
    setRejectionReason("");
    setIsRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for rejection.");
      return;
    }
    try {
      const res = await apiFetch(`/api/specialist/consultations/${rejectId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (res.ok) {
        toast.success("Consultation rejected & returned to admin review.");
        setIsRejectOpen(false);
        setRejectId(null);
        setSelectedConsultationId(null);
        setActiveConsultation(null);
        loadDashboardData();
        loadConsultations();
      } else {
        toast.error("Failed to reject consultation.");
      }
    } catch (err) {
      toast.error("Error rejecting consultation.");
    }
  };

  // Submit diagnosis form
  const handleSaveDiagnosis = async () => {
    if (!diseaseInput.trim()) {
      toast.error("Please specify a disease name.");
      return;
    }
    try {
      const res = await apiFetch(`/api/specialist/consultations/${selectedConsultationId}/diagnosis`, {
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
        // Reload details to keep state sync
        selectConsultation(selectedConsultationId!);
      } else {
        toast.error("Failed to save diagnosis.");
      }
    } catch (err) {
      toast.error("Error saving diagnosis.");
    }
  };

  // Confirm AI Prediction Shortcut
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

  // Submit Final Treatment details (completes ticket)
  const handleSaveTreatment = async () => {
    try {
      const res = await apiFetch(`/api/specialist/consultations/${selectedConsultationId}/treatment`, {
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
        selectConsultation(selectedConsultationId!);
        loadDashboardData();
        loadConsultations();
      } else {
        toast.error("Failed to submit treatment recommendations.");
      }
    } catch (err) {
      toast.error("Error submitting treatment.");
    }
  };

  // Toggle products recommendations
  const toggleRecommendProduct = async (pId: string) => {
    let updated = [...recommendedProductIds];
    if (updated.includes(pId)) {
      updated = updated.filter(id => id !== pId);
    } else {
      updated.push(pId);
    }
    setRecommendedProductIds(updated);

    try {
      const res = await apiFetch(`/api/specialist/consultations/${selectedConsultationId}/recommend-products`, {
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

  // Chat message send
  const sendText = async (textToSend?: string) => {
    const finalMsg = textToSend || chatMessage;
    if (!finalMsg.trim()) return;

    try {
      const res = await apiFetch(`/api/specialist/consultations/${selectedConsultationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: finalMsg })
      });
      if (res.ok) {
        if (!textToSend) setChatMessage("");
      }
    } catch (err) {
      toast.error("Failed to send message.");
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Pre-fill simulated voice note link into chat
        setChatMessage(`[Voice Note] Listening link: ${url}`);
      };

      recorder.start();
      setIsRecording(true);
      toast.info("Recording voice message... Speak now.");
    } catch (err) {
      toast.error("Audio recording permission denied or unsupported.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success("Audio message recorded successfully.");
    }
  };

  // Request templates
  const triggerMediaRequest = (type: "images" | "videos" | "progress") => {
    let msg = "";
    if (type === "images") {
      msg = "Hello. Please upload 2-3 additional close-up, high-resolution photos of the leaf undersides and stem joints of this crop.";
    } else if (type === "videos") {
      msg = "Could you record and upload a short, 15-second video walking around the affected patch? This helps evaluate spacing and soil irrigation.";
    } else {
      msg = "Please write a quick progress update. Are you observing any new symptoms since our last message?";
    }
    sendText(msg);
  };

  // Save Follow-up details
  const saveFollowUp = async () => {
    try {
      const res = await apiFetch(`/api/specialist/consultations/${selectedConsultationId}/follow-up`, {
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
        selectConsultation(selectedConsultationId!);
      }
    } catch (err) {
      toast.error("Error setting follow-up.");
    }
  };

  const handleCloseFollowUp = async () => {
    try {
      const res = await apiFetch(`/api/specialist/consultations/${selectedConsultationId}/follow-up/close`, {
        method: "PUT"
      });
      if (res.ok) {
        toast.success("Follow-up closed successfully.");
        selectConsultation(selectedConsultationId!);
      }
    } catch (err) {
      toast.error("Error closing follow-up.");
    }
  };

  // Load Profile editor data
  useEffect(() => {
    if (activeTab === "profile" && user) {
      setProfileName(user.name || "");
      setProfileMobile(user.mobile || "");
      setProfileRegion(user.workingRegion || "");
      setProfileTitle((user as any).specialistTitle || "Agronomist Specialist");
      setProfileBio((user as any).bio || "");
      setProfileQuals((user as any).qualifications?.join(", ") || "");
      setProfileLanguages((user as any).languages?.join(", ") || "");
      setProfileAvail((user as any).availabilityStatus || "AVAILABLE");
    }
  }, [activeTab, user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/specialist/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          mobile: profileMobile,
          workingRegion: profileRegion,
          specialistTitle: profileTitle,
          bio: profileBio,
          qualifications: profileQuals.split(",").map(q => q.trim()).filter(Boolean),
          languages: profileLanguages.split(",").map(l => l.trim()).filter(Boolean),
          availabilityStatus: profileAvail
        })
      });
      if (res.ok) {
        toast.success("Profile saved successfully.");
        // Refresh session
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error updating profile.");
    }
  };

  // Change Password
  const changePasswordHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsNewPass) return;
    try {
      const res = await apiFetch("/api/specialist/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: settingsOldPass,
          newPassword: settingsNewPass
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully.");
        setSettingsOldPass("");
        setSettingsNewPass("");
      } else {
        toast.error(data.message || "Failed to update password.");
      }
    } catch (err) {
      toast.error("Error updating password.");
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully.");
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-card text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Specialist Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "AGRI_SPECIALIST") {
    return null;
  }

  // Predefined Knowledge base data for 12. Knowledge Center
  const KNOWLEDGE_ITEMS = [
    { title: "Cotton Alternaria Leaf Spot", category: "Fungal diseases", symptoms: "Concentric brown circles on lower crop leaves", causes: "Alternaria macrospora spore spread under humid dew conditions", prevention: "Crop rotation, seed treatment, avoiding overhead sprinklers" },
    { title: "Rice Bacterial Leaf Blight", category: "Bacterial diseases", symptoms: "Water-soaked yellow stripes extending along leaf margins", causes: "Xanthomonas oryzae bacteria entering leaf wounds", prevention: "Use resistant cultivars, balanced nitrogen fertilizers" },
    { title: "Tomato Early Blight", category: "Fungal diseases", symptoms: "Dark target-like rings on older leaves first", causes: "Alternaria solani fungus surviving in weed residues", prevention: "Proper row spacing, mulching, watering from crop base" },
    { title: "Organic Neem Seed Extract Spray Formulation", category: "Formulations", symptoms: "General organic defense", causes: "Active azadirachtin compound repels sucking bugs", prevention: "Mix 50g neem powder in 1L water, ferment 12 hours, add soap surfactant" }
  ].filter(item => 
    item.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    item.symptoms.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(knowledgeSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 text-foreground font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 h-full border-r border-border bg-card flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-3 py-1 border-b border-border pb-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white">
                <Sprout className="h-5 w-5" />
              </span>
              <div className="text-left">
                <span className="font-bold text-sm block leading-none text-foreground">Specialist Workspace</span>
                <span className="text-[10px] text-emerald-600 font-semibold tracking-wider uppercase mt-1 block">AgriCare Pro</span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab("overview"); setSelectedConsultationId(null); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "overview" && !selectedConsultationId
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Overview
              </button>
              <button
                onClick={() => { setActiveTab("consultations"); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "consultations" || selectedConsultationId
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Clipboard className="h-4 w-4" />
                Assigned Cases ({stats.active + stats.pending})
              </button>
              <button
                onClick={() => { setActiveTab("history"); setSelectedConsultationId(null); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "history"
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Activity className="h-4 w-4" />
                Consultation History
              </button>
              <button
                onClick={() => { setActiveTab("analytics"); setSelectedConsultationId(null); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "analytics"
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Layers className="h-4 w-4" />
                Performance Analytics
              </button>
              <button
                onClick={() => { setActiveTab("knowledge"); setSelectedConsultationId(null); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === "knowledge"
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Agronomy Library
              </button>
            </nav>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div 
              onClick={() => { setActiveTab("profile"); setSelectedConsultationId(null); }}
              className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                activeTab === "profile" ? "bg-emerald-600/15 border-emerald-500" : "bg-muted/30 hover:bg-muted"
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-bold leading-none truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-1">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                activeTab === "settings" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold">
              {selectedConsultationId ? "Consultation Workspace" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {selectedConsultationId 
                ? `Currently processing case ID: ${selectedConsultationId}` 
                : "Welcome to your AgriCare specialist dashboard"
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold gap-1.5 py-1 px-3">
              <span className={`h-2 w-2 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
              {profileAvail === "AVAILABLE" ? "Online & Available" : "On Leave"}
            </Badge>
            <div className="relative">
              <button className="relative p-2 rounded-full hover:bg-muted text-muted-foreground">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-6">
          {/* CONSULTATION ACTIVE WORKSPACE ROUTING OVERRIDE */}
          {selectedConsultationId && activeConsultation ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
              {/* LEFT & CENTER DETAILS SECTION */}
              <div className="lg:col-span-2 space-y-6">
                {/* Farmer & Crop Case Sheet card */}
                <Card className="shadow-sm border-border/80 overflow-hidden">
                  <CardHeader className="bg-muted/40 border-b border-border/50 py-4 flex flex-row items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Case File</span>
                      <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                        {activeConsultation.reportId?.cropName || "Unknown Crop"} Diagnosis Sheet
                      </CardTitle>
                    </div>
                    <Badge variant={activeConsultation.status === "PENDING" ? "secondary" : "default"} className="font-bold py-1 px-2.5">
                      {activeConsultation.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Farmer Details Grid */}
                    <div>
                      <h3 className="text-sm font-bold border-b border-border pb-2 mb-3 text-emerald-700">1. Farmer Profile</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Farmer Name</p>
                          <p className="font-semibold">{activeConsultation.farmerId?.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Mobile Number</p>
                          <p className="font-semibold">{activeConsultation.farmerId?.mobile || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">District / State</p>
                          <p className="font-semibold">
                            {activeConsultation.farmerId?.savedAddresses?.[0]?.city || "Pune"}, {activeConsultation.farmerId?.savedAddresses?.[0]?.state || "Maharashtra"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Village</p>
                          <p className="font-semibold">{activeConsultation.farmerId?.savedAddresses?.[0]?.street || "Wadgaon"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Farm Size</p>
                          <p className="font-semibold">{activeConsultation.farmerId?.farms?.[0]?.size ? `${activeConsultation.farmerId.farms[0].size} Acres` : "12 Acres"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Soil Texture</p>
                          <p className="font-semibold">{activeConsultation.farmerId?.farms?.[0]?.soilType || "Clay Black"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Crop Symptoms Questionnaire */}
                    <div>
                      <h3 className="text-sm font-bold border-b border-border pb-2 mb-3 text-emerald-700">2. Crop Information & Symptoms Questionnaire</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Crop Name</p>
                          <p className="font-semibold text-emerald-600">{activeConsultation.reportId?.cropName || "Cotton"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Growth Stage</p>
                          <p className="font-semibold">Flowering / Leaf Growth</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sowing Date</p>
                          <p className="font-semibold">15 May 2026</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Irrigation Method</p>
                          <p className="font-semibold">Drip Irrigation</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pesticides Sprayed</p>
                          <p className="font-semibold">Neem Oil (10 Days ago)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Weather Condition</p>
                          <p className="font-semibold">Humid (74% RH)</p>
                        </div>
                      </div>
                      <div className="bg-muted/40 p-3.5 rounded-lg border border-border/60">
                        <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Farmer Stated Symptoms:</p>
                        <p className="text-sm italic font-medium">"{activeConsultation.reportId?.symptoms || "No symptom description submitted."}"</p>
                      </div>
                    </div>

                    {/* Leaf Image Gallery */}
                    <div>
                      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                        <h3 className="text-sm font-bold text-emerald-700">3. Leaf Image Gallery</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setCompareImages(!compareImages)}
                          className="h-7 text-xs font-bold hover:bg-emerald-600/10 text-emerald-700"
                        >
                          {compareImages ? "Single View" : "Compare Images Side-by-Side"}
                        </Button>
                      </div>

                      {compareImages ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border border-border/80 rounded-lg overflow-hidden relative bg-black flex items-center justify-center group h-64">
                            <img 
                              src={activeConsultation.reportId?.imageUrl || "https://images.unsplash.com/photo-1599599810769-bcde5a160d32"} 
                              alt="Upload 1" 
                              className="max-h-full object-contain cursor-zoom-in"
                              onClick={() => setLightboxImage(activeConsultation.reportId?.imageUrl)}
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Original image</div>
                          </div>
                          <div className="border border-border/80 rounded-lg overflow-hidden relative bg-black flex items-center justify-center group h-64">
                            {/* Compare with another default image */}
                            <img 
                              src="https://images.unsplash.com/photo-1592417817098-8f3d6eb19675" 
                              alt="Library Reference" 
                              className="max-h-full object-contain cursor-zoom-in"
                              onClick={() => setLightboxImage("https://images.unsplash.com/photo-1592417817098-8f3d6eb19675")}
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Library reference</div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          <div 
                            onClick={() => setLightboxImage(activeConsultation.reportId?.imageUrl)}
                            className="border border-border/80 rounded-lg overflow-hidden relative bg-muted cursor-zoom-in hover:brightness-95 group h-36 flex items-center justify-center"
                          >
                            <img src={activeConsultation.reportId?.imageUrl || "https://images.unsplash.com/photo-1599599810769-bcde5a160d32"} className="object-cover h-full w-full" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div 
                            onClick={() => setLightboxImage("https://images.unsplash.com/photo-1592417817098-8f3d6eb19675")}
                            className="border border-border/80 rounded-lg overflow-hidden relative bg-muted cursor-zoom-in hover:brightness-95 group h-36 flex items-center justify-center"
                          >
                            <img src="https://images.unsplash.com/photo-1592417817098-8f3d6eb19675" className="object-cover h-full w-full" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="border border-dashed border-border/80 rounded-lg flex flex-col items-center justify-center text-muted-foreground text-xs p-3 text-center h-36">
                            <Download className="h-5 w-5 mb-1.5" />
                            <a 
                              href={activeConsultation.reportId?.imageUrl} 
                              download 
                              target="_blank" 
                              className="font-semibold text-emerald-600 hover:underline"
                            >
                              Download Case Images
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Disease report summary */}
                {activeConsultation.reportId?.aiPrediction && (
                  <Card className="shadow-sm border-border bg-emerald-950/5 border-l-4 border-l-emerald-600">
                    <CardHeader className="py-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-sm font-bold text-emerald-800 dark:text-emerald-400">AI Pathology Assessment Report</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Predicted Disease</p>
                          <p className="font-bold text-emerald-700">{activeConsultation.reportId.aiPrediction.disease}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">AI Confidence Score</p>
                          <p className="font-bold text-emerald-600">{(activeConsultation.reportId.aiPrediction.confidence * 100).toFixed(0)}% Confidence</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">AI Suggested Chemical Sprays</p>
                          <p className="font-semibold text-muted-foreground">{activeConsultation.reportId.aiPrediction.pesticides?.join(", ") || "None"}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                        <Button 
                          onClick={handleConfirmAI} 
                          className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold py-1.5 h-8"
                        >
                          Confirm AI Result & Pre-fill Forms
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Expert Diagnosis Form */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="py-4 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      4. Expert Disease Diagnosis & Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Confirmed Disease Name *</label>
                        <Input 
                          value={diseaseInput} 
                          onChange={(e) => setDiseaseInput(e.target.value)} 
                          placeholder="e.g. Alternaria Leaf Spot" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Severity Level</label>
                        <Select 
                          value={severityInput} 
                          onValueChange={(val: any) => setSeverityInput(val)}
                        >
                          <SelectTrigger>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Key Symptoms Observed (Comma separated)</label>
                        <textarea 
                          value={symptomsInput} 
                          onChange={(e) => setSymptomsInput(e.target.value)} 
                          rows={2} 
                          className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Brown spots, yellow halo, defoliation" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Pathogen / Causes (Comma separated)</label>
                        <textarea 
                          value={causesInput} 
                          onChange={(e) => setCausesInput(e.target.value)} 
                          rows={2} 
                          className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Alternaria macrospora, high leaf moisture" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Preventive Care Guidelines</label>
                        <textarea 
                          value={prevMeasuresInput} 
                          onChange={(e) => setPrevMeasuresInput(e.target.value)} 
                          rows={2} 
                          className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Avoid overhead watering, pull out infected leaves" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Expected Recovery Timeline</label>
                        <Input 
                          value={timelineInput} 
                          onChange={(e) => setTimelineInput(e.target.value)} 
                          placeholder="e.g. 7-14 Days" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Private Internal Specialist Notes (Not visible to farmer)</label>
                      <textarea 
                        value={notesInput} 
                        onChange={(e) => setNotesInput(e.target.value)} 
                        rows={2} 
                        className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                        placeholder="Farmer seems hesitant to spray chemical pesticides. Focus recommendation on organic biocides." 
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSaveDiagnosis} className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-5">
                        Save Diagnosis Sheet
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Treatment Prescriptions Form */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="py-4 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-emerald-600" />
                      5. Formulation Treatment & Crop Care Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Recommended Chemical Pesticides</label>
                        <Input 
                          value={recPesticides} 
                          onChange={(e) => setRecPesticides(e.target.value)} 
                          placeholder="Mancozeb 75% WP, Chlorothalonil" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Recommended Fungicides</label>
                        <Input 
                          value={recFungicides} 
                          onChange={(e) => setRecFungicides(e.target.value)} 
                          placeholder="Copper Oxychloride" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Chemical Fertilizers</label>
                        <Input 
                          value={recFertilizers} 
                          onChange={(e) => setRecFertilizers(e.target.value)} 
                          placeholder="NPK 19:19:19, Urea" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Organic Biocides / Alternatives</label>
                        <Input 
                          value={recOrganic} 
                          onChange={(e) => setRecOrganic(e.target.value)} 
                          placeholder="Neem seed oil spray" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Bio Fertilizers</label>
                        <Input 
                          value={recBioFert} 
                          onChange={(e) => setRecBioFert(e.target.value)} 
                          placeholder="Trichoderma viride, Compost" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Dosage Instructions</label>
                        <textarea 
                          value={dosageInstructions} 
                          onChange={(e) => setDosageInstructions(e.target.value)} 
                          rows={2} 
                          className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Mix 2.5g Mancozeb per Liter of water. Spray crop foliage thoroughly." 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Spray Timeline Schedule</label>
                        <textarea 
                          value={spraySchedule} 
                          onChange={(e) => setSpraySchedule(e.target.value)} 
                          rows={2} 
                          className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Apply early morning before dew dries. Re-apply in 10 days if spots spread." 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Irrigation Advice</label>
                        <Input 
                          value={irrigationAdvice} 
                          onChange={(e) => setIrrigationAdvice(e.target.value)} 
                          placeholder="Reduce watering frequency during humidity" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Soil Improvement Advice</label>
                        <Input 
                          value={soilAdvice} 
                          onChange={(e) => setSoilAdvice(e.target.value)} 
                          placeholder="Incorporate farm yard manure, test pH" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">General Crop Care Tips</label>
                        <Input 
                          value={careTips} 
                          onChange={(e) => setCareTips(e.target.value)} 
                          placeholder="Monitor surrounding crops for spread" 
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border/40">
                      <Button 
                        onClick={handleSaveTreatment} 
                        disabled={activeConsultation.status === "COMPLETED"}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6"
                      >
                        {activeConsultation.status === "COMPLETED" 
                          ? "Consultation Completed" 
                          : "Submit Treatment & Complete Ticket"
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Marketplace recommendations */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="py-4 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-600" />
                      6. Merchant Inventory Product Recommendations
                    </CardTitle>
                    <CardDescription>Recommend genuine merchant supplies directly to the farmer's checkout cart.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
                      <Input 
                        value={productQuery} 
                        onChange={(e) => setProductQuery(e.target.value)} 
                        placeholder="Search fertilizers, pesticides, sprays from merchant catalog..." 
                        className="pl-9"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
                      {productsList.map(prod => {
                        const isRecommended = recommendedProductIds.includes(prod._id);
                        return (
                          <div 
                            key={prod._id} 
                            onClick={() => toggleRecommendProduct(prod._id)}
                            className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all ${
                              isRecommended 
                                ? "bg-emerald-600/10 border-emerald-500 shadow-sm" 
                                : "bg-card border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img src={prod.imageUrl} className="h-10 w-10 object-cover rounded bg-muted" />
                              <div className="text-left overflow-hidden">
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
                        <p className="text-xs text-muted-foreground col-span-2 text-center py-4">No marketplace products found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT SIDEBAR PANEL: CHAT & FOLLOW-UP TIMELINE */}
              <div className="space-y-6">
                {/* Accept/Reject Pending Actions Bar */}
                {activeConsultation.status === "PENDING" && (
                  <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 border p-4 space-y-3">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      This assigned case is pending your confirmation. Accept to unlock communication and diagnosis workspace.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleAccept(activeConsultation._id)} className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs">
                        Accept Case
                      </Button>
                      <Button onClick={() => handleRejectClick(activeConsultation._id)} variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100 text-xs font-bold">
                        Reject Case
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Farmer Chat Communication Box */}
                <Card className="shadow-sm border-border flex flex-col h-[480px]">
                  <CardHeader className="py-3.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-emerald-600" />
                      <CardTitle className="text-sm font-bold">Live Farmer Chat</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">Online</Badge>
                  </CardHeader>
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                    {activeConsultation.chatHistory?.map((chat: any, idx: number) => {
                      const isMe = chat.senderId?._id === user.id || chat.senderId === user.id || chat.senderId?.role === "AGRI_SPECIALIST";
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                            isMe 
                              ? "bg-emerald-600 text-white rounded-br-none" 
                              : "bg-muted text-foreground rounded-bl-none border border-border"
                          }`}>
                            <p className="font-semibold text-[10px] mb-1.5 opacity-90">
                              {isMe ? "You (Specialist)" : (chat.senderId?.name || "Farmer")}
                            </p>
                            <p>{chat.message}</p>
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 px-1">
                            {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    {activeConsultation.chatHistory?.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No chat history. Send a message to connect with the farmer.</p>
                    )}
                  </div>

                  {/* Request Templates Shortcuts */}
                  <div className="border-t border-border/50 p-2 bg-muted/10 flex flex-wrap gap-1.5 justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => triggerMediaRequest("images")} 
                      className="h-6 text-[10px] font-bold border border-emerald-600/20 text-emerald-700 bg-card hover:bg-emerald-50"
                    >
                      + Request Images
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => triggerMediaRequest("videos")} 
                      className="h-6 text-[10px] font-bold border border-emerald-600/20 text-emerald-700 bg-card hover:bg-emerald-50"
                    >
                      + Request Videos
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => triggerMediaRequest("progress")} 
                      className="h-6 text-[10px] font-bold border border-emerald-600/20 text-emerald-700 bg-card hover:bg-emerald-50"
                    >
                      + Ask Progress
                    </Button>
                  </div>

                  {/* Input sending panel */}
                  <div className="border-t border-border/60 p-3 bg-card flex items-center gap-2">
                    {/* Simulated Voice note recorder */}
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`h-9 w-9 shrink-0 ${isRecording ? "bg-red-500/10 text-red-600 animate-pulse hover:bg-red-500/20" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>

                    <Input 
                      value={chatMessage} 
                      onChange={(e) => setChatMessage(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && sendText()}
                      placeholder="Type message to farmer..." 
                      className="h-9 text-xs" 
                      disabled={activeConsultation.status === "PENDING"}
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      onClick={() => sendText()}
                      className="h-9 w-9 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={activeConsultation.status === "PENDING"}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                {/* Follow-up management card */}
                <Card className="shadow-sm border-border">
                  <CardHeader className="py-3.5 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-emerald-600" />
                      Follow-up & Checkups
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {activeConsultation.followUp?.status === "SCHEDULED" ? (
                      <div className="bg-emerald-600/5 border border-emerald-500/20 p-3 rounded-lg text-xs space-y-2">
                        <p className="font-bold text-emerald-800">Scheduled Follow-up Date:</p>
                        <p className="font-semibold text-emerald-700">
                          {new Date(activeConsultation.followUp.scheduledDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {activeConsultation.followUp.reminderNote && (
                          <p className="text-[10px] text-muted-foreground italic">Note: "{activeConsultation.followUp.reminderNote}"</p>
                        )}
                        <Button 
                          onClick={handleCloseFollowUp} 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 h-7 mt-2"
                        >
                          Mark Follow-up Closed
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold text-muted-foreground mb-1 block">Select Follow-up Checkup Date</label>
                          <Input 
                            type="date" 
                            value={followUpDate} 
                            onChange={(e) => setFollowUpDate(e.target.value)} 
                            className="h-8 text-xs" 
                          />
                        </div>
                        <div>
                          <label className="font-bold text-muted-foreground mb-1 block">Checkup Reminder Instruction Notes</label>
                          <textarea 
                            value={followUpReminder} 
                            onChange={(e) => setFollowUpReminder(e.target.value)} 
                            rows={2} 
                            placeholder="e.g. Check leaf buds for recovery and upload 2 clear photos."
                            className="w-full text-xs rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                          />
                        </div>
                        <Button onClick={saveFollowUp} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 h-8">
                          Schedule Follow-up
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Back to list button */}
                <Button 
                  onClick={() => { setSelectedConsultationId(null); setActiveConsultation(null); }} 
                  variant="outline" 
                  className="w-full font-bold border-border"
                >
                  Close Workspace & Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* RENDER NORMAL TAB OVERVIEWS */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Assigned</p>
                          <h3 className="text-2xl font-bold mt-1 text-emerald-800 dark:text-emerald-400">{stats.totalAssigned}</h3>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
                          <Clipboard className="h-5 w-5" />
                        </span>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pending Acceptance</p>
                          <h3 className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</h3>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                          <Activity className="h-5 w-5" />
                        </span>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Consults</p>
                          <h3 className="text-2xl font-bold mt-1 text-blue-600">{stats.active}</h3>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
                          <MessageSquare className="h-5 w-5" />
                        </span>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
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
                    <Card className="lg:col-span-2 shadow-sm border-border">
                      <CardHeader className="py-4 border-b border-border/60">
                        <CardTitle className="text-sm font-bold text-emerald-800">Pending & Active Consultation Requests</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/60">
                          {assignedConsultations
                            .filter(c => c.status === "PENDING" || c.status === "ACTIVE")
                            .slice(0, 5)
                            .map((c: any) => (
                              <div key={c._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                <div className="text-left overflow-hidden">
                                  <p className="text-sm font-bold text-foreground truncate">{c.reportId?.cropName || "Unknown Crop"} Diagnosis</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Farmer: {c.farmerId?.name || "Farmer"} &bull; {c.reportId?.priority} Priority
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {c.status === "PENDING" ? (
                                    <>
                                      <Button onClick={() => handleAccept(c._id)} className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-3">
                                        Accept
                                      </Button>
                                      <Button onClick={() => handleRejectClick(c._id)} variant="ghost" className="h-8 text-red-500 text-xs font-bold hover:bg-red-50">
                                        Reject
                                      </Button>
                                    </>
                                  ) : (
                                    <Button onClick={() => selectConsultation(c._id)} className="h-8 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold px-3">
                                      Open Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          {assignedConsultations.filter(c => c.status === "PENDING" || c.status === "ACTIVE").length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-8">No pending or active consultations assigned.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent activities & System Notifications */}
                    <Card className="shadow-sm border-border">
                      <CardHeader className="py-4 border-b border-border/60">
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
              )}

              {/* ASSIGNED CONSULTATIONS SEARCH/FILTER GRID */}
              {activeTab === "consultations" && (
                <div className="space-y-6">
                  {/* Search and Filters bar */}
                  <Card className="shadow-sm border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                      <Input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search cases by farmer name, crop disease..." 
                        className="pl-9 h-10"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-10 text-xs">
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
                        <SelectTrigger className="w-[140px] h-10 text-xs">
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
                        className="h-10 text-xs w-[160px]"
                      />
                    </div>
                  </Card>

                  {/* Consultation List Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {assignedConsultations.map((c: any) => (
                      <Card key={c._id} className="shadow-sm border-border hover:shadow-md transition-all flex flex-col justify-between">
                        <CardHeader className="pb-3">
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
                              <Button onClick={() => handleAccept(c._id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8">
                                Accept
                              </Button>
                              <Button onClick={() => handleRejectClick(c._id)} size="sm" variant="ghost" className="text-red-500 font-bold text-xs h-8 hover:bg-red-50">
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => selectConsultation(c._id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8">
                              Open Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    {assignedConsultations.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center col-span-3 py-10">No consultations match your search filters.</p>
                    )}
                  </div>
                </div>
              )}

              {/* HISTORICAL RESOLVED CONSULTATIONS */}
              {activeTab === "history" && (
                <Card className="shadow-sm border-border">
                  <CardHeader className="py-4 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-emerald-800">Closed & Completed Consultation Records</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/60">
                      {assignedConsultations
                        .filter(c => c.status === "COMPLETED")
                        .map((c: any) => (
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
                            <Button onClick={() => selectConsultation(c._id)} variant="outline" className="h-8 text-xs font-bold border-border">
                              View Details & Prescription
                            </Button>
                          </div>
                        ))}
                      {assignedConsultations.filter(c => c.status === "COMPLETED").length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">No historical consultation records found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ANALYTICS & REPORTS PERFORMANCE TABS */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* KPI card row */}
                  <div className="grid grid-cols-3 gap-5">
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Total Completed</p>
                        <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">{stats.completed}</h3>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Resolution Speed (Avg)</p>
                        <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">12.5 hrs</h3>
                      </CardContent>
                    </Card>
                    <Card className="shadow-sm border-border">
                      <CardContent className="p-5 text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Total Revenue Share</p>
                        <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-2">₹{stats.earnings}</h3>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SVG Chart showing monthly case volume */}
                    <Card className="shadow-sm border-border">
                      <CardHeader className="py-4 border-b border-border">
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
                    <Card className="shadow-sm border-border">
                      <CardHeader className="py-4 border-b border-border">
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
                            <span>Bacterial Blight</span>
                            <span>22%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-emerald-600 h-2 rounded-full w-[22%]" />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between font-semibold mb-1">
                            <span>Early Blight (Tomato)</span>
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
              )}

              {/* KNOWLEDGE LIBRARY FOR SPECIALISTS */}
              {activeTab === "knowledge" && (
                <div className="space-y-6">
                  {/* Search library bar */}
                  <div className="relative">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                    <Input 
                      value={knowledgeSearch} 
                      onChange={(e) => setKnowledgeSearch(e.target.value)} 
                      placeholder="Search disease library, pests lists, organic formulation recipes..." 
                      className="pl-9 h-10 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {KNOWLEDGE_ITEMS.map((item, idx) => (
                      <Card key={idx} className="shadow-sm border-border text-left">
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase">{item.category}</Badge>
                          <CardTitle className="text-base font-bold text-emerald-800 mt-2">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <p><span className="font-semibold text-muted-foreground">Symptoms:</span> {item.symptoms}</p>
                          <p><span className="font-semibold text-muted-foreground">Causes:</span> {item.causes}</p>
                          <p><span className="font-semibold text-muted-foreground">Prevention:</span> {item.prevention}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {KNOWLEDGE_ITEMS.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center col-span-2 py-8">No library articles found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* PROFILE SETTINGS TAB */}
              {activeTab === "profile" && (
                <Card className="shadow-sm border-border max-w-2xl mx-auto">
                  <CardHeader className="py-4 border-b border-border/60">
                    <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-emerald-600" />
                      Manage Specialist Profile Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={saveProfile} className="space-y-4 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Full Name</label>
                          <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Mobile Number</label>
                          <Input value={profileMobile} onChange={(e) => setProfileMobile(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Working Region / State</label>
                          <Input value={profileRegion} onChange={(e) => setProfileRegion(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Specialist Professional Title</label>
                          <Input value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Qualifications (Comma separated)</label>
                          <Input value={profileQuals} onChange={(e) => setProfileQuals(e.target.value)} placeholder="Ph.D. Agronomy, M.Sc Pathology" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Languages Spoken (Comma separated)</label>
                          <Input value={profileLanguages} onChange={(e) => setProfileLanguages(e.target.value)} placeholder="English, Hindi, Telugu" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Specialist Biography</label>
                        <textarea 
                          value={profileBio} 
                          onChange={(e) => setProfileBio(e.target.value)} 
                          rows={3} 
                          className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Availability Toggles Status</label>
                        <Select 
                          value={profileAvail} 
                          onValueChange={(val: any) => setProfileAvail(val)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AVAILABLE">Available & Accepting</SelectItem>
                            <SelectItem value="UNAVAILABLE">Busy / Offline</SelectItem>
                            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">
                          Save Profile Details
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* SECURITY & ACCOUNT PREFERENCES */}
              {activeTab === "settings" && (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Change Password */}
                  <Card className="shadow-sm border-border">
                    <CardHeader className="py-4 border-b border-border/60">
                      <CardTitle className="text-sm font-bold text-emerald-800">Change Account Password</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={changePasswordHandler} className="space-y-4 text-left">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Current Password</label>
                          <Input 
                            type="password" 
                            value={settingsOldPass} 
                            onChange={(e) => setSettingsOldPass(e.target.value)} 
                            required 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">New Password</label>
                          <Input 
                            type="password" 
                            value={settingsNewPass} 
                            onChange={(e) => setSettingsNewPass(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5">
                            Update Password
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* REJECTION MODAL POPUP (Reason required) */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Assigned Consultation</DialogTitle>
            <DialogDescription>
              Please enter a reason for rejecting this consultation. This case will be released back to the admin for reassignment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              rows={3} 
              className="w-full text-sm rounded-lg border border-border p-2 bg-card outline-none focus:ring-1 focus:ring-emerald-500" 
              placeholder="e.g. Fungal crop disease is outside my core entomology expertise." 
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRejectOpen(false)} variant="outline" className="border-border">
              Cancel
            </Button>
            <Button onClick={submitReject} className="bg-red-600 hover:bg-red-700 text-white font-bold">
              Reject Consultation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMAGE LIGHTBOX MODAL */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl p-1 bg-black overflow-hidden flex items-center justify-center h-[520px]">
          {lightboxImage && (
            <img src={lightboxImage} className="max-h-full max-w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
