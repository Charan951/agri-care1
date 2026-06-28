import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle2, ShieldCheck, XCircle, AlertCircle, RefreshCw, X, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Farmer {
  _id: string;
  name: string;
}

interface Merchant {
  _id: string;
  name: string;
  businessName: string;
}

interface OrderRef {
  _id: string;
  farmerId: Farmer;
  merchantId: Merchant;
}

interface PaymentRecord {
  _id: string;
  orderId: OrderRef;
  transactionId: string;
  amount: number;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  merchantSettled: boolean;
  createdAt: string;
}

export function PaymentManagementTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  // Form Fields
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [status, setStatus] = useState<PaymentRecord['status']>("PENDING");
  const [merchantSettled, setMerchantSettled] = useState(false);

  const fetchPayments = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await fetch("/api/admin/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        toast.error("Failed to load payment transactions.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrdersList = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      if (response.ok) {
        setOrders(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchOrdersList();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || amount <= 0) {
      toast.error("Valid Order ID and Amount are required.");
      return;
    }

    const payload = {
      orderId,
      amount,
      paymentMethod,
      transactionId: transactionId || `TXN${Date.now()}`,
      status,
      merchantSettled
    };

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Payment transaction logged successfully.");
        setIsCreateOpen(false);
        fetchPayments();
      } else {
        toast.error("Failed to log transaction.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const payload = {
      status,
      merchantSettled,
      paymentMethod,
      amount
    };

    try {
      const response = await fetch(`/api/admin/payments/${editingPayment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Transaction audit updated.");
        setIsEditOpen(false);
        fetchPayments();
      } else {
        toast.error("Failed to update transaction.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this financial transaction log?")) return;
    try {
      const response = await fetch(`/api/admin/payments/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Transaction log deleted.");
        fetchPayments();
      } else {
        toast.error("Failed to delete log.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleProcessRefund = async (pay: PaymentRecord) => {
    if (!confirm("Authorize direct gateway refund for this transaction?")) return;
    try {
      const response = await fetch(`/api/admin/payments/${pay._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REFUNDED"
        })
      });
      if (response.ok) {
        // Also update order status
        await fetch(`/api/admin/orders/${pay.orderId?._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "RETURNED",
            paymentStatus: "REFUNDED"
          })
        });

        toast.success("Refund issued to farmer payment method.");
        fetchPayments();
      } else {
        toast.error("Failed to process gateway refund.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    }
  };

  const handleToggleSettlement = async (pay: PaymentRecord) => {
    try {
      const response = await fetch(`/api/admin/payments/${pay._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantSettled: !pay.merchantSettled
        })
      });
      if (response.ok) {
        toast.success(pay.merchantSettled ? "Settlement rolled back." : "Payout settled to merchant wallet.");
        fetchPayments();
      } else {
        toast.error("Failed to update settlement.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
        <div className="text-xs text-muted-foreground">
          Financial payouts auditing ledger. Access to manual refunds and settlements.
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Sync Ledger
          </button>
          <button
            onClick={() => {
              setOrderId("");
              setAmount(0);
              setPaymentMethod("UPI");
              setTransactionId("");
              setStatus("PENDING");
              setMerchantSettled(false);
              setIsCreateOpen(true);
            }}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Audit Transaction
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Parties</th>
                <th className="px-6 py-4">Method / Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payout Settlement</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      Loading ledger records...
                    </div>
                  </td>
                </tr>
              ) : payments.length ? (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-foreground text-xs">{p.transactionId}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Ref: {p._id}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <div className="text-foreground">Farmer: {p.orderId?.farmerId?.name || "N/A"}</div>
                      <div className="text-muted-foreground mt-0.5">Merchant: {p.orderId?.merchantId?.businessName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-foreground">₹{p.amount.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Via: {p.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.status === 'SUCCESSFUL' ? 'bg-emerald-500/10 text-emerald-600' :
                        p.status === 'REFUNDED' ? 'bg-blue-500/10 text-blue-600' :
                        p.status === 'FAILED' ? 'bg-red-500/10 text-red-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleSettlement(p)}
                        className={`cursor-pointer inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
                          p.merchantSettled 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 hover:bg-muted'
                        }`}
                        disabled={p.status !== 'SUCCESSFUL'}
                      >
                        {p.merchantSettled ? "SETTLED (PAID)" : "PENDING PAYOUT"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {p.status === 'SUCCESSFUL' && (
                          <button
                            onClick={() => handleProcessRefund(p)}
                            className="cursor-pointer rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Issue Refund"
                          >
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingPayment(p);
                            setAmount(p.amount);
                            setPaymentMethod(p.paymentMethod);
                            setStatus(p.status);
                            setMerchantSettled(p.merchantSettled);
                            setIsEditOpen(true);
                          }}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Audit Transaction"
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No transaction logs matching current filters.
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
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCreateOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand" />
              Log Financial Audit Entry
            </h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Associate Order ID</label>
                <select
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Choose Order --</option>
                  {orders.map(o => (
                    <option key={o._id} value={o._id}>
                      {o._id.substring(0, 8).toUpperCase()}... - ₹{o.totalAmount} by {o.farmerId?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Transaction Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="UPI">UPI (Unified Payments)</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="NETBANKING">Net Banking</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Gateway Transaction ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN100098573210"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Transaction Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SUCCESSFUL">SUCCESSFUL</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={merchantSettled}
                      onChange={(e) => setMerchantSettled(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-[var(--brand)]"
                    />
                    Settled to Seller
                  </label>
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
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsEditOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-brand" />
              Audit Transaction Log
            </h4>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Transaction Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CARD">CARD</option>
                    <option value="NETBANKING">NETBANKING</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Payment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SUCCESSFUL">SUCCESSFUL</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={merchantSettled}
                      onChange={(e) => setMerchantSettled(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-[var(--brand)]"
                    />
                    Settled to Seller
                  </label>
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
