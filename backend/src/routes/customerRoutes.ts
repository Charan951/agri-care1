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
  getCustomerDashboardSummary
} from '../controllers/userController';
import {
  getFarmerTickets,
  createTicket,
  getTicketChat,
  sendFarmerTicketMessage,
  updateTicketStatus
} from '../controllers/ticketController';
import {
  runAIDetection,
  getDetectionHistory,
  getWeather,
  getKnowledgeCenter
} from '../controllers/reportController';
import {
  getFarmerConsultations,
  requestConsultation,
  getConsultationDetails,
  sendConsultationMessage,
  sendMockSpecialistMessage,
  rateSpecialist
} from '../controllers/consultationController';
import {
  getProducts,
  getProductDetails,
  submitProductReview
} from '../controllers/productController';
import {
  processCheckout,
  getFarmerOrders,
  getOrderDetails,
  cancelOrder,
  requestOrderReturn
} from '../controllers/orderController';
import {
  createCheckoutPaymentOrder,
  verifyCheckoutPayment,
  createConsultationPaymentOrder,
  verifyConsultationPayment,
  getFarmerPayments
} from '../controllers/paymentController';
import {
  getFarmerNotifications,
  markNotificationsAsRead
} from '../controllers/notificationController';

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
router.get('/tickets', getFarmerTickets);
router.post('/tickets', createTicket);
router.get('/tickets/:id', getTicketChat);
router.post('/tickets/:id/message', sendFarmerTicketMessage);
router.put('/tickets/:id/status', updateTicketStatus);

// AI Disease Detection
router.post('/disease-detection', runAIDetection);
router.get('/disease-detection/history', getDetectionHistory);

// Consultations
router.get('/consultations', getFarmerConsultations);
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
router.get('/orders', getFarmerOrders);
router.get('/orders/:id', getOrderDetails);
router.post('/orders/:id/cancel', cancelOrder);
router.post('/orders/:id/return', requestOrderReturn);

// Payments
router.get('/payments', getFarmerPayments);

// Weather & Advisory
router.get('/weather', getWeather);

// Knowledge Center
router.get('/knowledge-center', getKnowledgeCenter);

// Notifications
router.get('/notifications', getFarmerNotifications);
router.put('/notifications/read', markNotificationsAsRead);

export default router;
