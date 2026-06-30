import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Mic,
  Camera,
  Send,
  FileText,
  CheckCircle2,
  Activity,
  ChevronRight,
  RefreshCw,
  Star,
  Printer,
  ArrowRight,
  Calendar,
  Clock,
  User as UserIcon,
  Tag,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { translations } from "./translations";
import { compressImage } from "@/lib/utils";

interface ConsultationsTabProps {
  language: "en" | "te";
  selectedConsultation?: any;
  setSelectedConsultation?: (consultation: any) => void;
  setDashboardActiveTab?: (tab: any) => void;
  onCartOrWishlistUpdate?: () => void;
  autoOpenBookingReportId?: string;
  setAutoOpenBookingReportId?: (id: string) => void;
}

export function ConsultationsTab({ 
  language, 
  selectedConsultation: propSelectedConsultation, 
  setSelectedConsultation: propSetSelectedConsultation,
  setDashboardActiveTab,
  onCartOrWishlistUpdate,
  autoOpenBookingReportId,
  setAutoOpenBookingReportId
}: ConsultationsTabProps) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [consultations, setConsultations] = useState<any[]>([]);
  const [localSelectedConsultation, setLocalSelectedConsultation] = useState<any>(null);
  const selectedConsultation = propSelectedConsultation !== undefined ? propSelectedConsultation : localSelectedConsultation;
  const setSelectedConsultation = propSetSelectedConsultation !== undefined ? propSetSelectedConsultation : setLocalSelectedConsultation;
  const [loading, setLoading] = useState(true);

  // Tab state in detail view
  const [activeTab, setActiveTab] = useState<"profile" | "questionnaire" | "gallery" | "diagnosis">("profile");

  // Floating Chat states
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  // Chat input states
  const [consultMessage, setConsultMessage] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isSpecialistTyping, setIsSpecialyping] = useState(false);

  // Rating & review states
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingTargetConsultation, setRatingTargetConsultation] = useState<any>(null);
  const [specialistRating, setSpecialistRating] = useState(5);
  const [writtenReview, setWrittenReview] = useState("");

  // Consultation booking states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const consultChatEndRef = useRef<HTMLDivElement>(null);

  const fetchConsultations = async () => {
    try {
      const res = await apiFetch("/api/customer/consultations");
      if (res.ok) {
        const data = await res.json();
        setConsultations(data.consultations || []);
      }
    } catch (err) {
      console.error("Error fetching consultations", err);
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryAndShowBooking = async () => {
    try {
      const res = await apiFetch("/api/customer/disease-detection/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryReports(data.reports || []);
        setShowBookingModal(true);
      } else {
        toast.error("Failed to load crop scan history.");
      }
    } catch (err) {
      toast.error("Failed to load crop scan history.");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRequestConsultation = async (reportId: string) => {
    if (!reportId) {
      toast.warning("Please select a crop diagnosis report.");
      return;
    }
    try {
      setIsPaymentProcessing(true);
      const res = await apiFetch("/api/customer/consultations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to initiate consultation payment.");
        setIsPaymentProcessing(false);
        return;
      }

      const orderData = await res.json();
      await loadRazorpayScript();

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "AgriCare Specialist Consultation",
        description: "Expert Agronomist Consultation Fee",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiFetch("/api/customer/consultations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                reportId
              })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              toast.success("Consultation fee paid successfully! Ticket created.");
              setShowBookingModal(false);
              setSelectedReportId("");
              
              // Reload consultations list
              const updatedRes = await apiFetch("/api/customer/consultations");
              if (updatedRes.ok) {
                const updatedData = await updatedRes.json();
                const list = updatedData.consultations || [];
                setConsultations(list);
                const newConsult = list.find((c: any) => c.reportId?._id === reportId || c.reportId === reportId);
                if (newConsult) {
                  setSelectedConsultation(newConsult);
                } else if (list.length > 0) {
                  setSelectedConsultation(list[0]);
                }
              }
            } else {
              toast.error("Payment verification failed on server.");
            }
          } catch (verifyErr) {
            toast.error("Error verifying consultation payment.");
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile
        },
        theme: {
          color: "#4CAF50"
        },
        modal: {
          ondismiss: function () {
            setIsPaymentProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Error booking consultation.");
      setIsPaymentProcessing(false);
    }
  };

  const unconsultedReports = historyReports.filter(
    (report) => !consultations.some(
      (c) => c.reportId?._id === report._id || c.reportId === report._id
    )
  );

  useEffect(() => {
    fetchConsultations();
  }, []);

  useEffect(() => {
    if (autoOpenBookingReportId) {
      const fetchHistoryAndSelect = async () => {
        try {
          const res = await apiFetch("/api/customer/disease-detection/history");
          if (res.ok) {
            const data = await res.json();
            const reports = data.reports || [];
            setHistoryReports(reports);
            setSelectedReportId(autoOpenBookingReportId);
            setShowBookingModal(true);
          }
        } catch (err) {
          console.error("Error fetching history for auto-booking:", err);
        } finally {
          if (setAutoOpenBookingReportId) {
            setAutoOpenBookingReportId("");
          }
        }
      };
      fetchHistoryAndSelect();
    }
  }, [autoOpenBookingReportId, setAutoOpenBookingReportId]);

  // Socket chat messaging listener
  useEffect(() => {
    if (!socket) return;

    const handleChatUpdate = (data: any) => {
      if (selectedConsultation && selectedConsultation._id === data.consultationId) {
        setSelectedConsultation((prev: any) => {
          if (!prev) return null;
          return { ...prev, chatHistory: data.chatHistory };
        });
        setTimeout(() => consultChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
      
      // Reload consultations list
      apiFetch("/api/customer/consultations")
        .then(res => res.json())
        .then(resData => setConsultations(resData.consultations || []));
    };

    const handleConsultationUpdate = (data: any) => {
      // Reload consultations list
      apiFetch("/api/customer/consultations")
        .then(res => res.json())
        .then(resData => {
          const list = resData.consultations || [];
          setConsultations(list);
          if (selectedConsultation && selectedConsultation._id === data.consultationId) {
            const found = list.find((c: any) => c._id === data.consultationId);
            if (found) {
              setSelectedConsultation(found);
            } else {
              setSelectedConsultation((prev: any) => {
                if (!prev) return null;
                return { ...prev, status: data.status };
              });
            }
          }
        });
    };

    socket.on("consultation_chat_updated", handleChatUpdate);
    socket.on("consultation_updated", handleConsultationUpdate);

    return () => {
      socket.off("consultation_chat_updated", handleChatUpdate);
      socket.off("consultation_updated", handleConsultationUpdate);
    };
  }, [socket, selectedConsultation]);

  // Auto-scroll chat
  useEffect(() => {
    consultChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConsultation?.chatHistory, isSpecialistTyping]);

  const handleSendConsultMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultMessage.trim() || !selectedConsultation) return;

    const currentMsg = consultMessage;
    try {
      const res = await apiFetch(`/api/customer/consultations/${selectedConsultation._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConsultation((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
        setConsultMessage("");

        // Trigger agronomist simulated typing and response
        setIsSpecialyping(true);
        setTimeout(async () => {
          setIsSpecialyping(false);
          let expertReply = "I am carefully examining your leaf photos and symptoms. Let me compile the best organic and chemical treatment instructions for you.";
          
          if (currentMsg.toLowerCase().includes("organic") || currentMsg.toLowerCase().includes("సేంద్రీయ")) {
            expertReply = "For organic care, prepare a spray using Neem Oil (10ml) mixed with water. Apply thoroughly once every 5-7 days.";
          } else if (currentMsg.toLowerCase().includes("contagious") || currentMsg.toLowerCase().includes("వ్యాపిస్తుందా")) {
            expertReply = "Yes, leaf diseases spread easily. Remove and destroy heavily affected leaves immediately to protect adjacent stalks.";
          } else if (currentMsg.toLowerCase().includes("rain") || currentMsg.toLowerCase().includes("వర్షం")) {
            expertReply = "Avoid spraying during rainfall as it washes off the fungicides. Pick a dry, sunny morning instead.";
          } else if (currentMsg.toLowerCase().includes("recover") || currentMsg.toLowerCase().includes("కోలుకోవడానికి")) {
            expertReply = "If you apply the recommended treatment schedules, you should see new healthy green sprouts in 10-14 days.";
          }

          const replyRes = await apiFetch(`/api/customer/consultations/${selectedConsultation._id}/message/mock-specialist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: expertReply })
          });
          if (replyRes.ok) {
            const replyData = await replyRes.json();
            setSelectedConsultation((prev: any) => ({ ...prev, chatHistory: replyData.chatHistory }));
          }
        }, 2000);
      }
    } catch (err) {
      toast.error("Failed to send chat message");
    }
  };

  const triggerVoiceMessage = () => {
    setIsVoiceRecording(true);
    toast.info("Recording voice message...");
    setTimeout(() => {
      setIsVoiceRecording(false);
      setConsultMessage(language === "en" ? "🔊 Voice Query (0:12) — [Simulated Recording]" : "🔊 వాయిస్ ప్రశ్న (0:12) — [రికార్డింగ్ సిమ్యులేషన్]");
      toast.success("Voice message recorded successfully!");
    }, 3000);
  };

  const submitDetailedRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingTargetConsultation) return;

    try {
      const res = await apiFetch(`/api/customer/consultations/${ratingTargetConsultation._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: specialistRating })
      });

      if (res.ok) {
        const data = await res.json();
        setConsultations(prev => prev.map(c => c._id === ratingTargetConsultation._id ? data.consultation : c));
        setSelectedConsultation(data.consultation);
        setIsRatingModalOpen(false);
        setWrittenReview("");
        toast.success(language === "en" ? "Review submitted successfully! Consultation resolved." : "సమీక్ష సమర్పించబడింది! సంప్రదింపు విజయవంతంగా పరిష్కరించబడింది.");
      } else {
        toast.error("Failed to close consultation ticket.");
      }
    } catch (err) {
      toast.error("Error submitting feedback reviews.");
    }
  };

  const getSpecialistName = (name?: string) => {
    if (!name) return "Agronomist Expert";
    if (name.startsWith("Dr.")) return name;
    return `Dr. ${name}`;
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

  const handleBuyNow = async (product: any) => {
    if (product._id) {
      try {
        const res = await apiFetch("/api/customer/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product._id, quantity: 1 })
        });
        if (res.ok) {
          toast.success(`${product.name} has been added to your shopping cart!`);
          onCartOrWishlistUpdate?.();
        } else {
          toast.error("Failed to add product to cart.");
        }
      } catch (err) {
        toast.error("Failed to add product to cart.");
      }
    } else {
      toast.success(`${product.name} has been added to your shopping cart!`);
    }

    if (setDashboardActiveTab) {
      setDashboardActiveTab("cart");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) return null;
  const userAny = user as any;

  // Extract shared images from chat history messages containing camera emoji 📷, "Attached", or base64 images
  const chatSharedImages = selectedConsultation
    ? (selectedConsultation.chatHistory || [])
        .filter((msg: any) => msg.message?.startsWith("data:image/") || msg.message?.includes("📷") || msg.message?.includes("Attached"))
        .map((msg: any, idx: number) => {
          if (msg.message?.startsWith("data:image/")) {
            return {
              url: msg.message,
              timestamp: msg.timestamp,
              sender: msg.senderId?.role || 'CUSTOMER'
            };
          }
          const mockImages = [
            "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=300",
            "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300"
          ];
          return {
            url: mockImages[idx % mockImages.length],
            timestamp: msg.timestamp,
            sender: msg.senderId?.role || 'CUSTOMER'
          };
        })
    : [];

  return (
    <div className="relative w-full">
      {/* Main Content (either List view or Details view) */}
      {!selectedConsultation ? (
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-extrabold text-lg text-foreground tracking-tight m-0">Expert Conversations</h3>
            <button
              onClick={fetchHistoryAndShowBooking}
              className="bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-bold px-4 py-2.5 rounded-xl border-0 cursor-pointer shadow-soft"
            >
              + New Consultation
            </button>
          </div>

          {consultations.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-soft max-w-xl mx-auto space-y-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto animate-bounce" />
              <p className="text-xs text-muted-foreground">{translations[language].historyTitle.split(" ")[0]} No active consultations.</p>
              <div className="border border-border p-4 rounded-2xl bg-brand/5 space-y-2 text-left">
                <h4 className="font-bold text-xs text-brand uppercase">Agronomist Package (₹499)</h4>
                <ul className="text-xs text-muted-foreground space-y-1.5 pl-0">
                  <li className="list-none">• Direct chat with certified expert</li>
                  <li className="list-none">• Custom spray schedule layout</li>
                  <li className="list-none">• Certified treatment PDF download</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {consultations.map((c: any, i: number) => {
                const name = getSpecialistName(c.specialistId?.name);
                const isCompleted = c.status === 'COMPLETED';
                
                let cardClasses = "p-5 border rounded-2xl cursor-pointer text-left transition-all relative flex flex-col justify-between h-44 bg-card hover:shadow-card hover:-translate-y-0.5 duration-200 ";
                if (!isCompleted) {
                  cardClasses += "bg-brand/[0.01] border-brand/20 hover:bg-brand/[0.03]";
                } else {
                  cardClasses += "border-border hover:bg-muted/10";
                }

                let badgeClasses = "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ";
                if (c.status === 'COMPLETED') {
                  badgeClasses += "bg-emerald-50 text-emerald-700 border-emerald-200/50";
                } else {
                  badgeClasses += "bg-brand-soft text-brand border-brand/20";
                }

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedConsultation(c)}
                    className={cardClasses}
                  >
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between items-start gap-2 w-full">
                        <h4 className="font-bold text-sm text-foreground truncate max-w-[70%]">
                          {name}
                        </h4>
                        <span className={badgeClasses}>{c.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">Speciality: {c.specialistId?.specialization || "Crop Protection"}</p>
                      <p className="text-[11px] font-bold text-brand mt-1 truncate">Crop: {c.reportId?.cropName || "Tomato"}</p>
                    </div>
                    <div className="border-t border-border/60 pt-3 flex justify-between items-center text-[10px] text-muted-foreground w-full">
                      <span>Booked: {c.createdAt && !isNaN(Date.parse(c.createdAt)) ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                      <span className="text-brand font-bold hover:underline flex items-center gap-0.5">
                        Open Conversation &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 text-left relative">
          
          {/* Back button */}
          <button
            onClick={() => {
              setSelectedConsultation(null);
              setShowFloatingChat(false);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer p-0"
          >
            &larr; Back to Conversations
          </button>

          {/* Workflow Progress Status Card (Top Horizontal Bar) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-3.5 overflow-x-auto no-scrollbar">
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider m-0 font-bold">
              Consultation Status Actions
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold min-w-max">
              {(() => {
                const activeWorkflowIdx = 
                  selectedConsultation.status === 'COMPLETED'
                    ? 4
                    : selectedConsultation.prescription
                      ? 3
                      : selectedConsultation.chatHistory?.length > 0
                        ? 2
                        : selectedConsultation.specialistId
                          ? 1
                          : 0;

                const workflowSteps = [
                  { label: "Payment & Ticket Created", active: true },
                  { label: "Specialist Assigned", active: activeWorkflowIdx >= 1 },
                  { label: "Chat Active", active: activeWorkflowIdx >= 2 },
                  { label: "Prescription Generated", active: activeWorkflowIdx >= 3 },
                  { label: "Completed", active: activeWorkflowIdx >= 4 }
                ];

                return workflowSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg border transition-all ${
                      step.active
                        ? "bg-brand/10 border-brand/30 text-brand shadow-soft"
                        : "bg-muted/30 border-border text-muted-foreground/60"
                    }`}>
                      {step.label}
                    </span>
                    {idx < workflowSteps.length - 1 && (
                      <span className="text-muted-foreground/40 font-bold">&rarr;</span>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Details layout split: Left Case Sheet + Right Advisor Info/Followup */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column (col-span-2, Main Diagnosis Sheet Card containing tabbed navigation) */}
            <div className="lg:col-span-2 space-y-6">
              
              {selectedConsultation.reportId && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">
                  
                  {/* Title Header */}
                  <div className="flex justify-between items-center border-b border-border pb-3.5">
                    <div>
                      <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Case File</span>
                      <h2 className="text-lg font-extrabold text-foreground tracking-tight m-0 mt-0.5">
                        {(selectedConsultation.reportId.cropName || "CROP").toUpperCase()} DIAGNOSIS SHEET
                      </h2>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                      selectedConsultation.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        : 'bg-brand-soft text-brand border-brand/20'
                    }`}>
                      {selectedConsultation.status}
                    </span>
                  </div>

                  {/* RESPONSIVE TABS HEADER */}
                  <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-1.5 pb-2.5">
                    {[
                      { id: "profile", label: "1. Farmer Profile" },
                      { id: "questionnaire", label: "2. Crop Questionnaire" },
                      { id: "gallery", label: "3. Leaf Image Gallery" },
                      { id: "diagnosis", label: "4. Diagnosis & Prescriptions" }
                    ].map((tabItem) => (
                      <button
                        key={tabItem.id}
                        onClick={() => setActiveTab(tabItem.id as any)}
                        className={`px-3 py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all border-0 flex-shrink-0 ${
                          activeTab === tabItem.id
                            ? "bg-brand text-brand-foreground shadow-soft"
                            : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {tabItem.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB CONTENTS */}
                  <div className="space-y-4">
                    
                    {/* Tab 1: Farmer Profile */}
                    {activeTab === "profile" && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                          <UserIcon className="h-4.5 w-4.5 text-brand" />
                          <span className="font-extrabold text-xs text-foreground">Farmer Profile Information</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farmer Name</p>
                            <p className="font-bold text-foreground mt-0.5">{userAny.name}</p>
                          </div>
                          <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</p>
                            <p className="font-bold text-foreground mt-0.5">{userAny.mobile || "9515694155"}</p>
                          </div>
                          <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">District / State</p>
                            <p className="font-bold text-foreground mt-0.5">{userAny.district || "Pune, Maharashtra"}</p>
                          </div>
                          <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Village</p>
                            <p className="font-bold text-foreground mt-0.5">{userAny.village || "Wadgaon"}</p>
                          </div>
                          <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farm Size</p>
                            <p className="font-bold text-foreground mt-0.5">{userAny.farmSize || "12 Acres"}</p>
                          </div>
                          <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Soil Texture</p>
                            <p className="font-bold text-foreground mt-0.5">{userAny.soilTexture || "Clay Black"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Crop Information & Symptoms Questionnaire */}
                    {activeTab === "questionnaire" && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                          <CheckCircle2 className="h-4.5 w-4.5 text-brand" />
                          <span className="font-extrabold text-xs text-foreground">Crop Information & Symptoms Questionnaire</span>
                        </div>
                        {(() => {
                          const responses = parseFarmerResponses(selectedConsultation.reportId.symptoms);
                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                                <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Crop Name</span>
                                  <span className="font-bold text-foreground mt-0.5 block">{selectedConsultation.reportId.cropName}</span>
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

                              <div className="p-3.5 bg-brand/[0.02] border border-brand/10 rounded-xl text-xs space-y-1.5 text-left">
                                <span className="text-[9px] font-extrabold text-brand uppercase tracking-wider">Farmer Stated Symptoms</span>
                                <p className="text-muted-foreground leading-relaxed m-0">{selectedConsultation.reportId.symptoms.split("Farmer Responses:")[0]?.trim() || "Yellowing leaves & spots."}</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab 3: Leaf Image Gallery & AI Report */}
                    {activeTab === "gallery" && (
                      <div className="space-y-6 animate-fadeIn">
                        
                        {/* Section A: Customer Uploaded Leaf Gallery (Initial Scans) */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border/40 pb-1">
                            <span className="font-extrabold text-xs text-foreground">Initial Inspection Leaf Scans (5 Photos)</span>
                            <button 
                              onClick={() => toast.info("Downloading all case images...")}
                              className="text-[10px] font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer p-0"
                            >
                              Download Case Images
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="col-span-2 sm:col-span-2 relative rounded-xl overflow-hidden border border-border/80 aspect-video bg-muted shadow-soft">
                              <img 
                                src={selectedConsultation.reportId.imageUrl} 
                                alt="Primary Scan" 
                                className="w-full h-full object-cover" 
                              />
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[8px] font-bold text-white rounded uppercase tracking-wider">
                                Primary Leaf Scan
                              </span>
                            </div>
                            
                            {/* Detail Inspection zooms */}
                            {[
                              "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300",
                              "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=300",
                              selectedConsultation.reportId.imageUrl,
                              "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=300"
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

                        {/* Section B: Shared During Conversation (Chat Shared Images) */}
                        <div className="space-y-3 pt-4 border-t border-border/60">
                          <div className="flex justify-between items-center pb-1">
                            <span className="font-extrabold text-[11px] text-foreground">Photos Shared During Conversation</span>
                            <span className="text-[9px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                              {chatSharedImages.length} Photos
                            </span>
                          </div>
                          {chatSharedImages.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic m-0 bg-muted/5 p-3.5 border border-dashed rounded-xl text-center">
                              No photos shared during the chat conversation yet. Attach photos in the chat box to view them here in real-time.
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {chatSharedImages.map((img: any, sIdx: number) => (
                                <div 
                                  key={sIdx} 
                                  className="relative rounded-lg overflow-hidden border border-border/80 aspect-square bg-muted cursor-pointer hover:border-brand transition-colors"
                                >
                                  <img 
                                    src={img.url} 
                                    alt={`Shared Detail ${sIdx + 1}`} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <span className="absolute bottom-1 right-1 bg-black/60 text-[6.5px] font-bold text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* AI pathology card */}
                        {selectedConsultation.reportId.aiPrediction && (
                          <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-3 text-xs mt-3">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider font-bold">AI Pathology Assessment Report</span>
                              <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand font-black text-[10px]">
                                {Math.round(selectedConsultation.reportId.aiPrediction.confidence * 100)}% Confidence
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                              <div>
                                <p className="text-muted-foreground m-0">Predicted Disease Name</p>
                                <p className="font-extrabold text-foreground mt-0.5 text-xs">{selectedConsultation.reportId.aiPrediction.disease}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground m-0">AI Suggested Sprays</p>
                                <p className="font-bold text-brand mt-0.5">{selectedConsultation.reportId.aiPrediction.pesticides?.join(", ") || "Fungicide, Neem Spray"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Expert Disease Diagnosis & Analysis & Prescription */}
                    {activeTab === "diagnosis" && (
                      <div className="space-y-6 animate-fadeIn">
                        
                        {/* 4. Expert Disease Diagnosis & Analysis */}
                        {(() => {
                          const diagnosis = (selectedConsultation.diagnosisDetails && selectedConsultation.diagnosisDetails.disease)
                            ? selectedConsultation.diagnosisDetails
                            : {
                                disease: selectedConsultation.prescription?.advice?.split(":")[0] || "Tomato Early Blight",
                                severity: "HIGH",
                                symptoms: ["Yellowing leaves", "Concentric circular spots on lower leaves", "Brown leaf lesions"],
                                causes: ["Alternaria solani (fungus)", "High relative humidity", "Warm leaf wetness periods"],
                                preventiveMeasures: [
                                  "Foliar pruning of lower leaves to increase aeration",
                                  "Avoid sprinkler overhead watering (use drip irrigation)",
                                  "Maintain crop rotation with non-solanaceous crops"
                                ],
                                recoveryTimeline: "10-14 Days"
                              };

                          return (
                            <div className="space-y-4">
                              <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                                <Activity className="h-4.5 w-4.5 text-brand" />
                                <span className="font-extrabold text-xs text-foreground">Expert Diagnosis & severity analysis</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Confirmed Disease Name</p>
                                  <p className="font-extrabold text-brand mt-0.5 text-xs">{diagnosis.disease}</p>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Severity Level</p>
                                  <p className="font-bold text-red-600 mt-0.5">{diagnosis.severity}</p>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Expected Recovery Timeline</p>
                                  <p className="font-bold text-foreground mt-0.5">{diagnosis.recoveryTimeline}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl space-y-1">
                                  <span className="font-bold text-foreground block">Key Symptoms Observed</span>
                                  <ul className="pl-4 space-y-1 mt-1 text-muted-foreground">
                                    {diagnosis.symptoms?.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                                  </ul>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl space-y-1">
                                  <span className="font-bold text-foreground block">Pathogen / Causes</span>
                                  <ul className="pl-4 space-y-1 mt-1 text-muted-foreground">
                                    {diagnosis.causes?.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                                  </ul>
                                </div>
                                <div className="p-3.5 bg-muted/10 border border-border/40 rounded-xl md:col-span-2 space-y-1">
                                  <span className="font-bold text-foreground block">Preventive Care Guidelines</span>
                                  <ul className="pl-4 space-y-1 mt-1 text-muted-foreground">
                                    {diagnosis.preventiveMeasures?.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                         {(() => {
                          const treatment = (selectedConsultation.treatmentRecommendation && selectedConsultation.treatmentRecommendation.dosageInstructions)
                            ? selectedConsultation.treatmentRecommendation
                            : {
                                pesticides: ["Neem Oil (1500 ppm)"],
                                fungicides: [selectedConsultation.prescription?.medicines?.[0] || "Copper Oxychloride 50% WP"],
                                fertilizers: [selectedConsultation.prescription?.medicines?.[1] || "NPK 19:19:19"],
                                organicAlternatives: ["Trichoderma viride bio-fungicide", "Garlic-chili extract spray"],
                                bioFertilizers: ["Pseudomonas fluorescens (liquid)"],
                                dosageInstructions: "Mix 2.5g of Copper Oxychloride per liter of clean water. Spray thoroughly on both leaf surfaces.",
                                spraySchedule: "Foliar spray twice at a 7-day interval. Apply early morning or late evening.",
                                irrigationAdvice: "Avoid late-evening watering. Shift to morning drip schedule to allow leaves to dry quickly.",
                                soilImprovementAdvice: "Apply 5kg Trichoderma enriched vermicompost per plant basin.",
                                cropCareTips: "Prune lower infected leaves up to 1 foot height. Sanitize tools after pruning."
                              };

                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="h-4.5 w-4.5 text-brand" />
                                  <span className="font-extrabold text-xs text-foreground">Treatment & Crop Care Prescriptions</span>
                                </div>
                                <button
                                  onClick={() => {
                                    toast.success(language === "en" ? "Treatment PDF report downloaded successfully!" : "చికిత్స నిвеదిక PDF విజయవంతంగా డౌన్‌లోడ్ చేయబడింది!");
                                  }}
                                  className="text-[10px] text-brand font-bold hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                                >
                                  <Printer className="h-3.5 w-3.5" /> Download PDF
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Recommended Chemical Pesticides</span>
                                  <span className="font-bold text-foreground mt-0.5 block">{treatment.pesticides?.join(", ") || "N/A"}</span>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Recommended Fungicides</span>
                                  <span className="font-bold text-foreground mt-0.5 block">{treatment.fungicides?.join(", ") || "N/A"}</span>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Chemical Fertilizers</span>
                                  <span className="font-bold text-foreground mt-0.5 block">{treatment.fertilizers?.join(", ") || "N/A"}</span>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Organic Biocides / Alternatives</span>
                                  <span className="font-bold text-foreground mt-0.5 block">{treatment.organicAlternatives?.join(", ") || "N/A"}</span>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl sm:col-span-2">
                                  <span className="text-[9px] font-bold text-muted-foreground block uppercase">Bio-Fertilizers</span>
                                  <span className="font-bold text-foreground mt-0.5 block">{treatment.bioFertilizers?.join(", ") || "N/A"}</span>
                                </div>

                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl sm:col-span-2">
                                  <span className="font-bold text-foreground block font-bold">Dosage Instructions</span>
                                  <p className="text-muted-foreground mt-1 m-0">{treatment.dosageInstructions}</p>
                                </div>

                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl sm:col-span-2">
                                  <span className="font-bold text-foreground block font-bold">Spray Timeline Schedule</span>
                                  <p className="text-muted-foreground mt-1 m-0">{treatment.spraySchedule}</p>
                                </div>

                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="font-bold text-foreground block font-bold">Irrigation Advice</span>
                                  <p className="text-muted-foreground mt-1 m-0">{treatment.irrigationAdvice}</p>
                                </div>

                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl">
                                  <span className="font-bold text-foreground block font-bold">Soil Improvement Advice</span>
                                  <p className="text-muted-foreground mt-1 m-0">{treatment.soilImprovementAdvice}</p>
                                </div>

                                <div className="p-3 bg-muted/10 border border-border/40 rounded-xl sm:col-span-2">
                                  <span className="font-bold text-foreground block font-bold">General Crop Care Tips</span>
                                  <p className="text-muted-foreground mt-1 m-0">{treatment.cropCareTips}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 6. Recommended Prescription Products */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border/40 pb-1">
                            <div className="flex items-center gap-1.5">
                              <Tag className="h-4.5 w-4.5 text-brand" />
                              <span className="font-extrabold text-xs text-foreground">Recommended Prescription Products</span>
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground">Specialist Choice</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {selectedConsultation.recommendedProducts && selectedConsultation.recommendedProducts.length > 0 ? (
                              selectedConsultation.recommendedProducts.map((prod: any, idx: number) => (
                                <div key={prod._id || idx} className="border border-border rounded-2xl p-3 flex flex-col justify-between bg-muted/5 hover:border-brand/40 transition-all text-xs text-left">
                                  <div className="space-y-2">
                                    <div className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                                      <img src={prod.imageUrl || "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=200"} alt={prod.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-foreground m-0 truncate" title={prod.name}>{prod.name}</h5>
                                      <p className="text-[10px] text-muted-foreground m-0 mt-0.5">{prod.category || "Recommendation"}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2 border-t border-border flex justify-between items-center">
                                    <span className="font-extrabold text-foreground">₹{prod.price}</span>
                                    <button
                                      onClick={() => handleBuyNow(prod)}
                                      className="bg-brand text-brand-foreground font-bold text-[10px] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-brand/90"
                                    >
                                      Buy Now
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              [
                                { name: selectedConsultation.prescription?.medicines?.[0] || "Copper Oxychloride 50% WP", price: 380, desc: "Chemical Fungicide", img: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=200" },
                                { name: selectedConsultation.prescription?.medicines?.[1] || "NPK 19:19:19 Fertilizer", price: 240, desc: "Water Soluble NPK", img: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=200" },
                                { name: "Neem Oil Extract (Organic Care)", price: 185, desc: "Organic Spray Biocide", img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=200" }
                              ].map((prod, idx) => (
                                <div key={idx} className="border border-border rounded-2xl p-3 flex flex-col justify-between bg-muted/5 hover:border-brand/40 transition-all text-xs text-left">
                                  <div className="space-y-2">
                                    <div className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                                      <img src={prod.img} alt={prod.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-foreground m-0 truncate" title={prod.name}>{prod.name}</h5>
                                      <p className="text-[10px] text-muted-foreground m-0 mt-0.5">{prod.desc}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2 border-t border-border flex justify-between items-center">
                                    <span className="font-extrabold text-foreground">₹{prod.price}</span>
                                    <button
                                      onClick={() => handleBuyNow(prod)}
                                      className="bg-brand text-brand-foreground font-bold text-[10px] px-2.5 py-1 rounded-lg border-0 cursor-pointer hover:bg-brand/90"
                                    >
                                      Buy Now
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>

            {/* Right Column (col-span-1 on desktop, narrow Specialist Info + Follow-up details) */}
            <div className="space-y-6">
              
              {/* Specialist Details card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground m-0">
                      {getSpecialistName(selectedConsultation.specialistId?.name)}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedConsultation.specialistId?.specialization || "Crop Protection"}
                    </p>
                  </div>
                  {selectedConsultation.status !== 'COMPLETED' && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse shrink-0" title="Online" />
                  )}
                </div>
                
                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Rating</span>
                    <span className="font-bold text-foreground">★ {selectedConsultation.specialistId?.rating || 5.0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Mobile Contact</span>
                    <span className="font-bold text-foreground">{selectedConsultation.specialistId?.mobile || "+91 99999 99999"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Booking Date</span>
                    <span className="font-bold text-foreground">
                      {selectedConsultation.createdAt && !isNaN(Date.parse(selectedConsultation.createdAt)) 
                        ? new Date(selectedConsultation.createdAt).toLocaleString() 
                        : new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow-up & Checkups Card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2.5">
                  <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider m-0">
                    Follow-up & Checkups
                  </h4>
                  {(() => {
                    const status = selectedConsultation.followUp?.status;
                    if (status === "SCHEDULED") {
                      return (
                        <span className="px-2 py-0.5 bg-brand/10 text-brand text-[8px] font-bold uppercase rounded">
                          Active
                        </span>
                      );
                    } else if (status === "COMPLETED") {
                      return (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase rounded">
                          Completed
                        </span>
                      );
                    } else {
                      return (
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[8px] font-bold uppercase rounded">
                          Not Scheduled
                        </span>
                      );
                    }
                  })()}
                </div>
                
                {selectedConsultation.followUp && 
                (selectedConsultation.followUp.status === "SCHEDULED" || selectedConsultation.followUp.status === "COMPLETED") ? (
                  <div className="text-xs space-y-2.5 leading-relaxed text-left">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider m-0">Scheduled Follow-up Date</p>
                        <p className="font-extrabold text-foreground m-0 mt-0.5">
                          {selectedConsultation.followUp.scheduledDate
                            ? new Date(selectedConsultation.followUp.scheduledDate).toLocaleDateString([], { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider m-0">Reminder Note</p>
                        <p className="text-muted-foreground m-0 mt-0.5 italic">
                          {selectedConsultation.followUp.reminderNote || "No notes provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4 italic">
                    No follow-up checkup has been scheduled yet.
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* FLOATING CHAT BUBBLE TRIGGER */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowFloatingChat(!showFloatingChat)}
              className="h-14 w-14 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-lg hover:scale-105 duration-200 cursor-pointer border-0 relative"
              title="Open Specialist Chat"
            >
              {showFloatingChat ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
              {selectedConsultation.status !== 'COMPLETED' && (
                <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-success ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>

          {/* FLOATING CHAT BOX WIDGET POPUP OVERLAY */}
          {showFloatingChat && (
            <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[480px] bg-card border border-border rounded-2xl shadow-lift z-50 flex flex-col overflow-hidden transition-all duration-200 animate-slideUp">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/10 shrink-0">
                <div className="text-left flex items-center gap-2">
                  <div className="relative">
                    <MessageSquare className="h-4 w-4 text-brand" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[11px] text-foreground m-0">
                      {getSpecialistName(selectedConsultation.specialistId?.name)}
                    </h3>
                    <p className="text-[8px] text-muted-foreground m-0 mt-0.5">Replies instantly</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5">
                  {selectedConsultation.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setRatingTargetConsultation(selectedConsultation);
                        setIsRatingModalOpen(true);
                      }}
                      className="text-[9px] font-bold text-brand hover:underline cursor-pointer border-0 bg-transparent"
                    >
                      Resolve
                    </button>
                  )}
                  <button 
                    onClick={() => setShowFloatingChat(false)} 
                    className="p-1 hover:bg-muted rounded-full border-0 bg-transparent cursor-pointer"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Chat History Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
                <div className="text-center py-1">
                  <span className="bg-muted px-2.5 py-0.5 rounded-full text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">
                    SECURE SYSTEM CHAT
                  </span>
                </div>

                {selectedConsultation.chatHistory?.map((msg: any, i: number) => {
                  const isMe = msg.senderId?._id === user.id || msg.senderId === user.id || (msg.senderId?.role === 'CUSTOMER');
                  return (
                    <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-[11px] space-y-1 text-left shadow-soft ${
                        isMe ? "bg-brand text-brand-foreground font-semibold" : "bg-card border border-border text-foreground"
                      }`}>
                        {msg.message?.startsWith("data:image/") ? (
                          <img
                            src={msg.message}
                            alt="Shared leaf"
                            className="max-w-[160px] max-h-[160px] rounded-xl object-cover mt-0.5 border cursor-pointer hover:opacity-90"
                            onClick={() => {
                              const w = window.open();
                              if (w) w.document.write(`<img src="${msg.message}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                            }}
                          />
                        ) : (
                          <p className="leading-relaxed m-0">{msg.message}</p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1 shrink-0">
                          <p className={`text-[7px] m-0 ${isMe ? "text-brand-foreground/75" : "text-muted-foreground"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isMe && (
                            <span className="text-[8px] text-brand-foreground/80 font-bold">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isSpecialistTyping && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border px-3 py-2 rounded-2xl text-[10px] text-muted-foreground flex items-center gap-1 shadow-soft">
                      <span className="h-1 w-1 rounded-full bg-brand animate-bounce" />
                      <span className="h-1 w-1 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1 w-1 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[9px] font-semibold">Specialist typing...</span>
                    </div>
                  </div>
                )}
                <div ref={consultChatEndRef} />
              </div>

              {/* Quick Replies inside floating chat widget */}
              {selectedConsultation.status !== 'COMPLETED' && (
                <div className="flex gap-1.5 overflow-x-auto px-3 py-1.5 bg-muted/10 border-t border-border no-scrollbar shrink-0">
                  {[
                    translations[language].quickReply1,
                    translations[language].quickReply2,
                    translations[language].quickReply3,
                    translations[language].quickReply4
                  ].map((qr, idx) => (
                    <button
                      key={idx}
                      onClick={() => setConsultMessage(qr)}
                      className="px-2.5 py-0.5 rounded-full border border-border text-[8px] font-bold text-muted-foreground hover:border-brand hover:text-brand bg-card flex-shrink-0 cursor-pointer"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input Bar */}
              {selectedConsultation.status !== 'COMPLETED' ? (
                <form onSubmit={handleSendConsultMessage} className="p-2.5 border-t border-border flex gap-1.5 items-center bg-card shrink-0">
                  <button
                    type="button"
                    onClick={triggerVoiceMessage}
                    className={`p-2 rounded-lg border border-border cursor-pointer ${isVoiceRecording ? "bg-red-50 text-red-600 animate-pulse border-red-200" : "bg-card text-muted-foreground hover:text-brand"}`}
                    title="Record Voice Note"
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>
                  
                  <label className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-brand cursor-pointer">
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressedFile = await compressImage(file);
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64Url = reader.result as string;
                            try {
                              const res = await apiFetch(`/api/customer/consultations/${selectedConsultation._id}/message`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ message: base64Url })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setSelectedConsultation((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
                                toast.success("Image uploaded successfully.");
                              }
                            } catch (err) {
                              toast.error("Failed to upload image.");
                            }
                          };
                          reader.readAsDataURL(compressedFile);
                        } catch (err) {
                          console.error("Compression error:", err);
                          toast.error("Failed to process image.");
                        }
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    placeholder={translations[language].inputPlaceholder}
                    value={consultMessage}
                    onChange={(e) => setConsultMessage(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-brand"
                  />
                  
                  <button type="submit" className="p-2 bg-brand text-brand-foreground rounded-lg border-0 cursor-pointer hover:bg-brand/90 flex items-center justify-center">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-muted/20 border-t border-border text-center text-[10px] font-semibold text-muted-foreground shrink-0">
                  Consultation ticket closed.
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* RATING DIALOG MODAL */}
      {isRatingModalOpen && ratingTargetConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-lift text-left">
            <h3 className="font-bold text-sm text-foreground m-0">{translations[language].ratingTitle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Please rate your experience with {getSpecialistName(ratingTargetConsultation.specialistId?.name)} to complete the consultation ticket.</p>
            
            <form onSubmit={submitDetailedRating} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">{translations[language].rateSpecialist}</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setSpecialistRating(star)}
                      className="bg-transparent border-0 cursor-pointer p-0"
                    >
                      <Star className={`h-6.5 w-6.5 ${star <= specialistRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">{translations[language].writtenReview}</label>
                <textarea
                  value={writtenReview}
                  onChange={(e) => setWrittenReview(e.target.value)}
                  placeholder="Review comments..."
                  rows={2}
                  className="w-full text-xs rounded-lg border border-border p-2 bg-background outline-none text-foreground"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRatingModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-xs font-bold hover:bg-brand/90 border-0 cursor-pointer"
                >
                  {translations[language].submitFeedback.split(" ")[0]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DIALOG MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-lift text-left">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-sm text-foreground m-0">Book Agronomist Consultation</h3>
              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedReportId("");
                }}
                className="p-1 hover:bg-muted rounded-full border-0 bg-transparent cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect with a certified Agronomist expert for personalized organic and chemical treatment advice. The consultation fee is <span className="font-bold text-foreground">₹499</span>.
              </p>

              {unconsultedReports.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded-xl text-center space-y-3 bg-muted/10">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You have no diagnoses reports available for a new consultation. Please perform an AI Crop Diagnosis scan first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Select Crop Scan Report</label>
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border p-2 bg-background outline-none font-medium text-foreground"
                  >
                    <option value="">-- Choose a crop diagnosis report --</option>
                    {unconsultedReports.map((report) => (
                      <option key={report._id} value={report._id}>
                        {report.cropName} - {report.aiPrediction?.disease || "Healthy"} ({new Date(report.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedReportId("");
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                {unconsultedReports.length > 0 && (
                  <button
                    type="button"
                    disabled={isPaymentProcessing || !selectedReportId}
                    onClick={() => handleRequestConsultation(selectedReportId)}
                    className="px-4 py-2 rounded-lg bg-brand text-brand-foreground text-xs font-bold hover:bg-brand/90 border-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isPaymentProcessing ? "Processing..." : "Pay ₹499 & Book"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
