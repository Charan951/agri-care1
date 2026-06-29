import { Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Payment } from '../models/Payment';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Consultation } from '../models/Consultation';
import { DiseaseReport } from '../models/DiseaseReport';
import { Settlement } from '../models/Settlement';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { emitToRoom } from '../utils/socket';
import mongoose from 'mongoose';

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_STX1H1R9XvVjSZ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'iMtdlSgzu1h9vQgytwxSOiJI'
});

// ==========================================
// 1. ADMIN PAYMENT CRUD
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
// 2. GATEWAY TRANSACTION HANDLERS (FARMER)
// ==========================================
export const createCheckoutPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, couponCode } = req.body;
    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Cart items are required' });
      return;
    }

    let calculatedTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId || item.product?._id || item.product);
      if (!product) {
        res.status(404).json({ message: `Product not found` });
        return;
      }
      calculatedTotal += product.price * item.quantity;
    }

    let discount = 0;
    if (couponCode && couponCode.toUpperCase() === 'KISAN20') {
      discount = calculatedTotal * 0.20;
    }
    const finalAmount = Math.max(1, calculatedTotal - discount);

    const options = {
      amount: Math.round(finalAmount * 100),
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

    const merchant = await User.findOne({ role: 'MERCHANT', status: 'ACTIVE' });
    const merchantId = merchant ? merchant._id : new mongoose.Types.ObjectId();

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

    const payment = new Payment({
      orderId: order._id,
      transactionId: razorpay_payment_id,
      amount: totalAmount,
      status: 'SUCCESSFUL',
      paymentMethod: paymentMethod || 'Razorpay UPI',
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

    const consultationFee = 499;

    const options = {
      amount: Math.round(consultationFee * 100),
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

    const consultation = new Consultation({
      reportId,
      farmerId,
      specialistId: null,
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

    const payment = new Payment({
      orderId: reportId,
      transactionId: razorpay_payment_id,
      amount: 499,
      status: 'SUCCESSFUL',
      paymentMethod: 'Razorpay API',
      merchantSettled: false
    });
    await payment.save();

    report.status = 'ASSIGNED';
    await report.save();

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

export const getFarmerPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
// 3. MERCHANT SETTLEMENTS
// ==========================================
export const getSettlements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const settlements = await Settlement.find({ merchantId }).sort({ createdAt: -1 });
    res.json(settlements);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve settlements', error: err.message });
  }
};
