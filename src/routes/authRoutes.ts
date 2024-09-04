import { Router } from "express";
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
  getAllNewEmployees,
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
  checkAnniversary,
  addWallOfFameEntry,
  getAllWallOfFameEntries,
  getWallOfFameEntryByUserId,
  checkPreviousDayAttendance,
  applyForLeave,
  getLeaveBalance,
  getPeopleOnLeaveToday,
  getLeaveRequests,
  allotAsset,
  getUserAssets,
  getAllAssets,
  applyRegularization,
  getAllRegularizations,
  getPendingRequests,
  getRejectedRequests,
  getApprovedRequests,
  getDraftRequests,
  getUndoRequests,
  createHelpdeskTicket,
  getAllTickets,
  getTicketsByStatus,
  createResignationRequest,
  getResignationRequests,
  createOnDutyRequest,
  getAllOnDutyRequests,
  createNotification,
  getAllNotifications,
} from "../controllers/authController";

const router = Router();

//status check
router.get("/", checkStatus);

//user
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);

//Attendance calendar
router.post("/check-attendance", checkAttendance);
router.post("/check-leave-balance", checkLeaveBalance);
router.post("/check-PreviousDayAttendance", checkPreviousDayAttendance);

//feed of home page
router.post("/add_post", addPost);
router.get("/getAll_feed", getAllFeeds);
router.get("/feeds/user/:user_id", getFeedByUserId);

//new employee to company
router.post("/add_new_employee", addEmployee);
router.get("/new_employees", getAllNewEmployees);
router.get("/new_employee/:id", getNewEmployeeById);

//referral
router.post("/referral", addReferral);
router.get("/referrals", getAllReferrals);

//corevalues
router.post("/core-values", addCoreValue);
router.get("/core-values", getAllCoreValues);

//company
router.post("/company-info", upsertCompanyInfo);
router.get("/company-info/:type", getCompanyInfo);

//event
router.get("/check-birthdays", checkBirthdays);
router.get("/year-celebration", checkAnniversary);

// Wall of Fame routes
router.post("/wall-of-fame/post", addWallOfFameEntry);
router.get("/wall-of-fame", getAllWallOfFameEntries);
router.get("/wall-of-fame/:user_id", getWallOfFameEntryByUserId);

// leave check apis
router.post("/apply-leave", applyForLeave);
router.get("/leave/requests", getLeaveRequests);
router.get("/leave/today", getPeopleOnLeaveToday);
router.get("/leave-balance", getLeaveBalance);

//Assets allocating
router.post("/asset/allot", allotAsset);
router.get("/user/:userId/assets", getUserAssets);
router.get("/assets", getAllAssets);

//Regularization
router.post("/regularlarization", applyRegularization);
router.get("/regularlarization", getAllRegularizations);

//Request
router.get("/pending-requests", getPendingRequests);
router.get("/approved-requests", getApprovedRequests);
router.get("/rejected-requests", getRejectedRequests);
router.get("/draft-requests", getDraftRequests);
router.get("/undo-requests", getUndoRequests);

//Helpdesk tickets
router.post("/tickets", createHelpdeskTicket);
router.get("/tickets", getAllTickets);
router.get("/tickets/status/:status", getTicketsByStatus);

//resignations
router.post("/resignation", createResignationRequest);
router.get("/resignation", getResignationRequests);

//on-duty req
router.post("/on-duty", createOnDutyRequest);
router.get("/on-duty", getAllOnDutyRequests);

// notifications
router.post("/create-notification", createNotification);
router.get("/notifications", getAllNotifications);

export default router;
