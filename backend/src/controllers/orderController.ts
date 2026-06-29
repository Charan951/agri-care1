import { Response } from 'express';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';
import mongoose from 'mongoose';

// ==========================================
// 1. ADMIN ORDER CRUD
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
// 2. MERCHANT ORDER CRUD
// ==========================================
export const getMerchantOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
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
    const merchantId = req.user?.id || req.user?._id;

    const order = await Order.findOne({ _id: id, merchantId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (status === 'PACKING') order.packedAt = new Date();
    if (status === 'SHIPPED') order.shippedAt = new Date();
    if (status === 'DELIVERED') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'PAID';
    }

    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

export const updateOrderTracking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrierName } = req.body;
    const merchantId = req.user?.id || req.user?._id;

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

// ==========================================
// 3. FARMER ORDER & CHECKOUT
// ==========================================
export const processCheckout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, totalAmount, deliveryAddress, paymentMethod, razorpayTransactionId } = req.body;
    const farmerId = req.user?._id;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Cannot place order with empty items list' });
      return;
    }

    const merchant = await User.findOne({ role: 'MERCHANT', status: 'ACTIVE' });
    const merchantId = merchant ? merchant._id : new mongoose.Types.ObjectId();

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

    const payment = new Payment({
      orderId: order._id,
      transactionId: razorpayTransactionId || `TXN_RP_${Date.now()}`,
      amount: totalAmount,
      status: 'SUCCESSFUL',
      paymentMethod: paymentMethod || 'UPI',
      merchantSettled: false
    });
    await payment.save();

    const user = await User.findById(farmerId);
    if (user) {
      user.cart = [];
      await user.save();
    }

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

export const getFarmerOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
