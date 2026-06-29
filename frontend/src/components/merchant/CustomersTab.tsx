import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface CustomersTabProps {
  customers: any[];
  setCustomers: (val: any) => void;
}

export function CustomersTab({ customers, setCustomers }: CustomersTabProps) {
  const handleSaveNotes = async (customerId: string, notes: string) => {
    try {
      const res = await apiFetch(`/api/merchant/customers/${customerId}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers((prev: any[]) => prev.map(c => c._id === customerId ? data.customer : c));
        toast.success("Customer CRM note saved.");
      }
    } catch (err) {
      toast.error("Failed to save CRM note");
    }
  };

  return (
    <div className="space-y-6 text-left">
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
            <tbody className="divide-y divide-border/40 font-medium text-foreground">
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
                    <input
                      type="text"
                      defaultValue={c.notes}
                      onBlur={(e) => handleSaveNotes(c._id, e.target.value)}
                      className="h-8 rounded border border-border bg-background text-foreground px-2 text-[11px] outline-none focus:ring-1 focus:ring-brand w-48"
                      placeholder="Add preference notes..."
                    />
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
  );
}
