import { Schema, model, Document, Types } from 'mongoose';

export interface IMerchantNotification extends Document {
  merchantId: Types.ObjectId;
  title: string;
  message: string;
  type: 'NEW_ORDER' | 'LOW_STOCK' | 'PRODUCT_APPROVAL' | 'SETTLEMENT' | 'SUPPORT_TICKET' | 'CUSTOMER_MESSAGE';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const merchantNotificationSchema = new Schema<IMerchantNotification>({
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['NEW_ORDER', 'LOW_STOCK', 'PRODUCT_APPROVAL', 'SETTLEMENT', 'SUPPORT_TICKET', 'CUSTOMER_MESSAGE'],
    required: true,
  },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

merchantNotificationSchema.index({ merchantId: 1, createdAt: -1 });

export const MerchantNotification = model<IMerchantNotification>('MerchantNotification', merchantNotificationSchema);

