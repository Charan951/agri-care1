import { Plus, Trash2 } from "lucide-react";

interface OffersTabProps {
  offers: any[];
  setIsOfferModalOpen: (val: boolean) => void;
  handleDeleteOffer: (id: string) => void;
}

export function OffersTab({ offers, setIsOfferModalOpen, handleDeleteOffer }: OffersTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Offers & Discount Campaigns</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Run seasonal discounts, coupons, combo rates, flash campaigns, and promo programs.</p>
        </div>
        <button
          onClick={() => setIsOfferModalOpen(true)}
          className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start border-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Coupon / Offer
        </button>
      </div>

      {/* Active Coupons List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => (
          <div key={o._id} className="bg-card border border-border p-5 rounded-2xl shadow-soft flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase tracking-wider">{o.type}</span>
                <button onClick={() => handleDeleteOffer(o._id)} className="text-muted-foreground hover:text-destructive p-1 bg-transparent border-0 cursor-pointer" title="Delete Campaign"><Trash2 className="h-4 w-4" /></button>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-3">{o.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{o.description || "Seasonal promo campaigns for catalog items."}</p>
              {o.code && (
                <div className="mt-3 border bg-muted/40 border-dashed border-border p-2 rounded-lg text-center text-xs font-mono font-black text-brand tracking-widest uppercase">
                  Code: {o.code}
                </div>
              )}
            </div>
            <div className="border-t border-border/40 pt-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Discount: <strong className="text-foreground">{o.discountPercentage}%</strong></span>
              <span>Min Purchase: <strong className="text-foreground">₹{o.minPurchaseAmount}</strong></span>
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-10 font-semibold bg-card p-4 rounded-xl border col-span-full">No active promotional programs launched.</p>
        )}
      </div>
    </div>
  );
}
