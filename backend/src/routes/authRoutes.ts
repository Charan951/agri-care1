import { Router } from 'express';
import { register, login, logout, getMe, forgotPassword, resetPasswordWithOtp, googleLogin, googleRegister } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOtp);
router.post('/google', googleLogin);
router.post('/google/register', googleRegister);

export default router;
