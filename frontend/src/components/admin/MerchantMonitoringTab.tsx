import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, ShieldAlert, Award, Star, Search, X, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  businessName?: string;
  gstin?: string;
  rating?: number;
  createdAt: string;
}

interface MerchantEnrichedRecord {
  user: UserRecord;
  sales: number;
  orders: number;
  fulfillmentRate: string;
}

export function MerchantMonitoringTab() {
  const [merchants, setMerchants] = useState<MerchantEnrichedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<UserRecord | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [status, setStatus] = useState<UserRecord['status']>("PENDING");
  const [rating, setRating] = useState(5.0);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/merchants");
      if (response.ok) {
        const data = await response.json();
        setMerchants(data.merchants || data);
      } else {
        toast.error("Failed to load merchants list.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      email,
      password: password || "Merchant@123",
      mobile,
      businessName,
      gstin,
      status
    };

    try {
      const response = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Merchant account created successfully.");
        setIsCreateOpen(false);
        fetchMerchants();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to create merchant.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;

    const payload = {
      name,
      mobile,
      businessName,
      gstin,
      status,
      rating
    };

    try {
      const response = await fetch(`/api/admin/merchants/${editingMerchant._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Merchant profile updated.");
        setIsEditOpen(false);
        fetchMerchants();
      } else {
        toast.error("Failed to update merchant.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleToggleStatus = async (m: UserRecord, newStatus: UserRecord['status']) => {
    try {
      const response = await fetch(`/api/admin/merchants/${m._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        toast.success(`Merchant status updated to ${newStatus}.`);
        fetchMerchants();
      } else {
        toast.error("Failed to update merchant status.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this merchant account?")) return;
    try {
      const response = await fetch(`/api/admin/merchants/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Merchant account deleted.");
        fetchMerchants();
      } else {
        toast.error("Failed to delete merchant.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = 
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.user.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.user.gstin || "").toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter ? m.user.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by merchant name, business, or GSTIN..."
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
            <option value="ACTIVE">Approved (Active)</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button
            onClick={() => {
              setName("");
              setEmail("");
              setPassword("");
              setMobile("");
              setBusinessName("");
              setGstin("");
              setStatus("PENDING");
              setIsCreateOpen(true);
            }}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Add Merchant
          </button>
        </div>
      </div>

      {/* MERCHANTS LIST */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              Loading merchant accounts...
            </div>
          </div>
        ) : filteredMerchants.length ? (
          filteredMerchants.map((m) => (
            <div key={m.user._id} className="rounded-xl border border-border bg-card p-5 shadow-soft hover:shadow-soft-hover transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h5 className="text-sm font-bold text-foreground">{m.user.businessName || "No Business Name"}</h5>
                    <p className="mt-0.5 text-xs text-muted-foreground">Owner: {m.user.name}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    m.user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                    m.user.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    {m.user.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>GSTIN</span>
                    <span className="font-mono font-semibold text-foreground">{m.user.gstin || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Fulfillment Rate</span>
                    <span className="font-semibold text-foreground">{m.fulfillmentRate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Rating</span>
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                      {m.user.rating?.toFixed(1) || "5.0"}
                    </span>
                  </div>
                </div>

                {/* Sales volume metrics */}
                <div className="mt-4 grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Orders</span>
                    <p className="text-sm font-bold mt-0.5 flex items-center justify-center gap-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-brand" />
                      {m.orders}
                    </p>
                  </div>
                  <div className="text-center border-l border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Sales Value</span>
                    <p className="text-sm font-bold mt-0.5 text-emerald-600">₹{m.sales.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {m.user.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleToggleStatus(m.user, 'ACTIVE')}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  )}
                  {m.user.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleToggleStatus(m.user, 'SUSPENDED')}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/20"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Suspend
                    </button>
                  )}
                  {m.user.status === 'SUSPENDED' && (
                    <button
                      onClick={() => handleToggleStatus(m.user, 'ACTIVE')}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20"
                    >
                      <Award className="h-3.5 w-3.5" />
                      Reactivate
                    </button>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingMerchant(m.user);
                      setName(m.user.name);
                      setMobile(m.user.mobile);
                      setBusinessName(m.user.businessName || "");
                      setGstin(m.user.gstin || "");
                      setStatus(m.user.status);
                      setRating(m.user.rating || 5.0);
                      setIsEditOpen(true);
                    }}
                    className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit Merchant"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.user._id)}
                    className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                    title="Delete Merchant"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
            No merchant stores found.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsCreateOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand" />
              Register Merchant Store
            </h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">GSTIN Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Password (Default)</label>
                <input
                  type="password"
                  placeholder="Merchant@123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="PENDING">PENDING REVIEW</option>
                  <option value="ACTIVE">ACTIVE (APPROVED)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsEditOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-brand" />
              Update Merchant Store Profile
            </h4>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">GSTIN Code</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Store Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Store Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
