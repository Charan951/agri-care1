import { Schema, model, Document, Types } from 'mongoose';

export interface IInventoryLog extends Document {
  productId: Types.ObjectId;
  merchantId: Types.ObjectId;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  batchNumber?: string;
  warehouseName?: string;
  createdAt: Date;
}

const inventoryLogSchema = new Schema<IInventoryLog>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
    required: true,
  },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  batchNumber: { type: String, default: '' },
  warehouseName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

inventoryLogSchema.index({ merchantId: 1, createdAt: -1 });

export const InventoryLog = model<IInventoryLog>('InventoryLog', inventoryLogSchema);

