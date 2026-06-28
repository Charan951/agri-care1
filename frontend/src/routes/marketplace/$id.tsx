import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Star, ShieldCheck, Truck, MapPin, ChevronRight, X } from "lucide-react";
import { Section } from "@/components/site/Section";
import { CTA } from "@/components/site/CTA";
import { IMG } from "@/lib/site";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/marketplace/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Product Details — AgriCare Marketplace` },
      { name: "description", content: "View product details, reviews and merchant info on AgriCare." },
      { property: "og:image", content: IMG.marketplace },
    ],
  }),
  component: ProductDetails,
});

function ProductDetails() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/customer/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setActiveImage(data.product?.imageUrl || IMG.vegetables);
        } else {
          // Fallback to static if request fails or unauthorized
          const mockProduct = {
            _id: id,
            name: "Hybrid Tomato Seeds — Pusa Ruby (10g)",
            price: 240,
            mrp: 320,
            rating: 4.8,
            stock: 20,
            imageUrl: IMG.vegetables,
            description: "High-yielding hybrid tomato seeds suited for Kharif and Rabi seasons. Disease-resistant, uniform fruit size, ideal for both fresh market and processing.",
            category: "Seeds & Saplings",
            sku: `AGS-${id}`,
            brand: "Pusa Ruby",
            specifications: {
              "Pack size": "10g (~3,000 seeds)",
              "Crop season": "Kharif, Rabi",
              "Spacing": "60 × 45 cm",
              "Storage": "Cool, dry place < 25°C",
              "Country of origin": "India"
            },
            reviews: [
              { name: "Mahesh K.", comment: "Excellent germination, almost 95% sprouted. Will buy again.", rating: 5, date: new Date() },
              { name: "Suresh P.", comment: "Good quality and fast delivery. Plants are healthy.", rating: 4, date: new Date() }
            ],
            merchantId: {
              businessName: "Green Valley Agritech",
              rating: 4.9
            }
          };
          setProduct(mockProduct);
          setActiveImage(mockProduct.imageUrl);
        }
      } catch (err) {
        const mockProduct = {
          _id: id,
          name: "Hybrid Tomato Seeds — Pusa Ruby (10g)",
          price: 240,
          mrp: 320,
          rating: 4.8,
          stock: 20,
          imageUrl: IMG.vegetables,
          description: "High-yielding hybrid tomato seeds suited for Kharif and Rabi seasons. Disease-resistant, uniform fruit size, ideal for both fresh market and processing.",
          category: "Seeds & Saplings",
          sku: `AGS-${id}`,
          brand: "Pusa Ruby",
          specifications: {
            "Pack size": "10g (~3,000 seeds)",
            "Crop season": "Kharif, Rabi",
            "Spacing": "60 × 45 cm",
            "Storage": "Cool, dry place < 25°C",
            "Country of origin": "India"
          },
          reviews: [
            { name: "Mahesh K.", comment: "Excellent germination, almost 95% sprouted. Will buy again.", rating: 5, date: new Date() },
            { name: "Suresh P.", comment: "Good quality and fast delivery. Plants are healthy.", rating: 4, date: new Date() }
          ],
          merchantId: {
            businessName: "Green Valley Agritech",
            rating: 4.9
          }
        };
        setProduct(mockProduct);
        setActiveImage(mockProduct.imageUrl);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-page py-20 text-center text-muted-foreground">
        Product details could not be found.
      </div>
    );
  }

  const gallery = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : [product.imageUrl || IMG.vegetables];

  const specs = product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications)
    ? Object.entries(product.specifications)
    : [
        ["Pack size", product.weight ? `${product.weight} ${product.unit || "g"}` : "Standard"],
        ["Brand", product.brand || "AgriCare Approved"],
        ["Category", product.category],
        ["Country of origin", "India"]
      ];

  const handleAddToCart = async () => {
    try {
      const res = await apiFetch('/api/customer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      if (res.ok) {
        toast.success("Product added to your cart!");
      } else {
        toast.error("Sign in as a Farmer to add items to your cart.");
      }
    } catch (e) {
      toast.error("Failed to add to cart.");
    }
  };

  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="container-page py-4 text-sm text-muted-foreground">
          <nav className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/marketplace" className="hover:text-foreground">Marketplace</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={activeImage} alt={product.name} className="aspect-square w-full object-cover" />
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {gallery.map((g: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(g)}
                    className={`overflow-hidden rounded-lg border bg-card hover:border-brand ${
                      activeImage === g ? "border-brand border-2" : "border-border"
                    }`}
                  >
                    <img src={g} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="eyebrow">{product.stock === 0 ? "Out of Stock" : product.category}</span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">{product.name}</h1>
            
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-gold text-gold" />
                {product.rating || 5.0} ({product.reviews?.length || 0} reviews)
              </span>
              <span>·</span>
              <span className="font-semibold">SKU: {product.sku || "N/A"}</span>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <p className="text-4xl font-bold text-foreground">₹{(product.price || 0).toLocaleString("en-IN")}</p>
              {product.mrp > product.price && (
                <>
                  <p className="text-base text-muted-foreground line-through">₹{product.mrp.toLocaleString("en-IN")}</p>
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold text-brand">
                    Save {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground font-medium">
              {product.description}
            </p>

            {product.usageInstructions && (
              <div className="mt-6 text-xs bg-muted/30 p-3 rounded-lg border border-border">
                <strong className="text-foreground">Usage Instructions:</strong>
                <p className="mt-1 text-muted-foreground">{product.usageInstructions}</p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={handleAddToCart}
                className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
              >
                Add to cart
              </button>
            </div>

            <div className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-5 text-sm">
              <div className="flex items-center gap-3"><Truck className="h-4 w-4 text-brand" /> Delivery in 3–5 days</div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-brand" />
                Verified merchant · 7-day returns
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-brand" />
                Ships from {product.merchantId?.businessName || "Verified AgriCare Partner"}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Specifications</h2>
            <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-card">
              {specs.map(([k, v]: any) => (
                <div key={k} className="grid grid-cols-2 gap-4 px-5 py-4 text-sm font-semibold">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-foreground">{v}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-12 text-2xl font-bold tracking-tight text-foreground">Reviews</h2>
            <div className="mt-5 space-y-4">
              {product.reviews?.map((r: any, idx: number) => (
                <div key={idx} className="card-soft p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{r.name}</p>
                    <div className="flex text-gold">
                      {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium bg-muted/20 p-2.5 rounded-lg italic">"{r.comment}"</p>
                  {r.reply && (
                    <div className="ml-6 bg-brand/5 border border-brand/10 p-3 rounded-lg text-xs">
                      <span className="font-bold text-brand block mb-0.5">Merchant response:</span>
                      <p className="text-muted-foreground font-medium">"{r.reply}"</p>
                    </div>
                  )}
                </div>
              ))}
              {(!product.reviews || product.reviews.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-6">No customer reviews yet.</p>
              )}
            </div>
          </div>

          <aside>
            <div className="card-soft p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sold by</p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {product.merchantId?.businessName || "Verified Partner"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified merchant · Rating: {product.merchantId?.rating || 5.0} ★
              </p>
            </div>
          </aside>
        </div>
      </Section>
      <CTA />
    </>
  );
}
