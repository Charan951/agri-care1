import { Response } from 'express';
import { Consultation } from '../models/Consultation';
import { DiseaseReport } from '../models/DiseaseReport';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { SystemNotification } from '../models/SystemNotification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';
import mongoose from 'mongoose';

// Helper to check object id validity
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 1. SPECIALIST DASHBOARD & PERFORMANCE
// ==========================================
export const getSpecialistDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specialistId = req.user?._id;
    if (!specialistId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalAssigned,
      pending,
      active,
      completed,
      activeConsultations,
      todayCount,
      recentConsultations,
      notifications
    ] = await Promise.all([
      Consultation.countDocuments({ specialistId, status: { $ne: 'REJECTED' } }),
      Consultation.countDocuments({ specialistId, status: 'PENDING' }),
      Consultation.countDocuments({ specialistId, status: 'ACTIVE' }),
      Consultation.countDocuments({ specialistId, status: 'COMPLETED' }),
      Consultation.find({ specialistId, status: 'ACTIVE' }),
      Consultation.countDocuments({
        specialistId,
        createdAt: { $gte: startOfToday }
      }),
      Consultation.find({ specialistId })
        .populate('farmerId', 'name')
        .populate('reportId', 'cropName')
        .sort({ updatedAt: -1 })
        .limit(5),
      SystemNotification.find({
        recipientRole: { $in: ['ALL', 'AGRI_SPECIALIST'] }
      }).sort({ createdAt: -1 }).limit(5)
    ]);

    let waitingFarmer = 0;
    for (const c of activeConsultations) {
      if (c.chatHistory.length > 0) {
        const lastMsg = c.chatHistory[c.chatHistory.length - 1];
        if (lastMsg.senderId.toString() === specialistId.toString()) {
          waitingFarmer++;
        }
      }
    }

    const avgRating = req.user?.rating || 5.0;
    const earnings = completed * 250;

    const recentActivities = recentConsultations.map(c => ({
      id: c._id,
      type: 'CONSULTATION',
      text: `Consultation for ${c.reportId ? (c.reportId as any).cropName : 'crop'} with ${(c.farmerId as any)?.name || 'Farmer'} is ${c.status.toLowerCase()}`,
      status: c.status,
      timestamp: c.updatedAt
    }));

    res.json({
      stats: {
        totalAssigned,
        pending,
        active,
        waitingFarmer,
        completed,
        todayCount,
        avgRating,
        earnings
      },
      recentActivities,
      notifications
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching specialist dashboard stats' });
  }
};

export const getSpecialistAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specialistId = req.user?._id;
    if (!specialistId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const totalConsultations = await Consultation.countDocuments({ specialistId });
    const resolvedConsultations = await Consultation.countDocuments({ specialistId, status: 'COMPLETED' });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await Consultation.aggregate([
      {
        $match: {
          specialistId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const diseaseStats = await Consultation.aggregate([
      {
        $match: {
          specialistId,
          'diagnosisDetails.disease': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$diagnosisDetails.disease',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const completedConsultations = await Consultation.find({ specialistId, status: 'COMPLETED' });
    let totalResolutionHours = 0;
    completedConsultations.forEach(c => {
      const diffMs = c.updatedAt.getTime() - c.createdAt.getTime();
      totalResolutionHours += diffMs / (1000 * 60 * 60);
    });
    const avgResolutionTime = completedConsultations.length > 0
      ? parseFloat((totalResolutionHours / completedConsultations.length).toFixed(1))
      : 12.5;

    const rating = req.user?.rating || 5.0;
    const successRate = totalConsultations > 0 ? Math.round((resolvedConsultations / totalConsultations) * 100) : 100;

    res.json({
      analytics: {
        totalConsultations,
        resolvedConsultations,
        successRate,
        avgResolutionTime,
        rating,
        monthlyStats: monthlyStats.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          count: m.count
        })),
        diseaseStats: diseaseStats.map(d => ({
          disease: d._id,
          count: d.count
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching specialist analytics' });
  }
};

// ==========================================
// 2. ACTIVE CASES OPERATIONS
// ==========================================
export const getAssignedConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specialistId = req.user?._id;
    const { status, crop, priority, district, search } = req.query;

    const query: any = { specialistId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'REJECTED' };
    }

    let consultations = await Consultation.find(query)
      .populate('reportId')
      .populate({
        path: 'farmerId',
        select: 'name email mobile'
      })
      .sort({ createdAt: -1 });

    if (crop) {
      consultations = consultations.filter(c => 
        c.reportId && (c.reportId as any).cropName?.toLowerCase().includes(String(crop).toLowerCase())
      );
    }

    if (priority) {
      consultations = consultations.filter(c => 
        c.reportId && (c.reportId as any).priority === priority
      );
    }

    if (district) {
      consultations = consultations.filter(c => {
        const farmer = c.farmerId as any;
        if (!farmer) return false;
        const addressHasDistrict = farmer.savedAddresses?.some((addr: any) => 
          addr.city?.toLowerCase().includes(String(district).toLowerCase()) || 
          addr.state?.toLowerCase().includes(String(district).toLowerCase())
        );
        const farmHasDistrict = farmer.farms?.some((f: any) => 
          f.location?.toLowerCase().includes(String(district).toLowerCase())
        );
        return addressHasDistrict || farmHasDistrict;
      });
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      consultations = consultations.filter(c => {
        const farmer = c.farmerId as any;
        const report = c.reportId as any;
        return (
          farmer?.name?.toLowerCase().includes(searchStr) ||
          report?.cropName?.toLowerCase().includes(searchStr) ||
          report?.symptoms?.toLowerCase().includes(searchStr)
        );
      });
    }

    res.json({ consultations });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching assigned consultations' });
  }
};

export const getConsultationDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ message: 'Invalid consultation ID' });
      return;
    }

    const consultation = await Consultation.findById(id)
      .populate({
        path: 'farmerId',
        select: '-password'
      })
      .populate('reportId')
      .populate('chatHistory.senderId', 'name role avatarUrl')
      .populate('recommendedProducts');

    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    const farmerId = consultation.farmerId?._id;
    let farmerHistory: any[] = [];
    let farmerOrders: any[] = [];
    if (farmerId) {
      const [historyData, ordersData] = await Promise.all([
        Consultation.find({ farmerId, _id: { $ne: id } })
          .populate('reportId')
          .sort({ createdAt: -1 }),
        Order.find({ farmerId }).sort({ createdAt: -1 })
      ]);
      farmerHistory = historyData;
      farmerOrders = ordersData;
    }

    res.json({
      consultation,
      farmerHistory,
      farmerOrders
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching consultation details' });
  }
};

export const acceptConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ message: 'Invalid consultation ID' });
      return;
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.status = 'ACTIVE';
    await consultation.save();

    if (consultation.reportId) {
      await DiseaseReport.findByIdAndUpdate(consultation.reportId, { status: 'ASSIGNED' });
    }

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: 'ACTIVE' });
    emitToRoom('role_ADMIN', 'consultation_accepted', { consultationId: id, specialistId: req.user?._id });

    res.json({ message: 'Consultation accepted successfully', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error accepting consultation' });
  }
};

export const rejectConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      res.status(400).json({ message: 'Rejection reason is required' });
      return;
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.status = 'REJECTED';
    consultation.rejectionReason = reason;
    await consultation.save();

    if (consultation.reportId) {
      await DiseaseReport.findByIdAndUpdate(consultation.reportId, {
        status: 'OPEN',
        $unset: { assignedSpecialistId: 1 }
      });
    }

    emitToRoom('role_ADMIN', 'consultation_rejected', {
      consultationId: id,
      specialistId: req.user?._id,
      reason
    });
    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: 'REJECTED' });

    res.json({ message: 'Consultation rejected. Released back to admin review.', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error rejecting consultation' });
  }
};

// ==========================================
// 3. PRESCRIPTION & RECOMMENDATIONS
// ==========================================
export const submitDiagnosis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { disease, severity, symptoms, causes, preventiveMeasures, recoveryTimeline, internalNotes } = req.body;

    if (!disease) {
      res.status(400).json({ message: 'Disease name is required' });
      return;
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.diagnosisDetails = {
      disease,
      severity: severity || 'MEDIUM',
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      causes: Array.isArray(causes) ? causes : [causes],
      preventiveMeasures: Array.isArray(preventiveMeasures) ? preventiveMeasures : [preventiveMeasures],
      recoveryTimeline: recoveryTimeline || '7-14 Days'
    };
    if (internalNotes !== undefined) {
      consultation.internalNotes = internalNotes;
    }
    await consultation.save();

    if (consultation.reportId) {
      await DiseaseReport.findByIdAndUpdate(consultation.reportId, {
        specialistDiagnosis: {
          disease,
          diagnosis: `Severity: ${severity}. Causes: ${causes}. Prevention: ${preventiveMeasures}. Timeline: ${recoveryTimeline}`,
          pesticides: [],
          diagnosedBy: req.user?._id as mongoose.Types.ObjectId
        }
      });
    }

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    if (consultation.specialistId) {
      emitToRoom(`user_${consultation.specialistId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    }
    emitToRoom('role_ADMIN', 'consultation_updated', { consultationId: id });

    res.json({ message: 'Diagnosis saved successfully', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error saving diagnosis' });
  }
};

export const submitTreatment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      fertilizers,
      pesticides,
      fungicides,
      organicAlternatives,
      bioFertilizers,
      dosageInstructions,
      spraySchedule,
      irrigationAdvice,
      soilImprovementAdvice,
      cropCareTips
    } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.treatmentRecommendation = {
      fertilizers: Array.isArray(fertilizers) ? fertilizers : [fertilizers],
      pesticides: Array.isArray(pesticides) ? pesticides : [pesticides],
      fungicides: Array.isArray(fungicides) ? fungicides : [fungicides],
      organicAlternatives: Array.isArray(organicAlternatives) ? organicAlternatives : [organicAlternatives],
      bioFertilizers: Array.isArray(bioFertilizers) ? bioFertilizers : [bioFertilizers],
      dosageInstructions: dosageInstructions || '',
      spraySchedule: spraySchedule || '',
      irrigationAdvice: irrigationAdvice || '',
      soilImprovementAdvice: soilImprovementAdvice || '',
      cropCareTips: cropCareTips || ''
    };

    const medicinesCombined = [
      ...(Array.isArray(fertilizers) ? fertilizers : []),
      ...(Array.isArray(pesticides) ? pesticides : []),
      ...(Array.isArray(fungicides) ? fungicides : [])
    ];
    consultation.prescription = {
      medicines: medicinesCombined,
      advice: `Dosage: ${dosageInstructions}. Spray Schedule: ${spraySchedule}. Irrigation: ${irrigationAdvice}`,
      createdAt: new Date()
    };

    consultation.status = 'COMPLETED';
    await consultation.save();

    if (consultation.reportId) {
      await DiseaseReport.findByIdAndUpdate(consultation.reportId, {
        status: 'RESOLVED',
        'specialistDiagnosis.pesticides': medicinesCombined
      });
    }

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: 'COMPLETED' });

    res.json({ message: 'Treatment submitted and consultation marked completed successfully', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error submitting treatment' });
  }
};

export const recommendProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      res.status(400).json({ message: 'productIds must be an array of product IDs' });
      return;
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.recommendedProducts = productIds.map(pId => new mongoose.Types.ObjectId(pId));
    await consultation.save();

    const populated = await Consultation.findById(id).populate('recommendedProducts');

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    if (consultation.specialistId) {
      emitToRoom(`user_${consultation.specialistId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    }
    emitToRoom('role_ADMIN', 'consultation_updated', { consultationId: id });

    res.json({ message: 'Products recommended successfully', recommendedProducts: populated?.recommendedProducts });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error recommending products' });
  }
};

export const getMarketplaceProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await Product.find(query).limit(20);
    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching products' });
  }
};

// ==========================================
// 4. CHAT COMMUNICATIONS
// ==========================================
export const sendSpecialistMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, mediaUrl, mediaType } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    let finalMessageText = message;
    if (mediaUrl) {
      finalMessageText = `[${mediaType || 'Media File'}] ${message || 'View attached file'}: ${mediaUrl}`;
    }

    const newMessage = {
      senderId: req.user?._id as mongoose.Types.ObjectId,
      message: finalMessageText,
      timestamp: new Date()
    };

    consultation.chatHistory.push(newMessage);
    await consultation.save();

    const populated = await Consultation.findById(id)
      .populate('chatHistory.senderId', 'name role avatarUrl');

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_chat_updated', { consultationId: id, chatHistory: populated?.chatHistory });
    emitToRoom(`user_${consultation.specialistId}`, 'consultation_chat_updated', { consultationId: id, chatHistory: populated?.chatHistory });

    res.json({ message: 'Message sent successfully', chatHistory: populated?.chatHistory });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error sending chat message' });
  }
};

export const sendConsultationMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    const newMessage = {
      senderId: req.user?._id as mongoose.Types.ObjectId,
      message,
      timestamp: new Date()
    };

    consultation.chatHistory.push(newMessage);
    await consultation.save();

    const populatedConsultation = await Consultation.findById(id)
      .populate('chatHistory.senderId', 'name role');

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_chat_updated', { consultationId: id, chatHistory: populatedConsultation?.chatHistory });
    emitToRoom(`user_${consultation.specialistId}`, 'consultation_chat_updated', { consultationId: id, chatHistory: populatedConsultation?.chatHistory });

    res.json({ message: 'Message sent successfully', chatHistory: populatedConsultation?.chatHistory });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error sending message' });
  }
};

export const sendMockSpecialistMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    if (!consultation.specialistId) {
      res.status(400).json({ message: 'No specialist assigned to this consultation yet' });
      return;
    }

    const newMessage = {
      senderId: consultation.specialistId as mongoose.Types.ObjectId,
      message,
      timestamp: new Date()
    };

    consultation.chatHistory.push(newMessage);
    await consultation.save();

    const populatedConsultation = await Consultation.findById(id)
      .populate('chatHistory.senderId', 'name role');

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_chat_updated', { consultationId: id, chatHistory: populatedConsultation?.chatHistory });

    res.json({ message: 'Mock specialist message sent successfully', chatHistory: populatedConsultation?.chatHistory });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error sending mock message' });
  }
};

// ==========================================
// 5. FOLLOW-UP SCHEDULERS
// ==========================================
export const manageFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledDate, reminderNote, status } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.followUp = {
      scheduledDate: scheduledDate ? new Date(scheduledDate) : consultation.followUp?.scheduledDate,
      reminderNote: reminderNote !== undefined ? reminderNote : consultation.followUp?.reminderNote,
      status: status || consultation.followUp?.status || 'SCHEDULED'
    };

    await consultation.save();

    // Notify farmer, specialist and admin about follow-up updates
    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    if (consultation.specialistId) {
      emitToRoom(`user_${consultation.specialistId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    }
    emitToRoom('role_ADMIN', 'consultation_updated', { consultationId: id });

    res.json({ message: 'Follow-up details saved successfully', followUp: consultation.followUp });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error managing follow-up' });
  }
};

export const closeFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    if (consultation.followUp) {
      consultation.followUp.status = 'COMPLETED';
    }
    await consultation.save();

    // Notify farmer, specialist and admin about follow-up updates
    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    if (consultation.specialistId) {
      emitToRoom(`user_${consultation.specialistId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    }
    emitToRoom('role_ADMIN', 'consultation_updated', { consultationId: id });

    res.json({ message: 'Follow-up marked completed successfully', followUp: consultation.followUp });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error closing follow-up' });
  }
};

// ==========================================
// 6. GENERAL CONSULTATIONS QUERY
// ==========================================
export const getConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const consultations = await Consultation.find()
      .populate('reportId', 'cropName symptoms imageUrl')
      .populate('farmerId', 'name email mobile')
      .populate('specialistId', 'name specialization mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Consultation.countDocuments();

    res.json({
      consultations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFarmerConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [consultations, total] = await Promise.all([
      Consultation.find({ farmerId: req.user?._id })
        .populate('specialistId', 'name specialization rating mobile')
        .populate('reportId')
        .populate('recommendedProducts')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Consultation.countDocuments({ farmerId: req.user?._id })
    ]);

    res.json({
      consultations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching consultations' });
  }
};

export const requestConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.body;
    const report = await DiseaseReport.findById(reportId);
    if (!report) {
      res.status(404).json({ message: 'Disease report not found' });
      return;
    }

    const payment = await Payment.findOne({ orderId: reportId, status: 'SUCCESSFUL' });
    if (!payment) {
      res.status(402).json({ message: 'Payment required. Please pay the consultation fee first.' });
      return;
    }

    const specialist = await User.findOne({ role: 'AGRI_SPECIALIST', status: 'ACTIVE' });
    if (!specialist) {
      res.status(400).json({ message: 'No specialists are currently available. Try again later.' });
      return;
    }

    const consultation = new Consultation({
      reportId,
      farmerId: req.user?._id,
      specialistId: specialist._id,
      status: 'ACTIVE',
      chatHistory: [
        {
          senderId: req.user?._id,
          message: `Consultation requested for ${report.cropName}. Symptoms: ${report.symptoms}`,
          timestamp: new Date()
        }
      ]
    });

    await consultation.save();

    report.status = 'ASSIGNED';
    report.assignedSpecialistId = specialist._id as mongoose.Types.ObjectId;
    await report.save();

    res.status(201).json({ message: 'Consultation requested', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error requesting consultation' });
  }
};

export const createConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reportId, farmerId, specialistId, status, chatHistory, prescription } = req.body;

    const newConsultation = new Consultation({
      reportId,
      farmerId,
      specialistId,
      status: status || 'PENDING',
      chatHistory: chatHistory || [],
      prescription
    });

    await newConsultation.save();
    res.status(201).json({ message: 'Consultation created successfully.', consultation: newConsultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, specialistId, chatHistory, prescription, addMessage } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found.' });
      return;
    }

    if (status) consultation.status = status;
    if (specialistId) consultation.specialistId = specialistId;
    if (chatHistory) consultation.chatHistory = chatHistory;
    if (prescription) consultation.prescription = prescription;

    if (addMessage) {
      consultation.chatHistory.push({
        senderId: addMessage.senderId,
        message: addMessage.message,
        timestamp: new Date()
      });
    }

    await consultation.save();

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    if (consultation.specialistId) {
      emitToRoom(`user_${consultation.specialistId}`, 'consultation_updated', { consultationId: id, status: consultation.status });
    }

    res.json({ message: 'Consultation updated successfully.', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Consultation.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Consultation not found.' });
      return;
    }
    res.json({ message: 'Consultation deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const rateSpecialist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }

    consultation.status = 'COMPLETED';
    await consultation.save();

    const specialist = await User.findById(consultation.specialistId);
    if (specialist) {
      const prevRating = specialist.rating || 5.0;
      specialist.rating = parseFloat(((prevRating + rating) / 2).toFixed(2));
      await specialist.save();
    }

    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: 'COMPLETED' });
    if (consultation.specialistId) {
      emitToRoom(`user_${consultation.specialistId}`, 'consultation_updated', { consultationId: id, status: 'COMPLETED' });
    }
    emitToRoom('role_ADMIN', 'consultation_updated', { consultationId: id });

    res.json({ message: 'Thank you for your rating!', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error submitting rating' });
  }
};

export const getSpecialistsForFarmer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farmerRegion = req.user?.workingRegion || '';
    
    // Exclude specialists who are on leave (ON_LEAVE)
    const specialists = await User.find({ 
      role: 'AGRI_SPECIALIST', 
      status: 'ACTIVE',
      availabilityStatus: { $ne: 'ON_LEAVE' }
    });
    
    // Find active consultations for these specialists
    const activeConsultations = await Consultation.find({
      specialistId: { $in: specialists.map(s => s._id) },
      status: { $in: ['PENDING', 'ACTIVE'] }
    });

    const specialistsWithBusyState = specialists.map(specialist => {
      const specialistConsults = activeConsultations.filter(
        c => c.specialistId?.toString() === specialist._id.toString()
      );
      
      let isBusy = specialist.availabilityStatus === 'UNAVAILABLE';
      let busyUntil: string | null = null;

      for (const consult of specialistConsults) {
        let isCurrentlyInMeeting = false;
        if (consult.timeSlot) {
          try {
            const slotTime = new Date(consult.timeSlot);
            if (!isNaN(slotTime.getTime())) {
              const endTime = new Date(slotTime.getTime() + 30 * 60 * 1000); // 30 minutes duration
              const now = new Date();
              if (now >= slotTime && now < endTime) {
                isCurrentlyInMeeting = true;
                busyUntil = consult.timeSlot;
              }
            }
          } catch (e) {}
        } else {
          const lastUpdated = new Date(consult.updatedAt);
          const diffMs = Date.now() - lastUpdated.getTime();
          if (diffMs < 30 * 60 * 1000) {
            isCurrentlyInMeeting = true;
          }
        }

        if (isCurrentlyInMeeting) {
          isBusy = true;
          break;
        }
      }

      return {
        ...specialist.toObject(),
        isBusy,
        busyUntil
      };
    });
    
    // Sort specialists: different workingRegion comes first (Priority: other place first display)
    specialistsWithBusyState.sort((a, b) => {
      const aDifferent = a.workingRegion !== farmerRegion;
      const bDifferent = b.workingRegion !== farmerRegion;
      if (aDifferent && !bDifferent) return -1;
      if (!aDifferent && bDifferent) return 1;
      return 0;
    });

    res.json({ specialists: specialistsWithBusyState });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching specialists' });
  }
};

export const assignSpecialistToConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // consultationId
    const { specialistId } = req.body;

    if (!specialistId) {
      res.status(400).json({ message: 'Specialist ID is required.' });
      return;
    }

    const consultation = await Consultation.findById(id);
    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found.' });
      return;
    }

    // Verify it belongs to this farmer and is still pending assignment
    if (consultation.farmerId.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    if (consultation.specialistId) {
      res.status(400).json({ message: 'Specialist is already assigned to this consultation.' });
      return;
    }

    const specialist = await User.findOne({ _id: specialistId, role: 'AGRI_SPECIALIST', status: 'ACTIVE' });
    if (!specialist) {
      res.status(404).json({ message: 'Specialist not found or not active.' });
      return;
    }

    consultation.specialistId = specialist._id as mongoose.Types.ObjectId;
    consultation.status = 'ACTIVE';
    consultation.chatHistory.push({
      senderId: specialist._id as mongoose.Types.ObjectId,
      message: `Hello! I am Dr. ${specialist.name}, your assigned Agronomist Specialist. I have reviewed your case and I am here to help you. Let's discuss your crop issues.`,
      timestamp: new Date()
    });

    await consultation.save();

    // Link in DiseaseReport as well
    const report = await DiseaseReport.findById(consultation.reportId);
    if (report) {
      report.assignedSpecialistId = specialist._id as mongoose.Types.ObjectId;
      await report.save();
    }

    // Populate references before returning
    await consultation.populate([
      { path: 'specialistId', select: 'name specialization rating mobile' },
      { path: 'reportId' }
    ]);

    emitToRoom('role_ADMIN', 'consultation_updated', { consultationId: id, status: 'ACTIVE' });
    emitToRoom(`user_${specialist._id}`, 'new_consultation_request', { consultationId: id });
    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: 'ACTIVE' });

    res.json({ message: 'Specialist assigned successfully.', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error assigning specialist' });
  }
};
