import { Plus, Edit, Copy, Trash2 } from "lucide-react";

interface ProductsTabProps {
  products: any[];
  setIsProductModalOpen: (val: boolean) => void;
  setEditingProductId: (val: string | null) => void;
  setProductForm: (val: any) => void;
  setTempPreviews: (val: any[]) => void;
  handleEditProduct: (p: any) => void;
  handleDuplicateProduct: (id: string) => void;
  handleDeleteProduct: (id: string) => void;
}

export function ProductsTab({
  products,
  setIsProductModalOpen,
  setEditingProductId,
  setProductForm,
  setTempPreviews,
  handleEditProduct,
  handleDuplicateProduct,
  handleDeleteProduct
}: ProductsTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Agricultural Catalog</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Add, duplicate, edit, and configure catalog options for the marketplace.</p>
        </div>
        <button
          onClick={() => {
            setEditingProductId(null);
            setProductForm({
              name: "", category: "Fertilizer", subcategory: "", price: 100, stock: 20,
              sku: "AGR-", brand: "", mrp: 120, discount: 0, gst: 12, lowStockThreshold: 5,
              description: "", usageInstructions: "", precautions: "",
              imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500",
              imageUrls: []
            });
            setTempPreviews([]);
            setIsProductModalOpen(true);
          }}
          className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start border-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Product Item
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">SKU / Brand</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Pricing</th>
                <th className="px-6 py-4">Stock Levels</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium text-foreground">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                        <img src={p.imageUrl || "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100"} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{p.name}</h4>
                        <span className="text-[10px] text-muted-foreground font-semibold">Unit: {p.weight} {p.unit}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">
                    <div>{p.sku || "N/A"}</div>
                    <div className="text-[10px] text-brand mt-0.5">{p.brand}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">
                    <div>{p.category}</div>
                    <div className="text-[10px] mt-0.5">{p.subcategory || "General"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">₹{p.price}</div>
                    {p.mrp > p.price && (
                      <div className="text-[10px] text-muted-foreground line-through font-semibold">MRP: ₹{p.mrp}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-bold ${p.stock <= (p.lowStockThreshold || 5) ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                      {p.stock} units
                    </div>
                    {p.stock === 0 ? (
                      <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">Out of stock</span>
                    ) : p.stock <= (p.lowStockThreshold || 5) ? (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">Low stock</span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                      p.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {p.status || "PENDING"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditProduct(p)} className="p-1 text-muted-foreground hover:text-brand bg-transparent border-0 cursor-pointer" title="Edit"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDuplicateProduct(p._id)} className="p-1 text-muted-foreground hover:text-brand bg-transparent border-0 cursor-pointer" title="Duplicate"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteProduct(p._id)} className="p-1 text-muted-foreground hover:text-destructive bg-transparent border-0 cursor-pointer" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground font-semibold">No catalog products listed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
