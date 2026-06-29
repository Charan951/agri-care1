interface ProfileTabProps {
  profileSecurityForm: any;
  setProfileSecurityForm: (val: any) => void;
  handleProfileSecuritySubmit: (e: React.FormEvent) => void;
}

export function ProfileTab({
  profileSecurityForm,
  setProfileSecurityForm,
  handleProfileSecuritySubmit
}: ProfileTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Profile Credentials</h1>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage merchant account security credentials and credentials settings.</p>
      </div>

      <form onSubmit={handleProfileSecuritySubmit} className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Account Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Authorized Representative Name</label>
              <input
                type="text"
                value={profileSecurityForm.name}
                onChange={(e) => setProfileSecurityForm({ ...profileSecurityForm, name: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Login Email Address</label>
              <input
                type="email"
                disabled
                value={profileSecurityForm.email}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-muted/40 text-muted-foreground px-3 text-xs outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Authorized Contact Mobile</label>
              <input
                type="text"
                value={profileSecurityForm.mobile}
                onChange={(e) => setProfileSecurityForm({ ...profileSecurityForm, mobile: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Update Password</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">Current Password</label>
              <input
                type="password"
                value={profileSecurityForm.currentPassword}
                onChange={(e) => setProfileSecurityForm({ ...profileSecurityForm, currentPassword: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">New Security Password</label>
              <input
                type="password"
                value={profileSecurityForm.newPassword}
                onChange={(e) => setProfileSecurityForm({ ...profileSecurityForm, newPassword: e.target.value })}
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
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
