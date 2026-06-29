import { Store } from "lucide-react";

interface StoreTabProps {
  storeProfileForm: any;
  setStoreProfileForm: (val: any) => void;
  handleStoreProfileSubmit: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => void;
  uploadingLogo: boolean;
  uploadingBanner: boolean;
}

export function StoreTab({
  storeProfileForm,
  setStoreProfileForm,
  handleStoreProfileSubmit,
  handleImageUpload,
  uploadingLogo,
  uploadingBanner
}: StoreTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Store Management</h1>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage store profiles, corporate info, banners, bank details, and pick up configuration.</p>
      </div>

      <form onSubmit={handleStoreProfileSubmit} className="space-y-6">
        {/* Store Branding */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Store Branding</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Store Logo</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl border border-border bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {storeProfileForm.storeProfile?.logoUrl ? (
                    <img src={storeProfileForm.storeProfile.logoUrl} className="h-full w-full object-cover" alt="Logo" />
                  ) : (
                    <Store className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                    id="store-logo-upload"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="store-logo-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted text-foreground"
                  >
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </label>
                  <p className="mt-1 text-[10px] text-muted-foreground font-medium">Square PNG or JPG up to 5MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">Store Banner</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-32 rounded-xl border border-border bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {storeProfileForm.storeProfile?.bannerUrl ? (
                    <img src={storeProfileForm.storeProfile.bannerUrl} className="h-full w-full object-cover" alt="Banner" />
                  ) : (
                    <div className="text-[10px] text-muted-foreground font-bold">No Banner</div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                    className="hidden"
                    id="store-banner-upload"
                    disabled={uploadingBanner}
                  />
                  <label
                    htmlFor="store-banner-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted text-foreground"
                  >
                    {uploadingBanner ? "Uploading..." : "Upload Banner"}
                  </label>
                  <p className="mt-1 text-[10px] text-muted-foreground font-medium">Landscape image up to 10MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Business Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Store / Business Name</label>
              <input
                type="text"
                value={storeProfileForm.businessName}
                onChange={(e) => setStoreProfileForm({ ...storeProfileForm, businessName: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">GSTIN Details</label>
              <input
                type="text"
                value={storeProfileForm.gstin}
                onChange={(e) => setStoreProfileForm({ ...storeProfileForm, gstin: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">PAN Details</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.pan}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: { ...storeProfileForm.storeProfile, pan: e.target.value }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">UPI ID for settlements</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.upiId}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: { ...storeProfileForm.storeProfile, upiId: e.target.value }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Bank Account */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Bank Account Parameters</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Beneficiary Name</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.bankAccount.holderName}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    bankAccount: { ...storeProfileForm.storeProfile.bankAccount, holderName: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Bank Name</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.bankAccount.bankName}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    bankAccount: { ...storeProfileForm.storeProfile.bankAccount, bankName: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Account Number</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.bankAccount.accountNumber}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    bankAccount: { ...storeProfileForm.storeProfile.bankAccount, accountNumber: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">IFSC Code</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.bankAccount.ifscCode}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    bankAccount: { ...storeProfileForm.storeProfile.bankAccount, ifscCode: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Addresses & Logistical Locations</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Corporate / Business Address</label>
              <textarea
                value={storeProfileForm.storeProfile.businessAddress}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: { ...storeProfileForm.storeProfile, businessAddress: e.target.value }
                })}
                className="mt-1.5 h-20 w-full rounded-lg border border-border bg-background text-foreground p-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Warehouse Distribution address</label>
              <textarea
                value={storeProfileForm.storeProfile.warehouseAddress}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: { ...storeProfileForm.storeProfile, warehouseAddress: e.target.value }
                })}
                className="mt-1.5 h-20 w-full rounded-lg border border-border bg-background text-foreground p-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Order Pickup location</label>
              <textarea
                value={storeProfileForm.storeProfile.pickupAddress}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: { ...storeProfileForm.storeProfile, pickupAddress: e.target.value }
                })}
                className="mt-1.5 h-20 w-full rounded-lg border border-border bg-background text-foreground p-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Business Hours</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.businessHours}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: { ...storeProfileForm.storeProfile, businessHours: e.target.value }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all border-0 cursor-pointer"
          >
            Save Store Information
          </button>
        </div>
      </form>
    </div>
  );
}
