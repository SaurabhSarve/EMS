// models/OTP.js
const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userType: {
    type: String,
    enum: ['employee', 'Admin', 'Department Head'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-delete after 10 minutes
  }
});

module.exports = mongoose.model('OTP', OTPSchema);