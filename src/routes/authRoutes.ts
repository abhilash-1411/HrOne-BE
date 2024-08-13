import { Router } from 'express';
import { register, login, forgotPassword,checkStatus,checkAttendance,getAllUsers,getUserById,uploadProfilePicture,checkLeaveBalance} from '../controllers/authController';


const router = Router();
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.get('/', checkStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/check-attendance', checkAttendance);
router.post('/check-leave-balance', checkLeaveBalance); 

export default router;
