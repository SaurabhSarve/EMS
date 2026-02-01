const express = require('express').default || require('express');
const router = express.Router();

const {login , logout , getCurrentUser , requestPasswordReset, verifyOTP, resetPassword , register, createPassword} = require('../controllers/authController');

const {protect} = require("../middleware/auth");

router.post("/login" ,login);
router.post("/create-password" , createPassword )

router.post("/logout" , protect , logout);
router.get("/me" , protect , getCurrentUser);
router.post("/register" , register);


router.post('/forgot-password/request', requestPasswordReset);
router.post('/forgot-password/verify-otp', verifyOTP);
router.post('/forgot-password/reset', resetPassword);

module.exports = router;