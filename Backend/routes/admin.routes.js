const express = require('express').default || require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require("../config/cloudConfig.js");
const upload = multer({ storage });
const {
    getDashboardstats,
    getAllEmployees,
    createEmployee,
    getEmployeebyId,
    updateEmployee,
    deleteEmployee,
    getAlldepartments,
    createDepartment,
    getleavesDetail,
    getEmployeesSalary,
    addTask,
    deleteTask,
    updateTaskByAdmin,
    updateSalary,
    runPayroll,
    leaveAction,
    deleteLeave,
    sentEmail,
    getDepartmentTasks,
    payIndividual,
    deleteDepartment,
    updateDepartment,
    assignDepartmentToEmployee,
    updateProfile,
    getAllEmployeesByDepartement,
    getCurrentMonthPaidEmployees,
    getPaidEmployeesByDateRange,
    getAllAdmins,
    updateAdminStatus,
    getAllEmployeesDuePayment,
    employeePromotion,
    updateEmployeesPermantentSalary,
    employeePayRollById,
    employeeFilterPayRoll,
    bulkHiring,
    getDepartmentHeadEmployees
} = require("../controllers/adminController.js");

const { downloadInvoice } = require("../controllers/downloadInvoice");


const { protect, authorize } = require('../middleware/auth');
const { getAdminTickets, deleteEmployeeTicket, deleteDepartmentHeadTicket, updateTicket, updateTicketStatus, forwardToAdmin, getDepartmentHeadQueries, getMyQueriesForDepartmentHead, getDepartmentEmployeesTickets } = require('../controllers/supportTicketController.js');
const { ActivatePaymentMode, UpdateBankDetails } = require("../controllers/paymentController.js");
const { getRecentActivities } = require('../controllers/activityController.js');
const { 
  getProjectsByDepartmentHead, 
  createProject, 
  getProjectById, 
  updateProject, 
  archiveProject, 
  unarchiveProject,
  deleteProject,
  assignDepartmentToHead 
} = require("../controllers/projectController.js");
const {
  getProjectUpdates,
  getProjectLatestUpdates,
  toggleUpdateLike,
  replyToUpdate
} = require("../controllers/projectUpdateController.js");
// middleware
router.use(protect);

const uploadFile = multer({ dest: "uploads/" });

// Admin AUTHORIZED AREA ROUTES

// Dashboard routes
router.get("/dashboard/stats", getDashboardstats);
router.get("/recent-activities", getRecentActivities);


// router.get("/tickets", getAdminTickets);
// router.patch("/support-tickets/:id/mark-read", updateTicket);
// router.patch("/support-tickets/:id/status", updateTicketStatus);

// // fowarded to admin 
// router.put(
//     "/tickets/:id/forward-to-admin", forwardToAdmin );


// updated routes of support tickets
router.get("/tickets", getAdminTickets);
router.get("/tickets/department-head-queries", getDepartmentHeadQueries);
router.get("/tickets/my-queries", getMyQueriesForDepartmentHead);
router.get("/tickets/department-employees", getDepartmentEmployeesTickets);
router.patch("/support-tickets/:id/update", updateTicket);
router.patch("/support-tickets/:id/status", updateTicketStatus);
router.put("/tickets/:id/forward-to-admin", forwardToAdmin);

// delete employee ticket by admin
router.delete("/support-tickets/:id", deleteEmployeeTicket);

// delete department head ticket by admin
router.delete("/support-tickets/department-head/:id", deleteDepartmentHeadTicket);




// Employee management routes
router.route("/employees")
    .get(getAllEmployees)
    .post(upload.single('profilePhoto'), createEmployee);



// after registraion (after adding employee)
router.post("/employees/sent-email", sentEmail);


// profile -> edit profile -> delete employee routes
router.route("/employee/:id")
    .get(getEmployeebyId)
    .put(upload.single('profilePhoto'), updateEmployee)
    .delete(deleteEmployee);

// Assign department to employee
router.patch("/employee/:id/assign-department", assignDepartmentToEmployee);

router.route("/employees/bydepartment").get(getAllEmployeesByDepartement)


// tasks , based on Head and Admin
router.get("/employees/tasks", getDepartmentTasks);


// task adding to employee (Department head Authorized routes)
router.post("/employee/:id/addtask", addTask);

// task deletion (Admin/Department Head)
router.delete("/tasks/:taskId", deleteTask);
router.patch("/tasks/:taskId", updateTaskByAdmin);





// getting all employees salary  , updating salary
router.route("/employees/salary")
    .get(getEmployeesSalary)
    .post(updateSalary);


// secureDashboard routes
router.post("/employees/salary/run-payroll", runPayroll);
router.post('/salary/pay-individual/:salaryId', payIndividual);

// router.get("/employees/salary" ,getEmployeesSalary);
// router.post("/employees/salary/" , updateSalary);


// delete leave - MUST come before /employees/leaves to avoid route conflicts
router.route("/employees/leaves/:leaveId")
    .delete(deleteLeave);

// leaves detail and actions
router.route("/employees/leaves")
    .get(getleavesDetail)
    .post(leaveAction);


// bank secure activity (access with payment keyWord)
router.route("/employees/salary/paymentmode")
    .post(ActivatePaymentMode)
    .put(UpdateBankDetails);



// Department management routes 
router.route("/departments")
    .get(getAlldepartments)
    .post(createDepartment);


router.route("/departments/:id")
    .put(updateDepartment)
    .delete(deleteDepartment);

    
// Project management routes (Department Head Projects)
router.route("/projects")
    .get(getProjectsByDepartmentHead)
    .post(createProject);

router.route("/projects/:id")
    .get(getProjectById)
    .put(updateProject)
    .delete(deleteProject);

router.patch("/projects/:id/archive", archiveProject);

router.patch("/projects/:id/unarchive", unarchiveProject);

// Project Updates routes
router.get("/projects/:projectId/updates", getProjectUpdates);

router.get("/projects/:projectId/updates/latest", getProjectLatestUpdates);

router.post("/projects/updates/:updateId/like", toggleUpdateLike);

router.post("/projects/updates/:updateId/reply", replyToUpdate);

router.post("/assign-department", assignDepartmentToHead);


router.route("/me")
    .put(upload.single('profilePhoto'), updateProfile);

router.route("/employees/salary/history").get(getCurrentMonthPaidEmployees);
router.route("/employees/salary/customHistory").get(getPaidEmployeesByDateRange)
router.route("/employees/salary/invoice/:salaryId").get(downloadInvoice);
router.route("/employees/salary/allDue").get(getAllEmployeesDuePayment);
router.route("/employees/promotion").put(employeePromotion);
router.route("/employees/permententSalaryUpdate").patch(updateEmployeesPermantentSalary);
// router.route("/employees/id/payroll").get(employeePayRollById);
router.route("/employees/id/filter").post(employeeFilterPayRoll);
router.route("/bulkHiring").post(uploadFile.single("file"), bulkHiring)

// Admin management routes
router.get("/admins", getAllAdmins);
router.patch("/admins/:id/status", updateAdminStatus);
router.get("/head/employess", protect, authorize('Department Head'), getDepartmentHeadEmployees);

module.exports = router;