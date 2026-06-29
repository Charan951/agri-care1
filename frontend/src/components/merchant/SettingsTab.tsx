interface SettingsTabProps {
  storeProfileForm: any;
  setStoreProfileForm: (val: any) => void;
  handleStoreProfileSubmit: (e: React.FormEvent) => void;
}

export function SettingsTab({
  storeProfileForm,
  setStoreProfileForm,
  handleStoreProfileSubmit
}: SettingsTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Store Preferences</h1>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">Configure store shipping thresholds, tax structures, invoice parameters, and templates.</p>
      </div>

      <form onSubmit={handleStoreProfileSubmit} className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Shipping Fee Configurations</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Shipping Method</label>
              <select
                value={storeProfileForm.storeProfile.shippingSettings.shippingType}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    shippingSettings: { ...storeProfileForm.storeProfile.shippingSettings, shippingType: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
              >
                <option value="FREE">Free shipping on all items</option>
                <option value="FLAT">Flat Rate on all orders</option>
                <option value="THRESHOLD">Free shipping above threshold</option>
              </select>
            </div>
            {storeProfileForm.storeProfile.shippingSettings.shippingType === "FLAT" && (
              <div>
                <label className="text-xs font-bold text-muted-foreground">Flat Rate Shipping Fee (₹)</label>
                <input
                  type="number"
                  value={storeProfileForm.storeProfile.shippingSettings.flatRate}
                  onChange={(e) => setStoreProfileForm({
                    ...storeProfileForm,
                    storeProfile: {
                      ...storeProfileForm.storeProfile,
                      shippingSettings: { ...storeProfileForm.storeProfile.shippingSettings, flatRate: Number(e.target.value) }
                    }
                  })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                />
              </div>
            )}
            {storeProfileForm.storeProfile.shippingSettings.shippingType === "THRESHOLD" && (
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Flat Rate (₹)</label>
                  <input
                    type="number"
                    value={storeProfileForm.storeProfile.shippingSettings.flatRate}
                    onChange={(e) => setStoreProfileForm({
                      ...storeProfileForm,
                      storeProfile: {
                        ...storeProfileForm.storeProfile,
                        shippingSettings: { ...storeProfileForm.storeProfile.shippingSettings, flatRate: Number(e.target.value) }
                      }
                    })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Free Above Threshold (₹)</label>
                  <input
                    type="number"
                    value={storeProfileForm.storeProfile.shippingSettings.freeShippingThreshold}
                    onChange={(e) => setStoreProfileForm({
                      ...storeProfileForm,
                      storeProfile: {
                        ...storeProfileForm.storeProfile,
                        shippingSettings: { ...storeProfileForm.storeProfile.shippingSettings, freeShippingThreshold: Number(e.target.value) }
                      }
                    })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Invoice Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Invoice Serial Prefix</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.invoiceSettings.invoicePrefix}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    invoiceSettings: { ...storeProfileForm.storeProfile.invoiceSettings, invoicePrefix: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Invoice Disclaimer Notes</label>
              <input
                type="text"
                value={storeProfileForm.storeProfile.invoiceSettings.invoiceNotes}
                onChange={(e) => setStoreProfileForm({
                  ...storeProfileForm,
                  storeProfile: {
                    ...storeProfileForm.storeProfile,
                    invoiceSettings: { ...storeProfileForm.storeProfile.invoiceSettings, invoiceNotes: e.target.value }
                  }
                })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all border-0 cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
