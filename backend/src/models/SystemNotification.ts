import { Schema, model, Document, Types } from 'mongoose';

export interface ISystemNotification extends Document {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
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
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export const SystemNotification = model<ISystemNotification>(
  'SystemNotification',
  systemNotificationSchema
);
