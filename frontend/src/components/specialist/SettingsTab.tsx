import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export function SettingsTab() {
  const [settingsOldPass, setSettingsOldPass] = useState("");
  const [settingsNewPass, setSettingsNewPass] = useState("");

  const changePasswordHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsNewPass) return;
    try {
      const res = await apiFetch("/api/specialist/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: settingsOldPass,
          newPassword: settingsNewPass
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully.");
        setSettingsOldPass("");
        setSettingsNewPass("");
      } else {
        toast.error(data.message || "Failed to update password.");
      }
    } catch (err) {
      toast.error("Error updating password.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-sm border-border bg-card text-foreground">
        <CardHeader className="py-4 border-b border-border/60 text-left">
          <CardTitle className="text-sm font-bold text-emerald-800">Change Account Password</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={changePasswordHandler} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Current Password</label>
              <Input 
                type="password" 
                value={settingsOldPass} 
                onChange={(e) => setSettingsOldPass(e.target.value)} 
                required 
                className="bg-background text-foreground border-border"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">New Password</label>
              <Input 
                type="password" 
                value={settingsNewPass} 
                onChange={(e) => setSettingsNewPass(e.target.value)} 
                required 
                className="bg-background text-foreground border-border"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 border-0 cursor-pointer">
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
