import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  checkStatus,
  checkAttendance,
  getAllUsers,
  getUserById,
  checkLeaveBalance,
  getFeedByUserId // Import the new controller
} from '../controllers/authController';

const router = Router();

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.get('/', checkStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/check-attendance', checkAttendance);
router.post('/check-leave-balance', checkLeaveBalance);
router.get('/feeds/user/:user_id', getFeedByUserId); // Add the new route

export default router;
