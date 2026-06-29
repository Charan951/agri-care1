import { useEffect, useState } from "react";
import { FileText, Printer, Package, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch("/api/customer/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading orders", err);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/customer/orders/${orderId}/cancel`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.order);
        }
        toast.success("Order cancelled and refund initiated.");
      }
    } catch (err) {
      toast.error("Error cancelling order");
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    try {
      const res = await apiFetch(`/api/customer/orders/${orderId}/return`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(data.order);
        }
        toast.success("Return request submitted.");
      }
    } catch (err) {
      toast.error("Error requesting return");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      {/* Orders List */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full">
        <h3 className="font-bold text-sm border-b border-border pb-2 mb-3 text-foreground">Order History Log</h3>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
          {orders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">No orders placed yet.</p>
          ) : (
            orders.map((o: any, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedOrder(o)}
                className={`p-3.5 border rounded-xl cursor-pointer text-left transition-colors relative ${
                  selectedOrder && selectedOrder._id === o._id ? "bg-brand/5 border-brand shadow-sm" : "border-border hover:bg-muted/10"
                }`}
              >
                <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold uppercase absolute top-3 right-3">{o.status}</span>
                <h4 className="font-bold text-xs truncate max-w-[120px] text-foreground">
                  {o.items[0]?.product} {o.items.length > 1 ? `+${o.items.length - 1} more` : ""}
                </h4>
                <p className="text-[10px] text-brand font-bold mt-1">₹{o.totalAmount}</p>
                <p className="text-[8px] text-muted-foreground mt-2">Ordered on: {new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Details & Tracking */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 flex flex-col h-full overflow-y-auto no-scrollbar text-left space-y-5">
        {selectedOrder ? (
          <>
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-foreground">Order Ref: {selectedOrder._id}</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5">Purchased on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              {selectedOrder.status === 'PENDING' && (
                <button onClick={() => handleCancelOrder(selectedOrder._id)} className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-100 cursor-pointer">
                  Cancel Order
                </button>
              )}
              {selectedOrder.status === 'DELIVERED' && (
                <button onClick={() => handleReturnOrder(selectedOrder._id)} className="bg-muted text-foreground border border-border text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-muted/70 cursor-pointer">
                  Request Return
                </button>
              )}
            </div>

            {/* Invoice download simulation */}
            {selectedOrder.invoiceUrl && (
              <div className="p-3 bg-muted/20 border border-border rounded-xl flex justify-between items-center shrink-0">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1"><FileText className="h-4 w-4 text-brand" /> Invoice PDF available</span>
                <button
                  onClick={() => {
                    toast.info("Opening simulated printer dialog...");
                    window.print();
                  }}
                  className="text-xs text-brand font-bold hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </button>
              </div>
            )}

            {/* Items summary */}
            <div className="space-y-2 shrink-0">
              <p className="text-xs font-bold text-muted-foreground">Order Items</p>
              <div className="space-y-1 text-xs">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between p-2.5 bg-muted/10 border rounded-lg">
                    <span className="text-foreground">{item.product} (x{item.quantity})</span>
                    <span className="font-semibold text-foreground">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address */}
            <div className="space-y-1 text-xs shrink-0 text-left">
              <p className="font-bold text-muted-foreground">Shipping Address:</p>
              <p className="text-foreground leading-relaxed">{selectedOrder.deliveryAddress}</p>
            </div>

            {/* Tracking timeline */}
            <div className="space-y-4 pt-2 flex-grow text-left">
              <p className="text-xs font-bold text-muted-foreground">Order Logistics Timeline</p>
              <div className="relative pl-6 space-y-5 border-l-2 border-border ml-2 text-xs">
                {[
                  { label: "Order Placed", desc: "Order details received and verified.", active: true },
                  { label: "Packed & Sealed", desc: "Package handed over to logistics vendor.", active: ['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) },
                  { label: "Out for Delivery", desc: "Out for transit with last mile shipper.", active: ['SHIPPED', 'DELIVERED'].includes(selectedOrder.status) },
                  { label: "Delivered", desc: "Parcel received at farm gate address.", active: selectedOrder.status === 'DELIVERED' }
                ].map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[30px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
                      step.active ? "bg-brand border-brand text-white" : "bg-card border-border text-muted-foreground"
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </span>
                    <div>
                      <h4 className={`font-bold ${step.active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center flex-col text-center space-y-3 p-6">
            <Package className="h-8 w-8 text-muted-foreground animate-pulse" />
            <h4 className="font-bold text-xs text-foreground">Select an Order to Track</h4>
            <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
              Check delivery logs, raise return tickets, or print invoices by selecting a transaction ID from the left.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
