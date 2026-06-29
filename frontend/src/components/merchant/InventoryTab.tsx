import { Plus } from "lucide-react";
import { toast } from "sonner";

interface InventoryTabProps {
  products: any[];
  inventoryLogs: any[];
  setIsStockModalOpen: (val: boolean) => void;
  setStockForm: (val: any) => void;
}

export function InventoryTab({
  products,
  inventoryLogs,
  setIsStockModalOpen,
  setStockForm
}: InventoryTabProps) {
  const outOfStock = products.filter(p => p.stock === 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Inventory Logs & Adjustments</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Perform immediate inventory corrections and track stock history logs.</p>
        </div>
        <button
          onClick={() => {
            if (products.length === 0) {
              toast.error("Please add products first before adjusting stock.");
              return;
            }
            setStockForm({
              productId: products[0]._id, type: "IN", quantity: 10, reason: "Restocking Catalog", batchNumber: "BCH-01", warehouseName: "Main Warehouse"
            });
            setIsStockModalOpen(true);
          }}
          className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start border-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Post Stock Adjustment
        </button>
      </div>

      {/* Stock Alerts Overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Out of Stock Alerts</h3>
          <div className="space-y-2">
            {outOfStock.map(p => (
              <div key={p._id} className="flex items-center justify-between text-xs border bg-destructive/5 border-destructive/10 p-2.5 rounded-lg">
                <span className="font-bold text-foreground">{p.name}</span>
                <span className="font-bold text-destructive">0 Left</span>
              </div>
            ))}
            {outOfStock.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No products are currently out of stock.</p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Low Stock Warnings</h3>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p._id} className="flex items-center justify-between text-xs border bg-amber-500/5 border-amber-500/10 p-2.5 rounded-lg">
                <span className="font-bold text-foreground">{p.name}</span>
                <span className="font-bold text-amber-700">{p.stock} units left</span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No products are currently low in stock.</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock Logs */}
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inventory Change Log History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Qty Change</th>
                <th className="px-6 py-4">Reason / Batch</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium text-foreground">
              {inventoryLogs.map((log) => (
                <tr key={log._id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{log.productId?.name || "Deleted Product"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.type === "IN" ? "bg-emerald-100 text-emerald-800" :
                      log.type === "OUT" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{log.quantity} units</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <div>{log.reason}</div>
                    {log.batchNumber && <div className="text-[9px] text-brand">Batch: {log.batchNumber}</div>}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{log.warehouseName || "Default Warehouse"}</td>
                  <td className="px-6 py-4 text-muted-foreground/80 font-semibold">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {inventoryLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-semibold">No stock movement logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
