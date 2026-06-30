import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomerNote extends Document {
  merchantId: Types.ObjectId;
  farmerId: Types.ObjectId;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerNoteSchema = new Schema<ICustomerNote>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true },
  },
  { timestamps: true }
);

customerNoteSchema.index({ merchantId: 1, farmerId: 1 });

export const CustomerNote = model<ICustomerNote>('CustomerNote', customerNoteSchema);

