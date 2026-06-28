import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { DiseaseReport } from '../models/DiseaseReport';
import { Consultation } from '../models/Consultation';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { SystemNotification } from '../models/SystemNotification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';
import mongoose from 'mongoose';

// Helper to check object id validity
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 1. DASHBOARD OVERVIEW STATS
// ==========================================
export const getSpecialistDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specialistId = req.user?._id;
    if (!specialistId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const totalAssigned = await Consultation.countDocuments({ specialistId, status: { $ne: 'REJECTED' } });
    const pending = await Consultation.countDocuments({ specialistId, status: 'PENDING' });
    const active = await Consultation.countDocuments({ specialistId, status: 'ACTIVE' });
    const completed = await Consultation.countDocuments({ specialistId, status: 'COMPLETED' });

    // Waiting for Farmer: Active and the last message in chatHistory is from the specialist
    const activeConsultations = await Consultation.find({ specialistId, status: 'ACTIVE' });
    let waitingFarmer = 0;
    for (const c of activeConsultations) {
      if (c.chatHistory.length > 0) {
        const lastMsg = c.chatHistory[c.chatHistory.length - 1];
        if (lastMsg.senderId.toString() === specialistId.toString()) {
          waitingFarmer++;
        }
      }
    }

    // Today's consultations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = await Consultation.countDocuments({
      specialistId,
      createdAt: { $gte: startOfToday }
    });

    const avgRating = req.user?.rating || 5.0;
    const earnings = completed * 250; // Specialist receives standard ₹250 per completed consult

    // Recent activities (populate farmer name)
    const recentConsultations = await Consultation.find({ specialistId })
      .populate('farmerId', 'name')
      .populate('reportId', 'cropName')
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentActivities = recentConsultations.map(c => ({
      id: c._id,
      type: 'CONSULTATION',
      text: `Consultation for ${c.reportId ? (c.reportId as any).cropName : 'crop'} with ${(c.farmerId as any)?.name || 'Farmer'} is ${c.status.toLowerCase()}`,
      status: c.status,
      timestamp: c.updatedAt
    }));

    // Specialist notifications
    const notifications = await SystemNotification.find({
      $or: [
        { title: /assigned/i },
        { title: /message/i },
        { title: /consultation/i }
      ]
    }).sort({ createdAt: -1 }).limit(5);

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

// ==========================================
// 2. ASSIGNED CONSULTATIONS
// ==========================================
export const getAssignedConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specialistId = req.user?._id;
    const { status, crop, priority, district, search } = req.query;

    const query: any = { specialistId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'REJECTED' }; // exclude rejected consultations by default
    }

    let consultations = await Consultation.find(query)
      .populate('reportId')
      .populate({
        path: 'farmerId',
        select: 'name email mobile savedAddresses farms'
      })
      .sort({ createdAt: -1 });

    // Filter by Crop
    if (crop) {
      consultations = consultations.filter(c => 
        c.reportId && (c.reportId as any).cropName?.toLowerCase().includes(String(crop).toLowerCase())
      );
    }

    // Filter by Priority
    if (priority) {
      consultations = consultations.filter(c => 
        c.reportId && (c.reportId as any).priority === priority
      );
    }

    // Filter by District (check farmer's addresses or farms)
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

    // Keyword Search (Farmer Name, Crop Name, Symptoms)
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

// ==========================================
// 3. CONSULTATION DETAILS & TIMELINE
// ==========================================
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

    // Access farmer history (10. Consultation History)
    const farmerId = consultation.farmerId?._id;
    let farmerHistory: any[] = [];
    let farmerOrders: any[] = [];
    if (farmerId) {
      farmerHistory = await Consultation.find({ farmerId, _id: { $ne: id } })
        .populate('reportId')
        .sort({ createdAt: -1 });

      farmerOrders = await Order.find({ farmerId }).sort({ createdAt: -1 });
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

// Accept Consultation
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

    // Sync Disease Report status
    if (consultation.reportId) {
      await DiseaseReport.findByIdAndUpdate(consultation.reportId, { status: 'ASSIGNED' });
    }

    // Notification update
    emitToRoom(`user_${consultation.farmerId}`, 'consultation_updated', { consultationId: id, status: 'ACTIVE' });
    emitToRoom('role_ADMIN', 'consultation_accepted', { consultationId: id, specialistId: req.user?._id });

    res.json({ message: 'Consultation accepted successfully', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error accepting consultation' });
  }
};

// Reject Consultation (Reason Required)
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

    // Release/Unassign from disease report so admin can reassign
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
// 4. DISEASE DIAGNOSIS
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

    // Sync to DiseaseReport
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

    res.json({ message: 'Diagnosis saved successfully', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error saving diagnosis' });
  }
};

// ==========================================
// 5. TREATMENT RECOMMENDATION
// ==========================================
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

    // Keep legacy prescription schema synced for compatibility
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

    // Mark as COMPLETED upon final submission of treatment
    consultation.status = 'COMPLETED';
    await consultation.save();

    // Update DiseaseReport status to RESOLVED
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

// ==========================================
// 6. MARKETPLACE RECOMMENDATION
// ==========================================
export const recommendProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productIds } = req.body; // Array of product ids

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
    res.json({ message: 'Products recommended successfully', recommendedProducts: populated?.recommendedProducts });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error recommending products' });
  }
};

// Get Merchant Products list (for recommendations)
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
// 7. CUSTOMER COMMUNICATION (CHAT & MEDIA)
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
      // Sleek simulated media sharing
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

// ==========================================
// 8. FOLLOW-UP MANAGEMENT
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
    res.json({ message: 'Follow-up details saved successfully', followUp: consultation.followUp });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error managing follow-up' });
  }
};

// Close Follow-up
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
    res.json({ message: 'Follow-up marked completed successfully', followUp: consultation.followUp });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error closing follow-up' });
  }
};

// ==========================================
// 9. REPORTS & PERFORMANCE ANALYTICS
// ==========================================
export const getSpecialistAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specialistId = req.user?._id;
    if (!specialistId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const totalConsultations = await Consultation.countDocuments({ specialistId });
    const resolvedConsultations = await Consultation.countDocuments({ specialistId, status: 'COMPLETED' });

    // Aggregate monthly consultations counts (last 6 months)
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

    // Aggregate disease statistics
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

    // Average resolution time (mock analysis or difference between completed and created date)
    const completedConsultations = await Consultation.find({ specialistId, status: 'COMPLETED' });
    let totalResolutionHours = 0;
    completedConsultations.forEach(c => {
      const diffMs = c.updatedAt.getTime() - c.createdAt.getTime();
      totalResolutionHours += diffMs / (1000 * 60 * 60);
    });
    const avgResolutionTime = completedConsultations.length > 0
      ? parseFloat((totalResolutionHours / completedConsultations.length).toFixed(1))
      : 12.5; // fallback to default standard hours

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
// 10. PROFILE & SETTINGS
// ==========================================
export const getSpecialistProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching profile' });
  }
};

export const updateSpecialistProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      mobile,
      avatarUrl,
      workingRegion,
      preferredLanguage,
      qualifications,
      experienceYears,
      languages,
      availabilityStatus,
      bio,
      specialistTitle
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          name,
          mobile,
          avatarUrl,
          workingRegion,
          preferredLanguage,
          qualifications,
          experienceYears,
          languages,
          availabilityStatus,
          bio,
          specialistTitle
        }
      },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating profile' });
  }
};
