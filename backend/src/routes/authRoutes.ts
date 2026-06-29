import { Router } from 'express';
import { register, login, logout, getMe, forgotPassword, resetPasswordWithOtp } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOtp);

export default router;
