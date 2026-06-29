import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ReviewsTabProps {
  reviews: any[];
  setReviews: (val: any) => void;
}

export function ReviewsTab({ reviews, setReviews }: ReviewsTabProps) {
  const handleReviewReply = async (productId: string, reviewId: string, reply: string) => {
    try {
      const res = await apiFetch(`/api/merchant/products/${productId}/reviews/${reviewId}/reply`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply })
      });
      if (res.ok) {
        toast.success("Reply response submitted successfully.");
        // Refresh local reviews state
        setReviews((prev: any[]) => prev.map(r => r.reviewId === reviewId ? { ...r, reply } : r));
      }
    } catch (err) {
      toast.error("Error submitting review reply");
    }
  };

  const handleReviewReport = async (productId: string, reviewId: string, reason: string) => {
    try {
      const res = await apiFetch(`/api/merchant/products/${productId}/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success("Review reported to administrator.");
      }
    } catch (err) {
      toast.error("Error reporting review");
    }
  };

  return (
    <div className="space-y-6 text-left">
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
                  className="h-9 flex-1 rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
                <button
                  onClick={() => {
                    const val = (document.getElementById(`reply-${idx}`) as HTMLInputElement)?.value;
                    if (val) handleReviewReply(r.productId, r.reviewId, val);
                  }}
                  className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 border-0 cursor-pointer"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Report reason:");
                    if (reason) handleReviewReport(r.productId, r.reviewId, reason);
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 bg-transparent cursor-pointer"
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
  );
}
