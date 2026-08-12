import { useEffect, useState } from "react";
import { FileText, Printer, Package, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

interface OrdersTabProps {
  selectedOrder?: any;
  setSelectedOrder?: (order: any) => void;
  isActive?: boolean;
}

export function OrdersTab({ selectedOrder: propSelectedOrder, setSelectedOrder: propSetSelectedOrder, isActive }: OrdersTabProps = {}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [localSelectedOrder, setLocalSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  const selectedOrder = propSelectedOrder !== undefined ? propSelectedOrder : localSelectedOrder;
  const setSelectedOrder = propSetSelectedOrder !== undefined ? propSetSelectedOrder : setLocalSelectedOrder;

  const fetchOrders = async () => {
    try {
      const res = await apiFetch("/api/customer/orders");
      if (res.ok) {
        const data = await res.json();
        const list = data.orders || [];
        setOrders(list);

        // Restore selected order from sessionStorage
        const savedId = typeof window !== "undefined" ? sessionStorage.getItem("farmer_selected_order_id") : null;
        if (savedId && (!selectedOrder || selectedOrder._id !== savedId)) {
          const matched = list.find((o: any) => o._id === savedId);
          if (matched) {
            setSelectedOrder(matched);
          }
        }
      }
    } catch (err) {
      console.error("Error loading orders", err);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/api/customer/products");
      if (res.ok) {
        const data = await res.json();
        const mapping: Record<string, string> = {};
        data.products?.forEach((p: any) => {
          mapping[p.name] = p.imageUrl;
        });
        setProductImages(mapping);
      }
    } catch (err) {
      console.error("Error loading products mapping", err);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (isActive !== false) {
      fetchOrders();
      fetchProducts();
    }
  }, [isActive]);

  useEffect(() => {
    if (propSelectedOrder && orders.length > 0) {
      const found = orders.find((o: any) => o._id === propSelectedOrder._id);
      if (found) {
        if (!selectedOrder || selectedOrder._id !== found._id || !selectedOrder.items) {
          setSelectedOrder(found);
        }
      }
    }
  }, [propSelectedOrder, orders]);

  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdated = (data: any) => {
      apiFetch("/api/customer/orders")
        .then(res => res.ok && res.json())
        .then(resData => {
          if (resData) {
            const list = resData.orders || [];
            setOrders(list);
            if (selectedOrder && data.orderId) {
              const matched = list.find((o: any) => o._id === data.orderId);
              if (matched) {
                setSelectedOrder(matched);
              }
            }
          }
        });
    };

    socket.on("order_updated", handleOrderUpdated);
    return () => {
      socket.off("order_updated", handleOrderUpdated);
    };
  }, [socket, selectedOrder]);

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

  // Cards List View (when selectedOrder is null)
  if (!selectedOrder) {
    return (
      <div className="space-y-4 text-left">
        <h3 className="font-bold text-lg text-foreground">Order History Log</h3>
        {orders.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-soft">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-muted-foreground">No orders placed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((o: any, i: number) => {
              const isOngoing = !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status);
              
              let cardClasses = "p-5 border rounded-2xl cursor-pointer text-left transition-all relative flex flex-col justify-between h-40 bg-card hover:shadow-card hover:-translate-y-0.5 duration-200 ";
              if (isOngoing) {
                cardClasses += "bg-blue-500/[0.01] border-blue-200 hover:bg-blue-500/[0.03]";
              } else {
                cardClasses += "border-border hover:bg-muted/10";
              }

              let badgeClasses = "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ";
              if (isOngoing) {
                badgeClasses += "bg-blue-50 text-blue-700 border-blue-200/50";
              } else if (o.status === 'DELIVERED') {
                badgeClasses += "bg-emerald-50 text-emerald-700 border-emerald-200/50";
              } else {
                badgeClasses += "bg-red-50 text-red-700 border-red-200/50";
              }

              return (
                <div
                  key={i}
                  onClick={() => setSelectedOrder(o)}
                  className={cardClasses}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-foreground truncate max-w-[70%]">
                        {o.items[0]?.product} {o.items.length > 1 ? `+${o.items.length - 1} more` : ""}
                      </h4>
                      <span className={badgeClasses}>{o.status}</span>
                    </div>
                    <p className="text-xs font-black text-brand">₹{o.totalAmount}</p>
                  </div>
                  <div className="border-t border-border/60 pt-3 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Ordered: {new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="text-brand font-bold hover:underline flex items-center gap-0.5">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Order Details A to Z view (when selectedOrder is set)
  
  // Calculate active step index for the progress timeline
  const activeStepIndex = 
    selectedOrder.status === 'DELIVERED' 
      ? 3 
      : ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(selectedOrder.status)
        ? 2
        : ['ACCEPTED', 'PACKING', 'READY_TO_DISPATCH'].includes(selectedOrder.status)
          ? 1
          : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Back to list button */}
      <button
        onClick={() => setSelectedOrder(null)}
        className="flex items-center gap-2 text-xs font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer p-0"
      >
        &larr; Back to Order History
      </button>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft space-y-6">
        <div className="border-b border-border pb-4 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-lg text-foreground">Order Ref: {selectedOrder._id}</h3>
            <p className="text-xs text-muted-foreground mt-1">Purchased on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
          </div>
          {selectedOrder.invoiceUrl && (
            <button
              onClick={() => {
                toast.info("Opening simulated invoice printer...");
                window.print();
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 transition-colors text-xs font-bold rounded-xl cursor-pointer shadow-soft shrink-0"
            >
              <FileText className="h-4.5 w-4.5" /> Invoice
            </button>
          )}
        </div>

        {/* Horizontal Timeline (Placed Above Items & Address) */}
        <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 md:p-6 space-y-4">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
            Order Logistics Timeline
          </p>
          <div className="relative flex items-center justify-between w-full mt-2">
            {/* Connecting line background */}
            <div className="absolute left-0 right-0 top-3.5 h-[3px] bg-border -z-10 rounded-full" />
            
            {/* Connecting line progress fill */}
            <div 
              className="absolute left-0 top-3.5 h-[3px] bg-brand -z-10 rounded-full transition-all duration-500" 
              style={{
                width: `${(activeStepIndex / 3) * 100}%`
              }}
            />

            {[
              { label: "Order Placed", desc: "Details verified", active: true },
              { label: "Packed & Sealed", desc: "Handed to logistics", active: activeStepIndex >= 1 },
              { label: "Out for Delivery", desc: "In transit", active: activeStepIndex >= 2 },
              { label: "Delivered", desc: "Parcel received", active: activeStepIndex >= 3 }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center relative flex-1">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                  step.active 
                    ? "bg-brand border-brand text-white shadow-soft" 
                    : "bg-card border-border text-muted-foreground"
                }`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                </span>
                <div className="mt-2.5 max-w-[100px] md:max-w-[120px]">
                  <h4 className={`font-bold text-[10px] md:text-xs leading-tight ${step.active ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </h4>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug hidden sm:block">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items summary (Image, Product Name, Quantity, Price, Total) */}
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Order Items</p>
          <div className="space-y-2">
            {selectedOrder.items?.map((item: any, idx: number) => {
              const imageUrl = productImages[item.product] || "https://images.unsplash.com/photo-1599599810769-bcde5a160d32";
              return (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl shadow-soft">
                  <div className="flex items-center gap-3">
                    <img 
                      src={imageUrl} 
                      alt={item.product} 
                      className="w-14 h-14 object-cover rounded-lg border bg-muted" 
                    />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">{item.product}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Qty: {item.quantity} &times; ₹{item.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-brand">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Details */}
        {(() => {
          const subtotal = selectedOrder.items?.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0) || 0;
          const discount = Math.max(0, subtotal - selectedOrder.totalAmount);
          const hasDiscount = discount > 0;
          
          return (
            <div className="bg-card border border-border rounded-xl p-4.5 shadow-soft space-y-3">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Price Details</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Subtotal Price</span>
                  <span className="font-bold text-foreground">₹{subtotal}</span>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between text-success font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Delivery Fee</span>
                  <span className="text-success font-bold">FREE</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-extrabold text-sm">
                  <span className="text-foreground">Grand Total</span>
                  <span className="text-brand">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Delivery address */}
        <div className="space-y-2 text-xs">
          <p className="font-bold text-muted-foreground uppercase tracking-wider">Shipping Address</p>
          <div className="p-4 bg-muted/10 border border-border/60 rounded-xl">
            <p className="text-foreground leading-relaxed">{selectedOrder.deliveryAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
