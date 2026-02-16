const express = require('express').default || require('express');
const router = express.Router();


const { protect} = require('../middleware/auth');

const {getEmployeedashboard, getTasks, getProfile, updateTask, applyLeave, getAppliedLeave, getMyTickets, changePassword, updateSecurityKey} = require("../controllers/employeeController.js");
const { createTicket } = require('../controllers/supportTicketController.js');
router.use(protect);

router.get("/dashboard" , getEmployeedashboard);


router.get("/tasks" , getTasks);

router.post("/tasks" , updateTask);

router.route("/support/tickets")
.get(getMyTickets)
.post(createTicket);

router.get("/me" , getProfile);

router.post("/change-password", changePassword);

router.put("/update-security-key", updateSecurityKey);

router.route("/apply-leave")
.get(getAppliedLeave)
.post(applyLeave);



module.exports = router;