import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Store, ShoppingBag, Package, ShoppingCart, Users,
  Star, Tag, CreditCard, BarChart3, Bell, HelpCircle, User, Settings,
  LogOut, Plus, Trash2, Edit, Copy, Check, Eye, ChevronRight, X,
  Search, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, ArrowUpRight,
  Truck, ArrowRight, Printer, Download, MessageSquare, Send, Globe,
  ShieldCheck, FileText, Percent, HelpCircle as HelpIcon, Landmark
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant Dashboard — AgriCare" }
    ],
  }),
  component: MerchantDashboard,
});

type TabType =
  | "overview"
  | "store"
  | "products"
  | "inventory"
  | "orders"
  | "customers"
  | "reviews"
  | "offers"
  | "payments"
  | "reports"
  | "notifications"
  | "support"
  | "profile"
  | "settings";

function MerchantDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);

  // Modal / Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState<any>({
    name: "", category: "", subcategory: "", price: 0, stock: 10,
    sku: "", brand: "", mrp: 0, discount: 0, gst: 12, lowStockThreshold: 5,
    description: "", usageInstructions: "", precautions: "", 
    imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500",
    imageUrls: []
  });
  const [tempPreviews, setTempPreviews] = useState<any[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    productId: "", type: "IN", quantity: 1, reason: "Restocking", batchNumber: "", warehouseName: ""
  });

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingForm, setTrackingForm] = useState({ carrierName: "", trackingNumber: "" });
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const [supportForm, setSupportForm] = useState({ title: "", description: "" });
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessage, setTicketMessage] = useState("");

  const [offerForm, setOfferForm] = useState<any>({
    title: "", code: "", type: "COUPON", discountPercentage: 10, minPurchaseAmount: 100, startDate: "", endDate: ""
  });
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const [storeProfileForm, setStoreProfileForm] = useState<any>({
    businessName: "", gstin: "", storeProfile: {
      pan: "", upiId: "", logoUrl: "", bannerUrl: "", businessAddress: "", warehouseAddress: "", businessHours: "", pickupAddress: "",
      bankAccount: { holderName: "", accountNumber: "", ifscCode: "", bankName: "" },
      shippingSettings: { shippingType: "FREE", flatRate: 0, freeShippingThreshold: 0 },
      invoiceSettings: { invoicePrefix: "INV-", invoiceNotes: "" }
    }
  });

  const [profileSecurityForm, setProfileSecurityForm] = useState({
    name: "", email: "", mobile: "", currentPassword: "", newPassword: ""
  });

  // Image Uploading States
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Client-side image compression helper using HTML5 Canvas
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', quality);
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'logo' | 'banner') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === 'product') {
      setUploadingProductImage(true);
      
      // Generate Object URLs for local previews
      const newPreviews = Array.from(files).map((file, idx) => {
        const id = `${Date.now()}-${idx}`;
        return {
          id,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
          status: 'uploading'
        };
      });

      setTempPreviews(prev => [...prev, ...newPreviews]);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const localPreview = newPreviews[i];

          // Compress image client-side (max 1200x1200px, 75% quality)
          const compressedFile = await compressImage(file);

          const formData = new FormData();
          formData.append('image', compressedFile);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            
            // Remove success local preview, append Cloudinary url to productForm imageUrls
            setTempPreviews(prev => prev.filter(p => p.id !== localPreview.id));

            setProductForm((prev: any) => {
              const urls = prev.imageUrls || [];
              const nextUrls = [...urls, data.url];
              return {
                ...prev,
                imageUrl: !prev.imageUrl || prev.imageUrl === "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500" ? data.url : prev.imageUrl,
                imageUrls: nextUrls
              };
            });
            toast.success(`Image "${file.name}" uploaded successfully!`);
          } else {
            const errData = await response.json();
            // Set error status on the local preview so the user knows it failed
            setTempPreviews(prev => prev.map(p => p.id === localPreview.id ? { ...p, status: 'error' } : p));
            toast.error(errData.message || `Failed to upload "${file.name}"`);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Network error during upload');
      } finally {
        setUploadingProductImage(false);
      }
    } else {
      const file = files[0];
      if (type === 'logo') setUploadingLogo(true);
      else if (type === 'banner') setUploadingBanner(true);

      try {
        // Compress store branding (Logo: max 600px square; Banner: max 1600px width)
        const maxWidth = type === 'logo' ? 600 : 1600;
        const maxHeight = type === 'logo' ? 600 : 1200;
        const compressedFile = await compressImage(file, maxWidth, maxHeight);

        const formData = new FormData();
        formData.append('image', compressedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          if (type === 'logo') {
            setStoreProfileForm((prev: any) => ({
              ...prev,
              storeProfile: { ...prev.storeProfile, logoUrl: data.url }
            }));
            toast.success('Store logo uploaded successfully!');
          } else if (type === 'banner') {
            setStoreProfileForm((prev: any) => ({
              ...prev,
              storeProfile: { ...prev.storeProfile, bannerUrl: data.url }
            }));
            toast.success('Store banner uploaded successfully!');
          }
        } else {
          const errData = await response.json();
          toast.error(errData.message || 'Failed to upload image');
        }
      } catch (err) {
        console.error(err);
        toast.error('Network error during upload');
      } finally {
        if (type === 'logo') setUploadingLogo(false);
        else if (type === 'banner') setUploadingBanner(false);
      }
    }
  };

  // Fetch initial dashboard records
  const loadDashboardData = async () => {
    try {
      // 1. Dashboard stats
      const statsRes = await fetch("/api/merchant/dashboard-stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Product list
      const prodRes = await fetch("/api/merchant/products");
      if (prodRes.ok) setProducts(await prodRes.json());

      // 3. Inventory Logs
      const invRes = await fetch("/api/merchant/inventory/logs");
      if (invRes.ok) setInventoryLogs(await invRes.json());

      // 4. Orders
      const ordRes = await fetch("/api/merchant/orders");
      if (ordRes.ok) setOrders(await ordRes.json());

      // 5. Customers CRM
      const custRes = await fetch("/api/merchant/customers");
      if (custRes.ok) setCustomers(await custRes.json());

      // 6. Reviews
      const revRes = await fetch("/api/merchant/reviews");
      if (revRes.ok) setReviews(await revRes.json());

      // 7. Offers
      const offRes = await fetch("/api/merchant/offers");
      if (offRes.ok) setOffers(await offRes.json());

      // 8. Settlements
      const setRes = await fetch("/api/merchant/settlements");
      if (setRes.ok) setSettlements(await setRes.json());

      // 9. Notifications
      const notRes = await fetch("/api/merchant/notifications");
      if (notRes.ok) setNotifications(await notRes.json());

      // 10. Support tickets
      const tktRes = await fetch("/api/merchant/tickets");
      if (tktRes.ok) setTickets(await tktRes.json());

    } catch (err) {
      console.error("Error fetching merchant data", err);
    }
  };

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "MERCHANT")) {
      toast.error("Access unauthorized. Merchant accounts only.");
      navigate({ to: "/login" });
    } else if (isAuthenticated && user?.role === "MERCHANT") {
      loadDashboardData();
      // Populate profile forms
      setStoreProfileForm({
        businessName: user.businessName || "",
        gstin: user.gstin || "",
        storeProfile: {
          pan: user.storeProfile?.pan || "",
          upiId: user.storeProfile?.upiId || "",
          logoUrl: user.storeProfile?.logoUrl || "",
          bannerUrl: user.storeProfile?.bannerUrl || "",
          businessAddress: user.storeProfile?.businessAddress || "",
          warehouseAddress: user.storeProfile?.warehouseAddress || "",
          businessHours: user.storeProfile?.businessHours || "9:00 AM - 6:00 PM",
          pickupAddress: user.storeProfile?.pickupAddress || "",
          bankAccount: {
            holderName: user.storeProfile?.bankAccount?.holderName || "",
            accountNumber: user.storeProfile?.bankAccount?.accountNumber || "",
            ifscCode: user.storeProfile?.bankAccount?.ifscCode || "",
            bankName: user.storeProfile?.bankAccount?.bankName || ""
          },
          shippingSettings: {
            shippingType: user.storeProfile?.shippingSettings?.shippingType || "FREE",
            flatRate: user.storeProfile?.shippingSettings?.flatRate || 0,
            freeShippingThreshold: user.storeProfile?.shippingSettings?.freeShippingThreshold || 0
          },
          invoiceSettings: {
            invoicePrefix: user.storeProfile?.invoiceSettings?.invoicePrefix || "INV-",
            invoiceNotes: user.storeProfile?.invoiceSettings?.invoiceNotes || ""
          }
        }
      });
      setProfileSecurityForm({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        currentPassword: "",
        newPassword: ""
      });
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Merchant Dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogoutClick = async () => {
    await logout();
    toast.success("Successfully signed out.");
    navigate({ to: "/login" });
  };

  // Product Actions
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProductId ? `/api/merchant/products/${editingProductId}` : "/api/merchant/products";
      const method = editingProductId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm)
      });

      if (res.ok) {
        toast.success(editingProductId ? "Product updated." : "Product created successfully.");
        setIsProductModalOpen(false);
        setEditingProductId(null);
        loadDashboardData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save product.");
      }
    } catch (err) {
      toast.error("Network error saving product.");
    }
  };

  const handleEditProduct = (p: any) => {
    setEditingProductId(p._id);
    setProductForm({
      name: p.name, category: p.category, subcategory: p.subcategory || "", price: p.price, stock: p.stock,
      sku: p.sku || "", brand: p.brand || "", mrp: p.mrp || 0, discount: p.discount || 0, gst: p.gst || 12,
      lowStockThreshold: p.lowStockThreshold || 5, description: p.description,
      usageInstructions: p.usageInstructions || "", precautions: p.precautions || "", imageUrl: p.imageUrl,
      imageUrls: p.imageUrls || []
    });
    setTempPreviews([]);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/merchant/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted.");
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Failed to delete.");
    }
  };

  const handleDuplicateProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/merchant/products/${id}/duplicate`, { method: "POST" });
      if (res.ok) {
        toast.success("Product duplicated.");
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Failed to duplicate.");
    }
  };

  // Stock Adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/merchant/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockForm)
      });
      if (res.ok) {
        toast.success("Inventory adjusted successfully.");
        setIsStockModalOpen(false);
        loadDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to adjust stock.");
      }
    } catch (err) {
      toast.error("Stock adjustment network error.");
    }
  };

  // Order Actions
  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/merchant/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Order updated to ${status}`);
        if (selectedOrder?._id === orderId) {
          const updated = await res.json();
          setSelectedOrder(updated.order);
        }
        loadDashboardData();
      }
    } catch (err) {
      toast.error("Order status update failed.");
    }
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/merchant/orders/${selectedOrder._id}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingForm)
      });
      if (res.ok) {
        toast.success("Order dispatched with tracking details.");
        setIsTrackingModalOpen(false);
        const data = await res.json();
        setSelectedOrder(data.order);
        loadDashboardData();
      }
    } catch (err) {
      toast.error("Failed to update tracking.");
    }
  };

  // Offer Actions
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/merchant/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerForm)
      });
      if (res.ok) {
        toast.success("Promo code campaign published.");
        setIsOfferModalOpen(false);
        loadDashboardData();
      }
    } catch (err) {
      toast.error("Promo submission failed.");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Remove this promotion campaign?")) return;
    try {
      const res = await fetch(`/api/merchant/offers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Promotion campaign removed.");
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Delete failed.");
    }
  };

  // Store Profile Update
  const handleStoreProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/merchant/store-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeProfileForm)
      });
      if (res.ok) {
        toast.success("Store details updated successfully.");
        loadDashboardData();
      }
    } catch (err) {
      toast.error("Failed to save store settings.");
    }
  };

  // Profile Security Submit
  const handleProfileSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users/" + (user?.id || user?._id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileSecurityForm.name,
          mobile: profileSecurityForm.mobile
        })
      });
      if (res.ok) {
        toast.success("Profile security configurations updated.");
      }
    } catch (err) {
      toast.error("Updates failed.");
    }
  };

  // Customer CRM Notes Submit
  const handleSaveNotes = async (farmerId: string, notes: string) => {
    try {
      const res = await fetch(`/api/merchant/customers/${farmerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: notes })
      });
      if (res.ok) {
        toast.success("Notes saved.");
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Note save failed.");
    }
  };

  // Review Reply Submit
  const handleReviewReply = async (productId: string, reviewId: string, replyText: string) => {
    try {
      const res = await fetch(`/api/merchant/reviews/${productId}/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        toast.success("Reply submitted.");
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Failed to submit reply.");
    }
  };

  const handleReviewReport = async (productId: string, reviewId: string, reason: string) => {
    try {
      const res = await fetch(`/api/merchant/reviews/${productId}/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success("Review flagged to platform admins.");
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Failed to report review.");
    }
  };

  // Support Tickets raise
  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/merchant/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supportForm)
      });
      if (res.ok) {
        toast.success("Ticket raised to AgriCare admin desk.");
        setIsSupportModalOpen(false);
        setSupportForm({ title: "", description: "" });
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Raise ticket failed.");
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketMessage) return;
    try {
      const res = await fetch(`/api/merchant/tickets/${selectedTicket._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: ticketMessage })
      });
      if (res.ok) {
        setTicketMessage("");
        const updated = await res.json();
        setSelectedTicket(updated.ticket);
        loadDashboardData();
      }
    } catch (e) {
      toast.error("Send message failed.");
    }
  };

  // Mark notification read
  const handleMarkNotificationRead = async (notId: string) => {
    try {
      const res = await fetch(`/api/merchant/notifications/${notId}/read`, { method: "PUT" });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sidebar Menu list
  const menuItems = [
    { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { id: "store", label: "Store Management", icon: Store },
    { id: "products", label: "Product Listings", icon: ShoppingBag },
    { id: "inventory", label: "Inventory & Alerts", icon: Package },
    { id: "orders", label: "Order Processing", icon: ShoppingCart },
    { id: "customers", label: "Customers CRM", icon: Users },
    { id: "reviews", label: "Reviews & Feedback", icon: Star },
    { id: "offers", label: "Promotions & Offers", icon: Tag },
    { id: "payments", label: "Settlement Center", icon: CreditCard },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { id: "notifications", label: "Alert Feeds", icon: Bell },
    { id: "support", label: "Help & Support Desk", icon: HelpCircle },
    { id: "profile", label: "Profile Credentials", icon: User },
    { id: "settings", label: "Store Preferences", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 text-foreground">
      {/* SIDEBAR */}
      <aside className="w-68 h-full border-r border-border bg-card hidden lg:flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar pr-1">
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 px-3 py-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground shadow-soft">
                <Globe className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[14px] font-bold tracking-tight leading-none text-foreground">
                  {user?.businessName || "Store Dashboard"}
                </h2>
                <span className="text-[11px] text-muted-foreground font-medium mt-1 inline-block">
                  Verified Merchant Partner
                </span>
              </div>
            </div>

            <nav className="space-y-1.5" aria-label="Dashboard Tabs">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === item.id
                      ? "bg-brand text-brand-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                  {item.id === "notifications" && notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1.5">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                  {item.id === "orders" && orders.filter(o => o.status === 'PENDING').length > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-foreground text-[10px] font-bold text-brand px-1.5">
                      {orders.filter(o => o.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={handleLogoutClick}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign out Dashboard
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
              <Globe className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">{user?.businessName || "Merchant Portal"}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">Toggle menu</span>
            <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </header>

        {/* MOBILE MENU PANEL */}
        {mobileMenuOpen && (
          <div className="absolute inset-0 z-50 flex bg-background/95 backdrop-blur-sm lg:hidden">
            <div className="flex flex-col w-full max-w-[280px] bg-card p-4 border-r border-border h-full shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <span className="text-sm font-bold">{user?.businessName || "Menu"}</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold ${
                      activeTab === item.id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <button onClick={handleLogoutClick} className="flex items-center gap-3 px-3 py-2 mt-4 border-t border-border text-xs font-bold text-red-600"><LogOut className="h-4 w-4" /> Sign out</button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* MAIN BODY SCROLL */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-7 space-y-6 focus:outline-none">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">Overview Dashboard</h1>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Summary insights, revenue data, and real-time alerts.</p>
                </div>
                <div className="text-xs text-muted-foreground font-semibold bg-card px-3 py-1.5 rounded-lg border border-border">
                  Last Sync: {new Date().toLocaleTimeString()}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Gross Revenues</span>
                    <h3 className="text-2xl font-black mt-1 text-foreground">₹{(stats?.stats?.totalRevenue || 0).toLocaleString()}</h3>
                    <span className="text-[10px] text-emerald-500 font-semibold mt-1 inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +14.2% MoM</span>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center"><Landmark className="h-5.5 w-5.5" /></div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Today's Orders</span>
                    <h3 className="text-2xl font-black mt-1 text-foreground">{stats?.stats?.todayOrders || 0}</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-1 inline-block">New items requiring pack</span>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center"><ShoppingCart className="h-5.5 w-5.5" /></div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Low Stock alerts</span>
                    <h3 className="text-2xl font-black mt-1 text-destructive">{stats?.stats?.lowStock || 0}</h3>
                    <span className="text-[10px] text-destructive font-semibold mt-1 inline-block">Immediate restock needed</span>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-destructive/10 text-destructive grid place-items-center"><AlertTriangle className="h-5.5 w-5.5" /></div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Store Feedback Rating</span>
                    <h3 className="text-2xl font-black mt-1 text-foreground">{stats?.stats?.averageRating || 5.0} ★</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-1 inline-block">From {stats?.stats?.reviewCount || 0} total reviews</span>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center"><Star className="h-5.5 w-5.5" /></div>
                </div>
              </div>

              {/* Graphic Chart + Best Sellers */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft lg:col-span-2">
                  <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                    <h3 className="text-sm font-bold text-foreground">Sales Trend Overview</h3>
                    <span className="text-[11px] text-muted-foreground font-semibold">Past 6 Months</span>
                  </div>
                  {/* SVG Chart */}
                  <div className="h-56 w-full flex flex-col justify-between pt-2">
                    <div className="flex-1 relative overflow-hidden rounded-xl">
                      <svg className="absolute inset-0 w-full h-full overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Gradients */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--brand, #16a34a)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--brand, #16a34a)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 80 Q 20 40, 40 50 T 80 20 T 100 30" fill="none" stroke="var(--brand, #16a34a)" strokeWidth="3" />
                        <path d="M 0 80 Q 20 40, 40 50 T 80 20 T 100 30 L 100 100 L 0 100 Z" fill="url(#chartGrad)" />
                      </svg>
                      {/* Grid overlay */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        <div className="border-t border-border/30 w-full" />
                        <div className="border-t border-border/30 w-full" />
                        <div className="border-t border-border/30 w-full" />
                        <div className="border-t border-border/30 w-full" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground pt-3 border-t border-border">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                    </div>
                  </div>
                </div>

                {/* Best Sellers */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border mb-3">Best Sellers</h3>
                  <div className="space-y-4">
                    {stats?.bestSellingProducts?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          <img src={item.imageUrl || "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200"} className="h-full w-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate text-foreground">{item.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-semibold">{item.quantity} items sold</span>
                        </div>
                        <span className="text-xs font-black text-brand">₹{item.sales}</span>
                      </div>
                    ))}
                    {(!stats?.bestSellingProducts || stats.bestSellingProducts.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-8">No selling metrics recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Orders & Reviews Summary */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Reviews */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border mb-3">Customer Feedbacks</h3>
                  <div className="space-y-3">
                    {stats?.recentReviews?.map((r: any, idx: number) => (
                      <div key={idx} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{r.reviewerName}</span>
                          <span className="text-xs text-amber-500 font-semibold">{"★".repeat(Math.round(r.rating))}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">Product: {r.productName}</span>
                        <p className="text-xs text-muted-foreground/90 italic mt-1 font-medium bg-muted/30 p-2 rounded-lg">"{r.comment}"</p>
                      </div>
                    ))}
                    {(!stats?.recentReviews || stats.recentReviews.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-8">No feedback responses recorded.</p>
                    )}
                  </div>
                </div>

                {/* Notifications Alert Feed */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <h3 className="text-sm font-bold text-foreground pb-3 border-b border-border mb-3">Real-time Alert Feed</h3>
                  <div className="space-y-3">
                    {stats?.recentNotifications?.map((n: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start border-b border-border/40 pb-3 last:border-0 last:pb-0">
                        <div className="p-1.5 rounded-lg bg-brand/10 text-brand mt-0.5 flex-shrink-0">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                          <span className="text-[9px] text-muted-foreground/60 font-semibold block mt-1">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!stats?.recentNotifications || stats.recentNotifications.length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-8">No notifications currently pending.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORE MANAGEMENT */}
          {activeTab === "store" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Store Management</h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage store profiles, corporate info, banners, bank details, and pick up configuration.</p>
              </div>

              <form onSubmit={handleStoreProfileSubmit} className="space-y-6">
                {/* Store Branding Section */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
                  <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Store Branding</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Logo upload */}
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
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            {uploadingLogo ? "Uploading..." : "Upload Logo"}
                          </label>
                          <p className="mt-1 text-[10px] text-muted-foreground font-medium">Square PNG or JPG up to 5MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* Banner upload */}
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
                            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            {uploadingBanner ? "Uploading..." : "Upload Banner"}
                          </label>
                          <p className="mt-1 text-[10px] text-muted-foreground font-medium">Landscape image up to 10MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
                  <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Business Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground">Store / Business Name</label>
                      <input
                        type="text"
                        value={storeProfileForm.businessName}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, businessName: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground">GSTIN Details</label>
                      <input
                        type="text"
                        value={storeProfileForm.gstin}
                        onChange={(e) => setStoreProfileForm({ ...storeProfileForm, gstin: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                  </div>
                </div>

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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                  </div>
                </div>

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
                        className="mt-1.5 h-20 w-full rounded-lg border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-20 w-full rounded-lg border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-20 w-full rounded-lg border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all"
                  >
                    Save Store Information
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {activeTab === "products" && (
            <div className="space-y-6">
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
                  className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start"
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
                    <tbody className="divide-y divide-border/40 font-medium">
                      {products.map((p) => (
                        <tr key={p._id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
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
                              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Out of stock</span>
                            ) : p.stock <= (p.lowStockThreshold || 5) ? (
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Low stock</span>
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
                              <button onClick={() => handleEditProduct(p)} className="p-1 text-muted-foreground hover:text-brand" title="Edit"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDuplicateProduct(p._id)} className="p-1 text-muted-foreground hover:text-brand" title="Duplicate"><Copy className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteProduct(p._id)} className="p-1 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">Inventory Logs & Adjustments</h1>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Perform immediate inventory corrections and track stock history logs.</p>
                </div>
                <button
                  onClick={() => {
                    if (products.length === 0) {
                      toast.error("Please add products first before adjusting stock.");
                      return;
                    }
                    setStockForm({
                      productId: products[0]._id, type: "IN", quantity: 10, reason: "Restocking Catalog", batchNumber: "BCH-01", warehouseName: "Main Warehouse"
                    });
                    setIsStockModalOpen(true);
                  }}
                  className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start"
                >
                  <Plus className="h-4 w-4" /> Post Stock Adjustment
                </button>
              </div>

              {/* Stock Alerts Overview */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Out of Stock Alerts</h3>
                  <div className="space-y-2">
                    {products.filter(p => p.stock === 0).map(p => (
                      <div key={p._id} className="flex items-center justify-between text-xs border bg-destructive/5 border-destructive/10 p-2.5 rounded-lg">
                        <span className="font-bold text-foreground">{p.name}</span>
                        <span className="font-semibold text-destructive">0 Left</span>
                      </div>
                    ))}
                    {products.filter(p => p.stock === 0).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No products are currently out of stock.</p>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Low Stock Warnings</h3>
                  <div className="space-y-2">
                    {products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).map(p => (
                      <div key={p._id} className="flex items-center justify-between text-xs border bg-amber-500/5 border-amber-500/10 p-2.5 rounded-lg">
                        <span className="font-bold text-foreground">{p.name}</span>
                        <span className="font-semibold text-amber-700">{p.stock} units left</span>
                      </div>
                    ))}
                    {products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No products are currently low in stock.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Logs */}
              <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <div className="p-4 border-b border-border/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inventory Change Log History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Qty Change</th>
                        <th className="px-6 py-4">Reason / Batch</th>
                        <th className="px-6 py-4">Warehouse</th>
                        <th className="px-6 py-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {inventoryLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground">{log.productId?.name || "Deleted Product"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === "IN" ? "bg-emerald-100 text-emerald-800" :
                              log.type === "OUT" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold">{log.quantity} units</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            <div>{log.reason}</div>
                            {log.batchNumber && <div className="text-[9px] text-brand">Batch: {log.batchNumber}</div>}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{log.warehouseName || "Default Warehouse"}</td>
                          <td className="px-6 py-4 text-muted-foreground/80 font-semibold">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {inventoryLogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-semibold">No stock movement logs recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS BOARD */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Order Processing Desk</h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Review pending purchases, transition status flows, print invoices, and update shipping details.</p>
              </div>

              {/* Orders Split list */}
              <div className="grid gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Incoming Orders</h3>
                  {orders.map((o) => (
                    <div
                      key={o._id}
                      onClick={() => setSelectedOrder(o)}
                      className={`p-4 border rounded-xl shadow-soft cursor-pointer transition-all ${
                        selectedOrder?._id === o._id ? "border-brand bg-brand/5 shadow-md" : "border-border bg-card hover:bg-muted/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground">ID: #{o._id.substring(o._id.length - 6).toUpperCase()}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          o.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                          o.status === "DELIVERED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>{o.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground mt-2 truncate">Farmer: {o.farmerId?.name || "Customer"}</h4>
                      <div className="flex items-center justify-between mt-3 border-t border-border/40 pt-2 text-[11px] font-semibold text-muted-foreground">
                        <span>{o.items?.length || 0} items</span>
                        <span className="text-brand font-black">₹{o.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-10 font-semibold bg-card p-4 rounded-xl border">No orders placed.</p>
                  )}
                </div>

                {/* Selected Order Detail Panel */}
                <div className="lg:col-span-2">
                  {selectedOrder ? (
                    <div className="bg-card border border-border rounded-2xl shadow-soft p-6 space-y-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Order ID: #{selectedOrder._id.toUpperCase()}</h3>
                          <span className="text-[10px] text-muted-foreground font-semibold">Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedOrder.status === "PENDING" && (
                            <>
                              <button onClick={() => handleUpdateStatus(selectedOrder._id, "ACCEPTED")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand/90">Accept Order</button>
                              <button onClick={() => handleUpdateStatus(selectedOrder._id, "CANCELLED")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Reject</button>
                            </>
                          )}
                          {selectedOrder.status === "ACCEPTED" && (
                            <button onClick={() => handleUpdateStatus(selectedOrder._id, "PACKING")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand/90">Start Packing</button>
                          )}
                          {selectedOrder.status === "PACKING" && (
                            <button onClick={() => handleUpdateStatus(selectedOrder._id, "READY_TO_DISPATCH")} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand/90">Mark Ready for Dispatch</button>
                          )}
                          {selectedOrder.status === "READY_TO_DISPATCH" && (
                            <button
                              onClick={() => {
                                setTrackingForm({ carrierName: "", trackingNumber: "" });
                                setIsTrackingModalOpen(true);
                              }}
                              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand/90 flex items-center gap-1"
                            >
                              <Truck className="h-3.5 w-3.5" /> Dispatch Order
                            </button>
                          )}
                          {selectedOrder.status === "SHIPPED" && (
                            <button onClick={() => handleUpdateStatus(selectedOrder._id, "DELIVERED")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-505/90">Mark Delivered</button>
                          )}
                          <button onClick={() => window.print()} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" title="Print Invoice"><Printer className="h-4.5 w-4.5" /></button>
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="grid gap-4 sm:grid-cols-2 bg-muted/20 p-4 rounded-xl text-xs font-medium">
                        <div>
                          <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Shipping Destination</h4>
                          <div className="text-foreground font-bold">{selectedOrder.farmerId?.name}</div>
                          <div className="text-muted-foreground mt-0.5">{selectedOrder.deliveryAddress}</div>
                          <div className="text-muted-foreground mt-1">Mobile: {selectedOrder.farmerId?.mobile}</div>
                        </div>
                        <div>
                          <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Billing & Delivery status</h4>
                          <div>Payment Status: <span className="font-bold text-brand">{selectedOrder.paymentStatus}</span></div>
                          <div className="mt-1">Fulfillment Status: <span className="font-bold text-foreground">{selectedOrder.status}</span></div>
                          {selectedOrder.trackingNumber && (
                            <div className="mt-2 text-brand font-semibold">
                              Carrier: {selectedOrder.carrierName} <br />
                              Tracking: {selectedOrder.trackingNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 border-b border-border">Order Products</h4>
                        {selectedOrder.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">{item.product} <span className="text-muted-foreground font-semibold">x{item.quantity}</span></span>
                            <span className="font-bold text-foreground">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-xs pt-3 border-t border-border/40 font-black">
                          <span className="text-foreground">Total Paid Amount</span>
                          <span className="text-brand">₹{selectedOrder.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-2xl shadow-soft p-12 text-center text-muted-foreground font-semibold">
                      Please select an incoming order from the list to view billing and fulfill.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS CRM */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Customers CRM</h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage customer transaction history, and attach CRM compliance annotations.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <th className="px-6 py-4">Farmer Details</th>
                        <th className="px-6 py-4">Contact Info</th>
                        <th className="px-6 py-4">Base Pincode Address</th>
                        <th className="px-6 py-4">Order counts</th>
                        <th className="px-6 py-4">Total Purchases</th>
                        <th className="px-6 py-4">CRM Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {customers.map((c) => (
                        <tr key={c._id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground">{c.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            <div>{c.email}</div>
                            <div className="text-[10px] mt-0.5">{c.mobile}</div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{c.deliveryAddress}</td>
                          <td className="px-6 py-4 font-semibold">{c.purchaseFrequency} orders</td>
                          <td className="px-6 py-4 font-black text-brand">₹{c.totalSpent}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                defaultValue={c.notes}
                                onBlur={(e) => handleSaveNotes(c._id, e.target.value)}
                                className="h-8 rounded border border-border bg-card px-2 text-[11px] outline-none focus:ring-1 focus:ring-brand w-48"
                                placeholder="Add preference notes..."
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-semibold">No customer CRM logs registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Product Reviews</h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Reply to farmer feedback and flag inappropriate review ratings.</p>
              </div>

              <div className="space-y-4">
                {reviews.map((r, idx) => (
                  <div key={idx} className="bg-card border border-border p-5 rounded-2xl shadow-soft space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div>
                        <h4 className="text-xs font-black text-foreground">{r.name}</h4>
                        <span className="text-[10px] text-muted-foreground font-medium">Product Item: {r.productName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-500 font-bold">{"★".repeat(r.rating)}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">{new Date(r.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground/90 leading-relaxed font-semibold">"{r.comment}"</p>

                    {/* Reply widget */}
                    {r.reply ? (
                      <div className="bg-brand/5 border border-brand/10 p-3 rounded-lg text-xs">
                        <span className="font-bold text-brand block mb-1">Your reply response:</span>
                        <p className="text-muted-foreground font-medium">"{r.reply}"</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Submit reply response to review..."
                          id={`reply-${idx}`}
                          className="h-9 flex-1 rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <button
                          onClick={() => {
                            const val = (document.getElementById(`reply-${idx}`) as HTMLInputElement)?.value;
                            if (val) handleReviewReply(r.productId, r.reviewId, val);
                          }}
                          className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand/90"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Report reason:");
                            if (reason) handleReviewReport(r.productId, r.reviewId, reason);
                          }}
                          className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          Report Review
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-12 bg-card p-4 rounded-xl border font-semibold">No product feedback has been submitted yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: OFFERS & PROMOTIONS */}
          {activeTab === "offers" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">Offers & Discount Campaigns</h1>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Run seasonal discounts, coupons, combo rates, flash campaigns, and promo programs.</p>
                </div>
                <button
                  onClick={() => setIsOfferModalOpen(true)}
                  className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start"
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
                        <button onClick={() => handleDeleteOffer(o._id)} className="text-muted-foreground hover:text-destructive p-1" title="Delete Campaign"><Trash2 className="h-4 w-4" /></button>
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
                  <p className="text-xs text-muted-foreground text-center py-10 font-semibold bg-card p-4 rounded-xl border col-span-3">No active promotional programs launched.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: SETTLEMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Settlement Center</h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Track net payouts, pending settled funds, and transaction platform commission deductions (10%).</p>
              </div>

              {/* Settlement stats */}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Sales (Gross)</span>
                  <h3 className="text-2xl font-black mt-1 text-foreground">₹{settlements.reduce((sum, s) => sum + s.totalSales, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Commission Deducted (10%)</span>
                  <h3 className="text-2xl font-black mt-1 text-muted-foreground">₹{settlements.reduce((sum, s) => sum + s.commissionDeducted, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Net Payout Settled</span>
                  <h3 className="text-2xl font-black mt-1 text-brand">₹{settlements.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</h3>
                </div>
              </div>

              {/* Settlements log */}
              <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <div className="p-4 border-b border-border/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settlement Log History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                        <th className="px-6 py-4">Settlement Reference (UTR)</th>
                        <th className="px-6 py-4">Gross Sales</th>
                        <th className="px-6 py-4">Commission (10%)</th>
                        <th className="px-6 py-4">Net Payout</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Settlement Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {settlements.map((s) => (
                        <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-foreground uppercase">{s.transactionReference || "PENDING-UTR"}</td>
                          <td className="px-6 py-4 text-muted-foreground font-semibold">₹{s.totalSales}</td>
                          <td className="px-6 py-4 text-red-600 font-semibold">-₹{s.commissionDeducted}</td>
                          <td className="px-6 py-4 font-black text-brand">₹{s.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === "PROCESSED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground/80 font-semibold">{s.settledAt ? new Date(s.settledAt).toLocaleDateString() : "Pending"}</td>
                        </tr>
                      ))}
                      {settlements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground font-semibold">No settlement histories generated.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Reports & Analytics</h1>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Generate daily, weekly, monthly and profit-analysis reports for audits.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Export Sales Reports</h3>
                  <p className="text-xs text-muted-foreground font-medium">Download full transaction statistics, GST breakdowns and sales values in spreadsheet structure.</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => toast.info("Exporting Daily Sales Log...")} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5"><Download className="h-4 w-4" /> Daily Sales (CSV)</button>
                    <button onClick={() => toast.info("Exporting Monthly Business Audit...")} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5"><Download className="h-4 w-4" /> Monthly Audit (PDF)</button>
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-2xl shadow-soft space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Inventory Turnover Reports</h3>
                  <p className="text-xs text-muted-foreground font-medium">Analyze low-performance inventory list and product restocking cycles.</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button onClick={() => toast.info("Exporting Low Stock Audits...")} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5"><Download className="h-4 w-4" /> Low Stock Audits (CSV)</button>
                    <button onClick={() => toast.info("Exporting Product Performance Reports...")} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted transition-all flex items-center gap-1.5"><Download className="h-4 w-4" /> Performance Reports (PDF)</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: NOTIFICATIONS FEED */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">Alert Feeds</h1>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">View real-time stock, order, and platform transaction notification items.</p>
                </div>
                <button
                  onClick={() => toast.success("Marked all notifications as read")}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Mark all read
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleMarkNotificationRead(n._id)}
                    className={`p-4 border rounded-xl shadow-soft flex items-start gap-4 transition-all cursor-pointer ${
                      n.isRead ? "bg-card/60 border-border/60 opacity-80" : "bg-brand/5 border-brand/20 shadow-md"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-brand/10 text-brand mt-0.5">
                      <Bell className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-foreground">{n.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 font-semibold mt-1 inline-block">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-12 bg-card p-4 rounded-xl border font-semibold">No notification items pending.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 12: HELP & SUPPORT DESK */}
          {activeTab === "support" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground">Help & Support Desk</h1>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">Raise queries to platform administrators and view FAQs.</p>
                </div>
                <button
                  onClick={() => setIsSupportModalOpen(true)}
                  className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start"
                >
                  <Plus className="h-4 w-4" /> Raise Support Ticket
                </button>
              </div>

              {/* Chat thread + Tickets */}
              <div className="grid gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Support Tickets</h3>
                  {tickets.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 border rounded-xl shadow-soft cursor-pointer transition-all ${
                        selectedTicket?._id === t._id ? "border-brand bg-brand/5 shadow-md" : "border-border bg-card hover:bg-muted/10"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground">ID: #{t._id.substring(t._id.length - 6).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-foreground uppercase">{t.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground mt-2 truncate">{t.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.description}</p>
                    </div>
                  ))}
                  {tickets.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-10 bg-card p-4 rounded-xl border font-semibold">No raised tickets.</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  {selectedTicket ? (
                    <div className="bg-card border border-border rounded-2xl shadow-soft p-5 space-y-4">
                      <div className="pb-3 border-b border-border">
                        <h4 className="text-sm font-bold text-foreground">{selectedTicket.title}</h4>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{selectedTicket.description}</p>
                      </div>

                      {/* Chat Messages thread */}
                      <div className="h-56 overflow-y-auto space-y-3 p-3 bg-muted/20 rounded-xl border border-border/40">
                        {selectedTicket.chatHistory?.map((msg: any, idx: number) => (
                          <div key={idx} className={`flex flex-col max-w-[80%] rounded-xl p-3 text-xs ${
                            msg.senderId === (user?.id || user?._id) ? "bg-brand text-brand-foreground ml-auto" : "bg-card border border-border mr-auto"
                          }`}>
                            <p className="font-semibold">{msg.message}</p>
                            <span className="text-[9px] text-muted-foreground/60 mt-1 self-end font-semibold">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                        {(!selectedTicket.chatHistory || selectedTicket.chatHistory.length === 0) && (
                          <p className="text-xs text-muted-foreground text-center py-10 italic">No message responses from admin desk yet.</p>
                        )}
                      </div>

                      <form onSubmit={handleSendTicketMessage} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type support reply message..."
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                        />
                        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand/90 flex items-center gap-1.5"><Send className="h-4 w-4" /> Send</button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-2xl shadow-soft p-12 text-center text-muted-foreground font-semibold">
                      Please select a ticket from the list to view conversations with admin.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: PROFILE CREDENTIALS */}
          {activeTab === "profile" && (
            <div className="space-y-6">
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground">Login Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={profileSecurityForm.email}
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-muted/40 px-3 text-xs outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground">Authorized Contact Mobile</label>
                      <input
                        type="text"
                        value={profileSecurityForm.mobile}
                        onChange={(e) => setProfileSecurityForm({ ...profileSecurityForm, mobile: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground">New Security Password</label>
                      <input
                        type="password"
                        value={profileSecurityForm.newPassword}
                        onChange={(e) => setProfileSecurityForm({ ...profileSecurityForm, newPassword: e.target.value })}
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 14: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
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
                          className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
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
                            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
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
                            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
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
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ADD/EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-sm font-black">{editingProductId ? "Modify Catalog Product" : "Add New Agricultural Input"}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4.5 w-4.5" /></button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-muted-foreground">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  >
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pesticide">Pesticide</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Equipment">Tools & Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">SKU Number</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Brand Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Initial Stock Count</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">GST Tax Slab (%)</label>
                  <select
                    value={productForm.gst}
                    onChange={(e) => setProductForm({ ...productForm, gst: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                  >
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground">Product Images (Supports Multiple)</label>
                <div className="mt-1.5 space-y-3">
                  {/* Thumbnails grid */}
                  {((productForm.imageUrls && productForm.imageUrls.length > 0) || tempPreviews.length > 0) && (
                    <div className="grid grid-cols-4 gap-3">
                      {/* Already uploaded images */}
                      {productForm.imageUrls && productForm.imageUrls.map((url: string, idx: number) => {
                        const isPrimary = productForm.imageUrl === url;
                        return (
                          <div key={`uploaded-${idx}`} className="relative group aspect-square border border-border rounded-xl bg-muted overflow-hidden">
                            <img src={url} className="h-full w-full object-cover" alt={`Product ${idx}`} />
                            {/* Primary badge */}
                            {isPrimary && (
                              <span className="absolute top-1 left-1 bg-brand text-brand-foreground text-[8px] font-black px-1.5 py-0.5 rounded shadow-soft">
                                Primary
                              </span>
                            )}
                            {/* Hover overlay actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {!isPrimary && (
                                <button
                                  type="button"
                                  onClick={() => setProductForm({ ...productForm, imageUrl: url })}
                                  className="p-1 rounded bg-brand text-brand-foreground hover:bg-brand/90 text-[10px] font-bold cursor-pointer"
                                  title="Set as main image"
                                >
                                  Main
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextUrls = productForm.imageUrls.filter((_: any, i: number) => i !== idx);
                                  const nextPrimary = isPrimary ? (nextUrls[0] || "") : productForm.imageUrl;
                                  setProductForm({ ...productForm, imageUrl: nextPrimary, imageUrls: nextUrls });
                                }}
                                className="p-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[10px] font-bold cursor-pointer"
                                title="Remove image"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Temporary local uploading/error previews */}
                      {tempPreviews.map((p) => (
                        <div key={p.id} className={`relative aspect-square border rounded-xl bg-muted overflow-hidden ${p.status === 'error' ? 'border-destructive' : 'border-border'}`}>
                          <img src={p.previewUrl} className="h-full w-full object-cover opacity-60" alt="Uploading preview" />
                          
                          {p.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-1">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                              <span className="text-[8px] text-white font-bold">Uploading...</span>
                            </div>
                          )}

                          {p.status === 'error' && (
                            <div className="absolute inset-0 bg-destructive/10 flex flex-col items-center justify-center gap-1">
                              <span className="text-[8px] bg-destructive text-destructive-foreground font-black px-1.5 py-0.5 rounded shadow-soft">Error</span>
                              <button
                                type="button"
                                onClick={() => setTempPreviews(prev => prev.filter(tp => tp.id !== p.id))}
                                className="p-1 py-0.5 rounded bg-card border border-border text-[8px] font-bold cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button wrapper */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, 'product')}
                        className="hidden"
                        id="product-image-upload"
                        disabled={uploadingProductImage}
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted"
                      >
                        {uploadingProductImage ? "Uploading..." : "Upload Images to Cloudinary"}
                      </label>
                      <p className="mt-1 text-[10px] text-muted-foreground">Select one or more images. PNG, JPG, WEBP up to 10MB.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="mt-1.5 h-20 w-full rounded-lg border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90">Publish Catalog</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK LOG */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-black">Adjust Product Inventory</h3>
              <button onClick={() => setIsStockModalOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="font-bold text-muted-foreground">Select Product</label>
                <select
                  value={stockForm.productId}
                  onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                >
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.stock} left)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground">Adjustment Type</label>
                  <select
                    value={stockForm.type}
                    onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                  >
                    <option value="IN">Stock IN (Restocking)</option>
                    <option value="OUT">Stock OUT (Loss / Damage)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground">Adjustment Reason</label>
                <input
                  type="text"
                  required
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90">Apply Adjust</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TRACKING DETAILS */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-black">Ship Order & Dispatch</h3>
              <button onClick={() => setIsTrackingModalOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleDispatchSubmit} className="space-y-4">
              <div>
                <label className="font-bold text-muted-foreground">Logistic Carrier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BlueDart, Delhivery"
                  value={trackingForm.carrierName}
                  onChange={(e) => setTrackingForm({ ...trackingForm, carrierName: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-muted-foreground">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BDT9908123"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsTrackingModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90">Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RAISE TICKET */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-black">Raise Support Query</h3>
              <button onClick={() => setIsSupportModalOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div>
                <label className="font-bold text-muted-foreground">Query Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commission discrepancy, Payment delayed"
                  value={supportForm.title}
                  onChange={(e) => setSupportForm({ ...supportForm, title: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-muted-foreground">Description Details</label>
                <textarea
                  required
                  placeholder="Explain your problem in detail here..."
                  value={supportForm.description}
                  onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                  className="mt-1.5 h-24 w-full rounded-lg border border-border bg-card p-3 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsSupportModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD COUPON */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-sm font-black">Publish Discount Campaign</h3>
              <button onClick={() => setIsOfferModalOpen(false)} className="p-1 rounded hover:bg-muted"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div>
                <label className="font-bold text-muted-foreground">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsoon Special Seeds Offer"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground">Discount Rate (%)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.discountPercentage}
                    onChange={(e) => setOfferForm({ ...offerForm, discountPercentage: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Min Purchase Required (₹)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.minPurchaseAmount}
                    onChange={(e) => setOfferForm({ ...offerForm, minPurchaseAmount: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground">Promo Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON20"
                  value={offerForm.code}
                  onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={offerForm.startDate}
                    onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={offerForm.endDate}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90">Publish Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
