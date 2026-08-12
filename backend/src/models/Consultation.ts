import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage {
  senderId: Types.ObjectId;
  message: string;
  timestamp: Date;
}

export interface IPrescription {
  medicines: string[];
  advice: string;
  createdAt: Date;
}

export interface IConsultation extends Document {
  reportId: Types.ObjectId;
  farmerId: Types.ObjectId;
  specialistId?: Types.ObjectId | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ESCALATED' | 'REJECTED';
  consultationType: 'CHAT' | 'VOICE_CALL';
  timeSlot?: string;
  amount?: number;
  chatHistory: IMessage[];
  prescription?: IPrescription;
  rejectionReason?: string;
  diagnosisDetails?: {
    disease: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    symptoms: string[];
    causes: string[];
    preventiveMeasures: string[];
    recoveryTimeline: string;
  };
  treatmentRecommendation?: {
    fertilizers: string[];
    pesticides: string[];
    fungicides: string[];
    organicAlternatives: string[];
    bioFertilizers: string[];
    dosageInstructions: string;
    spraySchedule: string;
    irrigationAdvice: string;
    soilImprovementAdvice: string;
    cropCareTips: string;
  };
  recommendedProducts?: Types.ObjectId[];
  followUp?: {
    scheduledDate?: Date;
    reminderNote?: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  };
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const prescriptionSchema = new Schema<IPrescription>({
  medicines: [{ type: String }],
  advice: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const consultationSchema = new Schema<IConsultation>(
  {
    reportId: { type: Schema.Types.ObjectId, ref: 'DiseaseReport', required: true },
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    specialistId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'ESCALATED', 'REJECTED'],
      default: 'PENDING',
    },
    consultationType: {
      type: String,
      enum: ['CHAT', 'VOICE_CALL'],
      default: 'CHAT'
    },
    timeSlot: { type: String, default: '' },
    amount: { type: Number },
    chatHistory: [messageSchema],
    prescription: prescriptionSchema,
    rejectionReason: { type: String },
    diagnosisDetails: {
      disease: { type: String },
      severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
      symptoms: [{ type: String }],
      causes: [{ type: String }],
      preventiveMeasures: [{ type: String }],
      recoveryTimeline: { type: String }
    },
    treatmentRecommendation: {
      fertilizers: [{ type: String }],
      pesticides: [{ type: String }],
      fungicides: [{ type: String }],
      organicAlternatives: [{ type: String }],
      bioFertilizers: [{ type: String }],
      dosageInstructions: { type: String },
      spraySchedule: { type: String },
      irrigationAdvice: { type: String },
      soilImprovementAdvice: { type: String },
      cropCareTips: { type: String }
    },
    recommendedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    followUp: {
      scheduledDate: { type: Date },
      reminderNote: { type: String },
      status: { type: String, enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' }
    },
    internalNotes: { type: String }
  },
  { timestamps: true }
);

consultationSchema.index({ specialistId: 1, status: 1, createdAt: -1 });
consultationSchema.index({ specialistId: 1, updatedAt: -1 });
consultationSchema.index({ farmerId: 1, status: 1, createdAt: -1 });
consultationSchema.index({ farmerId: 1, createdAt: -1 });

export const Consultation = model<IConsultation>('Consultation', consultationSchema);

