import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { sendCredentialsEmail } from '../utils/email';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Order } from '../models/Order';
import mongoose, { Types } from 'mongoose';
import { Ticket } from '../models/Ticket';
import { Consultation } from '../models/Consultation';
import { DiseaseReport } from '../models/DiseaseReport';
import { Product } from '../models/Product';
import { MerchantNotification } from '../models/MerchantNotification';
import { CustomerNote } from '../models/CustomerNote';
import { emitToRoom } from '../utils/socket';

// ==========================================
// 1. PROFILE DETAILS
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
// 2. ADMIN USER CRUD (ADMIN ONLY)
// ==========================================
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (search) {
      query.$text = { $search: search as string };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await User.countDocuments(query);

    res.json({
      users,
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
// 3. ADMIN MERCHANT CRUD (ADMIN ONLY)
// ==========================================
export const getMerchantsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const merchantAggregation = await User.aggregate([
      { $match: { role: 'MERCHANT' } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'merchantId',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSales: { $sum: '$orders.totalAmount' },
          completedOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.status', 'DELIVERED'] }
              }
            }
          }
        }
      },
      {
        $project: {
          password: 0,
          orders: 0
        }
      }
    ]);

    const total = await User.countDocuments({ role: 'MERCHANT' });

    const enrichedMerchants = merchantAggregation.map((m) => ({
      user: m,
      sales: m.totalSales || 0,
      orders: m.totalOrders || 0,
      fulfillmentRate: m.totalOrders 
        ? `${Math.round(((m.completedOrders || 0) / m.totalOrders) * 100)}%`
        : '0%'
    }));

    res.json({
      merchants: enrichedMerchants,
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
// 4. FARMS MANAGEMENT
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
// 5. CART & WISHLIST
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

    emitToRoom(`user_${user._id}`, 'cart_updated', { cart: updatedUser?.cart || [] });

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

    emitToRoom(`user_${user._id}`, 'cart_updated', { cart: updatedUser?.cart || [] });

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

    emitToRoom(`user_${user._id}`, 'wishlist_updated', { wishlist: updatedUser?.wishlist || [] });

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

    emitToRoom(`user_${user._id}`, 'wishlist_updated', { wishlist: updatedUser?.wishlist || [] });

    res.json({ message: 'Removed from wishlist', wishlist: updatedUser?.wishlist || [] });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error removing from wishlist' });
  }
};

// ==========================================
// 6. CUSTOMER DASHBOARD SUMMARY
// ==========================================
export const getCustomerDashboardSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const farmerId = req.user?._id;
    if (!farmerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const [
      openTicketsCount,
      activeConsultationsCount,
      recentOrders,
      orderStatusSummary,
      recentReports,
      recommendedProducts,
      ongoingOrders,
      ongoingConsultations
    ] = await Promise.all([
      Ticket.countDocuments({ farmerId, status: { $ne: 'CLOSED' } }),
      Consultation.countDocuments({ farmerId, status: { $in: ['PENDING', 'ACTIVE'] } }),
      Order.find({ farmerId }).sort({ createdAt: -1 }).limit(3),
      Order.aggregate([
        { $match: { farmerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      DiseaseReport.find({ farmerId })
        .populate('assignedSpecialistId', 'name specialization rating mobile')
        .sort({ createdAt: -1 })
        .limit(3),
      Product.find().limit(4),
      Order.find({
        farmerId,
        status: { $nin: ['DELIVERED', 'CANCELLED', 'RETURNED'] }
      }).sort({ createdAt: -1 }),
      Consultation.find({
        farmerId,
        status: { $in: ['PENDING', 'ACTIVE', 'ESCALATED'] }
      })
        .populate('specialistId', 'name specialization rating mobile')
        .populate('reportId')
        .sort({ createdAt: -1 })
    ]);

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
      ongoingOrders,
      ongoingConsultations,
      weatherInfo
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching dashboard summary' });
  }
};

// ==========================================
// 7. MERCHANT DASHBOARD & CRM
// ==========================================
export const getMerchantDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = new Types.ObjectId(req.user?._id || req.user?.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Execute all queries in parallel
    const [
      productStats,
      orderStats,
      bestSellers,
      reviewStats,
      trends,
      recentNotifications
    ] = await Promise.all([
      // Product stats using aggregation
      Product.aggregate([
        { $match: { merchantId } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [
              { $match: { isEnabled: true, status: 'APPROVED' } },
              { $count: 'count' }
            ],
            outOfStock: [
              { $match: { stock: 0 } },
              { $count: 'count' }
            ],
            lowStock: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gt: ['$stock', 0] },
                      { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 5] }] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),
      // Order stats using aggregation
      Order.aggregate([
        { $match: { merchantId } },
        {
          $facet: {
            todayOrders: [
              { $match: { createdAt: { $gte: todayStart } } },
              { $count: 'count' }
            ],
            statusCounts: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            totalRevenue: [
              { $match: { status: { $ne: 'CANCELLED' }, paymentStatus: 'PAID' } },
              { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ],
            monthlyRevenue: [
              { $match: { createdAt: { $gte: monthStart }, status: { $ne: 'CANCELLED' }, paymentStatus: 'PAID' } },
              { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]
          }
        }
      ]),
      // Best sellers with product image using lookup
      Order.aggregate([
        { $match: { merchantId, status: { $ne: 'CANCELLED' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQty: { $sum: '$items.quantity' },
            totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { totalQty: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            let: { productName: '$_id', merchantId: merchantId },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$merchantId', '$$merchantId'] }, { $eq: ['$name', '$$productName'] }] } } },
              { $project: { imageUrl: 1 } }
            ],
            as: 'product'
          }
        },
        {
          $project: {
            name: '$_id',
            quantity: '$totalQty',
            sales: '$totalSales',
            imageUrl: { $ifNull: [{ $arrayElemAt: ['$product.imageUrl', 0] }, ''] }
          }
        }
      ]),
      // Review stats using aggregation
      Product.aggregate([
        { $match: { merchantId, 'reviews.0': { $exists: true } } },
        { $unwind: '$reviews' },
        {
          $facet: {
            ratingStats: [
              {
                $group: {
                  _id: null,
                  totalRating: { $sum: '$reviews.rating' },
                  reviewCount: { $sum: 1 },
                  ratings: {
                    $push: '$reviews.rating'
                  }
                }
              }
            ],
            recentReviews: [
              { $sort: { 'reviews.date': -1 } },
              { $limit: 5 },
              {
                $project: {
                  productName: '$name',
                  reviewerName: '$reviews.name',
                  rating: '$reviews.rating',
                  comment: '$reviews.comment',
                  date: '$reviews.date'
                }
              }
            ]
          }
        }
      ]),
      // Sales trends
      Order.aggregate([
        {
          $match: {
            merchantId,
            status: { $ne: 'CANCELLED' },
            paymentStatus: 'PAID'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            sales: { $sum: '$totalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ]),
      // Recent notifications
      MerchantNotification.find({ merchantId })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const totalProducts = productStats[0]?.total[0]?.count || 0;
    const activeProducts = productStats[0]?.active[0]?.count || 0;
    const outOfStock = productStats[0]?.outOfStock[0]?.count || 0;
    const lowStock = productStats[0]?.lowStock[0]?.count || 0;

    const todayOrders = orderStats[0]?.todayOrders[0]?.count || 0;
    const statusCounts = orderStats[0]?.statusCounts || [];
    const pendingOrders = statusCounts.find((s: any) => s._id === 'PENDING')?.count || 0;
    const completedOrders = statusCounts.find((s: any) => s._id === 'DELIVERED')?.count || 0;
    const cancelledOrders = statusCounts.find((s: any) => s._id === 'CANCELLED')?.count || 0;
    const totalRevenue = orderStats[0]?.totalRevenue[0]?.total || 0;
    const monthlyRevenue = orderStats[0]?.monthlyRevenue[0]?.total || 0;

    const ratingStats = reviewStats[0]?.ratingStats[0];
    const reviewCount = ratingStats?.reviewCount || 0;
    const totalRating = ratingStats?.totalRating || 0;
    const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 5.0;

    // Calculate ratings distribution
    const ratingsDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (ratingStats?.ratings) {
      ratingStats.ratings.forEach((rating: number) => {
        const roundedRating = Math.round(rating) as 5 | 4 | 3 | 2 | 1;
        if (ratingsDistribution[roundedRating] !== undefined) {
          ratingsDistribution[roundedRating]++;
        }
      });
    }
    const recentReviews = reviewStats[0]?.recentReviews || [];

    const salesTrend = trends.reverse().map(t => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        month: `${monthNames[t._id.month - 1]} ${t._id.year}`,
        sales: t.sales,
        orders: t.orders
      };
    });

    res.json({
      stats: {
        totalProducts,
        activeProducts,
        outOfStock,
        lowStock,
        todayOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        monthlyRevenue,
        averageRating,
        reviewCount
      },
      bestSellingProducts: bestSellers,
      recentReviews,
      ratingsDistribution,
      salesTrend,
      recentNotifications
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving dashboard stats', error: err.message });
  }
};

export const updateStoreProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?._id || req.user?.id;
    const { businessName, gstin, storeProfile } = req.body;

    const user = await User.findById(merchantId);
    if (!user) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    if (businessName) user.businessName = businessName;
    if (gstin) user.gstin = gstin;

    if (storeProfile) {
      user.storeProfile = {
        ...(user.storeProfile || {}),
        ...storeProfile,
        bankAccount: {
          ...(user.storeProfile?.bankAccount || {}),
          ...(storeProfile.bankAccount || {})
        },
        shippingSettings: {
          ...(user.storeProfile?.shippingSettings || {}),
          ...(storeProfile.shippingSettings || {})
        },
        invoiceSettings: {
          ...(user.storeProfile?.invoiceSettings || {}),
          ...(storeProfile.invoiceSettings || {})
        }
      };
    }

    if (user.status === 'PENDING') {
      user.status = 'ACTIVE';
    }

    await user.save();
    res.json({ message: 'Store profile updated successfully', user });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

export const getMerchantCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    const merchantId = new Types.ObjectId(req.user?._id || req.user?.id);

    // First, get all orders grouped by farmer
    const orderStats = await Order.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: '$farmerId',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    const farmerIds = orderStats.map(o => o._id);
    
    // Get all farmers in one query
    const farmers = await User.find({ _id: { $in: farmerIds } }).select('name email mobile savedAddresses');
    const farmerMap = new Map(farmers.map(f => [f._id.toString(), f]));

    // Get all notes in one query
    const notes = await CustomerNote.find({ merchantId, farmerId: { $in: farmerIds } });
    const noteMap = new Map(notes.map(n => [n.farmerId.toString(), n.note]));

    // Build response
    const customers = orderStats.map(o => {
      const farmer = farmerMap.get(o._id.toString());
      if (!farmer) return null;

      return {
        _id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        mobile: farmer.mobile,
        deliveryAddress: farmer.savedAddresses?.[0]?.street || 'N/A',
        totalSpent: o.totalSpent,
        purchaseFrequency: o.orderCount,
        lastOrderDate: o.lastOrderDate,
        notes: noteMap.get(o._id.toString()) || ''
      };
    }).filter(Boolean);

    // Sort by last order date descending
    customers.sort((a, b) => new Date(b!.lastOrderDate).getTime() - new Date(a!.lastOrderDate).getTime());

    const total = customers.length;
    const paginatedCustomers = customers.slice(skip, skip + limitNum);

    res.json({
      customers: paginatedCustomers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    console.error('Error in getMerchantCustomers:', err);
    res.status(500).json({ message: 'Failed to load customers list', error: err.message });
  }
};

export const updateCustomerNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const merchantId = req.user?._id || req.user?.id;

    const existing = await CustomerNote.findOne({ merchantId, farmerId: id });
    if (existing) {
      existing.note = note;
      await existing.save();
    } else {
      await CustomerNote.create({
        merchantId,
        farmerId: id,
        note
      });
    }

    res.json({ message: 'Customer CRM notes updated successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update notes', error: err.message });
  }
};



