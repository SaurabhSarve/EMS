const express = require('express').default || require('express');
const router = express.Router();
const multer  = require('multer');
const{storage} = require("../config/cloudConfig.js");
const upload = multer({storage});
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
    updateSalary,
    runPayroll,
    leaveAction,
    sentEmail,
    getDepartmentTasks,
    payIndividual,
    deleteDepartment,
    updateDepartment,
    updateProfile,
    getAllEmployeesByDepartement,
    getCurrentMonthPaidEmployees,
    getPaidEmployeesByDateRange,
    getAllEmployeesDuePayment
} = require("../controllers/adminController.js");

const {downloadInvoice} = require("../controllers/downloadInvoice");

const { protect} = require('../middleware/auth');
const { getAdminTickets, updateTicket, updateTicketStatus } = require('../controllers/supportTicketController.js');
const {ActivatePaymentMode ,  UpdateBankDetails} = require("../controllers/paymentController.js");
const { getRecentActivities } = require('../controllers/activityController.js');
// middleware
router.use(protect);

// Admin AUTHORIZED AREA ROUTES

// Dashboard routes
router.get("/dashboard/stats" , getDashboardstats);
router.get("/recent-activities" , getRecentActivities);
router.get("/tickets" ,getAdminTickets);
router.patch("/support-tickets/:id/mark-read",updateTicket);
router.patch("/support-tickets/:id/status", updateTicketStatus);


// Employee management routes
router.route("/employees")
.get(getAllEmployees)
.post(upload.single('profilePhoto') , createEmployee);



// after registraion (after adding employee)
router.post("/employees/sent-email" , sentEmail );


// profile -> edit profile -> delete employee routes
router.route("/employee/:id")
.get(getEmployeebyId)
.put(upload.single('profilePhoto'),updateEmployee)
.delete(deleteEmployee);

router.route("/employees/bydepartment").get(getAllEmployeesByDepartement)


// tasks , based on Head and Admin
router.get("/employees/tasks" , getDepartmentTasks);


// task adding to employee (Department head Authorized routes)
router.post("/employee/:id/addtask", addTask);

// task deletion (Admin/Department Head)
router.delete("/tasks/:taskId", deleteTask);





// getting all employees salary  , updating salary
router.route("/employees/salary")
.get(getEmployeesSalary)
.post(updateSalary);


// secureDashboard routes
router.post("/employees/salary/run-payroll" , runPayroll);
router.post('/salary/pay-individual/:salaryId',payIndividual);

// router.get("/employees/salary" ,getEmployeesSalary);
// router.post("/employees/salary/" , updateSalary);


// leaves detail 
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


router.route("/me")
.put(upload.single('profilePhoto'),updateProfile);

router.route("/employees/salary/history").get(getCurrentMonthPaidEmployees);
router.route("/employees/salary/customHistory").get(getPaidEmployeesByDateRange)
router.route("/employees/salary/invoice/:salaryId").get(downloadInvoice);
router.route("/employees/salary/allDue").get(getAllEmployeesDuePayment)

module.exports = router;