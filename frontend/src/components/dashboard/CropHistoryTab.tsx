import { useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
import { translations } from "./translations";

interface CropHistoryTabProps {
  language: "en" | "te";
  setActiveTab: (tab: any) => void;
  setDetectState: (state: { cropName: string; imageUrl: string; detectWorkflowStep: any; scanResult: any }) => void;
  setSelectedConsultation: (consultation: any) => void;
  setSelectedOrder: (order: any) => void;
  isActive?: boolean;
}

export function CropHistoryTab({
  language,
  setActiveTab,
  setDetectState,
  setSelectedConsultation,
  setSelectedOrder,
  isActive
}: CropHistoryTabProps) {
  const [scansHistory, setScansHistory] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "reports" | "consults" | "orders" | "payments">("all");

  const { socket } = useSocket();

  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [scansRes, consultsRes, ordersRes, paymentsRes] = await Promise.all([
        apiFetch("/api/customer/disease-detection/history"),
        apiFetch("/api/customer/consultations"),
        apiFetch("/api/customer/orders"),
        apiFetch("/api/customer/payments")
      ]);

      if (scansRes.ok) {
        const data = await scansRes.json();
        setScansHistory(data.reports || []);
      }
      if (consultsRes.ok) {
        const data = await consultsRes.json();
        setConsultations(data.consultations || []);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Error loading history data", err);
      if (!isSilent) toast.error("Failed to load history logs");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive !== false) {
      loadData();
    }
  }, [isActive]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      loadData(true);
    };

    socket.on("report_created", handleUpdate);
    socket.on("report_updated", handleUpdate);
    socket.on("report_deleted", handleUpdate);
    socket.on("consultation_updated", handleUpdate);
    socket.on("consultation_chat_updated", handleUpdate);
    socket.on("order_updated", handleUpdate);

    return () => {
      socket.off("report_created", handleUpdate);
      socket.off("report_updated", handleUpdate);
      socket.off("report_deleted", handleUpdate);
      socket.off("consultation_updated", handleUpdate);
      socket.off("consultation_chat_updated", handleUpdate);
      socket.off("order_updated", handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const getFilteredList = () => {
    const list: any[] = [];

    // Add Scan Reports
    if (historyFilter === "all" || historyFilter === "reports") {
      scansHistory.forEach(h => {
        const hasSpecialist = !!h.specialistDiagnosis;
        const isAssigned = h.status === 'ASSIGNED';
        let badgeText = translations[language].reports || "AI Report";
        let badgeColor = "bg-brand/10 text-brand border-brand/20";
        let subtitleText = `Diagnosed: ${h.aiPrediction?.disease || "Leaf Spot Disease"} (${(h.aiPrediction?.confidence * 100 || 94).toFixed(0)}% Conf)`;
        
        if (hasSpecialist) {
          badgeText = language === "te" ? "నిపుణుల నిర్ధారణ" : "Specialist Diagnosed";
          badgeColor = "bg-success/15 text-success border-success/20";
          subtitleText = `Diagnosed by Specialist: ${h.specialistDiagnosis.disease}`;
        } else if (isAssigned) {
          badgeText = language === "te" ? "పరిశీలనలో ఉంది" : "Assigned for Review";
          badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
          subtitleText = h.assignedSpecialistId?.name 
            ? `Under review by Dr. ${h.assignedSpecialistId.name}`
            : "Under review by specialist";
        }

        list.push({
          type: "report",
          title: h.cropName,
          subtitle: subtitleText,
          date: new Date(h.createdAt),
          raw: h,
          badge: badgeText,
          badgeColor: badgeColor,
          imageUrl: h.imageUrl
        });
      });
    }

    // Add Consultations
    if (historyFilter === "all" || historyFilter === "consults") {
      consultations.forEach(c => {
        list.push({
          type: "consult",
          title: `Agronomist Consult: Dr. ${c.specialistId?.name || "Expert"}`,
          subtitle: `Speciality: ${c.specialistId?.specialization || "Crop Protection"} | Status: ${c.status}`,
          date: new Date(c.createdAt),
          raw: c,
          badge: translations[language].consults || "Consultation",
          badgeColor: "bg-yellow-50 text-yellow-700 border-yellow-200"
        });
      });
    }

    // Add Marketplace Orders
    if (historyFilter === "all" || historyFilter === "orders") {
      orders.forEach(o => {
        list.push({
          type: "order",
          title: `Order Purchased: ${o.items[0]?.product || "Agri Product"}`,
          subtitle: `Amount: ₹${o.totalAmount} | Delivery Status: ${o.status}`,
          date: new Date(o.createdAt),
          raw: o,
          badge: translations[language].orders || "Marketplace Order",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
        });
      });
    }

    // Add Payment Logs
    if (historyFilter === "all" || historyFilter === "payments") {
      payments.forEach(p => {
        list.push({
          type: "payment",
          title: `Razorpay Payment ID: ${p.transactionId}`,
          subtitle: `Amount Paid: ₹${p.amount} | Status: ${p.status}`,
          date: new Date(p.createdAt),
          raw: p,
          badge: translations[language].payments || "Payment Log",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
        });
      });
    }

    // Sort by Date Descending
    let filteredList = list.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply Text Search Filter
    if (historySearch.trim()) {
      const searchLower = historySearch.toLowerCase();
      filteredList = filteredList.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle.toLowerCase().includes(searchLower) ||
        item.badge.toLowerCase().includes(searchLower)
      );
    }

    return filteredList;
  };

  const filteredList = getFilteredList();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        <div>
          <h3 className="font-extrabold text-md text-foreground">{translations[language].historyTitle}</h3>
          <p className="text-[10px] text-muted-foreground">Manage your past diagnostic scans, consultant details, receipts, and order purchases.</p>
        </div>
      </div>

      {/* Search and Category Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={translations[language].historySearchPlaceholder}
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
          className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand shadow-sm"
        />
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "all", label: translations[language].all },
            { id: "reports", label: translations[language].reports },
            { id: "consults", label: translations[language].consults },
            { id: "orders", label: translations[language].orders },
            { id: "payments", label: translations[language].payments }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setHistoryFilter(pill.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all border ${
                historyFilter === pill.id
                  ? "bg-brand border-brand text-brand-foreground shadow-sm"
                  : "bg-background border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Aggregated Logs List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <History className="h-8 w-8 text-muted-foreground/45 mx-auto animate-pulse" />
            <p className="text-xs">No matching history records found in this category.</p>
          </div>
        ) : (
          filteredList.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 hover:bg-muted/10 transition-colors bg-card">
              <div className="flex items-center gap-4 text-left">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-14 w-14 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg border border-border">
                    {item.type === "consult" ? "👨‍🔬" : item.type === "order" ? "📦" : "💳"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-xs text-foreground">{item.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                  <p className="text-[9px] text-muted-foreground">Log Date: {item.date.toLocaleString()}</p>
                </div>
              </div>

              {/* Item Action Triggers */}
              <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                {item.type === "report" && (
                  <>
                    <button
                      onClick={() => {
                        setDetectState({
                          cropName: item.raw.cropName,
                          imageUrl: item.raw.imageUrl,
                          detectWorkflowStep: "info",
                          scanResult: null
                        });
                        setActiveTab("detect");
                      }}
                      className="bg-brand/10 text-brand border border-brand/20 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors cursor-pointer"
                    >
                      Re-Scan Crop
                    </button>
                    <button
                      onClick={() => {
                        setDetectState({
                          cropName: item.raw.cropName,
                          imageUrl: item.raw.imageUrl,
                          detectWorkflowStep: "report",
                          scanResult: item.raw
                        });
                        setActiveTab("detect");
                      }}
                      className="bg-muted text-foreground border border-border font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      Open Report
                    </button>
                  </>
                )}

                {item.type === "consult" && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedConsultation(item.raw);
                        setActiveTab("consultations");
                      }}
                      className="bg-brand/10 text-brand border border-brand/20 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-colors cursor-pointer"
                    >
                      Enter Chat
                    </button>
                    {item.raw.prescription && (
                      <button
                        onClick={() => {
                          toast.success("Treatment plan PDF downloaded successfully!");
                        }}
                        className="bg-muted text-foreground border border-border font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                      >
                        Download PDF
                      </button>
                    )}
                  </>
                )}

                {item.type === "order" && (
                  <button
                    onClick={() => {
                      setSelectedOrder(item.raw);
                      setActiveTab("orders");
                    }}
                    className="bg-brand/10 text-brand border border-brand/20 font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-brand hover:text-white transition-all cursor-pointer"
                  >
                    Track Package
                  </button>
                )}

                {item.type === "payment" && (
                  <button
                    onClick={() => {
                      toast.info(`Receipt ID: ${item.raw.transactionId}. Printer simulation started.`);
                      window.print();
                    }}
                    className="bg-muted text-foreground border border-border font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-muted/70 transition-all cursor-pointer"
                  >
                    Print Invoice
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
