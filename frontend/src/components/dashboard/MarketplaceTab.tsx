import { useEffect, useState } from "react";
import { Store, Heart, ShoppingCart, X, Star, RefreshCw, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface MarketplaceTabProps {
  wishlistIds: string[];
  onCartOrWishlistUpdate: () => void;
  setActiveTab?: (tab: any) => void;
}

export function MarketplaceTab({ wishlistIds = [], onCartOrWishlistUpdate, setActiveTab }: MarketplaceTabProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const catQuery = marketCategory ? `&category=${marketCategory}` : "";
      const searchQuery = marketSearch ? `&search=${marketSearch}` : "";
      const res = await apiFetch(`/api/customer/products?${catQuery}${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error loading products", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [marketCategory, marketSearch]);

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        toast.success("Product added to cart!");
        onCartOrWishlistUpdate();
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = async (productId: string) => {
    try {
      const res = await apiFetch("/api/customer/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (res.ok) {
        toast.success("Product added to cart!");
        onCartOrWishlistUpdate();
        if (setActiveTab) {
          setActiveTab("cart");
        }
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const handleAddToWishlist = async (productId: string) => {
    try {
      const isWishlisted = wishlistIds.includes(productId);
      const url = isWishlisted 
        ? `/api/customer/wishlist/${productId}` 
        : "/api/customer/wishlist";
      const method = isWishlisted ? "DELETE" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: isWishlisted ? undefined : JSON.stringify({ productId })
      });
      if (res.ok) {
        toast.success(isWishlisted ? "Removed from Wishlist!" : "Added to Wishlist!");
        onCartOrWishlistUpdate();
      } else {
        toast.error("Failed to update wishlist");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  // If a product is selected, display details page inline
  if (selectedProduct) {
    const related = products.filter(p => p.category === selectedProduct.category && p._id !== selectedProduct._id);
    const isSelectedProductWishlisted = wishlistIds.includes(selectedProduct._id);

    return (
      <div className="space-y-6 text-left">
        <button
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          ← Back to Shop
        </button>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <img src={selectedProduct.imageUrl} alt="" className="w-full object-cover rounded-2xl border aspect-square bg-muted" />
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-brand uppercase">{selectedProduct.category}</span>
                <h2 className="font-extrabold text-lg text-foreground leading-tight">{selectedProduct.name}</h2>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span className="flex items-center gap-0.5 text-yellow-500 font-bold">★ {selectedProduct.rating}</span>
                  <span className="text-muted-foreground">({selectedProduct.reviews?.length || 0} reviews)</span>
                </div>
              </div>

              <div className="text-xl font-black text-foreground">
                ₹{selectedProduct.price}
              </div>

              <div className="space-y-1.5 border-y border-border py-4">
                <p className="text-[11px] font-bold text-muted-foreground uppercase">Stock Status</p>
                {selectedProduct.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    ● In Stock ({selectedProduct.stock} units)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                    ● Out of Stock
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{selectedProduct.description}</p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAddToWishlist(selectedProduct._id)}
                  className="p-3 border border-border rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer bg-card transition-colors shrink-0"
                >
                  <Heart className={`h-5 w-5 ${isSelectedProductWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </button>
                <button
                  onClick={() => handleAddToCart(selectedProduct._id)}
                  disabled={selectedProduct.stock <= 0}
                  className="flex-1 bg-brand-soft text-brand border border-brand/10 font-bold text-xs py-3 rounded-xl hover:bg-brand/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="h-4.5 w-4.5" /> Add to Cart
                </button>
                <button
                  onClick={() => handleBuyNow(selectedProduct._id)}
                  disabled={selectedProduct.stock <= 0}
                  className="flex-1 bg-brand text-brand-foreground font-bold text-xs py-3 rounded-xl hover:bg-brand/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-0 cursor-pointer shadow-soft"
                >
                  <Zap className="h-4.5 w-4.5 fill-current" /> Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* Feedback reviews */}
          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="font-bold text-sm text-foreground">Farmer Feedback Reviews ({selectedProduct.reviews?.length || 0})</h4>
            {!selectedProduct.reviews || selectedProduct.reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No feedback reviews submitted yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto no-scrollbar">
                {selectedProduct.reviews.map((rev: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted/20 border border-border rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{rev.name}</span>
                      <span className="text-yellow-500">★ {rev.rating}</span>
                    </div>
                    <p className="text-muted-foreground italic">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-md text-foreground">Related Products</h3>
          {related.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No related products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((prod) => {
                const isProdWishlisted = wishlistIds.includes(prod._id);
                return (
                  <div key={prod._id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                    <div className="cursor-pointer text-left" onClick={() => setSelectedProduct(prod)}>
                      <img src={prod.imageUrl} alt="" className="aspect-[4/3] w-full object-cover border-b bg-muted" />
                      <div className="p-3.5 space-y-1.5">
                        <span className="text-[9px] font-bold text-brand uppercase">{prod.category}</span>
                        <h4 className="font-bold text-xs text-foreground truncate">{prod.name}</h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{prod.description}</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground pt-1">
                          <span>₹{prod.price}</span>
                          <span className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-semibold">★ {prod.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 border-t border-border flex gap-2">
                      <button
                        onClick={() => handleAddToWishlist(prod._id)}
                        className="p-2 border border-border rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer bg-transparent"
                      >
                        <Heart className={`h-4.5 w-4.5 ${isProdWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                      </button>
                      <button
                        onClick={() => handleAddToCart(prod._id)}
                        className="flex-grow bg-brand text-brand-foreground font-bold text-xs py-2 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                      >
                        <ShoppingCart className="h-4 w-4" /> Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters / Search header */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-soft">
        <div className="flex flex-grow w-full md:max-w-md items-center gap-2 border border-border px-3 py-2 rounded-lg bg-background text-foreground">
          <Store className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search seeds, inputs, equipment..."
            value={marketSearch}
            onChange={(e) => setMarketSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="w-full md:w-48 flex-shrink-0">
          <select
            value={marketCategory}
            onChange={(e) => setMarketCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand font-semibold text-foreground cursor-pointer"
          >
            <option value="">All Categories</option>
            <option value="Seeds & Saplings">Seeds & Saplings</option>
            <option value="Fertilizers">Fertilizers</option>
            <option value="Equipment">Equipment</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              No products match your search.
            </div>
          ) : (
            products.map((prod) => {
              const isProdWishlisted = wishlistIds.includes(prod._id);
              return (
                <div key={prod._id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                  <div className="cursor-pointer text-left" onClick={() => setSelectedProduct(prod)}>
                    <img src={prod.imageUrl} alt="" className="aspect-[4/3] w-full object-cover border-b bg-muted" />
                    <div className="p-3.5 space-y-1.5">
                      <span className="text-[9px] font-bold text-brand uppercase">{prod.category}</span>
                      <h4 className="font-bold text-xs text-foreground truncate">{prod.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{prod.description}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground pt-1">
                        <span>₹{prod.price}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-semibold">★ {prod.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-border flex gap-2">
                    <button
                      onClick={() => handleAddToWishlist(prod._id)}
                      className="p-2 border border-border rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer bg-transparent"
                    >
                      <Heart className={`h-4.5 w-4.5 ${isProdWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                    </button>
                    <button
                      onClick={() => handleAddToCart(prod._id)}
                      className="flex-grow bg-brand text-brand-foreground font-bold text-xs py-2 rounded-lg hover:bg-brand/90 flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
