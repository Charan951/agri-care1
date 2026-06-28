import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/authMiddleware';
import {
  getSpecialistDashboardStats,
  getAssignedConsultations,
  getConsultationDetails,
  acceptConsultation,
  rejectConsultation,
  submitDiagnosis,
  submitTreatment,
  recommendProducts,
  getMarketplaceProducts,
  sendSpecialistMessage,
  manageFollowUp,
  closeFollowUp,
  getSpecialistAnalytics,
  getSpecialistProfile,
  updateSpecialistProfile
} from '../controllers/specialistController';
import { changePassword } from '../controllers/customerController'; // reuse change password

const router = Router();

// Apply auth check on all routes below
router.use(verifyToken);
router.use(requireRole(['AGRI_SPECIALIST']));

// 1. Dashboard overview
router.get('/dashboard-stats', getSpecialistDashboardStats);

// 2. Assigned Consultations & Operations
router.get('/consultations', getAssignedConsultations);
router.get('/consultations/:id', getConsultationDetails);
// Rejection/Acceptance
router.put('/consultations/:id/accept', acceptConsultation);
router.put('/consultations/:id/reject', rejectConsultation);

// 3. Diagnosis & Treatment Recommendation CRUD
router.put('/consultations/:id/diagnosis', submitDiagnosis);
router.put('/consultations/:id/treatment', submitTreatment);

// 4. Marketplace Recommendations
router.get('/products', getMarketplaceProducts);
router.post('/consultations/:id/recommend-products', recommendProducts);

// 5. Chat Communication
router.post('/consultations/:id/message', sendSpecialistMessage);

// 6. Follow-up Management
router.post('/consultations/:id/follow-up', manageFollowUp);
router.put('/consultations/:id/follow-up/close', closeFollowUp);

// 7. Reports & Personal Analytics
router.get('/analytics', getSpecialistAnalytics);

// 8. Profile & Settings
router.get('/profile', getSpecialistProfile);
router.put('/profile', updateSpecialistProfile);
router.put('/change-password', changePassword);

export default router;
