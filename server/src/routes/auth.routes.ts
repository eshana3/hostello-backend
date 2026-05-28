import { Router } from 'express';
import { sendOTPHandler, verifyOTPHandler, getMe, logout, updateProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';

const router = Router();
router.post('/send-otp', sendOTPHandler);
router.post('/verify-otp', verifyOTPHandler);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router;
