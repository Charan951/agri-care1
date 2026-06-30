import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

export function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await apiFetch("/api/customer/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Error loading payments", err);
      toast.error("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdated = () => {
      fetchPayments();
    };

    socket.on("order_updated", handleOrderUpdated);
    return () => {
      socket.off("order_updated", handleOrderUpdated);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-soft text-left space-y-4">
      <h3 className="font-bold text-md border-b border-border pb-2 text-foreground">Razorpay Transaction Logs</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-semibold">
              <th className="py-2.5">Transaction ID</th>
              <th className="py-2.5">Date</th>
              <th className="py-2.5">Method</th>
              <th className="py-2.5">Amount</th>
              <th className="py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">No payments record found.</td>
              </tr>
            ) : (
              payments.map((p, i) => (
                <tr key={i} className="border-b border-border/60 hover:bg-muted/10">
                  <td className="py-3 font-semibold text-foreground">{p.transactionId}</td>
                  <td className="py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 font-semibold text-muted-foreground">{p.paymentMethod}</td>
                  <td className="py-3 font-bold text-foreground">₹{p.amount}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      p.status === 'SUCCESSFUL' ? 'bg-success/15 text-success' : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
