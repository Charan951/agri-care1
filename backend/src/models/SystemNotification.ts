import { Schema, model, Document, Types } from 'mongoose';

export interface ISystemNotification extends Document {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
  link?: string;
  recipientRole?: 'ALL' | 'FARMER' | 'AGRI_SPECIALIST' | 'MERCHANT' | 'ADMIN';
  readBy: Types.ObjectId[];
  createdAt: Date;
}

const systemNotificationSchema = new Schema<ISystemNotification>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'ALERT'],
    default: 'INFO',
  },
  link: { type: String },
  recipientRole: {
    type: String,
    enum: ['ALL', 'FARMER', 'AGRI_SPECIALIST', 'MERCHANT', 'ADMIN'],
    default: 'ALL'
  },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

systemNotificationSchema.index({ recipientRole: 1, createdAt: -1 });

export const SystemNotification = model<ISystemNotification>(
  'SystemNotification',
  systemNotificationSchema
);
