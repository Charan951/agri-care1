import { Schema, model, Document, Types } from 'mongoose';

export interface IDiseaseReport extends Document {
  farmerId: Types.ObjectId;
  cropName: string;
  symptoms: string;
  imageUrl: string;
  aiPrediction: {
    disease: string;
    confidence: number;
    pesticides: string[];
    causes?: string;
    symptomsDetail?: string;
    prevention?: string;
    fertilizers?: string[];
    organicTreatment?: string;
    dosage?: string;
    applicationMethod?: string;
    safetyPrecautions?: string;
    recoveryTimeline?: string;
    recommendedProducts?: string[];
  };
  specialistDiagnosis?: {
    disease: string;
    diagnosis: string;
    pesticides: string[];
    diagnosedBy: Types.ObjectId;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  assignedSpecialistId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const diseaseReportSchema = new Schema<IDiseaseReport>(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cropName: { type: String, required: true, trim: true },
    symptoms: { type: String, required: true },
    imageUrl: { type: String, required: true },
    aiPrediction: {
      disease: { type: String, required: true },
      confidence: { type: Number, required: true },
      pesticides: [{ type: String }],
      causes: { type: String },
      symptomsDetail: { type: String },
      prevention: { type: String },
      fertilizers: [{ type: String }],
      organicTreatment: { type: String },
      dosage: { type: String },
      applicationMethod: { type: String },
      safetyPrecautions: { type: String },
      recoveryTimeline: { type: String },
      recommendedProducts: [{ type: String }]
    },
    specialistDiagnosis: {
      disease: { type: String },
      diagnosis: { type: String },
      pesticides: [{ type: String }],
      diagnosedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedSpecialistId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const DiseaseReport = model<IDiseaseReport>('DiseaseReport', diseaseReportSchema);
