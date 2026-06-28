import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, FileText, CheckCircle2, XCircle, RefreshCw, X, ShoppingCart, Eye } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  _id: string;
  name: string;
  businessName?: string;
  mobile: string;
}

interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

interface OrderRecord {
  _id: string;
  merchantId: UserRecord;
  farmerId: UserRecord;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  deliveryAddress: string;
  invoiceUrl?: string;
  createdAt: string;
}

export function OrderManagementTab() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [merchants, setMerchants] = useState<UserRecord[]>([]);
  const [farmers, setFarmers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detailed Modal / Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFarmerId, setCreateFarmerId] = useState("");
  const [createMerchantId, setCreateMerchantId] = useState("");
  const [createProduct, setCreateProduct] = useState("");
  const [createQty, setCreateQty] = useState(1);
  const [createPrice, setCreatePrice] = useState(100);
  const [createAddress, setCreateAddress] = useState("");

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [editStatus, setEditStatus] = useState<OrderRecord['status']>("PENDING");
  const [editPaymentStatus, setEditPaymentStatus] = useState<OrderRecord['paymentStatus']>("PENDING");
  const [editAddress, setEditAddress] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/orders?status=${statusFilter}&search=${search}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        toast.error("Failed to load orders list.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const mRes = await fetch("/api/admin/users?role=MERCHANT");
      const fRes = await fetch("/api/admin/users?role=FARMER");
      if (mRes.ok) setMerchants(await mRes.json());
      if (fRes.ok) setFarmers(await fRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchUsers();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFarmerId || !createMerchantId || !createProduct || !createAddress) {
      toast.error("All fields are required.");
      return;
    }

    const payload = {
      farmerId: createFarmerId,
      merchantId: createMerchantId,
      items: [{
        product: createProduct,
        quantity: createQty,
        price: createPrice
      }],
      totalAmount: createQty * createPrice,
      status: "PENDING",
      paymentStatus: "PENDING",
      deliveryAddress: createAddress,
      invoiceUrl: `/invoices/INV_${Date.now()}.pdf`
    };

    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success("Order logged successfully.");
        setIsCreateOpen(false);
        fetchOrders();
      } else {
        toast.error("Failed to log order.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const response = await fetch(`/api/admin/orders/${editingOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPaymentStatus,
          deliveryAddress: editAddress
        })
      });
      if (response.ok) {
        toast.success("Order updated successfully.");
        setIsEditOpen(false);
        fetchOrders();
        if (selectedOrder?._id === editingOrder._id) {
          const updated = await response.json();
          setSelectedOrder(updated.order);
        }
      } else {
        toast.error("Failed to update order.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleRefundApproval = async (order: OrderRecord) => {
    if (!confirm("Are you sure you want to approve refund for this order?")) return;
    try {
      const response = await fetch(`/api/admin/orders/${order._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RETURNED",
          paymentStatus: "REFUNDED"
        })
      });
      if (response.ok) {
        toast.success("Refund processed and order status closed.");
        fetchOrders();
        setSelectedOrder(null);
      } else {
        toast.error("Failed to process refund.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order log?")) return;
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Order record deleted.");
        fetchOrders();
        if (selectedOrder?._id === id) setSelectedOrder(null);
      } else {
        toast.error("Failed to delete record.");
      }
    } catch (err) {
      toast.error("Error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order ID, farmer, business, or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-muted/30 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none w-full sm:w-48"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SHIPPED">Shipped (In Transit)</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURN_REQUESTED">Return Requested</option>
            <option value="RETURNED">Returned (Refunded)</option>
          </select>

          <button
            onClick={() => {
              setCreateFarmerId("");
              setCreateMerchantId("");
              setCreateProduct("");
              setCreateQty(1);
              setCreatePrice(100);
              setCreateAddress("");
              setIsCreateOpen(true);
            }}
            className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="h-4 w-4" />
            Place Order
          </button>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Farmer</th>
                <th className="px-6 py-4">Merchant Store</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      Loading order records...
                    </div>
                  </td>
                </tr>
              ) : orders.length ? (
                orders.map((o) => (
                  <tr key={o._id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">
                      {o._id.substring(0, 8).toUpperCase()}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{o.farmerId?.name || "Farmer"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{o.farmerId?.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{o.merchantId?.businessName || "Store"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Seller: {o.merchantId?.name}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      ₹{o.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        o.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-600' :
                        o.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-600' :
                        o.status === 'CANCELLED' || o.status === 'RETURNED' ? 'bg-red-500/10 text-red-600' :
                        o.status === 'RETURN_REQUESTED' ? 'bg-purple-500/10 text-purple-600 animate-pulse' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      <span className={`${
                        o.paymentStatus === 'PAID' ? 'text-emerald-600' :
                        o.paymentStatus === 'REFUNDED' ? 'text-indigo-600' :
                        o.paymentStatus === 'FAILED' ? 'text-red-600' : 'text-amber-500'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="View Order Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingOrder(o);
                            setEditStatus(o.status);
                            setEditPaymentStatus(o.paymentStatus);
                            setEditAddress(o.deliveryAddress);
                            setIsEditOpen(true);
                          }}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Update Shipping Info"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(o._id)}
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
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No orders matching filters.
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
              <ShoppingCart className="h-5 w-5 text-brand" />
              Place Manual Order
            </h4>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Farmer Account</label>
                <select
                  required
                  value={createFarmerId}
                  onChange={(e) => setCreateFarmerId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Select Farmer --</option>
                  {farmers.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.mobile})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Merchant Store</label>
                <select
                  required
                  value={createMerchantId}
                  onChange={(e) => setCreateMerchantId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                >
                  <option value="">-- Select Merchant Store --</option>
                  {merchants.map(m => (
                    <option key={m._id} value={m._id}>{m.businessName} ({m.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Product Name</label>
                <input
                  type="text"
                  required
                  value={createProduct}
                  onChange={(e) => setCreateProduct(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  placeholder="e.g. Hybrid Cotton Seeds 1kg"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createQty}
                    onChange={(e) => setCreateQty(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Price per item (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(Number(e.target.value))}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Delivery Address</label>
                <textarea
                  required
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-muted/10 p-3 text-sm outline-none"
                  placeholder="Street details, Pincode, State..."
                />
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
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lift relative">
            <button onClick={() => setIsEditOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-brand" />
              Update Order Shipping Details
            </h4>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Delivery Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SHIPPED">SHIPPED (IN TRANSIT)</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RETURN_REQUESTED">RETURN REQUESTED</option>
                    <option value="RETURNED">RETURNED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Delivery Address</label>
                <textarea
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-muted/10 p-3 text-sm outline-none"
                />
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

      {/* DETAIL DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="h-full w-full max-w-md bg-card border-l border-border p-6 shadow-lift overflow-y-auto flex flex-col justify-between animate-slide-in">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Order Document ID</span>
                  <h4 className="text-sm font-mono font-bold">{selectedOrder._id}</h4>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="cursor-pointer rounded-lg border border-border p-1.5 hover:bg-muted text-muted-foreground">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Items List */}
              <div className="mt-6 space-y-4">
                <h5 className="text-xs font-bold uppercase text-muted-foreground">Order Items</h5>
                <div className="divide-y divide-border/60 border border-border rounded-xl p-4 bg-muted/10">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2.5 first:pt-0 last:pb-0 text-xs">
                      <div>
                        <div className="font-bold text-foreground">{item.product}</div>
                        <div className="text-muted-foreground mt-0.5">Qty: {item.quantity} @ ₹{item.price}</div>
                      </div>
                      <span className="font-bold text-foreground">₹{item.quantity * item.price}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-border font-bold text-sm text-foreground">
                    <span>Total Amount</span>
                    <span>₹{selectedOrder.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold text-muted-foreground">Farmer Client</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedOrder.farmerId?.name}</p>
                    <p className="text-muted-foreground mt-0.5">{selectedOrder.farmerId?.mobile}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground">Merchant Seller</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedOrder.merchantId?.businessName}</p>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-muted-foreground">Delivery Address</span>
                  <p className="font-semibold text-foreground mt-0.5 leading-relaxed">{selectedOrder.deliveryAddress}</p>
                </div>

                {selectedOrder.invoiceUrl && (
                  <div className="flex items-center gap-1.5 bg-muted/40 p-3 rounded-lg border border-border/80">
                    <FileText className="h-4.5 w-4.5 text-brand" />
                    <div>
                      <span className="font-bold text-[10px] text-muted-foreground uppercase">E-Invoice System</span>
                      <a href="#" className="block text-brand hover:underline font-semibold text-xs mt-0.5">
                        Download PDF Invoice ({selectedOrder._id.substring(0, 8).toUpperCase()}.pdf)
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Refund Audit actions */}
            <div className="border-t border-border pt-4 mt-6 space-y-3">
              {selectedOrder.status === 'RETURN_REQUESTED' && (
                <button
                  onClick={() => handleRefundApproval(selectedOrder)}
                  className="w-full h-10 cursor-pointer rounded-lg bg-indigo-600 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Approve Return & Refund Payout
                </button>
              )}
              
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full h-10 cursor-pointer rounded-lg border border-border text-center text-sm font-semibold hover:bg-muted"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
