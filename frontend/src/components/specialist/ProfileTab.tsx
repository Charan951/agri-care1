import { useState, useEffect } from "react";
import { User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ProfileTabProps {
  user: any;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const [profileName, setProfileName] = useState("");
  const [profileMobile, setProfileMobile] = useState("");
  const [profileRegion, setProfileRegion] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileQuals, setProfileQuals] = useState("");
  const [profileLanguages, setProfileLanguages] = useState("");
  const [profileAvail, setProfileAvail] = useState<"AVAILABLE" | "UNAVAILABLE" | "ON_LEAVE">("AVAILABLE");

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileMobile(user.mobile || "");
      setProfileRegion(user.workingRegion || "");
      setProfileTitle(user.specialistTitle || "Agronomist Specialist");
      setProfileBio(user.bio || "");
      setProfileQuals(user.qualifications?.join(", ") || "");
      setProfileLanguages(user.languages?.join(", ") || "");
      setProfileAvail(user.availabilityStatus || "AVAILABLE");
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/specialist/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          mobile: profileMobile,
          workingRegion: profileRegion,
          specialistTitle: profileTitle,
          bio: profileBio,
          qualifications: profileQuals.split(",").map(q => q.trim()).filter(Boolean),
          languages: profileLanguages.split(",").map(l => l.trim()).filter(Boolean),
          availabilityStatus: profileAvail
        })
      });
      if (res.ok) {
        toast.success("Profile saved successfully.");
        // Refresh session
        window.location.reload();
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      toast.error("Error updating profile.");
    }
  };

  return (
    <Card className="shadow-sm border-border max-w-2xl mx-auto bg-card text-foreground">
      <CardHeader className="py-4 border-b border-border/60 text-left">
        <CardTitle className="text-sm font-bold text-emerald-800 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-emerald-600" />
          Manage Specialist Profile Details
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={saveProfile} className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Full Name</label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-background text-foreground border-border" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Mobile Number</label>
              <Input value={profileMobile} onChange={(e) => setProfileMobile(e.target.value)} className="bg-background text-foreground border-border" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Working Region / State</label>
              <Input value={profileRegion} onChange={(e) => setProfileRegion(e.target.value)} className="bg-background text-foreground border-border" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Specialist Professional Title</label>
              <Input value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} className="bg-background text-foreground border-border" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Qualifications (Comma separated)</label>
              <Input value={profileQuals} onChange={(e) => setProfileQuals(e.target.value)} placeholder="Ph.D. Agronomy, M.Sc Pathology" className="bg-background text-foreground border-border" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Languages Spoken (Comma separated)</label>
              <Input value={profileLanguages} onChange={(e) => setProfileLanguages(e.target.value)} placeholder="English, Hindi, Telugu" className="bg-background text-foreground border-border" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Specialist Biography</label>
            <textarea 
              value={profileBio} 
              onChange={(e) => setProfileBio(e.target.value)} 
              rows={3} 
              className="w-full text-sm rounded-lg border border-border p-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-emerald-500" 
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Availability Toggles Status</label>
            <Select 
              value={profileAvail} 
              onValueChange={(val: any) => setProfileAvail(val)}
            >
              <SelectTrigger className="w-[200px] bg-background text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available & Accepting</SelectItem>
                <SelectItem value="UNAVAILABLE">Busy / Offline</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 border-0 cursor-pointer">
              Save Profile Details
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
