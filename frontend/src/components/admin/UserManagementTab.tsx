import { useEffect, useState, useRef } from "react";
import { Search, Plus, Edit2, Trash2, Shield, UserCheck, X, MapPin, Download } from "lucide-react";
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

export function UserManagementTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  
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
        setUsers(data);
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
                  <tr key={user._id} className="hover:bg-muted/15 transition-colors">
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
                          onClick={() => openEditModal(user)}
                          className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit User"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {user.email !== 'admin@agricare.com' && (
                          <button
                            onClick={() => handleDelete(user._id)}
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
                  className="h-10 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted"
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
