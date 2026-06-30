import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  transactionId: string;
  amount: number;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING' | 'REFUNDED';
  paymentMethod: string;
  merchantSettled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['SUCCESSFUL', 'FAILED', 'PENDING', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentMethod: { type: String, required: true },
    merchantSettled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
