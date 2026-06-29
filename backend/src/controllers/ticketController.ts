import { Response } from 'express';
import { Types } from 'mongoose';
import { Ticket } from '../models/Ticket';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';
import mongoose from 'mongoose';

// ==========================================
// 1. ADMIN TICKET CRUD
// ==========================================
export const getTicketsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status, priority } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query)
      .populate('farmerId', 'name email mobile role')
      .sort({ createdAt: -1 });

    if (search) {
      const filtered = tickets.filter(t => 
        t.title.toLowerCase().includes(String(search).toLowerCase()) ||
        t.description.toLowerCase().includes(String(search).toLowerCase()) ||
        (t.farmerId as any)?.name.toLowerCase().includes(String(search).toLowerCase())
      );
      res.json(filtered);
      return;
    }

    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTicketRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmerId, title, description, status, priority, images, chatHistory } = req.body;

    const newTicket = new Ticket({
      farmerId,
      title,
      description,
      status: status || 'OPEN',
      priority: priority || 'LOW',
      images: images || [],
      chatHistory: chatHistory || []
    });

    await newTicket.save();
    res.status(201).json({ message: 'Ticket created successfully.', ticket: newTicket });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority, title, description, chatHistory, addMessage } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found.' });
      return;
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (chatHistory) ticket.chatHistory = chatHistory;

    if (addMessage) {
      ticket.chatHistory.push({
        senderId: addMessage.senderId,
        message: addMessage.message,
        timestamp: new Date()
      });
      // Switch to open or in progress appropriately
      if (ticket.status === 'CLOSED') {
        ticket.status = 'IN_PROGRESS';
      }
    }

    await ticket.save();

    emitToRoom(`user_${ticket.farmerId}`, 'ticket_chat_updated', { ticketId: id, chatHistory: ticket.chatHistory });
    emitToRoom(`user_${ticket.farmerId}`, 'ticket_status_updated', { ticketId: id, status: ticket.status });

    res.json({ message: 'Ticket updated successfully.', ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTicketRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Ticket.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Ticket not found.' });
      return;
    }
    res.json({ message: 'Ticket deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. FARMER SUPPORT TICKETS
// ==========================================
export const getFarmerTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find({ farmerId: req.user?._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching tickets' });
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, imageUrls } = req.body;
    const ticket = new Ticket({
      farmerId: req.user?._id,
      title,
      description,
      images: imageUrls || [],
      status: 'OPEN',
      chatHistory: [
        {
          senderId: req.user?._id,
          message: `Ticket opened: ${description}`,
          timestamp: new Date()
        }
      ]
    });

    await ticket.save();
    res.status(201).json({ message: 'Support ticket created successfully', ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating ticket' });
  }
};

export const getTicketChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id).populate('chatHistory.senderId', 'name role');
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    res.json({ ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching ticket chat' });
  }
};

export const sendFarmerTicketMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    const newMessage = {
      senderId: req.user?._id as mongoose.Types.ObjectId,
      message,
      timestamp: new Date()
    };

    ticket.chatHistory.push(newMessage);
    ticket.status = 'OPEN';
    await ticket.save();

    const populatedTicket = await Ticket.findById(id).populate('chatHistory.senderId', 'name role');

    emitToRoom(`user_${ticket.farmerId}`, 'ticket_chat_updated', { ticketId: id, chatHistory: populatedTicket?.chatHistory });
    emitToRoom('role_ADMIN', 'ticket_updated', { ticketId: id });

    res.json({ message: 'Message sent successfully', chatHistory: populatedTicket?.chatHistory });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error sending message' });
  }
};

export const updateTicketStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    ticket.status = status;
    await ticket.save();

    emitToRoom(`user_${ticket.farmerId}`, 'ticket_status_updated', { ticketId: id, status });

    res.json({ message: `Ticket status updated to ${status}`, ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating status' });
  }
};

// ==========================================
// 3. MERCHANT SUPPORT TICKETS
// ==========================================
export const getMerchantTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const tickets = await Ticket.find({ farmerId: merchantId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch support tickets', error: err.message });
  }
};

export const createMerchantTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const { title, description } = req.body;

    const newTicket = await Ticket.create({
      farmerId: merchantId,
      title,
      description,
      status: 'OPEN',
      chatHistory: [],
    });

    res.status(201).json({ message: 'Support ticket raised successfully', ticket: newTicket });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to raise ticket', error: err.message });
  }
};

export const sendMerchantTicketMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const merchantId = req.user?.id || req.user?._id;

    const ticket = await Ticket.findOne({ _id: id, farmerId: merchantId });
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    ticket.chatHistory.push({
      senderId: new Types.ObjectId(merchantId),
      message,
      timestamp: new Date()
    });

    ticket.status = 'IN_PROGRESS';
    await ticket.save();

    res.status(201).json({ message: 'Message sent successfully', ticket });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};
