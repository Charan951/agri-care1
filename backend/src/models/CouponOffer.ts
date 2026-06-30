import { Schema, model, Document, Types } from 'mongoose';

export interface ICouponOffer extends Document {
  merchantId: Types.ObjectId;
  code?: string;
  type: 'COUPON' | 'DISCOUNT_CAMPAIGN' | 'COMBO' | 'BOGO' | 'FLASH_SALE' | 'SEASONAL';
  title: string;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  minPurchaseAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  applicableProducts?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const couponOfferSchema = new Schema<ICouponOffer>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, trim: true },
    type: {
      type: String,
      enum: ['COUPON', 'DISCOUNT_CAMPAIGN', 'COMBO', 'BOGO', 'FLASH_SALE', 'SEASONAL'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    minPurchaseAmount: { type: Number, default: 0 },
    buyQuantity: { type: Number, default: 0 },
    getQuantity: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

couponOfferSchema.index({ merchantId: 1, createdAt: -1 });

export const CouponOffer = model<ICouponOffer>('CouponOffer', couponOfferSchema);

