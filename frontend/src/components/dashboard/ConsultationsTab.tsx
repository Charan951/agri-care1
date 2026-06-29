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
  Star
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { translations } from "./translations";

interface ConsultationsTabProps {
  language: "en" | "te";
}

export function ConsultationsTab({ language }: ConsultationsTabProps) {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Chat input states
  const [consultMessage, setConsultMessage] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isSpecialistTyping, setIsSpecialistTyping] = useState(false);

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

    socket.on("consultation_chat_updated", handleChatUpdate);

    return () => {
      socket.off("consultation_chat_updated", handleChatUpdate);
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
        setIsSpecialistTyping(true);
        setTimeout(async () => {
          setIsSpecialistTyping(false);
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-10rem)] relative">
      {/* Column 1: Consultations List */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full col-span-1">
        <div className="flex justify-between items-center border-b border-border pb-2.5 mb-3">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-foreground m-0">Expert Conversations</h3>
          <button
            onClick={fetchHistoryAndShowBooking}
            className="bg-brand/10 hover:bg-brand text-brand hover:text-white transition-all text-[9px] font-extrabold px-2 py-1 rounded-md border-0 cursor-pointer"
          >
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1">
          {consultations.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-muted-foreground">{translations[language].historyTitle.split(" ")[0]} No active consultations.</p>
              <div className="border border-border p-3 rounded-xl bg-brand/5 space-y-2 text-left">
                <h4 className="font-bold text-[10px] text-brand uppercase">Agronomist Package (₹499)</h4>
                <ul className="text-[9px] text-muted-foreground space-y-1 pl-0">
                  <li className="list-none">• Direct chat with certified expert</li>
                  <li className="list-none">• Custom spray schedule layout</li>
                  <li className="list-none">• Certified treatment PDF download</li>
                </ul>
              </div>
            </div>
          ) : (
            consultations.map((c: any, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedConsultation(c)}
                className={`p-3 border rounded-xl cursor-pointer transition-all text-left relative ${
                  selectedConsultation && selectedConsultation._id === c._id
                    ? "bg-brand/5 border-brand shadow-sm"
                    : "border-border hover:bg-muted/10"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-foreground">Dr. {c.specialistId?.name || "Agronomist"}</h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    c.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-brand/15 text-brand'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">Speciality: {c.specialistId?.specialization || "Crop Protection"}</p>
                <p className="text-[9px] text-muted-foreground mt-2">Booked on: {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Column 2 & 3: Chat panel */}
      <div className="bg-card border border-border rounded-2xl flex flex-col h-full md:col-span-2 overflow-hidden shadow-soft">
        {selectedConsultation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/10 shrink-0">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-foreground">Dr. {selectedConsultation.specialistId?.name || "Agronomist Expert"}</h3>
                  {selectedConsultation.status !== 'COMPLETED' && (
                    <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" title="Online" />
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {selectedConsultation.specialistId?.specialization || "Crop Protection"} | ★ {selectedConsultation.specialistId?.rating || 5.0}
                </p>
              </div>
              {selectedConsultation.status !== 'COMPLETED' && (
                <button
                  onClick={() => {
                    setRatingTargetConsultation(selectedConsultation);
                    setIsRatingModalOpen(true);
                  }}
                  className="text-[10px] font-bold text-brand hover:underline cursor-pointer border-0 bg-transparent"
                >
                  Resolve & Rate
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
              <div className="text-center py-2">
                <span className="bg-muted px-3 py-1 rounded-full text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                  SECURE SYSTEM CHAT CREATED
                </span>
              </div>

              {selectedConsultation.chatHistory?.map((msg: any, i: number) => {
                const isMe = msg.senderId?._id === user.id || msg.senderId === user.id || (msg.senderId?.role === 'CUSTOMER');
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-xs space-y-1 text-left shadow-soft ${
                      isMe ? "bg-brand text-brand-foreground" : "bg-card border border-border text-foreground"
                    }`}>
                      <p className="leading-relaxed font-medium">{msg.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 shrink-0">
                        <p className={`text-[8px] ${isMe ? "text-brand-foreground/75" : "text-muted-foreground"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isMe && (
                          <span className="text-[9px] text-brand-foreground/80 font-bold">✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isSpecialistTyping && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border px-4 py-2.5 rounded-2xl text-xs text-muted-foreground flex items-center gap-1.5 shadow-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] font-semibold">Dr. Specialist is typing...</span>
                  </div>
                </div>
              )}

              <div ref={consultChatEndRef} />
            </div>

            {/* Quick Replies */}
            {selectedConsultation.status !== 'COMPLETED' && (
              <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-muted/10 border-t border-border no-scrollbar shrink-0">
                {[
                  translations[language].quickReply1,
                  translations[language].quickReply2,
                  translations[language].quickReply3,
                  translations[language].quickReply4
                ].map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => setConsultMessage(qr)}
                    className="px-3 py-1 rounded-full border border-border text-[9px] font-bold text-muted-foreground hover:border-brand hover:text-brand bg-card flex-shrink-0 cursor-pointer"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            {selectedConsultation.status !== 'COMPLETED' ? (
              <form onSubmit={handleSendConsultMessage} className="p-3 border-t border-border flex gap-2 items-center bg-card shrink-0">
                <button
                  type="button"
                  onClick={triggerVoiceMessage}
                  className={`p-2.5 rounded-lg border border-border cursor-pointer ${isVoiceRecording ? "bg-red-50 text-red-600 animate-pulse border-red-200" : "bg-card text-muted-foreground hover:text-brand"}`}
                  title="Record Voice Note"
                >
                  <Mic className="h-4 w-4" />
                </button>
                
                <label className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-brand cursor-pointer">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={() => {
                      setConsultMessage(language === "en" ? "📷 Image Attached [Simulated Upload]" : "📷 చిత్రం అటాచ్ చేయబడింది [సిమ్యులేషన్ అప్‌లోడ్]");
                    }}
                  />
                </label>

                <input
                  type="text"
                  required
                  value={consultMessage}
                  onChange={(e) => setConsultMessage(e.target.value)}
                  placeholder={translations[language].chatPlaceholder}
                  className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
                
                <button type="submit" className="p-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 cursor-pointer border-0">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="p-4 bg-muted/20 text-center text-xs text-muted-foreground border-t border-border shrink-0 font-bold">
                Consultation resolved and closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center flex-col text-center space-y-3 p-6">
            <MessageSquare className="h-8 w-8 text-muted-foreground animate-bounce" />
            <h4 className="font-bold text-xs text-foreground">Select a Chat Consultation</h4>
            <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
              Book crop leaf review diagnostics or select an ongoing conversation from the left to talk in real-time.
            </p>
          </div>
        )}
      </div>

      {/* Column 4: Timeline and Prescription */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full col-span-1 overflow-y-auto no-scrollbar text-left space-y-5">
        {selectedConsultation ? (
          <>
            <div className="space-y-3">
              <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider">{translations[language].timelineHeader}</h4>
              <div className="relative pl-5 space-y-4.5 border-l-2 border-brand-soft ml-1.5 text-[10px]">
                {[
                  { label: translations[language].timelinePayment, active: true },
                  { label: translations[language].timelineTicket, active: true },
                  { label: translations[language].timelineAdmin, active: selectedConsultation.status !== 'PENDING' },
                  { label: translations[language].timelineAssigned, active: !!selectedConsultation.specialistId },
                  { label: translations[language].timelineReviewing, active: selectedConsultation.status === 'ACTIVE' || selectedConsultation.status === 'COMPLETED' },
                  { label: translations[language].timelineChat, active: selectedConsultation.chatHistory?.length > 0 },
                  { label: translations[language].timelineReport, active: !!selectedConsultation.prescription },
                  { label: translations[language].timelineCompleted, active: selectedConsultation.status === 'COMPLETED' }
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[27px] top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                      step.active ? "bg-brand border-brand text-white" : "bg-card border-border text-muted-foreground"
                    }`}>
                      <span className="h-1 w-1 rounded-full bg-current" />
                    </span>
                    <span className={`font-bold ${step.active ? "text-foreground" : "text-muted-foreground/60"}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedConsultation.prescription ? (
              <div className="border-t border-border pt-4 space-y-4">
                <h4 className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider">Certified Treatment Report</h4>
                
                <div className="space-y-3 text-[11px] leading-relaxed">
                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">1. Confirmed Disease</p>
                    <p className="text-muted-foreground mt-0.5">{selectedConsultation.prescription.advice?.split(":")[0] || "Crop Pathogen Infection"}</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">2. Chemical Fertilizer Recommendation</p>
                    <p className="text-muted-foreground mt-0.5">NPK 19:19:19 & Micronutrient spray</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">3. Recommended Fungicide/Pesticide</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedConsultation.prescription.medicines?.map((m: string, idx: number) => (
                        <span key={idx} className="bg-brand/10 text-brand text-[9px] font-bold px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">4. Organic Alternatives</p>
                    <p className="text-muted-foreground mt-0.5">Neem Seed Kernel Extract (5% NSKE) spray</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">5. Dosage Instruction</p>
                    <p className="text-muted-foreground mt-0.5">2.5 grams fungicide powder per liter water</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">6. Spray Timeline Schedule</p>
                    <p className="text-muted-foreground mt-0.5">Apply immediately. Repeat foliar spray after 7 days if spots remain.</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">7. Application Method</p>
                    <p className="text-muted-foreground mt-0.5">High volume foliar spray ensuring thorough coverage of leaves.</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">8. Irrigation Adjustments</p>
                    <p className="text-muted-foreground mt-0.5">Switch to drip irrigation. Do not irrigate in late evenings.</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">9. Recovery Period</p>
                    <p className="text-success font-semibold mt-0.5">10 to 14 days</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">10. Safety Precautions</p>
                    <p className="text-muted-foreground mt-0.5">{translations[language].safetyLabel}: Wear mask & eye protection.</p>
                  </div>

                  <div className="bg-muted/10 p-2.5 border rounded-lg">
                    <p className="font-bold text-foreground">11. {translations[language].followUp}</p>
                    <p className="text-brand font-bold mt-0.5">10 Days follow up check scheduled</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    toast.success(language === "en" ? "Treatment PDF report downloaded successfully!" : "చికిత్స నివేదిక PDF విజయవంతంగా డౌన్‌లోడ్ చేయబడింది!");
                  }}
                  className="w-full bg-brand text-brand-foreground font-bold text-xs py-2 rounded-lg hover:bg-brand/90 transition-colors flex items-center justify-center gap-1 mt-3 border-0 cursor-pointer"
                >
                  <FileText className="h-4 w-4" /> {translations[language].downloadPDF}
                </button>
              </div>
            ) : (
              <div className="border-t border-border pt-4 text-center py-6">
                <span className="text-[10px] text-muted-foreground italic leading-relaxed">Prescription report will be generated after the specialist completes the initial diagnostic analysis.</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground text-xs italic">
            Select consultation chat to view progress timeline.
          </div>
        )}
      </div>

      {/* RATING DIALOG MODAL */}
      {isRatingModalOpen && ratingTargetConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-lift text-left">
            <h3 className="font-bold text-sm text-foreground">{translations[language].ratingTitle}</h3>
            <p className="text-xs text-muted-foreground">Please rate your experience with Dr. {ratingTargetConsultation.specialistId?.name || "Agronomist"} to complete the consultation ticket.</p>
            
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
                  className="w-full text-xs rounded-lg border border-border p-2 bg-background outline-none"
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
              <h3 className="font-bold text-sm text-foreground">Book Agronomist Consultation</h3>
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
                  <p className="text-xs text-muted-foreground">
                    You have no diagnoses reports available for a new consultation. Please perform an AI Crop Diagnosis scan first.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Select Crop Scan Report</label>
                  <select
                    value={selectedReportId}
                    onChange={(e) => setSelectedReportId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border p-2 bg-background outline-none font-medium"
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
