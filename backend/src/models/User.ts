import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  role: 'ADMIN' | 'SUPER_USER' | 'AGRI_SPECIALIST' | 'MERCHANT' | 'FARMER';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  workingRegion?: string;
  specialization?: string;
  googleId?: string;
  provider?: string;
  profileImage?: string;
  landAcres?: number;
  assignedSpecialists?: Types.ObjectId[];
  assignedFarmers?: Types.ObjectId[];
  businessName?: string;
  gstin?: string;
  rating?: number;
  avatarUrl?: string;
  preferredLanguage?: string;
  qualifications?: string[];
  experienceYears?: number;
  languages?: string[];
  availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'ON_LEAVE';
  bio?: string;
  specialistTitle?: string;
  farms?: {
    name: string;
    size: number;
    soilType: string;
    cropType: string;
    location?: string;
  }[];
  savedAddresses?: {
    label?: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  }[];
  wishlist?: Types.ObjectId[];
  cart?: {
    product: Types.ObjectId;
    quantity: number;
  }[];
  storeProfile?: {
    logoUrl?: string;
    bannerUrl?: string;
    pan?: string;
    bankAccount?: {
      holderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
    };
    upiId?: string;
    businessAddress?: string;
    warehouseAddress?: string;
    businessHours?: string;
    pickupAddress?: string;
    shippingSettings?: {
      shippingType?: 'FREE' | 'FLAT' | 'THRESHOLD';
      flatRate?: number;
      freeShippingThreshold?: number;
    };
    invoiceSettings?: {
      invoicePrefix?: string;
      invoiceNotes?: string;
    };
  };
  resetPasswordOtp?: string;
  resetPasswordOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    mobile: { type: String, required: false },
    role: {
      type: String,
      enum: ['ADMIN', 'SUPER_USER', 'AGRI_SPECIALIST', 'MERCHANT', 'FARMER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    googleId: { type: String, unique: true, sparse: true },
    provider: { type: String, default: 'local' },
    profileImage: { type: String },
    landAcres: { type: Number, default: 0 },
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpires: { type: Date },
    workingRegion: { type: String },
    specialization: { type: String },
    assignedSpecialists: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    assignedFarmers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    businessName: { type: String },
    gstin: { type: String },
    rating: { type: Number, default: 5.0 },
    avatarUrl: { type: String, default: '' },
    preferredLanguage: { type: String, default: 'English' },
    qualifications: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    languages: [{ type: String }],
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE', 'ON_LEAVE'],
      default: 'AVAILABLE'
    },
    bio: { type: String, default: '' },
    specialistTitle: { type: String, default: 'Agronomist Specialist' },
    farms: [
      {
        name: { type: String, required: true },
        size: { type: Number, required: true },
        soilType: { type: String, required: true },
        cropType: { type: String, required: true },
        location: { type: String, default: '' }
      }
    ],
    savedAddresses: [
      {
        label: { type: String, default: 'Home' },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
      }
    ],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    cart: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1, min: 1 }
      }
    ],
    storeProfile: {
      logoUrl: { type: String, default: '' },
      bannerUrl: { type: String, default: '' },
      pan: { type: String, default: '' },
      bankAccount: {
        holderName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' }
      },
      upiId: { type: String, default: '' },
      businessAddress: { type: String, default: '' },
      warehouseAddress: { type: String, default: '' },
      businessHours: { type: String, default: '' },
      pickupAddress: { type: String, default: '' },
      shippingSettings: {
        shippingType: { type: String, enum: ['FREE', 'FLAT', 'THRESHOLD'], default: 'FREE' },
        flatRate: { type: Number, default: 0 },
        freeShippingThreshold: { type: Number, default: 0 }
      },
      invoiceSettings: {
        invoicePrefix: { type: String, default: 'INV-' },
        invoiceNotes: { type: String, default: '' }
      }
    }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ name: 'text', email: 'text', mobile: 'text' });

export const User = model<IUser>('User', userSchema);
