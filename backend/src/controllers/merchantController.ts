import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Ticket } from '../models/Ticket';
import { InventoryLog } from '../models/InventoryLog';
import { CouponOffer } from '../models/CouponOffer';
import { Settlement } from '../models/Settlement';
import { MerchantNotification } from '../models/MerchantNotification';
import { CustomerNote } from '../models/CustomerNote';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Helper to push merchant notification
const createMerchantNotification = async (merchantId: string, title: string, message: string, type: string, link: string = '') => {
  try {
    await MerchantNotification.create({
      merchantId,
      title,
      message,
      type,
      link,
    });
  } catch (err) {
    console.error('Failed to create notification', err);
  }
};

// 1. Dashboard Overview Stats
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = new Types.ObjectId(req.user?.id);

    // Product stock counts
    const products = await Product.find({ merchantId });
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isEnabled && p.status === 'APPROVED').length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;

    // Order aggregate counts
    const orders = await Order.find({ merchantId });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => o.createdAt >= todayStart).length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    // Revenue
    const totalRevenue = orders
      .filter(o => o.status !== 'CANCELLED' && o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = orders
      .filter(o => o.createdAt >= monthStart && o.status !== 'CANCELLED' && o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Best Sellers (Mocked/Aggregated)
    const bestSellers = await Order.aggregate([
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
      { $limit: 5 }
    ]);

    const bestSellingProducts = [];
    for (const item of bestSellers) {
      // Find by name in database since items.product stores product name or ID depending on context
      const prod = await Product.findOne({ name: item._id, merchantId });
      bestSellingProducts.push({
        name: item._id,
        quantity: item.totalQty,
        sales: item.totalSales,
        imageUrl: prod?.imageUrl || ''
      });
    }

    // Reviews summary
    let totalRating = 0;
    let reviewCount = 0;
    const ratingsDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const recentReviews = [];

    for (const p of products) {
      if (p.reviews && p.reviews.length > 0) {
        for (const r of p.reviews) {
          totalRating += r.rating;
          reviewCount++;
          const roundedRating = Math.round(r.rating) as 5 | 4 | 3 | 2 | 1;
          if (ratingsDistribution[roundedRating] !== undefined) {
            ratingsDistribution[roundedRating]++;
          }
          if (recentReviews.length < 5) {
            recentReviews.push({
              productName: p.name,
              reviewerName: r.name,
              rating: r.rating,
              comment: r.comment,
              date: r.date,
            });
          }
        }
      }
    }

    const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 5.0;

    // Monthly sales revenue trends (Last 6 Months)
    const trends = await Order.aggregate([
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
    ]);

    const salesTrend = trends.reverse().map(t => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        month: `${monthNames[t._id.month - 1]} ${t._id.year}`,
        sales: t.sales,
        orders: t.orders
      };
    });

    // Recent notifications
    const recentNotifications = await MerchantNotification.find({ merchantId })
      .sort({ createdAt: -1 })
      .limit(5);

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
      bestSellingProducts,
      recentReviews,
      ratingsDistribution,
      salesTrend,
      recentNotifications
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving dashboard stats', error: err.message });
  }
};

// 2. Store Management Detail Updates
export const updateStoreProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
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

    // Mark status active once profile details are completed
    if (user.status === 'PENDING') {
      user.status = 'ACTIVE';
    }

    await user.save();
    res.json({ message: 'Store profile updated successfully', user });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// 3. Products Management
export const getProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const products = await Product.find({ merchantId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve products', error: err.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const productData = {
      ...req.body,
      merchantId,
      status: 'APPROVED' // Auto-approve for developer test workspace
    };

    const newProduct = await Product.create(productData);

    // Log initial stock IN
    if (newProduct.stock > 0) {
      await InventoryLog.create({
        productId: newProduct._id,
        merchantId,
        type: 'IN',
        quantity: newProduct.stock,
        reason: 'Initial Product Stock In',
        batchNumber: newProduct.batchNumber || 'INIT-BATCH',
      });
    }

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const existingProduct = await Product.findOne({ _id: id, merchantId });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const previousStock = existingProduct.stock;
    const updatedData = { ...req.body };
    delete updatedData.merchantId; // Prevent changing merchant

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product failed to update' });
    }

    // Log stock adjustments if updated stock differs
    if (updatedProduct.stock !== previousStock) {
      const difference = updatedProduct.stock - previousStock;
      await InventoryLog.create({
        productId: updatedProduct._id,
        merchantId,
        type: difference > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(difference),
        reason: 'Stock Quantity Manual Correction',
        batchNumber: updatedProduct.batchNumber || 'CORR-BATCH',
      });

      // Stock notification check
      if (updatedProduct.stock <= (updatedProduct.lowStockThreshold || 5)) {
        await createMerchantNotification(
          merchantId!,
          'Low Stock Alert',
          `Product "${updatedProduct.name}" has hit low stock threshold (${updatedProduct.stock} left).`,
          'LOW_STOCK',
          `/merchant?tab=inventory`
        );
      }
    }

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const product = await Product.findOneAndDelete({ _id: id, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

export const duplicateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const original = await Product.findOne({ _id: id, merchantId });
    if (!original) {
      return res.status(404).json({ message: 'Original product not found' });
    }

    const copy = new Product(original.toObject());
    copy._id = new Types.ObjectId();
    copy.name = `${original.name} (Copy)`;
    copy.sku = `${original.sku}-COPY`;
    copy.reviews = [];
    copy.rating = 5.0;
    copy.createdAt = new Date();
    copy.updatedAt = new Date();

    await copy.save();
    res.status(201).json({ message: 'Product duplicated successfully', product: copy });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to duplicate product', error: err.message });
  }
};

// 4. Inventory Management
export const getInventoryLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const logs = await InventoryLog.find({ merchantId })
      .populate('productId', 'name sku imageUrl')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch inventory logs', error: err.message });
  }
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const { productId, type, quantity, reason, batchNumber, warehouseName } = req.body;

    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const qty = Number(quantity);
    if (type === 'IN') {
      product.stock += qty;
    } else if (type === 'OUT' || type === 'ADJUSTMENT') {
      if (type === 'OUT' && product.stock < qty) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
      product.stock = Math.max(0, product.stock - (type === 'OUT' ? qty : -qty)); // adjustment could subtract or add depending on sign
    }

    await product.save();

    const log = await InventoryLog.create({
      productId,
      merchantId,
      type,
      quantity: Math.abs(qty),
      reason,
      batchNumber,
      warehouseName,
    });

    // Alert check
    if (product.stock <= (product.lowStockThreshold || 5)) {
      await createMerchantNotification(
        merchantId!,
        product.stock === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
        `Product "${product.name}" stock is now ${product.stock}.`,
        'LOW_STOCK',
        `/merchant?tab=inventory`
      );
    }

    res.status(201).json({ message: 'Inventory adjusted successfully', log, currentStock: product.stock });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to adjust stock', error: err.message });
  }
};

export const bulkUpdateInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const { updates } = req.body; // Array of { productId, newStock }

    for (const update of updates) {
      const product = await Product.findOne({ _id: update.productId, merchantId });
      if (product) {
        const diff = update.newStock - product.stock;
        if (diff !== 0) {
          product.stock = update.newStock;
          await product.save();

          await InventoryLog.create({
            productId: product._id,
            merchantId,
            type: diff > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(diff),
            reason: 'Bulk Stock Update',
          });
        }
      }
    }

    res.json({ message: 'Bulk inventory updated successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Bulk update failed', error: err.message });
  }
};

// 5. Order Management
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const orders = await Order.find({ merchantId })
      .populate('farmerId', 'name email mobile savedAddresses')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const merchantId = req.user?.id;

    const order = await Order.findOne({ _id: id, merchantId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (status === 'PACKING') order.packedAt = new Date();
    if (status === 'SHIPPED') order.shippedAt = new Date();
    if (status === 'DELIVERED') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'PAID'; // Mark paid once delivered if cash on delivery
    }

    await order.save();

    // Trigger notification to farmer via socket/db notifications (if any exist) or simple log
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

export const updateOrderTracking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrierName } = req.body;
    const merchantId = req.user?.id;

    const order = await Order.findOne({ _id: id, merchantId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.trackingNumber = trackingNumber;
    order.carrierName = carrierName;
    if (order.status === 'READY_TO_DISPATCH') {
      order.status = 'SHIPPED';
      order.shippedAt = new Date();
    }

    await order.save();
    res.json({ message: 'Tracking information updated successfully', order });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update tracking', error: err.message });
  }
};

// 6. Customer Management CRM
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = new Types.ObjectId(req.user?.id);

    // Aggregate unique farmers from orders
    const orders = await Order.aggregate([
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

    const enrichedCustomers = [];
    for (const o of orders) {
      if (!o._id) continue;
      const farmer = await User.findById(o._id).select('name email mobile savedAddresses');
      if (!farmer) continue;

      const noteRecord = await CustomerNote.findOne({ merchantId, farmerId: o._id });

      enrichedCustomers.push({
        _id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        mobile: farmer.mobile,
        deliveryAddress: farmer.savedAddresses?.[0]?.street || 'N/A',
        totalSpent: o.totalSpent,
        purchaseFrequency: o.orderCount,
        lastOrderDate: o.lastOrderDate,
        notes: noteRecord?.note || '',
      });
    }

    res.json(enrichedCustomers);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to load customers list', error: err.message });
  }
};

export const updateCustomerNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // farmerId
    const { note } = req.body;
    const merchantId = req.user?.id;

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

// 7. Reviews & Ratings
export const getReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const products = await Product.find({ merchantId });

    const reviewList: any[] = [];
    for (const p of products) {
      if (p.reviews && p.reviews.length > 0) {
        p.reviews.forEach((r: any) => {
          reviewList.push({
            productId: p._id,
            productName: p.name,
            reviewId: r._id,
            farmerId: r.farmerId,
            name: r.name,
            rating: r.rating,
            comment: r.comment,
            reply: r.reply,
            isReported: r.isReported,
            reportReason: r.reportReason,
            date: r.date,
          });
        });
      }
    }

    res.json(reviewList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
  }
};

export const replyToReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, reviewId } = req.params;
    const { reply } = req.body;
    const merchantId = req.user?.id;

    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = (product.reviews as any).id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.reply = reply;
    await product.save();

    res.json({ message: 'Reply submitted successfully', reply });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to reply to review', error: err.message });
  }
};

export const reportReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, reviewId } = req.params;
    const { reason } = req.body;
    const merchantId = req.user?.id;

    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = (product.reviews as any).id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isReported = true;
    review.reportReason = reason || 'Inappropriate comment content';
    await product.save();

    res.json({ message: 'Review flagged and reported to admins successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to report review', error: err.message });
  }
};

// 8. Offers & Promotions
export const getOffers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const offers = await CouponOffer.find({ merchantId }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch offers', error: err.message });
  }
};

export const createOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const offer = await CouponOffer.create({
      ...req.body,
      merchantId,
    });
    res.status(201).json({ message: 'Promotion campaign created successfully', offer });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create offer', error: err.message });
  }
};

export const updateOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const offer = await CouponOffer.findOneAndUpdate({ _id: id, merchantId }, req.body, { new: true });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found or unauthorized' });
    }

    res.json({ message: 'Promotion campaign updated successfully', offer });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update offer', error: err.message });
  }
};

export const deleteOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    const offer = await CouponOffer.findOneAndDelete({ _id: id, merchantId });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    res.json({ message: 'Offer deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete offer', error: err.message });
  }
};

// 9. Settlements
export const getSettlements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const settlements = await Settlement.find({ merchantId }).sort({ createdAt: -1 });
    res.json(settlements);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve settlements', error: err.message });
  }
};

// 10. Notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const notifications = await MerchantNotification.find({ merchantId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id;

    await MerchantNotification.findOneAndUpdate({ _id: id, merchantId }, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to mark read', error: err.message });
  }
};

// 11. Support Tickets
export const getSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    // Map specialist ticket to merchant creators by checking farmerId or querying tickets
    const tickets = await Ticket.find({ farmerId: merchantId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch support tickets', error: err.message });
  }
};

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id;
    const { title, description } = req.body;

    const newTicket = await Ticket.create({
      farmerId: merchantId, // Keep compatibility with model's farmerId field as creator
      title,
      description,
      status: 'OPEN',
      chatHistory: [],
    });

    res.status(201).json({ message: 'Support ticket raised successfully', ticket: newTicket });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to raise ticket', error: err.message });
  }
};

export const sendTicketMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // ticket id
    const { message } = req.body;
    const merchantId = req.user?.id;

    const ticket = await Ticket.findOne({ _id: id, farmerId: merchantId });
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    ticket.chatHistory.push({
      senderId: new Types.ObjectId(merchantId),
      message,
      timestamp: new Date()
    });

    ticket.status = 'IN_PROGRESS';
    await ticket.save();

    res.status(201).json({ message: 'Message sent successfully', ticket });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};
