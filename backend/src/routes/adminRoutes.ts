import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware';
import { getOverviewStats, getAnalyticsData } from '../controllers/adminController';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getMerchantsList,
  createMerchantRecord,
  updateMerchantRecord,
  deleteMerchantRecord
} from '../controllers/userController';
import {
  getDiseaseReports,
  createDiseaseReport,
  updateDiseaseReport,
  deleteDiseaseReport,
  getAIPredictions,
  createAIPrediction,
  updateAIPrediction,
  deleteAIPrediction
} from '../controllers/reportController';
import {
  getConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation
} from '../controllers/consultationController';
import {
  getOrdersList,
  createOrderRecord,
  updateOrderRecord,
  deleteOrderRecord
} from '../controllers/orderController';
import {
  getPaymentsList,
  createPaymentRecord,
  updatePaymentRecord,
  deletePaymentRecord
} from '../controllers/paymentController';

const router = Router();

// Apply auth check on all routes below
router.use(verifyToken);

// 1. Overview
router.get('/overview', requireRole(['ADMIN', 'SUPER_USER']), getOverviewStats);

// 2. User CRUD (Admin Only)
router.get('/users', requireRole(['ADMIN', 'SUPER_USER']), getUsers);
router.post('/users', requireRole(['ADMIN']), createUser);
router.put('/users/:id', requireRole(['ADMIN']), updateUser);
router.delete('/users/:id', requireRole(['ADMIN']), deleteUser);

// 4. Disease Report CRUD
router.get('/reports', requireRole(['ADMIN', 'SUPER_USER', 'AGRI_SPECIALIST']), getDiseaseReports);
router.post('/reports', requireRole(['ADMIN', 'SUPER_USER']), createDiseaseReport);
router.put('/reports/:id', requireRole(['ADMIN', 'SUPER_USER', 'AGRI_SPECIALIST']), updateDiseaseReport);
router.delete('/reports/:id', requireRole(['ADMIN', 'SUPER_USER']), deleteDiseaseReport);

// 5. Consultation CRUD
router.get('/consultations', requireRole(['ADMIN', 'SUPER_USER', 'AGRI_SPECIALIST']), getConsultations);
router.post('/consultations', requireRole(['ADMIN', 'SUPER_USER']), createConsultation);
router.put('/consultations/:id', requireRole(['ADMIN', 'SUPER_USER', 'AGRI_SPECIALIST']), updateConsultation);
router.delete('/consultations/:id', requireRole(['ADMIN', 'SUPER_USER']), deleteConsultation);

// 6. AI Predictions CRUD
router.get('/ai-predictions', requireRole(['ADMIN', 'SUPER_USER']), getAIPredictions);
router.post('/ai-predictions', requireRole(['ADMIN', 'SUPER_USER']), createAIPrediction);
router.put('/ai-predictions/:id', requireRole(['ADMIN', 'SUPER_USER']), updateAIPrediction);
router.delete('/ai-predictions/:id', requireRole(['ADMIN', 'SUPER_USER']), deleteAIPrediction);

// 7. Merchant CRUD (Admin Only)
router.get('/merchants', requireRole(['ADMIN', 'SUPER_USER']), getMerchantsList);
router.post('/merchants', requireRole(['ADMIN']), createMerchantRecord);
router.put('/merchants/:id', requireRole(['ADMIN']), updateMerchantRecord);
router.delete('/merchants/:id', requireRole(['ADMIN']), deleteMerchantRecord);

// 8. Order CRUD
router.get('/orders', requireRole(['ADMIN', 'SUPER_USER', 'MERCHANT']), getOrdersList);
router.post('/orders', requireRole(['ADMIN', 'MERCHANT']), createOrderRecord);
router.put('/orders/:id', requireRole(['ADMIN', 'MERCHANT']), updateOrderRecord);
router.delete('/orders/:id', requireRole(['ADMIN']), deleteOrderRecord);

// 9. Payment CRUD (Admin Only)
router.get('/payments', requireRole(['ADMIN']), getPaymentsList);
router.post('/payments', requireRole(['ADMIN']), createPaymentRecord);
router.put('/payments/:id', requireRole(['ADMIN']), updatePaymentRecord);
router.delete('/payments/:id', requireRole(['ADMIN']), deletePaymentRecord);

// 10. Analytics (Admin & Super User)
router.get('/analytics', requireRole(['ADMIN', 'SUPER_USER']), getAnalyticsData);

export default router;
