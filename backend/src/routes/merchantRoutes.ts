import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware';
import {
  getMerchantDashboardStats,
  updateStoreProfile,
  getMerchantCustomers,
  updateCustomerNotes
} from '../controllers/userController';
import {
  getMerchantProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  getInventoryLogs,
  adjustStock,
  bulkUpdateInventory,
  getReviews,
  replyToReview,
  reportReview,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
} from '../controllers/productController';
import {
  getMerchantOrders,
  updateOrderStatus,
  updateOrderTracking
} from '../controllers/orderController';
import { getSettlements } from '../controllers/paymentController';
import {
  getMerchantNotifications,
  markNotificationRead
} from '../controllers/notificationController';
import {
  getMerchantTickets,
  createMerchantTicket,
  sendMerchantTicketMessage
} from '../controllers/ticketController';

const router = Router();

// Require token verification for all merchant routes
router.use(verifyToken);
router.use(requireRole(['MERCHANT']));

// 1. Dashboard Overview Stats
router.get('/dashboard-stats', getMerchantDashboardStats);

// 2. Store Management Details
router.put('/store-profile', updateStoreProfile);

// 3. Products CRUD
router.get('/products', getMerchantProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/:id/duplicate', duplicateProduct);

// 4. Inventory Tracking Logs
router.get('/inventory/logs', getInventoryLogs);
router.post('/inventory/adjust', adjustStock);
router.post('/inventory/bulk-update', bulkUpdateInventory);

// 5. Order Fulfillment processing
router.get('/orders', getMerchantOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:id/tracking', updateOrderTracking);

// 6. Customer CRM notes
router.get('/customers', getMerchantCustomers);
router.post('/customers/:id/notes', updateCustomerNotes);

// 7. Reviews and Feedbacks
router.get('/reviews', getReviews);
router.post('/reviews/:productId/:reviewId/reply', replyToReview);
router.post('/reviews/:productId/:reviewId/report', reportReview);

// 8. Offers & Promotions
router.get('/offers', getOffers);
router.post('/offers', createOffer);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);

// 9. Payouts and Settlements
router.get('/settlements', getSettlements);

// 10. Notifications
router.get('/notifications', getMerchantNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// 11. Help & Support tickets
router.get('/tickets', getMerchantTickets);
router.post('/tickets', createMerchantTicket);
router.post('/tickets/:id/message', sendMerchantTicketMessage);

export default router;
