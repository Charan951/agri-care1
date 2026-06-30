import { useEffect, useState } from "react";
import { ShoppingCart, Trash2, CheckCircle2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";
//ji
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface CartTabProps {
  setActiveTab: (tab: any) => void;
  onCartOrWishlistUpdate?: () => void;
}

export function CartTab({ setActiveTab, onCartOrWishlistUpdate }: CartTabProps) {
  const { user } = useAuth();

  const [cart, setCart] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "address" | "payment" | "success">("cart");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [checkoutReceipt, setCheckoutReceipt] = useState<any>(null);

  const fetchCartAndProfile = async () => {
    try {
      const cartRes = await apiFetch("/api/customer/cart");
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCart(cartData.cart || []);
      }
      
      const profileRes = await apiFetch("/api/customer/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfileData(profileData.user);
      }
    } catch (err) {
      console.error("Error loading cart/profile", err);
      toast.error("Failed to load cart information");
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchCartAndProfile();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCartUpdated = (data: any) => {
      setCart(data.cart || []);
    };

    socket.on("cart_updated", handleCartUpdated);
    return () => {
      socket.off("cart_updated", handleCartUpdated);
    };
  }, [socket]);

  const handleAddToCart = async (productId: string, quantity: number) => {
    try {
      const res = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart || []);
        onCartOrWishlistUpdate?.();
      }
    } catch (err) {
      toast.error("Failed to update item quantity");
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    try {
      const res = await apiFetch(`/api/customer/cart/${productId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart || []);
        toast.success("Removed from cart");
        onCartOrWishlistUpdate?.();
      }
    } catch (err) {
      toast.error("Error removing item");
    }
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === "KISAN20") {
      setAppliedDiscount(0.2); // 20% off
      toast.success("Coupon KISAN20 applied! 20% discount applied.");
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const handleCheckoutSubmit = async () => {
    if (!profileData?.savedAddresses || profileData.savedAddresses.length === 0) {
      toast.error("Please add a delivery address in your Profile first!");
      setActiveTab("profile");
      return;
    }

    try {
      setIsPaymentProcessing(true);
      const res = await apiFetch("/api/customer/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product._id,
            quantity: item.quantity
          })),
          couponCode: couponCode
        })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || "Failed to create order on server.");
        setIsPaymentProcessing(false);
        return;
      }

      const orderData = await res.json();
      await loadRazorpayScript();

      const deliveryAddress = profileData.savedAddresses[selectedAddressIndex];
      const formattedAddress = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`;

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "AgriCare Marketplace",
        description: "Purchase Fertilisers & Seeds",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiFetch("/api/customer/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                items: cart.map(item => ({
                  product: item.product,
                  quantity: item.quantity,
                  price: item.product.price
                })),
                deliveryAddress: formattedAddress,
                totalAmount: orderData.finalAmount,
                paymentMethod: "Razorpay Checkout"
              })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              setCheckoutReceipt(verifyData);
              setCart([]);
              setAppliedDiscount(0);
              setCheckoutStep("success");
              toast.success("Payment Received! Order placed successfully.");
              onCartOrWishlistUpdate?.();
            } else {
              toast.error("Payment verification failed on server.");
            }
          } catch (verifyErr) {
            toast.error("Error verifying payment.");
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile
        },
        theme: {
          color: "#4CAF50"
        },
        modal: {
          ondismiss: function () {
            setIsPaymentProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Error starting checkout payment.");
      setIsPaymentProcessing(false);
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
    <div className="grid md:grid-cols-3 gap-6 relative">
      {/* Cart items list */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft md:col-span-2 space-y-4 text-left">
        <h3 className="font-bold text-md border-b border-border pb-2 text-foreground">Your Shopping Cart</h3>
        
        {cart.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-3 border border-dashed rounded-xl">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            <p>Your cart is empty. Check out our seeds and fertilizers.</p>
            <button onClick={() => setActiveTab("marketplace")} className="bg-brand text-brand-foreground text-xs font-bold px-4 py-2 rounded-lg cursor-pointer border-0">Browse Shop</button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item._id} className="flex flex-row items-center justify-between p-3.5 border border-border rounded-xl gap-4 bg-card shadow-soft">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <img src={item.product?.imageUrl} alt="" className="h-14 w-14 object-cover rounded-lg border bg-muted shrink-0" />
                  <div className="text-left min-w-0">
                    <h4 className="font-bold text-xs text-foreground truncate">{item.product?.name}</h4>
                    <p className="text-brand font-bold text-xs mt-0.5">₹{item.product?.price} each</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 shrink-0">
                  <div className="flex items-center border border-border rounded-lg text-xs overflow-hidden bg-background">
                    <button
                      onClick={() => handleAddToCart(item.product?._id, -1)}
                      className="px-2 py-1 bg-muted hover:bg-muted/70 font-bold border-0 cursor-pointer text-foreground"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-2.5 font-bold text-foreground text-xs">{item.quantity}</span>
                    <button
                      onClick={() => handleAddToCart(item.product?._id, 1)}
                      className="px-2 py-1 bg-muted hover:bg-muted/70 font-bold border-0 cursor-pointer text-foreground"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveFromCart(item.product?._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded bg-transparent border-0 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary / payment sheet */}
      {cart.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 text-left">
          <h4 className="font-bold text-sm border-b border-border pb-2 text-foreground">Order Price Summary</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Subtotal Price</span>
              <span className="font-bold text-foreground">₹{getCartTotal()}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-success font-semibold">
                <span>Coupon Discount (20% off)</span>
                <span>-₹{getCartTotal() * appliedDiscount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground font-semibold">Estimated Delivery fee</span>
              <span className="text-success font-bold">FREE</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
              <span className="text-foreground">Grand Total</span>
              <span className="text-brand">₹{getCartTotal() - (getCartTotal() * appliedDiscount)}</span>
            </div>
          </div>

          {/* Coupon input */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter KISAN20 for discount"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none uppercase text-foreground"
              />
              <button onClick={applyCoupon} className="bg-muted text-foreground border border-border text-xs font-bold px-3 rounded-lg hover:bg-muted/70 cursor-pointer">
                Apply
              </button>
            </div>
          </div>

          {/* Delivery Address selection */}
          <div className="pt-2 space-y-2">
            <p className="text-xs font-bold text-foreground">Select Delivery Address</p>
            {!profileData?.savedAddresses || profileData.savedAddresses.length === 0 ? (
              <p className="text-[10px] text-red-500 font-bold">Please register an address in the Profile tab first!</p>
            ) : (
              <select
                value={selectedAddressIndex}
                onChange={(e) => setSelectedAddressIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
              >
                {profileData.savedAddresses.map((addr: any, idx: number) => (
                  <option key={idx} value={idx}>{addr.label}: {addr.street}, {addr.city}</option>
                ))}
              </select>
            )}
          </div>

          <button onClick={handleCheckoutSubmit} className="w-full bg-brand text-brand-foreground font-bold text-xs py-3 rounded-lg hover:bg-brand/90 transition-colors border-0 cursor-pointer">
            Proceed to Secure Checkout
          </button>
        </div>
      )}

      {/* Checkout Success Modal overlay */}
      {checkoutStep === "success" && checkoutReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 text-center space-y-4 animate-in zoom-in-95 shadow-lift">
            <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-extrabold text-lg text-foreground">Order Placed Successfully!</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Thank you for buying from AgriCare. Your transaction ID is {checkoutReceipt.payment?.transactionId}.
            </p>
            <div className="border border-border p-3.5 rounded-xl text-left text-xs bg-muted/10 space-y-1">
              <p className="font-bold text-foreground">Order Ref: {checkoutReceipt.order?._id}</p>
              <p className="text-muted-foreground">Delivery Address: {checkoutReceipt.order?.deliveryAddress}</p>
              <p className="text-brand font-bold mt-1">Total Paid: ₹{checkoutReceipt.order?.totalAmount}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCheckoutStep("cart");
                  setCheckoutReceipt(null);
                  setActiveTab("orders");
                }}
                className="flex-grow bg-brand text-brand-foreground font-bold text-xs py-2.5 rounded-lg hover:bg-brand/90 border-0 cursor-pointer"
              >
                Track Shipment Status
              </button>
              <button
                onClick={() => {
                  setCheckoutStep("cart");
                  setCheckoutReceipt(null);
                }}
                className="bg-muted text-foreground border border-border font-bold text-xs py-2.5 rounded-lg px-4 hover:bg-muted/85 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
