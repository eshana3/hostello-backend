import { Router } from 'express';
import { sendOTP, verifyOTP, refreshToken, logout } from '../controllers/auth.controller';

const router = Router();
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

export default router;
