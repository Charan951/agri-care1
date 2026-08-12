import { useEffect, useState, useRef } from "react";
import { Ticket as TicketIcon, Send, X, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

export function TicketsTab() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New ticket form states
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketImage, setNewTicketImage] = useState("");

  // Ticket chat states
  const [ticketMessage, setTicketMessage] = useState("");

  const ticketChatEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    try {
      const res = await apiFetch("/api/customer/tickets");
      if (res.ok) {
        const data = await res.json();
        const list = data.tickets || [];
        setTickets(list);

        // Restore selected ticket from sessionStorage
        const savedId = typeof window !== "undefined" ? sessionStorage.getItem("farmer_selected_ticket_id") : null;
        if (savedId && (!selectedTicket || selectedTicket._id !== savedId)) {
          const matched = list.find((t: any) => t._id === savedId);
          if (matched) {
            setSelectedTicket(matched);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching tickets", err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("farmer_selected_ticket_id", selectedTicket._id);
      }
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("farmer_selected_ticket_id");
      }
    }
  }, [selectedTicket]);

  useEffect(() => {
    const loadAndRestore = async () => {
      await fetchTickets();
    };
    loadAndRestore();
  }, []);

  // Socket update listener
  useEffect(() => {
    if (!socket) return;

    const handleTicketChatUpdate = (data: any) => {
      if (selectedTicket && selectedTicket._id === data.ticketId) {
        setSelectedTicket((prev: any) => {
          if (!prev) return null;
          return { ...prev, chatHistory: data.chatHistory };
        });
        setTimeout(() => ticketChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
      
      // Reload tickets list
      apiFetch("/api/customer/tickets")
        .then(res => res.json())
        .then(resData => setTickets(resData.tickets || []));
    };

    const handleTicketStatusUpdate = (data: any) => {
      if (selectedTicket && selectedTicket._id === data.ticketId) {
        setSelectedTicket((prev: any) => {
          if (!prev) return null;
          return { ...prev, status: data.status };
        });
      }
      
      // Reload tickets list
      apiFetch("/api/customer/tickets")
        .then(res => res.json())
        .then(resData => setTickets(resData.tickets || []));
    };

    socket.on("ticket_chat_updated", handleTicketChatUpdate);
    socket.on("ticket_status_updated", handleTicketStatusUpdate);

    return () => {
      socket.off("ticket_chat_updated", handleTicketChatUpdate);
      socket.off("ticket_status_updated", handleTicketStatusUpdate);
    };
  }, [socket, selectedTicket]);

  // Auto scroll chat
  useEffect(() => {
    ticketChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.chatHistory]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/customer/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTicketTitle,
          description: newTicketDesc,
          imageUrls: newTicketImage ? [newTicketImage] : []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(prev => [data.ticket, ...prev]);
        toast.success("Support ticket created!");
        setNewTicketTitle("");
        setNewTicketDesc("");
        setNewTicketImage("");
      }
    } catch (err) {
      toast.error("Error creating support ticket");
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim() || !selectedTicket) return;

    try {
      const res = await apiFetch(`/api/customer/tickets/${selectedTicket._id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: ticketMessage })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket((prev: any) => ({ ...prev, chatHistory: data.chatHistory }));
        setTicketMessage("");
      }
    } catch (err) {
      toast.error("Error sending ticket message");
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/api/customer/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" })
      });
      if (res.ok) {
        const data = await res.json();
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        setTickets(prev => prev.map(t => t._id === ticketId ? data.ticket : t));
        toast.success("Ticket closed.");
      }
    } catch (err) {
      toast.error("Error closing ticket");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      {/* Create / List Support tickets */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col h-full space-y-4">
        <h3 className="font-bold text-sm border-b border-border pb-2 text-foreground">Support Tickets</h3>
        
        {/* Add ticket form */}
        <form onSubmit={handleCreateTicket} className="space-y-3 bg-muted/20 p-3.5 border rounded-xl text-left">
          <p className="text-xs font-bold text-foreground">Raise Support Query</p>
          <input
            type="text"
            required
            placeholder="Ticket Subject Title"
            value={newTicketTitle}
            onChange={(e) => setNewTicketTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none"
          />
          <textarea
            required
            placeholder="Describe issue (delay, payment, etc.)..."
            value={newTicketDesc}
            onChange={(e) => setNewTicketDesc(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none h-18 resize-none"
          />
          <button type="submit" className="w-full bg-brand text-brand-foreground text-xs font-bold py-2 rounded-lg hover:bg-brand/90 transition-colors border-0 cursor-pointer">
            Submit Support Request
          </button>
        </form>

        {/* Tickets list */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
          {tickets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No raised tickets log.</p>
          ) : (
            tickets.map((t: any, i: number) => (
              <div
                key={i}
                onClick={() => setSelectedTicket(t)}
                className={`p-3 border rounded-xl cursor-pointer text-left transition-colors relative ${
                  selectedTicket && selectedTicket._id === t._id ? "bg-brand/5 border-brand" : "border-border hover:bg-muted/10"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs truncate max-w-[120px] text-foreground">{t.title}</h4>
                  <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-muted font-bold text-muted-foreground uppercase">{t.status}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{t.description}</p>
                <p className="text-[8px] text-muted-foreground mt-2">Opened: {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ticket messages panel */}
      <div className="bg-card border border-border rounded-2xl flex flex-col h-full md:col-span-2 overflow-hidden shadow-soft">
        {selectedTicket ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-muted/10 shrink-0 text-left">
              <div>
                <h3 className="font-bold text-xs text-foreground">{selectedTicket.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Status: <span className="font-semibold">{selectedTicket.status}</span></p>
              </div>
              {selectedTicket.status !== 'CLOSED' && (
                <button onClick={() => handleCloseTicket(selectedTicket._id)} className="text-xs text-red-600 font-semibold hover:underline bg-transparent border-0 cursor-pointer">
                  Close Ticket
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
              {selectedTicket.chatHistory?.map((msg: any, i: number) => {
                const isMe = msg.senderId?._id === user.id || msg.senderId === user.id;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-xl text-xs text-left ${
                      isMe ? "bg-brand text-brand-foreground" : "bg-card border border-border text-foreground"
                    }`}>
                      <p className="leading-relaxed font-medium">{msg.message}</p>
                      <p className={`text-[8px] text-right mt-1 ${isMe ? "text-brand-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={ticketChatEndRef} />
            </div>

            {selectedTicket.status !== 'CLOSED' ? (
              <form onSubmit={handleSendTicketMessage} className="p-3 border-t border-border flex gap-2 items-center bg-card shrink-0">
                <input
                  type="text"
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Write support reply..."
                  className="flex-grow rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-brand"
                />
                <button type="submit" className="p-2.5 bg-brand text-white rounded-lg hover:bg-brand/90 border-0 cursor-pointer">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <div className="p-4 bg-muted/20 text-center text-xs text-muted-foreground border-t border-border shrink-0 font-semibold">
                This support ticket has been closed.
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center flex-col text-center space-y-3 p-6">
            <TicketIcon className="h-8 w-8 text-muted-foreground animate-bounce" />
            <h4 className="font-bold text-xs text-foreground">Select a Support Ticket</h4>
            <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
              Open an existing ticket log or submit a new query to consult customer care in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
