import { Schema, model, Document, Types } from 'mongoose';

export interface ITicketMessage {
  senderId: Types.ObjectId;
  message: string;
  timestamp: Date;
}

export interface ITicket extends Document {
  farmerId: Types.ObjectId;
  title: string;
  description: string;
  images: string[];
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_FARMER' | 'RESOLVED' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  chatHistory: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ticketSchema = new Schema<ITicket>({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_FARMER', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
  chatHistory: [ticketMessageSchema]
}, { timestamps: true });

ticketSchema.index({ farmerId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ title: 'text', description: 'text' });

export const Ticket = model<ITicket>('Ticket', ticketSchema);

