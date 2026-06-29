import { useEffect, useState, useRef, useCallback } from "react";
import { Trash2, RefreshCw, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const cropList = [
  "Paddy (Rice)", "Tomato", "Potato", "Maize", "Chilli",
  "Onion", "Groundnut", "Mango", "Banana", "Cucumber",
  "Brinjal", "Sunflower", "Cotton", "Sugarcane"
];

export function ProfileTab() {
  const { refreshProfile } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit Profile Inputs
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editLanguage, setEditLanguage] = useState("English");
  const [editAvatar, setEditAvatar] = useState("");

  // Change Password Inputs
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Saved Address Inputs
  const [newAddressStreet, setNewAddressStreet] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressState, setNewAddressState] = useState("");
  const [newAddressPincode, setNewAddressPincode] = useState("");
  const [newAddressLabel, setNewAddressLabel] = useState("Home");

  // Add Farm Inputs
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmSize, setNewFarmSize] = useState("");
  const [newFarmSoil, setNewFarmSoil] = useState("Black Clay");
  const [newFarmCrop, setNewFarmCrop] = useState("Cotton");
  const [newFarmLoc, setNewFarmLoc] = useState("");

  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRefInstance = useRef<any>(null);
  const markerRefInstance = useRef<any>(null);

  // Dynamic Leaflet CSS/JS loader from CDN
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || "";
        const city = addr.city || addr.town || addr.city_district || addr.county || "";
        const state = addr.state || "";
        const pincode = addr.postcode || "";

        setNewAddressStreet(street);
        setNewAddressCity(city);
        setNewAddressState(state);
        setNewAddressPincode(pincode);
      }
    } catch (err) {
      console.error("Reverse geocoding error", err);
    }
  };

  // Callback Ref that initializes the Leaflet map as soon as the DOM node mounts, preventing "Map container not found" errors.
  const mapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node === null) {
      if (mapRefInstance.current) {
        mapRefInstance.current.remove();
        mapRefInstance.current = null;
        markerRefInstance.current = null;
      }
      return;
    }

    if (!leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    if ((node as any)._leaflet_id) return;

    // Set custom icon paths using direct unpkg URLs
    const DefaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    const initialLat = latitude || 17.3850;
    const initialLng = longitude || 78.4867;

    const map = L.map(node).setView([initialLat, initialLng], 13);
    mapRefInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true
    }).addTo(map);
    markerRefInstance.current = marker;

    // Event listener for dragging pin marker
    marker.on("dragend", async () => {
      const position = marker.getLatLng();
      setLatitude(position.lat);
      setLongitude(position.lng);
      await reverseGeocode(position.lat, position.lng);
    });

    // Event listener for clicking map to place marker pin
    map.on("click", async (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      marker.setLatLng([lat, lng]);
      setLatitude(lat);
      setLongitude(lng);
      await reverseGeocode(lat, lng);
    });
  }, [leafletLoaded]);

  // Synchronize map center and marker coordinates on GPS fetch
  useEffect(() => {
    if (mapRefInstance.current && markerRefInstance.current && latitude && longitude) {
      mapRefInstance.current.setView([latitude, longitude], 15);
      markerRefInstance.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const fetchExactLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en"
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            
            // Map address details
            const street = addr.road || addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || "";
            const city = addr.city || addr.town || addr.city_district || addr.county || "";
            const state = addr.state || "";
            const pincode = addr.postcode || "";

            setNewAddressStreet(street);
            setNewAddressCity(city);
            setNewAddressState(state);
            setNewAddressPincode(pincode);
            setLatitude(latitude);
            setLongitude(longitude);
            toast.success("Location fetched successfully!");
          } else {
            toast.error("Failed to reverse geocode location");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error fetching address details");
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error(error.message || "Failed to get your current location");
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const loadProfileData = async () => {
    try {
      const res = await apiFetch("/api/customer/profile");
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        setFarms(data.user.farms || []);
        
        setEditName(data.user.name || "");
        setEditMobile(data.user.mobile || "");
        setEditRegion(data.user.workingRegion || "");
        setEditLanguage(data.user.preferredLanguage || "English");
        setEditAvatar(data.user.avatarUrl || "");
      }
    } catch (err) {
      console.error("Error loading profile details", err);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          workingRegion: editRegion,
          preferredLanguage: editLanguage,
          avatarUrl: editAvatar,
          savedAddresses: profileData?.savedAddresses
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        toast.success("Profile details updated successfully!");
        refreshProfile();
        setIsEditingProfile(false);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Profile update error.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (res.ok) {
        toast.success("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
      } else {
        const err = await res.json();
        toast.error(err.message || "Invalid password update credentials");
      }
    } catch (err) {
      toast.error("Network error updating password");
    }
  };

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFarmName,
          size: Number(newFarmSize),
          soilType: newFarmSoil,
          cropType: newFarmCrop,
          location: newFarmLoc
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms);
        toast.success("New farm added successfully!");
        setNewFarmName("");
        setNewFarmSize("");
        setNewFarmLoc("");
      }
    } catch (err) {
      toast.error("Error adding farm");
    }
  };

  const handleDeleteFarm = async (farmId: string) => {
    try {
      const res = await apiFetch(`/api/customer/farms/${farmId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setFarms(data.farms);
        toast.success("Farm deleted successfully!");
      }
    } catch (err) {
      toast.error("Error deleting farm");
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const currentAddresses = profileData?.savedAddresses || [];
      const updatedAddresses = [
        ...currentAddresses,
        { label: newAddressLabel, street: newAddressStreet, city: newAddressCity, state: newAddressState, pincode: newAddressPincode }
      ];

      const res = await apiFetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          workingRegion: editRegion,
          preferredLanguage: editLanguage,
          avatarUrl: editAvatar,
          savedAddresses: updatedAddresses
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        toast.success("New address added successfully!");
         setNewAddressStreet("");
        setNewAddressCity("");
        setNewAddressState("");
        setNewAddressPincode("");
        setLatitude(null);
        setLongitude(null);
      }
    } catch (err) {
      toast.error("Error saving address");
    }
  };

  const handleDeleteAddress = async (addressIndex: number) => {
    try {
      const currentAddresses = profileData?.savedAddresses || [];
      const updatedAddresses = currentAddresses.filter((_: any, i: number) => i !== addressIndex);

      const res = await apiFetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          workingRegion: editRegion,
          preferredLanguage: editLanguage,
          avatarUrl: editAvatar,
          savedAddresses: updatedAddresses
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
        toast.success("Address removed successfully!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to remove address");
      }
    } catch (err) {
      toast.error("Error removing address");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Edit profile Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 space-y-6">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <h3 className="font-bold text-md text-foreground">Profile & Farm Info</h3>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="bg-brand/10 text-brand text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand/20 transition-colors border-0 cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="grid md:grid-cols-2 gap-4 py-2">
            <div className="p-3 bg-muted/20 border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Farmer Name</span>
              <p className="font-bold text-sm text-foreground mt-1">{profileData?.name || "N/A"}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Mobile Number</span>
              <p className="font-bold text-sm text-foreground mt-1">{profileData?.mobile || "N/A"}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Farming Region</span>
              <p className="font-bold text-sm text-foreground mt-1">{profileData?.workingRegion || "N/A"}</p>
            </div>
            <div className="p-3 bg-muted/20 border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Preferred Language</span>
              <p className="font-bold text-sm text-foreground mt-1">{profileData?.preferredLanguage || "English"}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Farmer Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Farming Region</label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Pune, Maharashtra"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Preferred Language</label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                >
                  {["English", "Hindi", "Marathi", "Tamil", "Telugu", "Bengali"].map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-brand text-brand-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand/90 transition-colors border-0 cursor-pointer">
                Save Profile Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditName(profileData?.name || "");
                  setEditMobile(profileData?.mobile || "");
                  setEditRegion(profileData?.workingRegion || "");
                  setEditLanguage(profileData?.preferredLanguage || "English");
                  setIsEditingProfile(false);
                }}
                className="bg-muted text-foreground text-xs font-bold px-4 py-2 rounded-lg hover:bg-muted/75 transition-colors border border-border cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Change Password Form */}
        <div className="pt-4 border-t border-border space-y-4">
          <h4 className="font-bold text-sm text-foreground">Update Security Credentials</h4>
          <form onSubmit={handleChangePassword} className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <button type="submit" className="bg-muted text-foreground border border-border text-xs font-bold py-2 rounded-lg hover:bg-muted/75 transition-colors cursor-pointer">
              Change Password
            </button>
          </form>
        </div>

        {/* Manage Saved Addresses */}
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="font-bold text-sm text-foreground">Registered Delivery Addresses</h4>
          {(profileData?.savedAddresses || []).length === 0 ? (
            <div className="p-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              No delivery addresses yet. Add one below.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {(profileData?.savedAddresses || []).map((addr: any, i: number) => (
                <div key={i} className="p-3 border border-border rounded-xl text-xs space-y-1 relative">
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[8px] font-bold uppercase">{addr.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(i)}
                    className="absolute top-2 left-2 p-1 rounded hover:bg-muted text-red-500 bg-transparent border-0 cursor-pointer"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <p className="font-semibold text-foreground pl-6">{addr.street}</p>
                  <p className="text-muted-foreground pl-6">{addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Address Form */}
          <form onSubmit={handleAddAddress} className="bg-muted/30 p-4 border border-border/80 rounded-xl space-y-3">
            <p className="text-xs font-bold text-foreground">Add New Address</p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={fetchingLocation}
                onClick={fetchExactLocation}
                className="w-full bg-brand/10 text-brand hover:bg-brand/20 border border-brand/20 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {fetchingLocation ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Fetching GPS location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" /> Fetch Exact Location (GPS)
                  </>
                )}
              </button>
              {leafletLoaded && (
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] font-semibold text-muted-foreground block text-left">📍 Drag pin or click map to select location</label>
                  <div 
                    ref={mapRefCallback}
                    className="w-full h-52 rounded-lg border border-border overflow-hidden shadow-soft z-0"
                    style={{ minHeight: "220px" }}
                  />
                </div>
              )}
              <input
                type="text"
                required
                placeholder="Street / Village Location"
                value={newAddressStreet}
                onChange={(e) => setNewAddressStreet(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
              />
              <input
                type="text"
                required
                placeholder="City"
                value={newAddressCity}
                onChange={(e) => setNewAddressCity(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                placeholder="State"
                value={newAddressState}
                onChange={(e) => setNewAddressState(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
              <input
                type="text"
                required
                placeholder="Pincode"
                value={newAddressPincode}
                onChange={(e) => setNewAddressPincode(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
              <select
                value={newAddressLabel}
                onChange={(e) => setNewAddressLabel(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="Home">Home (House)</option>
                <option value="Work">Work</option>
                <option value="Other">Other (Another)</option>
              </select>
              <button type="submit" className="w-full bg-brand text-brand-foreground text-xs font-bold py-2.5 rounded-lg hover:bg-brand/90 transition-colors border-0 cursor-pointer">
                Add Address
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Multiple Farms Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <span className="font-bold text-sm text-foreground">Farm Plots ({farms.length})</span>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
          {farms.map((f: any, i: number) => (
            <div key={i} className="p-3 border border-border rounded-xl text-xs flex justify-between items-center hover:bg-muted/10">
              <div className="text-left">
                <p className="font-bold text-foreground">{f.name}</p>
                <p className="text-muted-foreground mt-0.5">{f.size} Acres | {f.soilType}</p>
                <p className="text-brand font-semibold mt-1">Active crop: {f.cropType}</p>
              </div>
              <button onClick={() => handleDeleteFarm(f._id)} className="p-1 text-red-500 hover:bg-red-50 rounded bg-transparent border-0 cursor-pointer">
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Farm form */}
        <form onSubmit={handleAddFarm} className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-bold text-foreground">Register New Field Plot</p>
          <div className="space-y-2">
            <input
              type="text"
              required
              placeholder="Plot Name"
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                required
                placeholder="Size (Acres)"
                value={newFarmSize}
                onChange={(e) => setNewFarmSize(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
              <select
                value={newFarmSoil}
                onChange={(e) => setNewFarmSoil(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                {["Black Clay", "Red Sandy", "Alluvial soil", "Laterite soil"].map(soil => (
                  <option key={soil} value={soil}>{soil}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newFarmCrop}
                onChange={(e) => setNewFarmCrop(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                {cropList.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Location Details"
                value={newFarmLoc}
                onChange={(e) => setNewFarmLoc(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
              />
            </div>
            <button type="submit" className="w-full bg-brand text-brand-foreground text-xs font-bold py-2 rounded-lg hover:bg-brand/90 transition-colors border-0 cursor-pointer">
              Register Farm Plot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
