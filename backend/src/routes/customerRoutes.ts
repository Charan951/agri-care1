import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware';
import {
  getCustomerProfile,
  updateCustomerProfile,
  changePassword,
  addFarm,
  updateFarm,
  deleteFarm,
  getCart,
  addToCart,
  removeFromCart,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getTickets,
  createTicket,
  getTicketChat,
  sendTicketMessage,
  updateTicketStatus,
  runAIDetection,
  getDetectionHistory,
  getConsultations,
  requestConsultation,
  getConsultationDetails,
  sendConsultationMessage,
  sendMockSpecialistMessage,
  rateSpecialist,
  getProducts,
  getProductDetails,
  submitProductReview,
  processCheckout,
  createCheckoutPaymentOrder,
  verifyCheckoutPayment,
  createConsultationPaymentOrder,
  verifyConsultationPayment,
  getOrders,
  getOrderDetails,
  cancelOrder,
  requestOrderReturn,
  getPayments,
  getWeather,
  getKnowledgeCenter,
  getCustomerDashboardSummary,
  getNotifications,
  markNotificationsAsRead
} from '../controllers/customerController';

const router = Router();

// Public Marketplace routes
router.get('/products', getProducts);
router.get('/products/:id', getProductDetails);

// Secure all customer routes with Farmer check
router.use(verifyToken);
router.use(requireRole(['FARMER']));

// Dashboard overview
router.get('/dashboard-summary', getCustomerDashboardSummary);

// Profile
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);
router.put('/change-password', changePassword);

// Farms
router.post('/farms', addFarm);
router.put('/farms/:farmId', updateFarm);
router.delete('/farms/:farmId', deleteFarm);

// Cart & Wishlist
router.get('/cart', getCart);
router.post('/cart', addToCart);
router.delete('/cart/:productId', removeFromCart);

router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Support Tickets
router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id', getTicketChat);
router.post('/tickets/:id/message', sendTicketMessage);
router.put('/tickets/:id/status', updateTicketStatus);

// AI Disease Detection
router.post('/disease-detection', runAIDetection);
router.get('/disease-detection/history', getDetectionHistory);

// Consultations
router.get('/consultations', getConsultations);
router.post('/consultations', requestConsultation);
router.post('/consultations/create-order', createConsultationPaymentOrder);
router.post('/consultations/verify', verifyConsultationPayment);
router.get('/consultations/:id', getConsultationDetails);
router.post('/consultations/:id/message', sendConsultationMessage);
router.post('/consultations/:id/message/mock-specialist', sendMockSpecialistMessage);
router.post('/consultations/:id/rate', rateSpecialist);

// Marketplace (Products)
router.post('/products/:id/review', submitProductReview);

// Orders & Checkout
router.post('/checkout', processCheckout);
router.post('/checkout/create-order', createCheckoutPaymentOrder);
router.post('/checkout/verify', verifyCheckoutPayment);
router.get('/orders', getOrders);
router.get('/orders/:id', getOrderDetails);
router.post('/orders/:id/cancel', cancelOrder);
router.post('/orders/:id/return', requestOrderReturn);

// Payments
router.get('/payments', getPayments);

// Weather & Advisory
router.get('/weather', getWeather);

// Knowledge Center
router.get('/knowledge-center', getKnowledgeCenter);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsAsRead);

export default router;
