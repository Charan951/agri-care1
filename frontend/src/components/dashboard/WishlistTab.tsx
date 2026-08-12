import { useEffect, useState } from "react";
import { Trash2, ShoppingCart, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

interface WishlistTabProps {
  onCartOrWishlistUpdate?: () => void;
  isActive?: boolean;
}

export function WishlistTab({ onCartOrWishlistUpdate, isActive }: WishlistTabProps) {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await apiFetch("/api/customer/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
      }
    } catch (err) {
      console.error("Error loading wishlist", err);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (isActive !== false) {
      fetchWishlist();
    }
  }, [isActive]);

  useEffect(() => {
    if (!socket) return;

    const handleWishlistUpdated = (data: any) => {
      setWishlist(data.wishlist || []);
    };

    socket.on("wishlist_updated", handleWishlistUpdated);
    return () => {
      socket.off("wishlist_updated", handleWishlistUpdated);
    };
  }, [socket]);

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      const res = await apiFetch(`/api/customer/wishlist/${productId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.wishlist || []);
        toast.success("Removed from wishlist");
        onCartOrWishlistUpdate?.();
      }
    } catch (err) {
      toast.error("Error removing from wishlist");
    }
  };

  const handleMoveWishlistToCart = async (productId: string) => {
    try {
      // Add to cart
      const cartRes = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      
      if (cartRes.ok) {
        // Remove from wishlist
        const wishlistRes = await apiFetch(`/api/customer/wishlist/${productId}`, { method: "DELETE" });
        if (wishlistRes.ok) {
          const data = await wishlistRes.json();
          setWishlist(data.wishlist || []);
          toast.success("Product moved to cart!");
          onCartOrWishlistUpdate?.();
        }
      }
    } catch (err) {
      toast.error("Failed to move product to cart");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const validWishlist = wishlist.filter(item => item !== null);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4">
      <h3 className="font-bold text-md border-b border-border pb-2 text-foreground">My Saved Products</h3>
      {validWishlist.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-12">No products saved in Wishlist.</p>
      ) : (
        <div className="space-y-4">
          {validWishlist.map((item) => (
            <div key={item?._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl gap-4 bg-card border-border">
              <div className="flex items-center gap-4 text-left">
                <img src={item?.imageUrl} alt="" className="h-16 w-16 object-cover rounded-lg border bg-muted" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">{item?.name}</h4>
                  <p className="text-brand font-bold text-xs mt-1">₹{item?.price}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleRemoveFromWishlist(item?._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded border border-border bg-transparent cursor-pointer"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => handleMoveWishlistToCart(item?._id)}
                  className="flex-grow bg-brand text-brand-foreground font-bold text-xs px-4 py-2 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" /> Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
