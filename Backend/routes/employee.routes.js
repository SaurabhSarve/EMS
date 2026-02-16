const express = require('express').default || require('express');
const router = express.Router();
const multer = require('multer');
const { taskAttachmentStorage, leaveDocumentStorage } = require('../config/cloudConfig');

const { protect} = require('../middleware/auth');


const {getEmployeedashboard, getTasks, getProfile, updateTask, addTaskComment, uploadTaskFile, applyLeave, getAppliedLeave, getMyTickets, changePassword, updateSecurityKey} = require("../controllers/employeeController.js");
const { createTicket } = require('../controllers/supportTicketController.js');
const { getProjectsByEmployee } = require("../controllers/projectController.js");
const { updateProjectProgress, addProjectComment } = require("../controllers/projectUpdateController.js");

const taskUpload = multer({ storage: taskAttachmentStorage });
const leaveDocumentUpload = multer({ storage: leaveDocumentStorage });

router.use(protect);

router.get("/dashboard" , getEmployeedashboard);


router.get("/tasks" , getTasks);

router.post("/tasks" , updateTask);


router.post("/tasks/:taskId/comments", addTaskComment);

router.post("/tasks/:taskId/upload", taskUpload.single('file'), uploadTaskFile);


router.route("/support/tickets")
.get(getMyTickets)
.post(createTicket);

router.get("/me" , getProfile);

router.post("/change-password", changePassword);

router.put("/update-security-key", updateSecurityKey);

router.route("/apply-leave")
.get(getAppliedLeave)
.post(leaveDocumentUpload.single('document'), applyLeave);

// Employee Projects routes
router.get("/projects", getProjectsByEmployee);

router.put("/projects/:projectId/progress", updateProjectProgress);

router.post("/projects/:projectId/comments", addProjectComment);

module.exports = router;