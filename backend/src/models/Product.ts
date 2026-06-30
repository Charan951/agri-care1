import { Schema, model, Document, Types } from 'mongoose';

export interface IProductReview {
  farmerId?: Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  reply?: string;
  isReported?: boolean;
  reportReason?: string;
  date: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  imageUrl: string;
  merchantId?: Types.ObjectId;
  reviews: IProductReview[];
  sku?: string;
  barcode?: string;
  brand?: string;
  subcategory?: string;
  imageUrls?: string[];
  videoUrl?: string;
  specifications?: Record<string, string>;
  usageInstructions?: string;
  precautions?: string;
  weight?: number;
  unit?: string;
  mrp?: number;
  discount?: number;
  gst?: number;
  tags?: string[];
  expiryDate?: Date;
  batchNumber?: string;
  isEnabled?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const productReviewSchema = new Schema<IProductReview>({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  reply: { type: String, default: '' },
  isReported: { type: Boolean, default: false },
  reportReason: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  stock: { type: Number, required: true, min: 0, default: 10 },
  imageUrl: { type: String, required: true },
  merchantId: { type: Schema.Types.ObjectId, ref: 'User' },
  reviews: [productReviewSchema],
  sku: { type: String, default: '' },
  barcode: { type: String, default: '' },
  brand: { type: String, default: '' },
  subcategory: { type: String, default: '' },
  imageUrls: [{ type: String }],
  videoUrl: { type: String, default: '' },
  specifications: { type: Map, of: String },
  usageInstructions: { type: String, default: '' },
  precautions: { type: String, default: '' },
  weight: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  mrp: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  tags: [{ type: String }],
  expiryDate: { type: Date },
  batchNumber: { type: String, default: '' },
  isEnabled: { type: Boolean, default: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

productSchema.index({ merchantId: 1, status: 1, isEnabled: 1 });
productSchema.index({ merchantId: 1, stock: 1 });
productSchema.index({ category: 1 });

export const Product = model<IProduct>('Product', productSchema);
