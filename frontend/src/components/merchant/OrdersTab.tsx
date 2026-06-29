import { ShoppingCart, Truck, Printer } from "lucide-react";

interface OrdersTabProps {
  orders: any[];
  selectedOrder: any;
  setSelectedOrder: (o: any) => void;
  handleUpdateStatus: (id: string, status: string) => void;
  setTrackingForm: (val: any) => void;
  setIsTrackingModalOpen: (val: boolean) => void;
}

export function OrdersTab({
  orders,
  selectedOrder,
  setSelectedOrder,
  handleUpdateStatus,
  setTrackingForm,
  setIsTrackingModalOpen
}: OrdersTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Order Processing Desk</h1>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">Review pending purchases, transition status flows, print invoices, and update shipping details.</p>
      </div>

      {/* Orders Split list */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Incoming Orders</h3>
          {orders.map((o) => (
            <div
              key={o._id}
              onClick={() => setSelectedOrder(o)}
              className={`p-4 border rounded-xl shadow-soft cursor-pointer transition-all text-left ${
                selectedOrder?._id === o._id ? "border-brand bg-brand/5 shadow-md" : "border-border bg-card hover:bg-muted/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">ID: #{o._id.substring(o._id.length - 6).toUpperCase()}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                  o.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                  o.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                }`}>{o.status}</span>
              </div>
              <h4 className="text-xs font-bold text-foreground mt-2 truncate">Farmer: {o.farmerId?.name || "Customer"}</h4>
              <div className="flex items-center justify-between mt-3 border-t border-border/40 pt-2 text-[11px] font-semibold text-muted-foreground">
                <span>{o.items?.length || 0} items</span>
                <span className="text-brand font-black">₹{o.totalAmount}</span>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-10 font-semibold bg-card p-4 rounded-xl border">No orders placed.</p>
          )}
        </div>

        {/* Selected Order Detail Panel */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-card border border-border rounded-2xl shadow-soft p-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border text-left">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Order ID: #{selectedOrder._id.toUpperCase()}</h3>
                  <span className="text-[10px] text-muted-foreground font-semibold">Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedOrder.status === "PENDING" && (
                    <>
                      <button onClick={() => handleUpdateStatus(selectedOrder._id, "ACCEPTED")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Accept Order</button>
                      <button onClick={() => handleUpdateStatus(selectedOrder._id, "CANCELLED")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 bg-transparent cursor-pointer">Reject</button>
                    </>
                  )}
                  {selectedOrder.status === "ACCEPTED" && (
                    <button onClick={() => handleUpdateStatus(selectedOrder._id, "PACKING")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Start Packing</button>
                  )}
                  {selectedOrder.status === "PACKING" && (
                    <button onClick={() => handleUpdateStatus(selectedOrder._id, "READY_TO_DISPATCH")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Mark Ready for Dispatch</button>
                  )}
                  {selectedOrder.status === "READY_TO_DISPATCH" && (
                    <button
                      onClick={() => {
                        setTrackingForm({ carrierName: "", trackingNumber: "" });
                        setIsTrackingModalOpen(true);
                      }}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground hover:bg-brand/90 flex items-center gap-1 border-0 cursor-pointer"
                    >
                      <Truck className="h-3.5 w-3.5" /> Dispatch Order
                    </button>
                  )}
                  {selectedOrder.status === "SHIPPED" && (
                    <button onClick={() => handleUpdateStatus(selectedOrder._id, "DELIVERED")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500/90 border-0 cursor-pointer">Mark Delivered</button>
                  )}
                  <button onClick={() => window.print()} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground bg-transparent cursor-pointer" title="Print Invoice"><Printer className="h-4.5 w-4.5" /></button>
                </div>
              </div>

              {/* Customer info */}
              <div className="grid gap-4 sm:grid-cols-2 bg-muted/20 p-4 rounded-xl text-xs font-medium text-left">
                <div>
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Shipping Destination</h4>
                  <div className="text-foreground font-bold">{selectedOrder.farmerId?.name}</div>
                  <div className="text-muted-foreground mt-0.5">{selectedOrder.deliveryAddress}</div>
                  <div className="text-muted-foreground mt-1">Mobile: {selectedOrder.farmerId?.mobile}</div>
                </div>
                <div>
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Billing & Delivery status</h4>
                  <div>Payment Status: <span className="font-bold text-brand">{selectedOrder.paymentStatus}</span></div>
                  <div className="mt-1">Fulfillment Status: <span className="font-bold text-foreground">{selectedOrder.status}</span></div>
                  {selectedOrder.trackingNumber && (
                    <div className="mt-2 text-brand font-semibold">
                      Carrier: {selectedOrder.carrierName} <br />
                      Tracking: {selectedOrder.trackingNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border">Order Products</h4>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{item.product} <span className="text-muted-foreground font-semibold">x{item.quantity}</span></span>
                    <span className="font-bold text-foreground">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-border/40 font-black">
                  <span className="text-foreground">Total Paid Amount</span>
                  <span className="text-brand">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-soft p-12 text-center text-muted-foreground font-semibold">
              Please select an incoming order from the list to view billing and fulfill.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
