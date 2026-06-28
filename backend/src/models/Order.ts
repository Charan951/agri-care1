import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  merchantId: Types.ObjectId;
  farmerId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'PACKING' | 'READY_TO_DISPATCH' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  deliveryAddress: string;
  invoiceUrl?: string;
  trackingNumber?: string;
  carrierName?: string;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  returnReason?: string;
  replacementStatus?: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const orderSchema = new Schema<IOrder>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PACKING', 'READY_TO_DISPATCH', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    deliveryAddress: { type: String, required: true },
    invoiceUrl: { type: String },
    trackingNumber: { type: String, default: '' },
    carrierName: { type: String, default: '' },
    packedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    returnReason: { type: String, default: '' },
    replacementStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'NONE'
    }
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);
