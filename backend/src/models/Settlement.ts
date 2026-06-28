import { Schema, model, Document, Types } from 'mongoose';

export interface ISettlement extends Document {
  merchantId: Types.ObjectId;
  amount: number;
  totalSales: number;
  commissionDeducted: number;
  refundDeductions: number;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  transactionReference?: string;
  bankDetails?: {
    holderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  orderIds: Types.ObjectId[];
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    totalSales: { type: Number, required: true, min: 0 },
    commissionDeducted: { type: Number, required: true, default: 10 },
    refundDeductions: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    transactionReference: { type: String, default: '' },
    bankDetails: {
      holderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    orderIds: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    settledAt: { type: Date },
  },
  { timestamps: true }
);

export const Settlement = model<ISettlement>('Settlement', settlementSchema);
