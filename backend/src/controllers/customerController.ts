import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { User } from '../models/User';
import { DiseaseReport } from '../models/DiseaseReport';
import { Consultation } from '../models/Consultation';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { SystemNotification } from '../models/SystemNotification';
import { Product } from '../models/Product';
import { Ticket } from '../models/Ticket';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';
import { analyzeCropDisease } from '../utils/gemini';
import mongoose from 'mongoose';

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_STX1H1R9XvVjSZ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'iMtdlSgzu1h9vQgytwxSOiJI'
});


// Helper to check object id validity
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

// ==========================================
// 1. DASHBOARD SUMMARY
// ==========================================
export const getCustomerDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.user?._id;
    if (!farmerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const openTicketsCount = await Ticket.countDocuments({ farmerId, status: { $ne: 'CLOSED' } });
    const activeConsultationsCount = await Consultation.countDocuments({ farmerId, status: { $in: ['PENDING', 'ACTIVE'] } });
    const recentOrders = await Order.find({ farmerId }).sort({ createdAt: -1 }).limit(3);
    const orderStatusSummary = await Order.aggregate([
      { $match: { farmerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentReports = await DiseaseReport.find({ farmerId })
      .populate('assignedSpecialistId', 'name specialization rating mobile')
      .sort({ createdAt: -1 })
      .limit(3);
    const recommendedProducts = await Product.find().limit(4);

    // Weather Summary Mock
    const weatherInfo = {
      temp: '29°C',
      humidity: '74%',
      rainForecast: '60% chance of light rain',
      windSpeed: '12 km/h',
      alerts: 'High humidity conditions detected. Fungal spot risk elevated for Cotton and Tomato crops.'
    };

    res.json({
      openTicketsCount,
      activeConsultationsCount,
      recentOrders,
      orderStatusSummary: orderStatusSummary.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      recentReports,
      recommendedProducts,
      weatherInfo
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching dashboard summary' });
  }
};

// ==========================================
// 2. PROFILE & SETTINGS
// ==========================================
export const getCustomerProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching profile' });
  }
};

export const updateCustomerProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, mobile, workingRegion, preferredLanguage, avatarUrl, savedAddresses } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { name, mobile, workingRegion, preferredLanguage, avatarUrl, savedAddresses } },
      { new: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating profile' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user || !user.password) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid current password' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error changing password' });
  }
};

// ==========================================
// 3. FARMS MANAGEMENT
// ==========================================
export const addFarm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, size, soilType, cropType, location } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.farms) user.farms = [];
    user.farms.push({ name, size, soilType, cropType, location });
    await user.save();

    res.json({ message: 'Farm added successfully', farms: user.farms });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error adding farm' });
  }
};

export const updateFarm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmId } = req.params;
    const { name, size, soilType, cropType, location } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.user?._id, 'farms._id': farmId },
      {
        $set: {
          'farms.$.name': name,
          'farms.$.size': size,
          'farms.$.soilType': soilType,
          'farms.$.cropType': cropType,
          'farms.$.location': location
        }
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ message: 'Farm not found' });
      return;
    }

    res.json({ message: 'Farm updated successfully', farms: user.farms });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating farm' });
  }
};

export const deleteFarm = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { farmId } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user || !user.farms) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.farms = user.farms.filter((f: any) => f._id.toString() !== farmId);
    await user.save();

    res.json({ message: 'Farm deleted successfully', farms: user.farms });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting farm' });
  }
};

// ==========================================
// 4. CART & WISHLIST
// ==========================================
export const getCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate('cart.product');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ cart: user.cart || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching cart' });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;
    const qty = quantity || 1;

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.cart) user.cart = [];

    const existingItem = user.cart.find((item: any) => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      user.cart.push({ product: new mongoose.Types.ObjectId(productId), quantity: qty });
    }

    await user.save();
    const updatedUser = await User.findById(req.user?._id).populate('cart.product');

    res.json({ message: 'Added to cart successfully', cart: updatedUser?.cart || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error adding to cart' });
  }
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user || !user.cart) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.cart = user.cart.filter((item: any) => item.product.toString() !== productId);
    await user.save();
    const updatedUser = await User.findById(req.user?._id).populate('cart.product');

    res.json({ message: 'Removed from cart successfully', cart: updatedUser?.cart || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error removing from cart' });
  }
};

export const getWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate('wishlist');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ wishlist: user.wishlist || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching wishlist' });
  }
};

export const addToWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.wishlist) user.wishlist = [];

    if (!user.wishlist.some(id => id.toString() === productId)) {
      user.wishlist.push(new mongoose.Types.ObjectId(productId));
    }

    await user.save();
    const updatedUser = await User.findById(req.user?._id).populate('wishlist');

    res.json({ message: 'Added to wishlist', wishlist: updatedUser?.wishlist || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error adding to wishlist' });
  }
};

export const removeFromWishlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user || !user.wishlist) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();
    const updatedUser = await User.findById(req.user?._id).populate('wishlist');

    res.json({ message: 'Removed from wishlist', wishlist: updatedUser?.wishlist || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error removing from wishlist' });
  }
};

// ==========================================
// 5. SUPPORT TICKETS
// ==========================================
export const getTickets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find({ farmerId: req.user?._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching tickets' });
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, imageUrls } = req.body;
    const ticket = new Ticket({
      farmerId: req.user?._id,
      title,
      description,
      images: imageUrls || [],
      status: 'OPEN',
      chatHistory: [
        {
          senderId: req.user?._id,
          message: `Ticket opened: ${description}`,
          timestamp: new Date()
        }
      ]
    });

    await ticket.save();
    res.status(201).json({ message: 'Support ticket created successfully', ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating ticket' });
  }
};

export const getTicketChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id).populate('chatHistory.senderId', 'name role');
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }
    res.json({ ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching ticket chat' });
  }
};

export const sendTicketMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    const newMessage = {
      senderId: req.user?._id as mongoose.Types.ObjectId,
      message,
      timestamp: new Date()
    };

    ticket.chatHistory.push(newMessage);
    ticket.status = 'OPEN'; // reset to open on farmer reply
    await ticket.save();

    const populatedTicket = await Ticket.findById(id).populate('chatHistory.senderId', 'name role');

    // Socket real-time broadcast to rooms
    emitToRoom(`user_${ticket.farmerId}`, 'ticket_chat_updated', { ticketId: id, chatHistory: populatedTicket?.chatHistory });
    emitToRoom('role_ADMIN', 'ticket_updated', { ticketId: id });

    res.json({ message: 'Message sent successfully', chatHistory: populatedTicket?.chatHistory });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error sending message' });
  }
};

export const updateTicketStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    ticket.status = status;
    await ticket.save();

    emitToRoom(`user_${ticket.farmerId}`, 'ticket_status_updated', { ticketId: id, status });

    res.json({ message: `Ticket status updated to ${status}`, ticket });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating status' });
  }
};

// ==========================================
// 6. AI DISEASE DETECTION
// ==========================================
const CROP_DISEASES_DB: Record<string, Array<{ disease: string, confidence: number, causes: string, symptoms: string, prevention: string, treatment: string }>> = {
  Paddy: [
    {
      disease: 'Rice Blast (Magnaporthe oryzae)',
      confidence: 0.94,
      causes: 'Fungal infection flourishing in high humidity and damp conditions.',
      symptoms: 'Spindle-shaped lesions on leaves with brown borders and grey centers.',
      prevention: 'Avoid excessive nitrogen fertilization; use resistant varieties.',
      treatment: 'Spray Tricyclazole 75% WP or Azoxystrobin.'
    },
    {
      disease: 'Brown Spot (Cochliobolus miyabeanus)',
      confidence: 0.88,
      causes: 'Soil/seed-borne fungus, common in nutrient-deficient soils.',
      symptoms: 'Oval reddish-brown lesions with yellow halos on leaf blades.',
      prevention: 'Ensure balanced fertilization (potassium and nitrogen).',
      treatment: 'Apply Mancozeb or Propiconazole 25% EC.'
    }
  ],
  Tomato: [
    {
      disease: 'Early Blight (Alternaria solani)',
      confidence: 0.95,
      causes: 'Fungal pathogen overwintering in crop debris.',
      symptoms: 'Concentric rings (target spots) on older leaves and stems.',
      prevention: 'Maintain crop rotation and space out tomato rows for air flow.',
      treatment: 'Spray Chlorothalonil or Copper-based fungicides.'
    },
    {
      disease: 'Late Blight (Phytophthora infestans)',
      confidence: 0.91,
      causes: 'Fungal-like oomycete spreading fast in cool, wet weather.',
      symptoms: 'Dark water-soaked spots on leaves with white growth underneath.',
      prevention: 'Use drip irrigation to keep foliage dry; destroy infected residues.',
      treatment: 'Apply Metalaxyl-M or Cymoxanil fungicides.'
    }
  ],
  Cotton: [
    {
      disease: 'Alternaria Leaf Spot (Alternaria macrospora)',
      confidence: 0.93,
      causes: 'Fungal infection active during high humidity and temperature.',
      symptoms: 'Small, circular, brown spots with purple margins on leaves.',
      prevention: 'Use certified clean seeds; burn crop residues after harvest.',
      treatment: 'Apply Copper Oxychloride 50% WP or Mancozeb.'
    }
  ],
  Maize: [
    {
      disease: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
      confidence: 0.92,
      causes: 'Fungal infection favored by high humidity and moderate temperatures.',
      symptoms: 'Large, cigar-shaped, grayish-green lesions on leaves.',
      prevention: 'Use resistant hybrids; practice crop rotation.',
      treatment: 'Apply fungicides like Azoxystrobin or Propiconazole.'
    },
    {
      disease: 'Common Rust (Puccinia sorghi)',
      confidence: 0.89,
      causes: 'Fungal pathogen spread by wind and moisture.',
      symptoms: 'Small, circular to elongated, orange-brown pustules on leaves.',
      prevention: 'Plant resistant varieties; avoid late planting.',
      treatment: 'Use fungicides such as Mancozeb or Triazoles.'
    }
  ],
  Wheat: [
    {
      disease: 'Powdery Mildew (Blumeria graminis)',
      confidence: 0.94,
      causes: 'Fungal infection thriving in cool, humid conditions.',
      symptoms: 'White, powdery spots on upper leaf surfaces that turn gray with age.',
      prevention: 'Use resistant cultivars; ensure good air circulation.',
      treatment: 'Apply fungicides like Tebuconazole or Propiconazole.'
    },
    {
      disease: 'Leaf Rust (Puccinia triticina)',
      confidence: 0.91,
      causes: 'Fungal disease spread by wind and rain splash.',
      symptoms: 'Small, orange-brown pustules on leaves, releasing spores.',
      prevention: 'Plant resistant varieties; apply early fungicide treatments.',
      treatment: 'Use fungicides such as Azoxystrobin or Triazoles.'
    }
  ]
};

export const runAIDetection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { cropName, imageUrl, answers } = req.body;
    if (!cropName || !imageUrl) {
      res.status(400).json({ message: 'Crop name and image URL are required' });
      return;
    }

    // Call the Gemini API analyzer (falls back to mock if API key is not set)
    const prediction = await analyzeCropDisease(cropName, imageUrl, answers || {});

    // Format farmer inputs for historical logs
    let symptomsString = answers['Symptoms'] || `AI scanned leaves for ${cropName}`;
    if (answers && Object.keys(answers).length > 0) {
      symptomsString += '\n\nFarmer Responses:';
      for (const [question, answer] of Object.entries(answers)) {
        symptomsString += `\n• ${question}: ${answer}`;
      }
    }

    // Create disease report document with full details
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

    // Query marketplace products that match keywords from recommendedProducts
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

    // If no products found, return top catalog products as recommendation fallback
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
// 7. CONSULTATIONS
// ==========================================
export const getConsultations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const consultations = await Consultation.find({ farmerId: req.user?._id })
      .populate('specialistId', 'name specialization rating mobile')
      .populate('reportId')
      .sort({ createdAt: -1 });
    res.json({ consultations });
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

    // Match a specialist
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

    // Link reports
    report.status = 'ASSIGNED';
    report.assignedSpecialistId = specialist._id as mongoose.Types.ObjectId;
    await report.save();

    res.status(201).json({ message: 'Consultation requested', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error requesting consultation' });
  }
};

export const getConsultationDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id)
      .populate('specialistId', 'name specialization rating mobile')
      .populate('reportId')
      .populate('chatHistory.senderId', 'name role');

    if (!consultation) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }
    res.json({ consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching consultation' });
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

    // Socket update
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

    // Update specialist avg rating
    const specialist = await User.findById(consultation.specialistId);
    if (specialist) {
      const prevRating = specialist.rating || 5.0;
      specialist.rating = parseFloat(((prevRating + rating) / 2).toFixed(2));
      await specialist.save();
    }

    res.json({ message: 'Thank you for your rating!', consultation });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error submitting rating' });
  }
};

// ==========================================
// 8. MARKETPLACE
// ==========================================
export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const query: any = {};

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query).populate('merchantId', 'businessName rating');
    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching products' });
  }
};

export const getProductDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('merchantId', 'businessName rating');
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json({ product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching product details' });
  }
};

export const submitProductReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    product.reviews.push({
      name: req.user?.name || 'Farmer',
      rating,
      comment,
      date: new Date()
    });

    // Update overall product rating
    const totalRatingSum = product.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    product.rating = parseFloat((totalRatingSum / product.reviews.length).toFixed(1));

    await product.save();
    res.json({ message: 'Review submitted successfully', product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error submitting review' });
  }
};

// ==========================================
// 9. CHECKOUT & ORDERS
// ==========================================
export const processCheckout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, totalAmount, deliveryAddress, paymentMethod, razorpayTransactionId } = req.body;
    const farmerId = req.user?._id;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Cannot place order with empty items list' });
      return;
    }

    // Lookup merchant
    const merchant = await User.findOne({ role: 'MERCHANT', status: 'ACTIVE' });
    const merchantId = merchant ? merchant._id : new mongoose.Types.ObjectId();

    // 1. Create Order
    const order = new Order({
      merchantId,
      farmerId,
      items,
      totalAmount,
      deliveryAddress,
      status: 'PENDING',
      paymentStatus: 'PAID',
      invoiceUrl: `/invoices/INV_${Date.now().toString().slice(-6)}.pdf`
    });
    await order.save();

    // 2. Create Payment transaction record
    const payment = new Payment({
      orderId: order._id,
      transactionId: razorpayTransactionId || `TXN_RP_${Date.now()}`,
      amount: totalAmount,
      status: 'SUCCESSFUL',
      paymentMethod: paymentMethod || 'UPI',
      merchantSettled: false
    });
    await payment.save();

    // 3. Clear user's cart in DB
    const user = await User.findById(farmerId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    // Realtime notification update
    emitToRoom(`user_${farmerId}`, 'order_updated', { orderId: order._id, status: 'PENDING' });
    emitToRoom('role_ADMIN', 'new_order_placed', { orderId: order._id });

    res.status(201).json({
      message: 'Checkout complete. Order placed successfully.',
      order,
      payment
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Checkout failed' });
  }
};

export const getOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ farmerId: req.user?._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching orders' });
  }
};

export const getOrderDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('merchantId', 'businessName mobile');
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching order details' });
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status !== 'PENDING') {
      res.status(400).json({ message: 'Only pending orders can be cancelled' });
      return;
    }

    order.status = 'CANCELLED';
    order.paymentStatus = 'REFUNDED';
    await order.save();

    // Trigger refund log
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { $set: { status: 'REFUNDED' } }
    );

    emitToRoom(`user_${order.farmerId}`, 'order_updated', { orderId: id, status: 'CANCELLED' });

    res.json({ message: 'Order cancelled and refund initiated successfully', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error cancelling order' });
  }
};

export const requestOrderReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    if (order.status !== 'DELIVERED') {
      res.status(400).json({ message: 'Returns can only be requested on delivered orders' });
      return;
    }

    order.status = 'RETURN_REQUESTED';
    await order.save();

    emitToRoom(`user_${order.farmerId}`, 'order_updated', { orderId: id, status: 'RETURN_REQUESTED' });

    res.json({ message: 'Return request submitted successfully', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error requesting return' });
  }
};

// ==========================================
// 10. PAYMENTS
// ==========================================
export const getPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ farmerId: req.user?._id });
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ orderId: { $in: orderIds } }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching payments' });
  }
};

// ==========================================
// 11. WEATHER INFORMATION
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

// ==========================================
// 12. KNOWLEDGE CENTER
// ==========================================
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

// ==========================================
// 13. NOTIFICATIONS
// ==========================================
export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await SystemNotification.find({
      $or: [
        { readBy: { $ne: req.user?._id } },
        { readBy: req.user?._id }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching notifications' });
  }
};

export const markNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    await SystemNotification.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error marking notifications read' });
  }
};

// ==========================================
// RAZORPAY INTEGRATION CONTROLLERS
// ==========================================

export const createCheckoutPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, couponCode } = req.body;
    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Cart items are required' });
      return;
    }

    // Securely compute total on the server
    let calculatedTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product?._id || item.product);
      if (!product) {
        res.status(404).json({ message: `Product not found` });
        return;
      }
      calculatedTotal += product.price * item.quantity;
    }

    // Apply coupon discount if valid
    let discount = 0;
    if (couponCode && couponCode.toUpperCase() === 'KISAN20') {
      discount = calculatedTotal * 0.20; // 20% off
    }
    const finalAmount = Math.max(1, calculatedTotal - discount);

    // Create Razorpay Order
    const options = {
      amount: Math.round(finalAmount * 100), // Razorpay accepts in paise (cents equivalent)
      currency: 'INR',
      receipt: `rcpt_order_${Date.now().toString().slice(-6)}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_STX1H1R9XvVjSZ',
      order: razorpayOrder,
      finalAmount,
      discount
    });
  } catch (error: any) {
    console.error('Error creating checkout payment order:', error);
    res.status(500).json({ message: error.message || 'Error creating checkout payment order' });
  }
};

export const verifyCheckoutPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      items,
      deliveryAddress,
      totalAmount,
      paymentMethod
    } = req.body;

    const farmerId = req.user?._id;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'iMtdlSgzu1h9vQgytwxSOiJI')
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      res.status(400).json({ message: 'Invalid payment signature' });
      return;
    }

    // Fetch active merchant
    const merchant = await User.findOne({ role: 'MERCHANT', status: 'ACTIVE' });
    const merchantId = merchant ? merchant._id : new mongoose.Types.ObjectId();

    // Create Order
    const order = new Order({
      merchantId,
      farmerId,
      items: items.map((it: any) => ({
        product: it.product?.name || it.name || 'Agri Product',
        quantity: it.quantity,
        price: it.product?.price || it.price
      })),
      totalAmount,
      deliveryAddress,
      status: 'PENDING',
      paymentStatus: 'PAID',
      invoiceUrl: `/invoices/INV_${Date.now().toString().slice(-6)}.pdf`
    });
    await order.save();

    // Create Payment record
    const payment = new Payment({
      orderId: order._id,
      transactionId: razorpay_payment_id,
      amount: totalAmount,
      status: 'SUCCESSFUL',
      paymentMethod: paymentMethod || 'Razorpay UPI',
      merchantSettled: false
    });
    await payment.save();

    // Clear cart
    const user = await User.findById(farmerId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    // Sockets sync
    emitToRoom(`user_${farmerId}`, 'order_updated', { orderId: order._id, status: 'PENDING' });
    emitToRoom('role_ADMIN', 'new_order_placed', { orderId: order._id });

    res.status(201).json({
      message: 'Payment verified and order placed successfully.',
      order,
      payment
    });
  } catch (error: any) {
    console.error('Error verifying checkout payment:', error);
    res.status(500).json({ message: error.message || 'Error verifying checkout payment' });
  }
};

export const createConsultationPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reportId } = req.body;
    if (!reportId) {
      res.status(400).json({ message: 'Disease report ID is required' });
      return;
    }

    const report = await DiseaseReport.findById(reportId);
    if (!report) {
      res.status(404).json({ message: 'Disease report not found' });
      return;
    }

    const consultationFee = 499; // Standard specialist consultation fee in INR

    // Create Razorpay Order
    const options = {
      amount: Math.round(consultationFee * 100), // in paise
      currency: 'INR',
      receipt: `rcpt_consult_${Date.now().toString().slice(-6)}`,
      notes: {
        reportId: reportId.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_STX1H1R9XvVjSZ',
      order: razorpayOrder,
      fee: consultationFee
    });
  } catch (error: any) {
    console.error('Error creating consultation payment order:', error);
    res.status(500).json({ message: error.message || 'Error creating consultation payment order' });
  }
};

export const verifyConsultationPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      reportId
    } = req.body;

    const farmerId = req.user?._id;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'iMtdlSgzu1h9vQgytwxSOiJI')
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;
    if (!isSignatureValid) {
      res.status(400).json({ message: 'Invalid payment signature' });
      return;
    }

    const report = await DiseaseReport.findById(reportId);
    if (!report) {
      res.status(404).json({ message: 'Disease report not found' });
      return;
    }

    // Create consultation in PENDING status (no specialist assigned yet)
    const consultation = new Consultation({
      reportId,
      farmerId,
      specialistId: null, // assigned later by admin
      status: 'PENDING',
      chatHistory: [
        {
          senderId: farmerId,
          message: `Consultation request initiated. Payment transaction ${razorpay_payment_id} succeeded. Waiting for Admin assignment.`,
          timestamp: new Date()
        }
      ]
    });
    await consultation.save();

    // Create a consultation payment record (link reportId or just a dummy/ref)
    const payment = new Payment({
      orderId: reportId, // using reportId as order reference for consultations
      transactionId: razorpay_payment_id,
      amount: 499,
      status: 'SUCCESSFUL',
      paymentMethod: 'Razorpay API',
      merchantSettled: false
    });
    await payment.save();

    // Update report status
    report.status = 'ASSIGNED';
    await report.save();

    // Emit Socket notifications
    emitToRoom('role_ADMIN', 'new_consultation_request', { consultationId: consultation._id });
    emitToRoom(`user_${farmerId}`, 'consultation_updated', { consultationId: consultation._id, status: 'PENDING' });

    res.status(201).json({
      message: 'Consultation request paid successfully. Ticket created.',
      consultation
    });
  } catch (error: any) {
    console.error('Error verifying consultation payment:', error);
    res.status(500).json({ message: error.message || 'Error verifying consultation payment' });
  }
};

