import { Response } from 'express';
import { DiseaseReport } from '../models/DiseaseReport';
import { Consultation } from '../models/Consultation';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { analyzeCropDisease } from '../utils/gemini';
import mongoose from 'mongoose';

// Helper to check object id validity
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 1. DISEASE REPORT CRUD
// ==========================================
export const getDiseaseReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status, priority } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const reports = await DiseaseReport.find(query)
      .populate('farmerId', 'name email mobile')
      .populate('assignedSpecialistId', 'name specialization')
      .sort({ createdAt: -1 });

    if (search) {
      const filtered = reports.filter(r => 
        r.cropName.toLowerCase().includes(String(search).toLowerCase()) ||
        r.symptoms.toLowerCase().includes(String(search).toLowerCase()) ||
        (r.farmerId as any)?.name.toLowerCase().includes(String(search).toLowerCase())
      );
      res.json(filtered);
      return;
    }

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDiseaseReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmerId, cropName, symptoms, imageUrl, aiPrediction, priority, status, assignedSpecialistId } = req.body;

    const newReport = new DiseaseReport({
      farmerId,
      cropName,
      symptoms,
      imageUrl,
      aiPrediction: aiPrediction || { disease: 'Healthy Crop', confidence: 0.99, pesticides: [] },
      priority: priority || 'MEDIUM',
      status: status || 'OPEN',
      assignedSpecialistId
    });

    await newReport.save();

    // Create consultation if specialist is assigned during creation
    if (newReport.assignedSpecialistId) {
      const consultation = new Consultation({
        reportId: newReport._id,
        farmerId: newReport.farmerId,
        specialistId: newReport.assignedSpecialistId,
        status: 'ACTIVE',
        chatHistory: [
          {
            senderId: newReport.farmerId,
            message: `Consultation auto-initiated by Admin for ${newReport.cropName}. Symptoms: ${newReport.symptoms}`,
            timestamp: new Date()
          }
        ]
      });
      await consultation.save();
    }

    res.status(201).json({ message: 'Disease report created successfully.', report: newReport });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDiseaseReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cropName, symptoms, priority, status, assignedSpecialistId, aiPrediction, specialistDiagnosis } = req.body;

    const report = await DiseaseReport.findById(id);
    if (!report) {
      res.status(404).json({ message: 'Disease report not found.' });
      return;
    }

    report.cropName = cropName || report.cropName;
    report.symptoms = symptoms || report.symptoms;
    report.priority = priority || report.priority;
    report.status = status || report.status;
    
    const oldSpecialistId = report.assignedSpecialistId;
    report.assignedSpecialistId = assignedSpecialistId !== undefined ? assignedSpecialistId : report.assignedSpecialistId;
    
    if (aiPrediction) report.aiPrediction = aiPrediction;
    if (specialistDiagnosis) report.specialistDiagnosis = specialistDiagnosis;

    await report.save();

    // Sync Consultation when specialist is assigned/changed/cleared
    if (report.assignedSpecialistId) {
      let consultation = await Consultation.findOne({ reportId: report._id });
      if (consultation) {
        consultation.specialistId = report.assignedSpecialistId;
        if (consultation.status === 'PENDING' || consultation.status === 'REJECTED') {
          consultation.status = 'ACTIVE';
        }
        await consultation.save();
      } else {
        consultation = new Consultation({
          reportId: report._id,
          farmerId: report.farmerId,
          specialistId: report.assignedSpecialistId,
          status: 'ACTIVE',
          chatHistory: [
            {
              senderId: report.farmerId,
              message: `Consultation auto-initiated by Admin for ${report.cropName}. Symptoms: ${report.symptoms}`,
              timestamp: new Date()
            }
          ]
        });
        await consultation.save();
      }
    } else if (assignedSpecialistId === null && oldSpecialistId) {
      const consultation = await Consultation.findOne({ reportId: report._id });
      if (consultation) {
        consultation.specialistId = null;
        await consultation.save();
      }
    }

    res.json({ message: 'Disease report updated successfully.', report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDiseaseReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await DiseaseReport.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Disease report not found.' });
      return;
    }
    res.json({ message: 'Disease report deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. AI DISEASE DETECTION (FARMER)
// ==========================================
export const runAIDetection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropName, imageUrl, answers } = req.body;
    if (!cropName || !imageUrl) {
      res.status(400).json({ message: 'Crop name and image URL are required' });
      return;
    }

    const prediction = await analyzeCropDisease(cropName, imageUrl, answers || {});

    let symptomsString = answers['Symptoms'] || `AI scanned leaves for ${cropName}`;
    if (answers && Object.keys(answers).length > 0) {
      symptomsString += '\n\nFarmer Responses:';
      for (const [question, answer] of Object.entries(answers)) {
        symptomsString += `\n• ${question}: ${answer}`;
      }
    }

    const report = new DiseaseReport({
      farmerId: req.user?._id,
      cropName,
      symptoms: symptomsString,
      imageUrl,
      aiPrediction: {
        disease: prediction.disease,
        confidence: prediction.confidence,
        pesticides: prediction.pesticides || [],
        causes: prediction.causes,
        symptomsDetail: prediction.symptomsDetail,
        prevention: prediction.prevention,
        fertilizers: prediction.fertilizers || [],
        organicTreatment: prediction.organicTreatment,
        dosage: prediction.dosage,
        applicationMethod: prediction.applicationMethod,
        safetyPrecautions: prediction.safetyPrecautions,
        recoveryTimeline: prediction.recoveryTimeline,
        recommendedProducts: prediction.recommendedProducts || []
      },
      priority: prediction.confidence > 0.9 ? 'HIGH' : 'MEDIUM',
      status: 'OPEN'
    });

    await report.save();

    let matchedProducts: any[] = [];
    if (prediction.recommendedProducts && prediction.recommendedProducts.length > 0) {
      const regexQueries = prediction.recommendedProducts.map(kw => new RegExp(kw, 'i'));
      matchedProducts = await Product.find({
        $or: [
          { name: { $in: regexQueries } },
          { description: { $in: regexQueries } }
        ]
      }).limit(5);
    }

    if (matchedProducts.length === 0) {
      matchedProducts = await Product.find().limit(4);
    }

    res.status(201).json({
      message: 'AI Crop Diagnosis Complete',
      report,
      details: prediction,
      recommendedProductsList: matchedProducts
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error executing AI scan' });
  }
};

export const getDetectionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reports = await DiseaseReport.find({ farmerId: req.user?._id })
      .populate('assignedSpecialistId', 'name specialization rating mobile')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching scan history' });
  }
};

// ==========================================
// 3. AI PREDICTION MONITORING CRUD (ADMIN)
// ==========================================
export const getAIPredictions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const predictions = await DiseaseReport.find({}, 'cropName symptoms imageUrl aiPrediction specialistDiagnosis createdAt farmerId')
      .populate('farmerId', 'name')
      .sort({ createdAt: -1 });

    res.json(predictions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAIPrediction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropName, symptoms, imageUrl, aiPrediction, farmerId } = req.body;
    
    let fid = farmerId;
    if (!fid) {
      const farmer = await User.findOne({ role: 'FARMER' });
      fid = farmer ? farmer._id : null;
    }

    const testReport = new DiseaseReport({
      farmerId: fid,
      cropName,
      symptoms,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',
      aiPrediction,
      status: 'CLOSED'
    });

    await testReport.save();
    res.status(201).json({ message: 'AI Prediction logged.', report: testReport });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAIPrediction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { aiPrediction, specialistDiagnosis } = req.body;

    const report = await DiseaseReport.findById(id);
    if (!report) {
      res.status(404).json({ message: 'Prediction record not found.' });
      return;
    }

    if (aiPrediction) report.aiPrediction = aiPrediction;
    if (specialistDiagnosis) report.specialistDiagnosis = specialistDiagnosis;

    await report.save();
    res.json({ message: 'AI Prediction record updated.', report });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAIPrediction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await DiseaseReport.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Record not found.' });
      return;
    }
    res.json({ message: 'AI Prediction record deleted.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. WEATHER & CROP ADVISORIES
// ==========================================
export const getWeather = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const weatherData = {
      location: req.user?.workingRegion || 'Maharashtra-Pune',
      current: {
        temp: 29,
        humidity: 74,
        condition: 'Partly Cloudy',
        windSpeed: 12,
        rainForecast: '60% chance of showers at 4:00 PM',
        pincode: '410501'
      },
      forecast: [
        { day: 'Mon', temp: 30, icon: 'cloud-rain', status: 'Showers' },
        { day: 'Tue', temp: 31, icon: 'sun', status: 'Sunny' },
        { day: 'Wed', temp: 28, icon: 'cloud-lightning', status: 'Storms' },
        { day: 'Thu', temp: 29, icon: 'cloud', status: 'Cloudy' },
        { day: 'Fri', temp: 30, icon: 'sun', status: 'Sunny' }
      ],
      alerts: [
        {
          title: 'High Humidity Warning',
          message: 'Elevated fungal spore counts likely. Farmers growing Cotton should monitor leaves closely for Alternaria spots.'
        }
      ]
    };
    res.json({ weatherData });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching weather' });
  }
};

export const getKnowledgeCenter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const articles = [
      {
        id: 'k1',
        title: 'Managing Nitrogen Deficiency in Paddy Fields',
        category: 'Crop Care',
        summary: 'Learn standard fertilizer dosage guidelines and leaf color indicators to optimize rice yield.',
        content: 'Paddy crops require optimal nitrogen schedules. Green leaf color charts can help prevent over-application...',
        readTime: '6 mins',
        imgUrl: 'https://images.unsplash.com/photo-1530507629858-e3759c1c66f3'
      },
      {
        id: 'k2',
        title: 'Organic Pest Control with Neem Extract Formulation',
        category: 'Organic Farming',
        summary: 'Step-by-step tutorial on fermenting and spraying organic neem oil formulations for bollworms.',
        content: 'Grind neem leaves and kernels, ferment with cow urine, and strain. Dilute 1:20 in water before spraying leaves...',
        readTime: '8 mins',
        imgUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399'
      }
    ];
    res.json({ articles });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading articles' });
  }
};

