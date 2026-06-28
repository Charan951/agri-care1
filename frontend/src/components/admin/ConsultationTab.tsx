import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, Eye, X, MessageSquare, ShieldAlert, Award, Send } from "lucide-react";
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

interface Message {
  senderId: string;
  message: string;
  timestamp: string;
}

interface ConsultationRecord {
  _id: string;
  reportId?: {
    cropName: string;
    symptoms: string;
    imageUrl?: string;
  };
  farmerId: Farmer;
  specialistId: Specialist;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ESCALATED';
  chatHistory: Message[];
  prescription?: {
    medicines: string[];
    advice: string;
    createdAt: string;
  };
  createdAt: string;
}

export function ConsultationTab() {
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Detailed Modal
  const [selectedConsult, setSelectedConsult] = useState<ConsultationRecord | null>(null);
  
  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newReportId, setNewReportId] = useState("");
  const [newFarmerId, setNewFarmerId] = useState("");
  const [newSpecialistId, setNewSpecialistId] = useState("");

  // Edit/Diagnosis Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editConsult, setEditConsult] = useState<ConsultationRecord | null>(null);
  const [editStatus, setEditStatus] = useState<ConsultationRecord['status']>("PENDING");
  const [editSpecialistId, setEditSpecialistId] = useState("");
  
  // Prescription editing
  const [prescAdvice, setPrescAdvice] = useState("");
  const [prescMedicines, setPrescMedicines] = useState("");

  // Chat message injection
  const [chatMessage, setChatMessage] = useState("");

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/consultations");
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      } else {
        toast.error("Failed to load consultations.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormDetails = async () => {
    try {
      const specRes = await fetch("/api/admin/users?role=AGRI_SPECIALIST");
      const farmerRes = await fetch("/api/admin/users?role=FARMER");
      const reportRes = await fetch("/api/admin/reports");
      
      if (specRes.ok) setSpecialists(await specRes.json());
      if (farmerRes.ok) setFarmers(await farmerRes.json());
      if (reportRes.ok) setReports(await reportRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConsultations();
    fetchFormDetails();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportId || !newFarmerId || !newSpecialistId) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/admin/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: newReportId,
          farmerId: newFarmerId,
          specialistId: newSpecialistId,
          status: "PENDING"
        })
      });

      if (response.ok) {
        toast.success("Consultation assigned successfully.");
        setIsCreateOpen(false);
        fetchConsultations();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to create consultation.");
      }
    } catch (err) {
      toast.error("Network error occurred.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editConsult) return;

    const payload: any = {
      status: editStatus,
      specialistId: editSpecialistId || undefined
    };

    if (prescAdvice) {
      payload.prescription = {
        advice: prescAdvice,
        medicines: prescMedicines ? prescMedicines.split(",").map(m => m.trim()) : [],
        createdAt: new Date()
      };
      // Automatically resolve to COMPLETED if prescription is saved
      if (editStatus === "PENDING" || editStatus === "ACTIVE") {
        payload.status = "COMPLETED";
      }
    }

    try {
      const response = await fetch(`/api/admin/consultations/${editConsult._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Consultation updated successfully.");
        setIsEditOpen(false);
        fetchConsultations();
        if (selectedConsult?._id === editConsult._id) {
          const updated = await response.json();
          setSelectedConsult(updated.consultation);
        }
      } else {
        toast.error("Failed to update consultation.");
      }
    } catch (err) {
      toast.error("Error saving changes.");
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsult || !chatMessage.trim()) return;

    try {
      const response = await fetch(`/api/admin/consultations/${selectedConsult._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addMessage: {
            senderId: "admin", // Admin sending message
            message: chatMessage.trim()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConsult(data.consultation);
        setChatMessage("");
        fetchConsultations();
      } else {
        toast.error("Failed to send message.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this consultation record?")) return;

    try {
      const response = await fetch(`/api/admin/consultations/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Consultation record deleted.");
        if (selectedConsult?._id === id) setSelectedConsult(null);
        fetchConsultations();
      } else {
        toast.error("Failed to delete record.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
  };

  const filteredConsultations = statusFilter
    ? consultations.filter(c => c.status === statusFilter)
    : consultations;

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none w-full sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending (Queued)</option>
            <option value="ACTIVE">Active (In Chat)</option>
            <option value="COMPLETED">Completed</option>
            <option value="ESCALATED">Escalated (Critical)</option>
          </select>
        </div>

        <button
          onClick={() => {
            setNewReportId("");
            setNewFarmerId("");
            setNewSpecialistId("");
            setIsCreateOpen(true);
          }}
          className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
        >
          <Plus className="h-4 w-4" />
          Assign New Call
        </button>
      </div>

      {/* TABLE DATA */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-4">Farmer</th>
                <th className="px-6 py-4">Assigned Agronomist</th>
                <th className="px-6 py-4">Crop Report</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Prescription</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      Loading consultations...
                    </div>
                  </td>
                </tr>
              ) : filteredConsultations.length ? (
                filteredConsultations.map((c) => (
                  <tr key={c._id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{c.farmerId?.name || "Farmer"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.farmerId?.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{c.specialistId?.name || "Specialist"}</div>
                      <div className="text-xs text-brand font-semibold mt-0.5">{c.specialistId?.specialization || "General"}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="font-bold text-foreground">{c.reportId?.cropName || "Crop Report"}</div>
                      <div className="text-muted-foreground truncate max-w-[150px] mt-0.5">{c.reportId?.symptoms || "No details"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        c.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' :
                        c.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-600' :
                        c.status === 'ESCALATED' ? 'bg-red-500/10 text-red-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {c.prescription ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Award className="h-3.5 w-3.5" />
                          <span>Prescribed</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedConsult(c)}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View Chats"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditConsult(c);
                            setEditStatus(c.status);
                            setEditSpecialistId(c.specialistId?._id || "");
                            setPrescAdvice(c.prescription?.advice || "");
                            setPrescMedicines(c.prescription?.medicines.join(", ") || "");
                            setIsEditOpen(true);
                          }}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Update Call details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No consultations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsCreateOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand" />
              Assign Advisory Call
            </h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Select Crop Disease Report</label>
                <select
                  required
                  value={newReportId}
                  onChange={(e) => setNewReportId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Choose Report --</option>
                  {reports.map(r => (
                    <option key={r._id} value={r._id}>{r.cropName} - {r.symptoms.substring(0, 30)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Select Farmer</label>
                <select
                  required
                  value={newFarmerId}
                  onChange={(e) => setNewFarmerId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Choose Farmer --</option>
                  {farmers.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.mobile})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Assign Agronomist Specialist</label>
                <select
                  required
                  value={newSpecialistId}
                  onChange={(e) => setNewSpecialistId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Choose Specialist --</option>
                  {specialists.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.specialization || "General"})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Assign Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editConsult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lift relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-brand" />
              Manage Consultation & Prescription
            </h4>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Call Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ESCALATED">ESCALATED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Reassign Specialist</label>
                  <select
                    value={editSpecialistId}
                    onChange={(e) => setEditSpecialistId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    {specialists.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.specialization || "General"})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prescription */}
              <div className="border-t border-border pt-4 space-y-4">
                <span className="block text-xs font-bold text-foreground">Add/Update Agronomist Prescription (Completes Call)</span>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Advice & Instructions</label>
                  <textarea
                    value={prescAdvice}
                    onChange={(e) => setPrescAdvice(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/10 p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    placeholder="Provide recommendations for treatment..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Medicines / Sprays (Comma-separated)</label>
                  <input
                    type="text"
                    value={prescMedicines}
                    onChange={(e) => setPrescMedicines(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    placeholder="e.g. Hexaconazole 5% EC, Urea"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Save Call Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAT LOG DRAWER */}
      {selectedConsult && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="h-full w-full max-w-md bg-card border-l border-border p-6 shadow-lift overflow-y-auto flex flex-col justify-between animate-slide-in">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Consultation Chat ID</span>
                  <h4 className="text-sm font-mono font-bold">{selectedConsult._id}</h4>
                </div>
                <button
                  onClick={() => setSelectedConsult(null)}
                  className="cursor-pointer rounded-lg border border-border p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mt-4 bg-muted/30 p-3 rounded-lg border border-border text-xs">
                <div className="font-bold text-foreground">Crop: {selectedConsult.reportId?.cropName || "General Advisory"}</div>
                <div className="text-muted-foreground mt-0.5">Agronomist: {selectedConsult.specialistId?.name}</div>
              </div>

              {/* Chat history */}
              <div className="mt-6 border border-border rounded-xl bg-muted/10 p-4 h-[300px] overflow-y-auto space-y-3.5">
                {selectedConsult.chatHistory.length ? (
                  selectedConsult.chatHistory.map((chat, idx) => {
                    const isAdminSender = chat.senderId === "admin";
                    const isFarmerSender = chat.senderId === selectedConsult.farmerId?._id;
                    const senderLabel = isAdminSender ? "Admin" : isFarmerSender ? "Farmer" : "Agronomist";
                    
                    return (
                      <div key={idx} className={`flex flex-col ${isAdminSender ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] font-bold text-muted-foreground mb-0.5">{senderLabel}</span>
                        <div className={`rounded-lg p-2.5 text-xs max-w-[80%] leading-relaxed ${
                          isAdminSender ? "bg-brand text-brand-foreground rounded-br-none" : "bg-card border border-border rounded-bl-none text-foreground"
                        }`}>
                          {chat.message}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-12">No messages exchanged yet.</p>
                )}
              </div>
            </div>

            {/* Message input */}
            <form onSubmit={handleSendChatMessage} className="border-t border-border pt-4 mt-4 flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type administrator response..."
                className="h-10 flex-1 rounded-lg border border-border bg-muted/30 px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                type="submit"
                className="h-10 w-10 shrink-0 grid place-items-center rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
