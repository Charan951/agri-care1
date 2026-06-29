import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Store, ShoppingBag, Package, ShoppingCart, Users,
  Star, Tag, CreditCard, BarChart3, Bell, HelpCircle, User, Settings,
  LogOut, Plus, Trash2, Edit, Copy, Check, Eye, ChevronRight, X,
  Search, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, ArrowUpRight,
  Truck, ArrowRight, Printer, Download, MessageSquare, Send, Globe,
  ShieldCheck, FileText, Percent, Landmark
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Tab imports
import { OverviewTab } from "@/components/merchant/OverviewTab";
import { StoreTab } from "@/components/merchant/StoreTab";
import { ProductsTab } from "@/components/merchant/ProductsTab";
import { InventoryTab } from "@/components/merchant/InventoryTab";
import { OrdersTab } from "@/components/merchant/OrdersTab";
import { CustomersTab } from "@/components/merchant/CustomersTab";
import { ReviewsTab } from "@/components/merchant/ReviewsTab";
import { OffersTab } from "@/components/merchant/OffersTab";
import { PaymentsTab } from "@/components/merchant/PaymentsTab";
import { ReportsTab } from "@/components/merchant/ReportsTab";
import { NotificationsTab } from "@/components/merchant/NotificationsTab";
import { SupportTab } from "@/components/merchant/SupportTab";
import { ProfileTab } from "@/components/merchant/ProfileTab";
import { SettingsTab } from "@/components/merchant/SettingsTab";

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

          const compressedFile = await compressImage(file);
          const formData = new FormData();
          formData.append('image', compressedFile);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            
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

  const loadDashboardData = async () => {
    try {
      const statsRes = await fetch("/api/merchant/dashboard-stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const prodRes = await fetch("/api/merchant/products");
      if (prodRes.ok) setProducts(await prodRes.json());

      const invRes = await fetch("/api/merchant/inventory/logs");
      if (invRes.ok) setInventoryLogs(await invRes.json());

      const ordRes = await fetch("/api/merchant/orders");
      if (ordRes.ok) setOrders(await ordRes.json());

      const custRes = await fetch("/api/merchant/customers");
      if (custRes.ok) setCustomers(await custRes.json());

      const revRes = await fetch("/api/merchant/reviews");
      if (revRes.ok) setReviews(await revRes.json());

      const offRes = await fetch("/api/merchant/offers");
      if (offRes.ok) setOffers(await offRes.json());

      const setRes = await fetch("/api/merchant/settlements");
      if (setRes.ok) setSettlements(await setRes.json());

      const notRes = await fetch("/api/merchant/notifications");
      if (notRes.ok) setNotifications(await notRes.json());

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
    <div className="flex h-screen overflow-hidden bg-muted/30 text-foreground font-sans">
      {/* SIDEBAR */}
      <aside className="w-68 h-full border-r border-border bg-card hidden lg:flex flex-col justify-between p-4 flex-shrink-0">
        <div className="flex flex-col justify-between h-full overflow-y-auto no-scrollbar pr-1">
          <div className="space-y-5">
            <div className="flex items-center gap-3.5 px-3 py-2 text-left">
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
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold border-0 cursor-pointer transition-all ${
                    activeTab === item.id
                      ? "bg-brand text-brand-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground bg-transparent"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                  {item.id === "notifications" && notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1.5 animate-pulse">
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-0 bg-transparent cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign out Dashboard
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN BODY SCROLL */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* MOBILE HEADER */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
              <Globe className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">{user?.businessName || "Merchant Portal"}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground bg-transparent cursor-pointer"
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
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4 text-left">
                <span className="text-sm font-bold">{user?.businessName || "Menu"}</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md hover:bg-muted bg-transparent border-0 cursor-pointer"><X className="h-5 w-5" /></button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold border-0 cursor-pointer ${
                      activeTab === item.id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted bg-transparent"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <button onClick={handleLogoutClick} className="flex items-center gap-3 px-3 py-2 mt-4 border-t border-border text-xs font-bold text-red-600 border-x-0 border-b-0 bg-transparent cursor-pointer"><LogOut className="h-4 w-4" /> Sign out</button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-7 space-y-6 focus:outline-none bg-muted/10 no-scrollbar">
          {activeTab === "overview" && (
            <OverviewTab stats={stats} />
          )}

          {activeTab === "store" && (
            <StoreTab
              storeProfileForm={storeProfileForm}
              setStoreProfileForm={setStoreProfileForm}
              handleStoreProfileSubmit={handleStoreProfileSubmit}
              handleImageUpload={handleImageUpload}
              uploadingLogo={uploadingLogo}
              uploadingBanner={uploadingBanner}
            />
          )}

          {activeTab === "products" && (
            <ProductsTab
              products={products}
              setIsProductModalOpen={setIsProductModalOpen}
              setEditingProductId={setEditingProductId}
              setProductForm={setProductForm}
              setTempPreviews={setTempPreviews}
              handleEditProduct={handleEditProduct}
              handleDuplicateProduct={handleDuplicateProduct}
              handleDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryTab
              products={products}
              inventoryLogs={inventoryLogs}
              setIsStockModalOpen={setIsStockModalOpen}
              setStockForm={setStockForm}
            />
          )}

          {activeTab === "orders" && (
            <OrdersTab
              orders={orders}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              handleUpdateStatus={handleUpdateStatus}
              setTrackingForm={setTrackingForm}
              setIsTrackingModalOpen={setIsTrackingModalOpen}
            />
          )}

          {activeTab === "customers" && (
            <CustomersTab
              customers={customers}
              setCustomers={setCustomers}
            />
          )}

          {activeTab === "reviews" && (
            <ReviewsTab
              reviews={reviews}
              setReviews={setReviews}
            />
          )}

          {activeTab === "offers" && (
            <OffersTab
              offers={offers}
              setIsOfferModalOpen={setIsOfferModalOpen}
              handleDeleteOffer={handleDeleteOffer}
            />
          )}

          {activeTab === "payments" && (
            <PaymentsTab settlements={settlements} />
          )}

          {activeTab === "reports" && (
            <ReportsTab />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              setNotifications={setNotifications}
            />
          )}

          {activeTab === "support" && (
            <SupportTab
              tickets={tickets}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              ticketMessage={ticketMessage}
              setTicketMessage={setTicketMessage}
              handleSendTicketMessage={handleSendTicketMessage}
              setIsSupportModalOpen={setIsSupportModalOpen}
              user={user}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab
              profileSecurityForm={profileSecurityForm}
              setProfileSecurityForm={setProfileSecurityForm}
              handleProfileSecuritySubmit={handleProfileSecuritySubmit}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              storeProfileForm={storeProfileForm}
              setStoreProfileForm={setStoreProfileForm}
              handleStoreProfileSubmit={handleStoreProfileSubmit}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: ADD/EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border text-left">
              <h3 className="text-sm font-black">{editingProductId ? "Modify Catalog Product" : "Add New Agricultural Input"}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded-lg hover:bg-muted bg-transparent border-0 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-muted-foreground">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
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
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Brand Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Initial Stock Count</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">GST Tax Slab (%)</label>
                  <select
                    value={productForm.gst}
                    onChange={(e) => setProductForm({ ...productForm, gst: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none"
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
                  {((productForm.imageUrls && productForm.imageUrls.length > 0) || tempPreviews.length > 0) && (
                    <div className="grid grid-cols-4 gap-3">
                      {productForm.imageUrls && productForm.imageUrls.map((url: string, idx: number) => {
                        const isPrimary = productForm.imageUrl === url;
                        return (
                          <div key={`uploaded-${idx}`} className="relative group aspect-square border border-border rounded-xl bg-muted overflow-hidden">
                            <img src={url} className="h-full w-full object-cover" alt={`Product ${idx}`} />
                            {isPrimary && (
                              <span className="absolute top-1 left-1 bg-brand text-brand-foreground text-[8px] font-black px-1.5 py-0.5 rounded shadow-soft">
                                Primary
                              </span>
                            )}
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
                                className="p-1 rounded bg-destructive text-white hover:bg-destructive/90 text-[10px] font-bold cursor-pointer border-0"
                                title="Remove image"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}

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
                              <span className="text-[8px] bg-destructive text-white font-black px-1.5 py-0.5 rounded shadow-soft">Error</span>
                              <button
                                type="button"
                                onClick={() => setTempPreviews(prev => prev.filter(tp => tp.id !== p.id))}
                                className="p-1 py-0.5 rounded bg-card border border-border text-[8px] font-bold cursor-pointer text-foreground"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted text-foreground"
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
                  className="mt-1.5 h-20 w-full rounded-lg border border-border bg-background text-foreground p-3 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted bg-transparent text-foreground cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Publish Catalog</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK LOG */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border text-left">
              <h3 className="text-sm font-black">Adjust Product Inventory</h3>
              <button onClick={() => setIsStockModalOpen(false)} className="p-1 rounded hover:bg-muted bg-transparent border-0 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleStockAdjustment} className="space-y-4 text-left">
              <div>
                <label className="font-bold text-muted-foreground">Select Product</label>
                <select
                  value={stockForm.productId}
                  onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted bg-transparent text-foreground cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Apply Adjust</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TRACKING DETAILS */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border text-left">
              <h3 className="text-sm font-black">Ship Order & Dispatch</h3>
              <button onClick={() => setIsTrackingModalOpen(false)} className="p-1 rounded hover:bg-muted bg-transparent border-0 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleDispatchSubmit} className="space-y-4 text-left">
              <div>
                <label className="font-bold text-muted-foreground">Logistic Carrier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BlueDart, Delhivery"
                  value={trackingForm.carrierName}
                  onChange={(e) => setTrackingForm({ ...trackingForm, carrierName: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsTrackingModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted bg-transparent text-foreground cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RAISE TICKET */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border text-left">
              <h3 className="text-sm font-black">Raise Support Query</h3>
              <button onClick={() => setIsSupportModalOpen(false)} className="p-1 rounded hover:bg-muted bg-transparent border-0 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleRaiseTicket} className="space-y-4 text-left">
              <div>
                <label className="font-bold text-muted-foreground">Query Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commission discrepancy, Payment delayed"
                  value={supportForm.title}
                  onChange={(e) => setSupportForm({ ...supportForm, title: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-muted-foreground">Description Details</label>
                <textarea
                  required
                  placeholder="Explain your problem in detail here..."
                  value={supportForm.description}
                  onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                  className="mt-1.5 h-24 w-full rounded-lg border border-border bg-background text-foreground p-3 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsSupportModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted bg-transparent text-foreground cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD COUPON */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border text-left">
              <h3 className="text-sm font-black">Publish Discount Campaign</h3>
              <button onClick={() => setIsOfferModalOpen(false)} className="p-1 rounded hover:bg-muted bg-transparent border-0 cursor-pointer"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form onSubmit={handleOfferSubmit} className="space-y-4 text-left">
              <div>
                <label className="font-bold text-muted-foreground">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monsoon Special Seeds Offer"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">Min Purchase Required (₹)</label>
                  <input
                    type="number"
                    required
                    value={offerForm.minPurchaseAmount}
                    onChange={(e) => setOfferForm({ ...offerForm, minPurchaseAmount: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
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
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={offerForm.endDate}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background text-foreground px-3 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsOfferModalOpen(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-muted bg-transparent text-foreground cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer">Publish Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
