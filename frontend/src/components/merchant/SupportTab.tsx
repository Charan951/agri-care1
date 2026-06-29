import { Plus, Send } from "lucide-react";

interface SupportTabProps {
  tickets: any[];
  selectedTicket: any;
  setSelectedTicket: (t: any) => void;
  ticketMessage: string;
  setTicketMessage: (val: string) => void;
  handleSendTicketMessage: (e: React.FormEvent) => void;
  setIsSupportModalOpen: (val: boolean) => void;
  user: any;
}

export function SupportTab({
  tickets,
  selectedTicket,
  setSelectedTicket,
  ticketMessage,
  setTicketMessage,
  handleSendTicketMessage,
  setIsSupportModalOpen,
  user
}: SupportTabProps) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Help & Support Desk</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Raise queries to platform administrators and view FAQs.</p>
        </div>
        <button
          onClick={() => setIsSupportModalOpen(true)}
          className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-soft hover:bg-brand/90 transition-all flex items-center gap-1.5 self-start border-0 cursor-pointer"
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
              <div className="h-56 overflow-y-auto space-y-3 p-3 bg-muted/20 rounded-xl border border-border/40 no-scrollbar">
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
                  className="h-10 flex-1 rounded-lg border border-border bg-background text-foreground px-3 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
                <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-brand-foreground hover:bg-brand/90 flex items-center gap-1.5 border-0 cursor-pointer">
                  <Send className="h-4 w-4" /> Send
                </button>
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
  );
}
