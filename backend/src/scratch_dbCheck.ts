import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Consultation } from './models/Consultation';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agricare';

// Pre-register DiseaseReport model manually on the same mongoose instance
try {
  mongoose.model('DiseaseReport', new mongoose.Schema({
    cropName: { type: String, required: true }
  }));
} catch (e) {}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const consultations = await Consultation.find({}).populate('reportId');
    console.log('Consultations report crop names:', consultations.map(c => ({
      id: c._id.toString(),
      status: c.status,
      reportId: c.reportId ? (c.reportId as any)._id : null,
      cropName: c.reportId ? (c.reportId as any).cropName : null
    })));

  } catch (err) {
    console.error('Error running test:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
