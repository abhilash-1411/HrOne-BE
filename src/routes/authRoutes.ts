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
  getFeedByUserId,
  addEmployee,
  getAllNewEmployees ,
  getNewEmployeeById,
  addPost,
  getAllFeeds,
  addReferral,
  getAllReferrals,
  addCoreValue,
  getAllCoreValues,
  upsertCompanyInfo,
  getCompanyInfo,
  checkBirthdays,
  checkAnniversary
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

router.post('/add_post', addPost);
router.get('/getAll_feed',getAllFeeds)
router.get('/feeds/user/:user_id', getFeedByUserId);
router.post('/add_new_employee', addEmployee);
router.get('/new_employees', getAllNewEmployees); 
router.get('/new_employee/:id', getNewEmployeeById); 
router.post('/referral', addReferral);
router.get('/referrals', getAllReferrals);
router.post('/core-values', addCoreValue);
router.get('/core-values', getAllCoreValues);
router.post('/company-info', upsertCompanyInfo);
router.get('/company-info/:type', getCompanyInfo);
router.get('/check-birthdays', checkBirthdays);
router.get('/year-celebration', checkAnniversary);


export default router;
