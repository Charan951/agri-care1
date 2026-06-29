interface PaymentsTabProps {
  settlements: any[];
}

export function PaymentsTab({ settlements }: PaymentsTabProps) {
  const grossRevenues = settlements.reduce((sum, s) => sum + s.totalSales, 0);
  const commissionDeducted = settlements.reduce((sum, s) => sum + s.commissionDeducted, 0);
  const netPayout = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Settlement Center</h1>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">Track net payouts, pending settled funds, and transaction platform commission deductions (10%).</p>
      </div>

      {/* Payout statistics */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Total Sales (Gross)</span>
          <h3 className="text-2xl font-black mt-1 text-foreground">₹{grossRevenues.toLocaleString()}</h3>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Commission Deducted (10%)</span>
          <h3 className="text-2xl font-black mt-1 text-muted-foreground">₹{commissionDeducted.toLocaleString()}</h3>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Net Payout Settled</span>
          <h3 className="text-2xl font-black mt-1 text-brand">₹{netPayout.toLocaleString()}</h3>
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
            <tbody className="divide-y divide-border/40 font-medium text-foreground">
              {settlements.map((s) => (
                <tr key={s._id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-foreground uppercase">{s.transactionReference || "PENDING-UTR"}</td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">₹{s.totalSales}</td>
                  <td className="px-6 py-4 text-red-600 font-semibold">-₹{s.commissionDeducted}</td>
                  <td className="px-6 py-4 font-black text-brand">₹{s.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
  );
}
