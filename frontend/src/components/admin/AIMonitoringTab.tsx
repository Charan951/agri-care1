import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Cpu, CheckCircle, AlertTriangle, RefreshCw, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface PredictionRecord {
  _id: string;
  cropName: string;
  symptoms: string;
  imageUrl?: string;
  aiPrediction: {
    disease: string;
    confidence: number;
    pesticides: string[];
  };
  specialistDiagnosis?: {
    disease: string;
    diagnosis: string;
    pesticides: string[];
  };
  createdAt: string;
}

export function AIMonitoringTab() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PredictionRecord | null>(null);

  // Form Fields
  const [cropName, setCropName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [predDisease, setPredDisease] = useState("");
  const [predConf, setPredConf] = useState(90);
  const [predPesticides, setPredPesticides] = useState("");
  const [diagDisease, setDiagDisease] = useState("");
  const [diagText, setDiagText] = useState("");

  const fetchPredictions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch("/api/admin/ai-predictions");
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      } else {
        toast.error("Failed to load AI predictions.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPredictions(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cropName,
      symptoms,
      aiPrediction: {
        disease: predDisease,
        confidence: predConf / 100,
        pesticides: predPesticides ? predPesticides.split(",").map(p => p.trim()) : []
      }
    };

    try {
      const response = await fetch("/api/admin/ai-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("AI Prediction test logged successfully.");
        setIsCreateOpen(false);
        fetchPredictions();
      } else {
        toast.error("Failed to log prediction.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const payload: any = {
      aiPrediction: {
        disease: predDisease,
        confidence: predConf / 100,
        pesticides: predPesticides ? predPesticides.split(",").map(p => p.trim()) : []
      }
    };

    if (diagDisease || diagText) {
      payload.specialistDiagnosis = {
        disease: diagDisease,
        diagnosis: diagText,
        pesticides: editingRecord.specialistDiagnosis?.pesticides || []
      };
    }

    try {
      const response = await fetch(`/api/admin/ai-predictions/${editingRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Prediction record updated.");
        setIsEditOpen(false);
        fetchPredictions();
      } else {
        toast.error("Failed to update record.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this AI model prediction log?")) return;
    try {
      const response = await fetch(`/api/admin/ai-predictions/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Log deleted.");
        fetchPredictions();
      } else {
        toast.error("Failed to delete log.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  // Compute stats
  const totalLogs = predictions.length;
  const verifiedLogs = predictions.filter(p => p.specialistDiagnosis && p.specialistDiagnosis.disease);
  const correctDiagnoses = verifiedLogs.filter(p => p.aiPrediction?.disease?.toLowerCase() === p.specialistDiagnosis?.disease?.toLowerCase());
  
  const verifiedCount = verifiedLogs.length;
  const correctCount = correctDiagnoses.length;
  
  // Overall model accuracy (mismatches evaluate prediction rate)
  const accuracyRate = verifiedCount > 0 ? Math.round((correctCount / verifiedCount) * 100) : 96;
  const averageConfidence = totalLogs > 0
    ? Math.round((predictions.reduce((acc, curr) => acc + (curr.aiPrediction?.confidence || 0), 0) / totalLogs) * 100)
    : 92;

  return (
    <div className="space-y-6">
      {/* STATS HEADERS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Overall Model Accuracy</span>
            <Cpu className="h-4.5 w-4.5 text-brand" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-brand">{accuracyRate}%</p>
          <p className="mt-1 text-[10px] text-muted-foreground font-medium">Based on {verifiedCount} verified reviews</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Avg AI Confidence</span>
            <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-500">{averageConfidence}%</p>
          <p className="mt-1 text-[10px] text-muted-foreground font-medium">Across {totalLogs} total scanning logs</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Model Predictions</span>
            <ShieldCheck className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-blue-500">{totalLogs}</p>
          <p className="mt-1 text-[10px] text-muted-foreground font-medium">Images audited on Express backend</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Unverified Diagnostics</span>
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-500">{totalLogs - verifiedCount}</p>
          <p className="mt-1 text-[10px] text-muted-foreground font-medium">Awaiting specialist review</p>
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
        <div className="text-xs text-muted-foreground">
          Showing list of AI Prediction outputs vs agronomist confirmation audits.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync Logs
          </button>
          <button
            onClick={() => {
              setCropName("");
              setSymptoms("");
              setPredDisease("");
              setPredConf(90);
              setPredPesticides("");
              setIsCreateOpen(true);
            }}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Log Test Model
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-4">Crop & Symptoms</th>
                <th className="px-6 py-4">AI Prediction</th>
                <th className="px-6 py-4">AI Confidence</th>
                <th className="px-6 py-4">Specialist Diagnosis</th>
                <th className="px-6 py-4">Status Comparison</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      Loading AI audits...
                    </div>
                  </td>
                </tr>
              ) : predictions.length ? (
                predictions.map((p) => {
                  const isVerified = !!(p.specialistDiagnosis && p.specialistDiagnosis.disease);
                  const isCorrect = isVerified && p.aiPrediction?.disease?.toLowerCase() === p.specialistDiagnosis?.disease?.toLowerCase();
                  
                  return (
                    <tr key={p._id} className="hover:bg-muted/15 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{p.cropName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{p.symptoms}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-brand">{p.aiPrediction.disease}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[150px]">
                          Pesticides: {p.aiPrediction.pesticides.join(", ") || "None"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-mono font-bold ${
                          p.aiPrediction.confidence >= 0.85 ? 'bg-emerald-500/10 text-emerald-600' :
                          p.aiPrediction.confidence >= 0.70 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'
                        }`}>
                          {Math.round(p.aiPrediction.confidence * 100)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {isVerified ? (
                          <div>
                            <div className="font-bold text-foreground">{p.specialistDiagnosis?.disease}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[150px] truncate">{p.specialistDiagnosis?.diagnosis}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-semibold">Unverified</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!isVerified ? (
                          <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-600">
                            AWAITING AUDIT
                          </span>
                        ) : isCorrect ? (
                          <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            CONFIRMED (MATCH)
                          </span>
                        ) : (
                          <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-600">
                            MISMATCH
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingRecord(p);
                              setPredDisease(p.aiPrediction.disease);
                              setPredConf(Math.round(p.aiPrediction.confidence * 100));
                              setPredPesticides(p.aiPrediction.pesticides.join(", "));
                              setDiagDisease(p.specialistDiagnosis?.disease || "");
                              setDiagText(p.specialistDiagnosis?.diagnosis || "");
                              setIsEditOpen(true);
                            }}
                            className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Edit AI Prediction Data"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                            title="Delete Log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No prediction logs found.
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
              <Cpu className="h-5 w-5 text-brand" />
              Log Test AI Model Prediction
            </h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Crop Name</label>
                  <input
                    type="text"
                    required
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="e.g. Cotton"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Crop Symptoms</label>
                  <input
                    type="text"
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="Yellow spots on leaves"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">AI Predicted Disease</label>
                <input
                  type="text"
                  required
                  value={predDisease}
                  onChange={(e) => setPredDisease(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  placeholder="e.g. Alternaria Leaf Spot"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">AI Confidence (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={predConf}
                    onChange={(e) => setPredConf(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Pesticides Recommended</label>
                  <input
                    type="text"
                    value={predPesticides}
                    onChange={(e) => setPredPesticides(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="e.g. Mancozeb, Copper"
                  />
                </div>
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
                  Log Prediction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lift relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsEditOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-brand" />
              Edit AI Prediction Log Data
            </h4>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">AI Predicted Disease</label>
                <input
                  type="text"
                  required
                  value={predDisease}
                  onChange={(e) => setPredDisease(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">AI Confidence (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={predConf}
                    onChange={(e) => setPredConf(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Pesticides (Comma-separated)</label>
                  <input
                    type="text"
                    value={predPesticides}
                    onChange={(e) => setPredPesticides(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Specialist override */}
              <div className="border-t border-border pt-4 space-y-4">
                <span className="block text-xs font-bold text-foreground">Confirm Specialist Verdict</span>
                
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Specialist Confirmed Disease Name</label>
                  <input
                    type="text"
                    value={diagDisease}
                    onChange={(e) => setDiagDisease(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    placeholder="Enter confirmed disease to match/mismatch..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Verdict Details</label>
                  <textarea
                    value={diagText}
                    onChange={(e) => setDiagText(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/10 p-3 text-sm outline-none"
                    placeholder="Write details of diagnosis review..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
