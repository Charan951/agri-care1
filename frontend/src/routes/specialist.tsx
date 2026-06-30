import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Clipboard, Activity, Layers, BookOpen,
  Settings, LogOut, Sprout, Bell, Star, Menu, X, User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// Tab imports
import { OverviewTab } from "@/components/specialist/OverviewTab";
import { ConsultationsTab } from "@/components/specialist/ConsultationsTab";
import { ConsultationWorkspace } from "@/components/specialist/ConsultationWorkspace";
import { HistoryTab } from "@/components/specialist/HistoryTab";
import { AnalyticsTab } from "@/components/specialist/AnalyticsTab";
import { KnowledgeTab } from "@/components/specialist/KnowledgeTab";
import { ProfileTab } from "@/components/specialist/ProfileTab";
import { SettingsTab } from "@/components/specialist/SettingsTab";

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
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({ overview: true });

  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev[activeTab]) return prev;
      return { ...prev, [activeTab]: true };
    });
  }, [activeTab]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);
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

  // Active consultation workspace states
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [farmerHistory, setFarmerHistory] = useState<any[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<any[]>([]);

  // Rejection Modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Chat message & voice note state
  const [chatMessage, setChatMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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

  // Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleChatUpdated = (data: any) => {
      if (selectedConsultationId === data.consultationId) {
        setActiveConsultation((prev: any) => {
          if (!prev) return null;
          return { ...prev, chatHistory: data.chatHistory };
        });
      }
      loadConsultations();
    };

    const handleConsultationRequest = () => {
      loadConsultations();
      loadDashboardData();
    };

    const handleConsultationUpdated = (data: any) => {
      if (selectedConsultationId === data.consultationId) {
        selectConsultation(data.consultationId);
      }
      loadConsultations();
    };

    socket.on("consultation_chat_updated", handleChatUpdated);
    socket.on("new_consultation_request", handleConsultationRequest);
    socket.on("consultation_accepted", handleConsultationRequest);
    socket.on("consultation_updated", handleConsultationUpdated);

    return () => {
      socket.off("consultation_chat_updated", handleChatUpdated);
      socket.off("new_consultation_request", handleConsultationRequest);
      socket.off("consultation_accepted", handleConsultationRequest);
      socket.off("consultation_updated", handleConsultationUpdated);
    };
  }, [socket, selectedConsultationId]);

  // Load Selected Consultation Workspace
  const selectConsultation = async (id: string) => {
    try {
      setSelectedConsultationId(id);
      const res = await apiFetch(`/api/specialist/consultations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConsultation(data.consultation);
        setFarmerHistory(data.farmerHistory);
        setFarmerOrders(data.farmerOrders);
      }
    } catch (err) {
      console.error("Error loading selected case workspace", err);
    }
  };

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

  // Audio recording simulation
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

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 text-foreground font-sans">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden lg:flex h-full border-r border-border bg-card flex-col justify-between flex-shrink-0 transition-all duration-300 ${
        isDesktopSidebarOpen
          ? "w-64 p-4 opacity-100"
          : "w-0 p-0 border-r-0 overflow-hidden opacity-0 pointer-events-none"
      }`}>
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-3 py-1 border-b border-border pb-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white">
                <Sprout className="h-5 w-5" />
              </span>
              <div className="text-left">
                <span className="font-bold text-sm block leading-none text-foreground font-sans">Specialist Workspace</span>
                <span className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase mt-1 block">AgriCare Pro</span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab("overview"); setSelectedConsultationId(null); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 ${
                  activeTab === "overview" && !selectedConsultationId
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Overview
              </button>
              <button
                onClick={() => { setActiveTab("consultations"); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 ${
                  activeTab === "consultations" || selectedConsultationId
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                }`}
              >
                <Clipboard className="h-4 w-4" />
                Assigned Cases ({stats.active + stats.pending})
              </button>
              <button
                onClick={() => { setActiveTab("history"); setSelectedConsultationId(null); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 ${
                  activeTab === "history"
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                }`}
              >
                <Activity className="h-4 w-4" />
                Consultation History
              </button>
              <button
                onClick={() => { setActiveTab("analytics"); setSelectedConsultationId(null); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 ${
                  activeTab === "analytics"
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                }`}
              >
                <Layers className="h-4 w-4" />
                Performance Analytics
              </button>
              <button
                onClick={() => { setActiveTab("knowledge"); setSelectedConsultationId(null); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 ${
                  activeTab === "knowledge"
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 pl-2"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Agronomy Library
              </button>
            </nav>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div 
              onClick={() => { setActiveTab("profile"); setSelectedConsultationId(null); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
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
              onClick={() => { setActiveTab("settings"); if (window.innerWidth < 1024) setIsDesktopSidebarOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 cursor-pointer ${
                activeTab === "settings" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted bg-transparent"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY DRAWER */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-64 bg-card h-full p-4 flex flex-col justify-between border-r border-border animate-in slide-in-from-left duration-250 shadow-lift">
            <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center pb-4 border-b border-border mb-4 text-left">
                <span className="font-extrabold text-sm text-emerald-600 uppercase tracking-wider">AgriCare Menu</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-muted rounded-full border-0 bg-transparent cursor-pointer">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <nav className="space-y-1">
                {[
                  { id: "overview" as TabType, label: "Dashboard Overview", icon: LayoutDashboard },
                  { id: "consultations" as TabType, label: `Assigned Cases (${stats.active + stats.pending})`, icon: Clipboard },
                  { id: "history" as TabType, label: "Consultation History", icon: Activity },
                  { id: "analytics" as TabType, label: "Performance Analytics", icon: Layers },
                  { id: "knowledge" as TabType, label: "Agronomy Library", icon: BookOpen },
                  { id: "profile" as TabType, label: "Profile Settings", icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id && !selectedConsultationId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSelectedConsultationId(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-all border-0 ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-soft"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <button
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors border-0 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col overflow-hidden h-full lg:pb-0 ${!selectedConsultationId ? "pb-16" : ""}`}>
        {/* HEADER BAR */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0 text-left relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted"
              title="Toggle Sidebar"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div />
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold gap-1.5 py-1 px-3">
              <span className={`h-2 w-2 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
              {user.availabilityStatus === "AVAILABLE" ? "Online & Available" : "On Leave"}
            </Badge>
            <div className="relative">
              <button className="relative p-2 rounded-full hover:bg-muted text-muted-foreground border-0 bg-transparent cursor-pointer">
                <Bell className="h-5 w-5 text-foreground" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-6 no-scrollbar text-left">
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {selectedConsultationId ? "Consultation Workspace" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedConsultationId 
                ? `Currently processing case ID: ${selectedConsultationId}` 
                : "Welcome to your AgriCare specialist dashboard"
              }
            </p>
          </div>
          {/* CONSULTATION ACTIVE WORKSPACE OVERRIDE */}
          {selectedConsultationId && activeConsultation ? (
            <ConsultationWorkspace
              activeConsultation={activeConsultation}
              farmerHistory={farmerHistory}
              farmerOrders={farmerOrders}
              user={user}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              sendText={sendText}
              triggerMediaRequest={triggerMediaRequest}
              handleAccept={handleAccept}
              handleRejectClick={handleRejectClick}
              selectConsultation={selectConsultation}
              setSelectedConsultationId={setSelectedConsultationId}
              setActiveConsultation={setActiveConsultation}
              loadDashboardData={loadDashboardData}
              loadConsultations={loadConsultations}
            />
          ) : (
            <>
              <div className={activeTab === "overview" ? "" : "hidden"}>
                <OverviewTab
                  stats={stats}
                  recentActivities={recentActivities}
                  assignedConsultations={assignedConsultations}
                  handleAccept={handleAccept}
                  handleRejectClick={handleRejectClick}
                  selectConsultation={selectConsultation}
                  setActiveTab={setActiveTab}
                />
              </div>

              {visitedTabs.consultations && (
                <div className={activeTab === "consultations" ? "" : "hidden"}>
                  <ConsultationsTab
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    priorityFilter={priorityFilter}
                    setPriorityFilter={setPriorityFilter}
                    districtFilter={districtFilter}
                    setDistrictFilter={setDistrictFilter}
                    assignedConsultations={assignedConsultations}
                    handleAccept={handleAccept}
                    handleRejectClick={handleRejectClick}
                    selectConsultation={selectConsultation}
                  />
                </div>
              )}

              {visitedTabs.history && (
                <div className={activeTab === "history" ? "" : "hidden"}>
                  <HistoryTab
                    assignedConsultations={assignedConsultations}
                    selectConsultation={selectConsultation}
                  />
                </div>
              )}

              {visitedTabs.analytics && (
                <div className={activeTab === "analytics" ? "" : "hidden"}>
                  <AnalyticsTab
                    stats={stats}
                  />
                </div>
              )}

              {visitedTabs.knowledge && (
                <div className={activeTab === "knowledge" ? "" : "hidden"}>
                  <KnowledgeTab />
                </div>
              )}

              {visitedTabs.profile && (
                <div className={activeTab === "profile" ? "" : "hidden"}>
                  <ProfileTab
                    user={user}
                  />
                </div>
              )}

              {visitedTabs.settings && (
                <div className={activeTab === "settings" ? "" : "hidden"}>
                  <SettingsTab />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* REJECTION MODAL POPUP */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader className="text-left">
            <DialogTitle>Reject Assigned Consultation</DialogTitle>
            <DialogDescription>
              Please enter a reason for rejecting this consultation. This case will be released back to the admin for reassignment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-left">
            <textarea 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              rows={3} 
              className="w-full text-sm rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
              placeholder="e.g. Fungal crop disease is outside my core entomology expertise." 
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button onClick={() => setIsRejectOpen(false)} variant="outline" className="border-border text-foreground">
              Cancel
            </Button>
            <Button onClick={submitReject} className="bg-red-600 hover:bg-red-700 text-white font-bold border-0 cursor-pointer">
              Reject Consultation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!selectedConsultationId && (
        <nav className="fixed bottom-0 inset-x-0 h-16 bg-card border-t border-border flex items-center justify-around z-40 lg:hidden shadow-lift shrink-0">
          {[
            { id: "overview" as TabType, label: "Home", icon: LayoutDashboard },
            { id: "consultations" as TabType, label: "Cases", icon: Clipboard },
            { id: "history" as TabType, label: "History", icon: Activity },
            { id: "profile" as TabType, label: "Profile", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id && !selectedConsultationId;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedConsultationId(null);
                }}
                className={`flex flex-col items-center gap-1 p-2 transition-colors cursor-pointer border-0 bg-transparent ${
                  isActive ? "text-emerald-600 font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-bold tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
