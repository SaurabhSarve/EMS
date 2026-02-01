const express = require('express').default || require('express');
const router = express.Router();

const authRoutes = require("./auth.routes.js");
const adminRoutes = require("./admin.routes.js");
const employeeRoutes = require("./employee.routes.js");


router.use('/auth' , authRoutes);
router.use('/admin' , adminRoutes);
router.use('/employee' , employeeRoutes);

module.exports = router;