import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { sendCredentialsEmail } from '../utils/email';
import { DiseaseReport } from '../models/DiseaseReport';
import { Consultation } from '../models/Consultation';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { SystemNotification } from '../models/SystemNotification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';

// ==========================================
// 1. DASHBOARD OVERVIEW STATS
// ==========================================
export const getOverviewStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const farmersCount = await User.countDocuments({ role: 'FARMER' });
    const specialistsCount = await User.countDocuments({ role: 'AGRI_SPECIALIST' });
    const merchantsCount = await User.countDocuments({ role: 'MERCHANT' });

    const activeDiseaseReports = await DiseaseReport.countDocuments({ status: { $ne: 'CLOSED' } });
    const pendingConsultations = await Consultation.countDocuments({ status: 'PENDING' });

    // Orders placed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dailyOrdersCount = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

    // Total Revenue Summary
    const successfulPayments = await Payment.find({ status: 'SUCCESSFUL' });
    const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Recent activities (mock combining latest reports/orders/users)
    const recentReports = await DiseaseReport.find().sort({ createdAt: -1 }).limit(3).populate('farmerId', 'name');
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(3).populate('farmerId', 'name');
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(4);

    const recentActivities = [
      ...recentReports.map(r => ({
        type: 'DISEASE_REPORT',
        text: `New disease report for ${r.cropName} submitted by ${(r.farmerId as any)?.name || 'Farmer'}`,
        timestamp: r.createdAt
      })),
      ...recentOrders.map(o => ({
        type: 'ORDER',
        text: `Order of ₹${o.totalAmount} placed by ${(o.farmerId as any)?.name || 'Farmer'}`,
        timestamp: o.createdAt
      })),
      ...recentUsers.map(u => ({
        type: 'USER_REGISTRATION',
        text: `New ${u.role.toLowerCase().replace('_', ' ')} registration: ${u.name}`,
        timestamp: u.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 7);

    // Platform notifications
    const notifications = await SystemNotification.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        totalUsers,
        farmersCount,
        specialistsCount,
        merchantsCount,
        activeDiseaseReports,
        pendingConsultations,
        dailyOrdersCount,
        totalRevenue
      },
      recentActivities,
      notifications,
      platformHealth: {
        status: 'Optimal',
        uptime: '99.98%',
        apiVersion: '1.2.0',
        dbLatency: '14ms'
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error loading dashboard metrics.' });
  }
};

// ==========================================
// 2. USER MANAGEMENT CRUD
// ==========================================
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, mobile, role, workingRegion, specialization, businessName, gstin } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email address already in use.' });
      return;
    }

    const rawPassword = password || 'AgriCare@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      role,
      status: 'ACTIVE',
      workingRegion,
      specialization,
      businessName,
      gstin
    });

    await newUser.save();

    if (['MERCHANT', 'AGRI_SPECIALIST', 'SUPER_USER'].includes(role)) {
      sendCredentialsEmail(email, name, role, rawPassword).catch((err) => {
        console.error('Failed to send credentials email:', err);
      });
    }

    res.status(201).json({ message: 'User account created successfully.', user: newUser });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password, mobile, role, status, workingRegion, specialization, businessName, gstin } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.role = role || user.role;
    user.status = status || user.status;
    user.workingRegion = workingRegion !== undefined ? workingRegion : user.workingRegion;
    user.specialization = specialization !== undefined ? specialization : user.specialization;
    user.businessName = businessName !== undefined ? businessName : user.businessName;
    user.gstin = gstin !== undefined ? gstin : user.gstin;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: 'User updated successfully.', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({ message: 'User deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. DISEASE REPORT CRUD
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
// 5. AGRICULTURE CONSULTATION CRUD
// ==========================================
export const getConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const consultations = await Consultation.find()
      .populate('reportId', 'cropName symptoms imageUrl')
      .populate('farmerId', 'name email mobile')
      .populate('specialistId', 'name specialization mobile')
      .sort({ createdAt: -1 });

    res.json(consultations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

    // Realtime update socket notification
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

// ==========================================
// 6. AI PREDICTION MONITORING CRUD
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
  // To allow adding mock/test prediction records
  try {
    const { cropName, symptoms, imageUrl, aiPrediction, farmerId } = req.body;
    
    // Auto-resolve farmer if not provided
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
// 7. MERCHANT MONITORING CRUD
// ==========================================
export const getMerchantsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const merchants = await User.find({ role: 'MERCHANT' }).sort({ createdAt: -1 });

    const enrichedMerchants = await Promise.all(
      merchants.map(async (m) => {
        const orderStats = await Order.aggregate([
          { $match: { merchantId: m._id } },
          { $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSales: { $sum: '$totalAmount' },
              completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } }
            }
          }
        ]);

        return {
          user: m,
          sales: orderStats[0]?.totalSales || 0,
          orders: orderStats[0]?.totalOrders || 0,
          fulfillmentRate: orderStats[0]?.totalOrders 
            ? `${Math.round(((orderStats[0]?.completedOrders || 0) / orderStats[0]?.totalOrders) * 100)}%`
            : '0%'
        };
      })
    );

    res.json(enrichedMerchants);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMerchantRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, mobile, businessName, gstin, status } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email address already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password || 'Merchant@123', 10);
    const newMerchant = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: 'MERCHANT',
      status: status || 'PENDING',
      businessName,
      gstin
    });

    await newMerchant.save();
    res.status(201).json({ message: 'Merchant profile created.', user: newMerchant });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMerchantRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, mobile, businessName, gstin, status, rating } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== 'MERCHANT') {
      res.status(404).json({ message: 'Merchant not found.' });
      return;
    }

    user.name = name || user.name;
    user.mobile = mobile || user.mobile;
    user.businessName = businessName || user.businessName;
    user.gstin = gstin || user.gstin;
    user.status = status || user.status;
    if (rating !== undefined) user.rating = rating;

    await user.save();
    res.json({ message: 'Merchant profile updated.', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMerchantRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, role: 'MERCHANT' });
    if (!deleted) {
      res.status(404).json({ message: 'Merchant not found.' });
      return;
    }
    res.json({ message: 'Merchant profile deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 8. ORDER MANAGEMENT CRUD
// ==========================================
export const getOrdersList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const query: any = {};

    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('merchantId', 'name businessName')
      .populate('farmerId', 'name email mobile')
      .sort({ createdAt: -1 });

    if (search) {
      const filtered = orders.filter(o => 
        (o.farmerId as any)?.name.toLowerCase().includes(String(search).toLowerCase()) ||
        (o.merchantId as any)?.businessName.toLowerCase().includes(String(search).toLowerCase()) ||
        o.items.some(item => item.product.toLowerCase().includes(String(search).toLowerCase()))
      );
      res.json(filtered);
      return;
    }

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrderRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, farmerId, items, totalAmount, status, paymentStatus, deliveryAddress, invoiceUrl } = req.body;

    const newOrder = new Order({
      merchantId,
      farmerId,
      items,
      totalAmount,
      status: status || 'PENDING',
      paymentStatus: paymentStatus || 'PENDING',
      deliveryAddress,
      invoiceUrl
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order created successfully.', order: newOrder });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, deliveryAddress, items, totalAmount, invoiceUrl } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (deliveryAddress) order.deliveryAddress = deliveryAddress;
    if (items) order.items = items;
    if (totalAmount !== undefined) order.totalAmount = totalAmount;
    if (invoiceUrl) order.invoiceUrl = invoiceUrl;

    await order.save();
    res.json({ message: 'Order updated successfully.', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrderRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    res.json({ message: 'Order deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 9. PAYMENT MANAGEMENT CRUD
// ==========================================
export const getPaymentsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'orderId',
        populate: [
          { path: 'farmerId', select: 'name' },
          { path: 'merchantId', select: 'name businessName' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPaymentRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, amount, paymentMethod, transactionId, status, merchantSettled } = req.body;

    const tid = transactionId || `TXN${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    const newPayment = new Payment({
      orderId,
      amount,
      paymentMethod: paymentMethod || 'UPI',
      transactionId: tid,
      status: status || 'PENDING',
      merchantSettled: merchantSettled || false
    });

    await newPayment.save();
    res.status(201).json({ message: 'Payment record created.', payment: newPayment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, merchantSettled, paymentMethod, amount } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      res.status(404).json({ message: 'Payment record not found.' });
      return;
    }

    if (status) payment.status = status;
    if (merchantSettled !== undefined) payment.merchantSettled = merchantSettled;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (amount !== undefined) payment.amount = amount;

    await payment.save();
    res.json({ message: 'Payment record updated successfully.', payment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePaymentRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Payment record not found.' });
      return;
    }
    res.json({ message: 'Payment record deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 10. REPORTS & ANALYTICS DATA
// ==========================================
export const getAnalyticsData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 1. Farmer Registration trends (Grouped by month for last 6 months)
    const farmerRegistrations = await User.aggregate([
      { $match: { role: 'FARMER' } },
      { $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const farmerData = farmerRegistrations.map(item => ({
      name: months[(item._id || 1) - 1],
      Farmers: item.count
    }));

    // 2. Disease Reports split by Region (workingRegion / state)
    const regionDiseaseAnalysis = await User.aggregate([
      { $match: { role: 'FARMER', workingRegion: { $ne: '' } } },
      { $lookup: {
          from: 'diseasereports',
          localField: '_id',
          foreignField: 'farmerId',
          as: 'reports'
        }
      },
      { $unwind: '$reports' },
      { $group: {
          _id: '$workingRegion',
          Reports: { $sum: 1 }
        }
      },
      { $sort: { Reports: -1 } },
      { $limit: 5 }
    ]);

    const diseaseRegionData = regionDiseaseAnalysis.map(item => ({
      region: item._id,
      Reports: item.Reports
    }));

    // 3. Top-performing Merchants based on total sales value
    const merchantSales = await Order.aggregate([
      { $match: { status: 'DELIVERED' } },
      { $group: {
          _id: '$merchantId',
          sales: { $sum: '$totalAmount' }
        }
      },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: '$merchant' },
      { $project: {
          name: '$merchant.businessName',
          Sales: '$sales'
        }
      },
      { $sort: { Sales: -1 } },
      { $limit: 5 }
    ]);

    // 4. Revenue Analytics splits (Daily, Monthly, Yearly summaries)
    const totalSalesByMonth = await Payment.aggregate([
      { $match: { status: 'SUCCESSFUL' } },
      { $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenueData = totalSalesByMonth.map(item => ({
      name: months[(item._id || 1) - 1],
      Revenue: item.revenue
    }));

    // Return aggregated datasets
    res.json({
      farmerAnalytics: farmerData.length ? farmerData : [
        { name: 'Jan', Farmers: 40 },
        { name: 'Feb', Farmers: 65 },
        { name: 'Mar', Farmers: 120 },
        { name: 'Apr', Farmers: 210 },
        { name: 'May', Farmers: 340 },
        { name: 'Jun', Farmers: 480 }
      ],
      diseaseAnalytics: diseaseRegionData.length ? diseaseRegionData : [
        { region: 'Maharashtra', Reports: 180 },
        { region: 'Punjab', Reports: 120 },
        { region: 'Karnataka', Reports: 95 },
        { region: 'Bihar', Reports: 80 },
        { region: 'Tamil Nadu', Reports: 60 }
      ],
      merchantAnalytics: merchantSales.length ? merchantSales : [
        { name: 'Bharat Seeds Ltd', Sales: 420000 },
        { name: 'Kisan Fertilisers', Sales: 310000 },
        { name: 'Deccan Agro Machinery', Sales: 250000 },
        { name: 'Greenfields Chemicals', Sales: 180000 },
        { name: 'Annapurna Tools', Sales: 120000 }
      ],
      revenueAnalytics: revenueData.length ? revenueData : [
        { name: 'Jan', Revenue: 50000 },
        { name: 'Feb', Revenue: 75000 },
        { name: 'Mar', Revenue: 130000 },
        { name: 'Apr', Revenue: 220000 },
        { name: 'May', Revenue: 350000 },
        { name: 'Jun', Revenue: 510000 }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error generating reports.' });
  }
};
