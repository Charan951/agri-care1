import { useEffect, useState, useRef } from "react";
import { Search, Plus, Edit2, Trash2, Shield, UserCheck, X, MapPin, Download, ShoppingBag, Activity, ArrowLeft, ShieldAlert, Cpu, AlertCircle, CheckCircle2, Image as ImageIcon, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'ADMIN' | 'SUPER_USER' | 'AGRI_SPECIALIST' | 'MERCHANT' | 'FARMER';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  workingRegion?: string;
  specialization?: string;
  businessName?: string;
  gstin?: string;
  createdAt: string;
}

export function UserManagementTab({
  setActiveTab,
  roleFilter: parentRoleFilter,
  setRoleFilter: parentSetRoleFilter,
}: {
  setActiveTab?: (tab: any) => void;
  roleFilter?: string;
  setRoleFilter?: (role: string) => void;
}) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [localRoleFilter, setLocalRoleFilter] = useState("");
  const roleFilter = parentRoleFilter !== undefined ? parentRoleFilter : localRoleFilter;
  const setRoleFilter = parentSetRoleFilter !== undefined ? parentSetRoleFilter : setLocalRoleFilter;

  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // User details & history states
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<any[]>([]);
  const [selectedUserReports, setSelectedUserReports] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Report details state
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [activeSheetTab, setActiveSheetTab] = useState<"profile" | "questionnaire" | "gallery" | "diagnosis">("profile");

  const parseFarmerResponses = (symptomsStr?: string) => {
    const responses: Record<string, string> = {};
    if (!symptomsStr) return responses;
    const parts = symptomsStr.split("Farmer Responses:");
    if (parts[1]) {
      const lines = parts[1].split(/[•\n]/);
      lines.forEach((line: string) => {
        const cleanLine = line.trim();
        if (cleanLine && cleanLine.includes(":")) {
          const colonIdx = cleanLine.indexOf(":");
          const k = cleanLine.substring(0, colonIdx).trim().toLowerCase();
          const v = cleanLine.substring(colonIdx + 1).trim();
          responses[k] = v;
        }
      });
    }
    return responses;
  };

  const fetchUserDetails = async (userId: string, userRole: string) => {
    setLoadingDetails(true);
    try {
      let ordersData = [];
      let reportsData = [];

      if (userRole === "MERCHANT") {
        // For merchant, get orders they sold
        const ordersRes = await fetch(`/api/admin/orders?merchantId=${userId}`);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          ordersData = data.orders || data;
        }
      } else if (userRole === "AGRI_SPECIALIST") {
        // For specialist, get reports assigned to them
        const reportsRes = await fetch(`/api/admin/reports?assignedSpecialistId=${userId}`);
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          reportsData = data.reports || data;
        }
      } else {
        // For farmer and others, get their orders and reports
        const ordersRes = await fetch(`/api/admin/orders?farmerId=${userId}`);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          ordersData = data.orders || data;
        }
        const reportsRes = await fetch(`/api/admin/reports?farmerId=${userId}`);
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          reportsData = data.reports || data;
        }
      }

      setSelectedUserOrders(ordersData);
      setSelectedUserReports(reportsData);
    } catch (error) {
      console.error("Failed to fetch user details", error);
      toast.error("Failed to load user's history.");
    } finally {
      setLoadingDetails(false);
    }
  };
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<UserRecord['role']>("FARMER");
  const [status, setStatus] = useState<UserRecord['status']>("ACTIVE");
  const [workingRegion, setWorkingRegion] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/users?role=${roleFilter}&search=${search}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || data);
      } else {
        toast.error("Failed to load users.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "AgriCareAdminPortal/1.0"
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    const toastId = toast.loading("Retrieving GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss(toastId);
        const { latitude, longitude } = position.coords;
        
        // Move map and marker if instances exist
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        setWorkingRegion("Resolving address...");
        const address = await reverseGeocode(latitude, longitude);
        setWorkingRegion(address);
        toast.success("Location address successfully resolved!");
      },
      (error) => {
        toast.dismiss(toastId);
        toast.error("Unable to retrieve location. Please type manually.");
      }
    );
  };

  useEffect(() => {
    if (!isModalOpen || role !== "MERCHANT") {
      return;
    }

    const L = (window as any).L;
    if (!L) {
      console.warn("Leaflet L is not loaded yet.");
      return;
    }

    // Small delay to ensure the DOM element is mounted and animation is complete
    const timer = setTimeout(() => {
      const container = document.getElementById("merchant-map");
      if (!container) return;

      // Parse existing coords if valid
      let center: [number, number] = [18.5204, 73.8567]; // default Pune
      if (workingRegion && workingRegion.includes(",")) {
        const parts = workingRegion.split(",");
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          center = [lat, lng];
        }
      }

      // Initialize map
      const map = L.map("merchant-map").setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Custom Leaflet Marker Icon to avoid Vite asset issues
      const defaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Add draggable marker
      const marker = L.marker(center, { icon: defaultIcon, draggable: true }).addTo(map);
      
      // Listen to marker dragend
      marker.on("dragend", async () => {
        const position = marker.getLatLng();
        setWorkingRegion("Resolving address...");
        const address = await reverseGeocode(position.lat, position.lng);
        setWorkingRegion(address);
      });

      // Listen to map click to reposition marker
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setWorkingRegion("Resolving address...");
        const address = await reverseGeocode(lat, lng);
        setWorkingRegion(address);
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Force size update to fix Leaflet rendering bug inside modals
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }, 350);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [isModalOpen, role]);

  const openCreateModal = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setMobile("");
    setRole("FARMER");
    setStatus("ACTIVE");
    setWorkingRegion("");
    setSpecialization("");
    setBusinessName("");
    setGstin("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Keep password blank unless changing
    setMobile(user.mobile);
    setRole(user.role);
    setStatus(user.status);
    setWorkingRegion(user.workingRegion || "");
    setSpecialization(user.specialization || "");
    setBusinessName(user.businessName || "");
    setGstin(user.gstin || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name,
      email,
      mobile,
      role,
      status,
      workingRegion,
      specialization,
      businessName,
      gstin: role === "MERCHANT" ? "" : gstin
    };

    if (password) {
      payload.password = password;
    }

    try {
      let response;
      if (editingUser) {
        response = await fetch(`/api/admin/users/${editingUser._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (response.ok) {
        toast.success(editingUser ? "User updated successfully." : "User created successfully.");
        setIsModalOpen(false);
        fetchUsers();
      } else {
        toast.error(data.message || "Failed to save user.");
      }
    } catch (err) {
      toast.error("An error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("User deleted successfully.");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete user.");
      }
    } catch (err) {
      toast.error("Error connecting to server.");
    }
  };

  const handleExportExcel = () => {
    if (users.length === 0) {
      toast.error("No users to export.");
      return;
    }

    // Define headers
    const headers = ["Name", "Email", "Mobile", "Role", "Status", "Business Name", "GSTIN", "Expertise/Region", "Registered Date"];
    
    // Map users to rows
    const rows = users.map(user => [
      user.name,
      user.email,
      user.mobile,
      user.role,
      user.status,
      user.businessName || "",
      user.gstin || "",
      user.role === "AGRI_SPECIALIST" ? (user.specialization || "") : (user.workingRegion || ""),
      new Date(user.createdAt).toLocaleDateString()
    ]);

    // Construct CSV content (RFC 4180 compliant)
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const roleLabel = roleFilter ? roleFilter.toLowerCase() : "all_roles";
    link.setAttribute("href", url);
    link.setAttribute("download", `agricare_users_${roleLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Users list exported successfully as CSV!");
  };

  return (
    <div className="space-y-6">
      {selectedReport ? (
        <div className="space-y-6 animate-fade-in bg-card p-6 rounded-2xl border border-border shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand transition-colors cursor-pointer w-fit"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Reports
              </button>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Case File</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground m-0 mt-0.5">
                    {(selectedReport.cropName || "CROP").toUpperCase()} DIAGNOSIS SHEET
                  </h2>
                </div>
                <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-md border border-border/60">
                  ID: {selectedReport._id}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                  selectedReport.status === 'RESOLVED' || selectedReport.status === 'CLOSED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                    : selectedReport.status === 'ASSIGNED'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50'
                      : 'bg-orange-50 text-orange-700 border-orange-200/50'
                }`}>
                  {selectedReport.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-1.5 pb-2.5">
                {[
                  { id: "profile", label: "1. Farmer Profile" },
                  { id: "questionnaire", label: "2. Crop Questionnaire" },
                  { id: "gallery", label: "3. Leaf Image Gallery" },
                  { id: "diagnosis", label: "4. Diagnosis & Prescriptions" }
                ].map((tabItem) => (
                  <button
                    key={tabItem.id}
                    onClick={() => setActiveSheetTab(tabItem.id as any)}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl cursor-pointer transition-all border-0 flex-shrink-0 ${
                      activeSheetTab === tabItem.id
                        ? "bg-brand text-brand-foreground shadow-soft"
                        : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeSheetTab === "profile" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                      <UserCheck className="h-4.5 w-4.5 text-brand" />
                      <span className="font-extrabold text-xs text-foreground">Farmer Profile Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farmer Name</p>
                        <p className="font-bold text-foreground mt-0.5">{selectedReport.farmerId?.name || "Unknown Farmer"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Mobile Number</p>
                        <p className="font-bold text-foreground mt-0.5">{selectedReport.farmerId?.mobile || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                        <p className="font-bold text-foreground mt-0.5 truncate" title={selectedReport.farmerId?.email || ""}>{selectedReport.farmerId?.email || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">District / State</p>
                        <p className="font-bold text-foreground mt-0.5">{(selectedReport.farmerId as any)?.district || "Pune, Maharashtra"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Village</p>
                        <p className="font-bold text-foreground mt-0.5">{(selectedReport.farmerId as any)?.village || "Wadgaon"}</p>
                      </div>
                      <div className="p-3 bg-muted/10 border border-border/50 rounded-xl">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Farm Size</p>
                        <p className="font-bold text-foreground mt-0.5">{(selectedReport.farmerId as any)?.farmSize || "12 Acres"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeSheetTab === "questionnaire" && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-1.5 border-b border-border/40 pb-1">
                      <CheckCircle2 className="h-4.5 w-4.5 text-brand" />
                      <span className="font-extrabold text-xs text-foreground">Crop Information & Symptoms Questionnaire</span>
                    </div>
                    {(() => {
                      const responses = parseFarmerResponses(selectedReport.symptoms);
                      const farmerSymptoms = selectedReport.symptoms.split("Farmer Responses:")[0]?.trim() || selectedReport.symptoms;
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Crop Name</span>
                              <span className="font-bold text-foreground mt-0.5 block">{selectedReport.cropName}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Growth Stage</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["growth stage"] || responses["stage"] || "Flowering"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Sowing / Apply Date</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["fertilizer apply date"] || responses["date"] || new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Irrigation Method</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["irrigation method"] || "Drip Irrigation"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Pesticides Sprayed</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["pesticide used"] || "Not specified"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Soil Type</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["soil type"] || (selectedReport.farmerId as any)?.soilTexture || "Clay Black"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Weather Conditions</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["weather conditions"] || "Humid"}</span>
                            </div>
                            <div className="p-2.5 bg-muted/10 border border-border/40 rounded-xl">
                              <span className="text-[9px] font-bold text-muted-foreground block uppercase">Disease Duration</span>
                              <span className="font-bold text-foreground mt-0.5 block">{responses["disease duration"] || "1-2 Days"}</span>
                            </div>
                          </div>

                          <div className="p-3.5 bg-brand/[0.02] border border-brand/10 rounded-xl text-xs space-y-1.5 text-left">
                            <span className="text-[9px] font-extrabold text-brand uppercase tracking-wider">Farmer Stated Symptoms</span>
                            <p className="text-muted-foreground leading-relaxed m-0">{farmerSymptoms || "N/A"}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeSheetTab === "gallery" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="font-extrabold text-xs text-foreground">Initial Inspection Leaf Scans</span>
                        <button
                          onClick={() => toast.info("Downloading case images...")}
                          className="text-[10px] font-bold text-brand hover:underline bg-transparent border-0 cursor-pointer p-0"
                        >
                          Download Case Images
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="col-span-2 sm:col-span-2 relative rounded-xl overflow-hidden border border-border/80 aspect-video bg-muted shadow-soft">
                          <img
                            src={selectedReport.imageUrl}
                            alt="Primary Scan"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-[8px] font-bold text-white rounded uppercase tracking-wider">
                            Primary Leaf Scan
                          </span>
                        </div>

                        {[
                          "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=300",
                          selectedReport.imageUrl,
                          "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80&w=300",
                          "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=300"
                        ].map((imgUrl, thumbIdx) => (
                          <div
                            key={thumbIdx}
                            className="col-span-1 relative rounded-lg overflow-hidden border border-border/80 aspect-square bg-muted cursor-pointer hover:border-brand transition-colors"
                          >
                            <img
                              src={imgUrl}
                              alt={`Leaf Detail ${thumbIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-[6px] font-bold text-white px-1 rounded-sm">
                              Zoom
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSheetTab === "diagnosis" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-brand-soft/20 rounded-xl border border-brand/20 p-6 shadow-soft hover:shadow-card transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-brand/10 pb-4">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-brand" />
                          <span className="text-sm font-extrabold text-brand uppercase tracking-wider">
                            Computer Vision AI Diagnosis
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold bg-brand/10 text-brand px-3 py-1 rounded-full border border-brand/20">
                          {Math.round(selectedReport.aiPrediction.confidence * 100)}% Confidence Match
                        </span>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-lg font-bold text-foreground">
                          {selectedReport.aiPrediction.disease}
                        </h5>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="bg-muted text-muted-foreground text-[9px] font-bold px-2.5 py-1 rounded uppercase border border-border/60">Crop: {selectedReport.cropName}</span>
                          <span className="bg-red-50 text-red-600 text-[9px] font-bold px-2.5 py-1 rounded uppercase border border-red-200/40">Severity: High</span>
                          <span className="bg-yellow-50 text-yellow-700 text-[9px] font-bold px-2.5 py-1 rounded uppercase border border-yellow-200/40">Risk: Moderate</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs border-t border-brand/10 pt-4 mt-4">
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Possible Causes</span>
                            <p className="text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.causes || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Observed Symptoms</span>
                            <p className="text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.symptomsDetail || selectedReport.aiPrediction.symptoms || selectedReport.symptoms || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wide">Preventive Measures</span>
                            <p className="text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.prevention || "N/A"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand/10 mt-4">
                          <div className="p-3.5 bg-card border border-border rounded-xl space-y-2 text-left">
                            <p className="font-bold text-brand text-xs">Chemical Fungicide treatment</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedReport.aiPrediction.pesticides || []).map((pest: string, idx: number) => (
                                <span key={idx} className="bg-brand/10 text-brand text-[9px] font-bold px-2.5 py-0.5 rounded border border-brand/20">{pest}</span>
                              ))}
                              {(selectedReport.aiPrediction.fertilizers || []).map((fert: string, idx: number) => (
                                <span key={idx} className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2.5 py-0.5 rounded border border-blue-200/40">{fert}</span>
                              ))}
                            </div>
                            {selectedReport.aiPrediction.dosage && (
                              <p className="text-[10px] text-muted-foreground mt-2"><span className="font-bold">Dosage:</span> {selectedReport.aiPrediction.dosage}</p>
                            )}
                            {selectedReport.aiPrediction.recoveryTimeline && (
                              <p className="text-[10px] text-muted-foreground"><span className="font-bold">Spray Schedule:</span> {selectedReport.aiPrediction.recoveryTimeline}</p>
                            )}
                          </div>

                          <div className="p-3.5 bg-card border border-border rounded-xl space-y-2 text-left">
                            <p className="font-bold text-emerald-600 text-xs">Organic Remedy alternatives</p>
                            <p className="text-[11px] text-foreground leading-relaxed font-medium">{selectedReport.aiPrediction.organicTreatment || "N/A"}</p>
                            {selectedReport.aiPrediction.applicationMethod && (
                              <p className="text-[10px] text-muted-foreground mt-2"><span className="font-bold">Application Method:</span> {selectedReport.aiPrediction.applicationMethod}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6 shadow-soft hover:shadow-card transition-shadow">
                      <div className="flex items-center gap-2 border-b border-border/80 pb-4 mb-4">
                        <UserCheck className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
                          Agronomist Specialist Review
                        </span>
                      </div>

                      {selectedReport.specialistDiagnosis ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Diagnosed Disease
                              </span>
                              <p className="text-base font-bold text-foreground mt-0.5">
                                {selectedReport.specialistDiagnosis.disease}
                              </p>
                            </div>
                            {selectedReport.assignedSpecialistId && typeof selectedReport.assignedSpecialistId === 'object' && (selectedReport.assignedSpecialistId as any).name && (
                              <div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Diagnosed By
                                </span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">
                                  {(selectedReport.assignedSpecialistId as any).name} ({(selectedReport.assignedSpecialistId as any).specialization || "General Specialist"})
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Diagnosis Details & Instructions
                            </span>
                            <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed bg-muted/10 p-4 rounded-lg border border-border">
                              {selectedReport.specialistDiagnosis.diagnosis}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                              Prescribed Treatments
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {selectedReport.specialistDiagnosis.pesticides.map((pest: string, i: number) => (
                                <span key={i} className="rounded-lg bg-muted px-3 py-1 text-xs font-semibold text-foreground border border-border">
                                  {pest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-500/5 text-amber-700 p-5 rounded-xl border border-amber-500/20">
                          <AlertCircle className="h-8 w-8 shrink-0 text-amber-600" />
                          <div className="flex-1 text-center sm:text-left">
                            <h5 className="font-bold text-sm">Review Pending</h5>
                            <p className="text-xs text-amber-600/90 mt-0.5">
                              This report has not been diagnosed by an agronomist yet.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-start border-b border-border pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground m-0">
                      {(selectedReport.assignedSpecialistId as any)?.name || "Agronomist Expert"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(selectedReport.assignedSpecialistId as any)?.specialization || "Crop Protection"}
                    </p>
                  </div>
                  {(selectedReport.status === "ASSIGNED" || selectedReport.status === "OPEN") && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse shrink-0" title="Active" />
                  )}
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Report Priority</span>
                    <span className={`font-bold ${
                      selectedReport.priority === 'HIGH' ? 'text-red-600' :
                      selectedReport.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                    }`}>{selectedReport.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-semibold">Submitted</span>
                    <span className="font-bold text-foreground">
                      {new Date(selectedReport.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border/80 pb-3 mb-4">
                  Farmer Contact
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                    {selectedReport.farmerId?.name ? selectedReport.farmerId.name[0].toUpperCase() : 'F'}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-foreground truncate" title={selectedReport.farmerId?.name || ""}>
                      {selectedReport.farmerId?.name || "Unknown Farmer"}
                    </h5>
                    <span className="text-[10px] text-muted-foreground">AgriCare Registered Farmer</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`mailto:${selectedReport.farmerId?.email}`} className="hover:underline text-foreground/90 truncate">
                      {selectedReport.farmerId?.email || "No Email"}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a href={`tel:${selectedReport.farmerId?.mobile}`} className="hover:underline text-foreground/90">
                      {selectedReport.farmerId?.mobile || "No Mobile"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : selectedUser ? (
        <div className="space-y-6 animate-fade-in bg-card p-6 rounded-2xl border border-border shadow-soft">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand transition-colors cursor-pointer w-fit"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to User Management
              </button>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  User Profile & History
                </h2>
                <span className="text-xs font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-md border border-border/60">
                  ID: {selectedUser._id}
                </span>
              </div>
            </div>
          </div>

          {/* User Info Header */}
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center border-b border-border/80 pb-5 mb-6">
            <div className="h-16 w-16 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-2xl shrink-0">
              {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  selectedUser.role === 'ADMIN' ? 'bg-red-500/10 text-red-600' :
                  selectedUser.role === 'SUPER_USER' ? 'bg-amber-500/10 text-amber-600' :
                  selectedUser.role === 'AGRI_SPECIALIST' ? 'bg-indigo-500/10 text-indigo-600' :
                  selectedUser.role === 'MERCHANT' ? 'bg-emerald-500/10 text-emerald-600' :
                  'bg-blue-500/10 text-blue-600'
                }`}>
                  {selectedUser.role.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  selectedUser.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                  selectedUser.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-red-500/10 text-red-600'
                }`}>
                  {selectedUser.status}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Email: <a href={`mailto:${selectedUser.email}`} className="text-foreground hover:underline font-medium">{selectedUser.email}</a></span>
                <span className="hidden sm:inline text-muted-foreground/40">•</span>
                <span>Mobile: <a href={`tel:${selectedUser.mobile}`} className="text-foreground hover:underline font-medium">{selectedUser.mobile}</a></span>
                <span className="hidden sm:inline text-muted-foreground/40">•</span>
                <span>Registered: <span className="text-foreground font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></span>
              </div>
            </div>
          </div>

          {/* Main Tabs/Grid Content */}
          <div className={`grid gap-6 ${selectedUser.role === "AGRI_SPECIALIST" || selectedUser.role === "MERCHANT" ? "grid-cols-1" : "md:grid-cols-2"}`}>
            {/* LEFT COLUMN: Show only if role is not AGRI_SPECIALIST */}
            {selectedUser.role !== "AGRI_SPECIALIST" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3 mb-2">
                  <ShoppingBag className="h-5 w-5 text-brand" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {selectedUser.role === "MERCHANT" ? "Orders Sold" : "Order History"}
                  </h4>
                  <span className="ml-auto text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/60">
                    {selectedUserOrders.length} {selectedUserOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                {loadingDetails ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    Loading orders...
                  </div>
                ) : selectedUserOrders.length > 0 ? (
                  <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1 no-scrollbar">
                    {selectedUserOrders.map((order) => (
                      <div 
                        key={order._id} 
                        onClick={() => {
                          if (setActiveTab) {
                            sessionStorage.setItem("admin_order_search", order._id);
                            setSelectedUser(null);
                            setActiveTab("orders");
                          }
                        }}
                        className="p-4 rounded-xl border border-border bg-muted/10 hover:border-brand/40 hover:bg-brand/5 transition-all text-xs space-y-2.5 cursor-pointer group animate-fade-in"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-semibold text-foreground/80 group-hover:text-brand transition-colors">ID: {order._id.substring(order._id.length - 8).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-600' :
                            order.status === 'SHIPPED' ? 'bg-indigo-500/10 text-indigo-600' :
                            order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-foreground font-semibold leading-relaxed">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between py-0.5">
                              <span>{item.product} × {item.quantity}</span>
                              <span className="text-muted-foreground font-mono">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                          <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-xs font-bold text-foreground">Total: ₹{order.totalAmount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    {selectedUser.role === "MERCHANT" ? "No orders sold by this merchant yet." : "No orders placed by this user yet."}
                  </div>
                )}
              </div>
            )}

            {/* RIGHT COLUMN: Show only if role is not MERCHANT */}
            {selectedUser.role !== "MERCHANT" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/80 pb-3 mb-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {selectedUser.role === "AGRI_SPECIALIST" ? "Assigned Reports" : "Disease History"}
                  </h4>
                  <span className="ml-auto text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/60">
                    {selectedUserReports.length} {selectedUserReports.length === 1 ? 'report' : 'reports'}
                  </span>
                </div>

                {loadingDetails ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    Loading reports...
                  </div>
                ) : selectedUserReports.length > 0 ? (
                  <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1 no-scrollbar">
                    {selectedUserReports.map((report) => (
                      <div 
                        key={report._id} 
                        onClick={() => {
                          setSelectedReport(report);
                          setActiveSheetTab("profile");
                        }}
                        className="p-4 rounded-xl border border-border bg-muted/10 hover:border-brand/40 hover:bg-brand/5 transition-all text-xs space-y-2 cursor-pointer group animate-fade-in"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand uppercase group-hover:text-brand-dark transition-colors">{report.cropName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            report.status === 'RESOLVED' || report.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-600' :
                            report.status === 'ASSIGNED' ? 'bg-indigo-500/10 text-indigo-600' :
                            'bg-orange-500/10 text-orange-600'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-foreground/90 font-medium line-clamp-2">Symptoms: "{report.symptoms}"</p>
                        
                        {/* Diagnosis */}
                        <div className="bg-card border border-border/80 p-2.5 rounded-lg space-y-1 mt-1 text-[11px]">
                          <div className="font-semibold text-foreground">AI Prediction:</div>
                          <div className="text-muted-foreground">{report.aiPrediction.disease} ({Math.round(report.aiPrediction.confidence * 100)}% match)</div>
                          {report.specialistDiagnosis && (
                            <>
                              <div className="font-semibold text-foreground mt-1.5 border-t border-border/40 pt-1.5">Agronomist Diagnosis:</div>
                              <div className="text-muted-foreground font-semibold text-brand-dark">{report.specialistDiagnosis.disease}</div>
                              <div className="text-muted-foreground line-clamp-2 mt-0.5">{report.specialistDiagnosis.diagnosis}</div>
                            </>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1">
                          <span>Date: {new Date(report.createdAt).toLocaleDateString()}</span>
                          <span className={`font-bold ${
                            report.priority === 'HIGH' ? 'text-red-600' :
                            report.priority === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                          }`}>{report.priority} Priority</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    {selectedUser.role === "AGRI_SPECIALIST" ? "No reports assigned to this specialist yet." : "No disease reports submitted by this user."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* FILTER & ACTIONS BAR */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border border-border shadow-soft">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-muted/30 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none"
              >
                <option value="">All Roles</option>
                <option value="FARMER">Farmers</option>
                <option value="MERCHANT">Merchants</option>
                <option value="AGRI_SPECIALIST">Specialists</option>
                <option value="SUPER_USER">Super Users</option>
                <option value="ADMIN">Admins</option>
              </select>

              <button
                onClick={handleExportExcel}
                className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>

              <button
                onClick={openCreateModal}
                className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
              >
                <Plus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Scope / Specs</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                          Loading users list...
                        </div>
                      </td>
                    </tr>
                  ) : users.length ? (
                    users.map((user) => (
                      <tr 
                        key={user._id} 
                        onClick={() => {
                          setSelectedUser(user);
                          fetchUserDetails(user._id, user.role);
                        }}
                        className="hover:bg-muted/15 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{user.mobile}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                            user.role === 'ADMIN' ? 'bg-red-500/10 text-red-600' :
                            user.role === 'SUPER_USER' ? 'bg-amber-500/10 text-amber-600' :
                            user.role === 'AGRI_SPECIALIST' ? 'bg-indigo-500/10 text-indigo-600' :
                            user.role === 'MERCHANT' ? 'bg-emerald-500/10 text-emerald-600' :
                            'bg-blue-500/10 text-blue-600'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' :
                            user.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
                          {user.role === 'MERCHANT' && (
                            <div>
                              <div className="font-bold text-foreground">{user.businessName || 'N/A'}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">GSTIN: {user.gstin || 'N/A'}</div>
                              <div className="text-[10px] text-brand mt-0.5 font-semibold">Location: {user.workingRegion || 'N/A'}</div>
                            </div>
                          )}
                          {user.role === 'AGRI_SPECIALIST' && (
                            <div className="text-foreground">{user.specialization || 'N/A'}</div>
                          )}
                          {(user.role === 'FARMER' || user.role === 'SUPER_USER') && (
                            <div className="text-foreground">{user.workingRegion || 'N/A'}</div>
                          )}
                          {user.role === 'ADMIN' && <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(user);
                              }}
                              className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Edit User"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {user.email !== 'admin@agricare.com' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(user._id);
                                }}
                                className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                                title="Delete User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        No users found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CREATE / EDIT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lift relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              {editingUser ? "Modify User Credentials & Profile" : "Register New Staff/User Account"}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">User Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="FARMER">Farmer</option>
                    <option value="MERCHANT">Merchant</option>
                    <option value="AGRI_SPECIALIST">Agronomist Specialist</option>
                    <option value="SUPER_USER">Super User Staff</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground">
                  Password {editingUser && "(Leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "••••••••" : "AgriCare@123"}
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              {/* DYNAMIC FIELDS BASED ON ROLE */}
              {role === "MERCHANT" && (
                <div className="space-y-4 border-t border-border pt-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">Business Name</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground flex justify-between items-center">
                      <span>Store Location / Address *</span>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="text-xs text-brand hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="h-3 w-3" /> Get Current Location
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra-Pune, or Lat/Long coordinates"
                      value={workingRegion}
                      onChange={(e) => setWorkingRegion(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                    />

                    {/* Live Street Map Container */}
                    <div className="mt-2.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Live Street Map (Drag marker or click map to select exact location)</span>
                      <div 
                        id="merchant-map" 
                        className="h-44 w-full rounded-lg border border-border mt-1 bg-muted/20 relative z-10"
                        style={{ minHeight: '176px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {role === "AGRI_SPECIALIST" && (
                <div className="border-t border-border pt-4">
                  <label className="text-xs font-bold text-muted-foreground">Specialist Expertise / Degree</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plant Pathology & Soil Fungi"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              )}

              {(role === "FARMER" || role === "SUPER_USER") && (
                <div className="border-t border-border pt-4">
                  <label className="text-xs font-bold text-muted-foreground">
                    {role === "SUPER_USER" ? "Assigned Territory / Region" : "Farmer District / Region"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra-Pune"
                    value={workingRegion}
                    onChange={(e) => setWorkingRegion(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-muted/10 px-3 text-sm outline-none"
                  />
                </div>
              )}

              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 cursor-pointer rounded-lg bg-brand px-5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  {editingUser ? "Save Changes" : "Register User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
