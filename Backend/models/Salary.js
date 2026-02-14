const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  employeeId: {
    type: String,
    required: true
  },

  month: {
    type: String,
    required: true
  },

  year: {
    type: Number,
    required: true
  },

  baseSalary: {
    type: Number,
  },

  allowances: {
    type: Number,
    default: 0
  },

  deductions: {
    type: Number,
    default: 0
  },

  taxApply: {
    type: Number,
    default: 0
  },

  netSalary: {
    type: Number,
  },

  Status: {
    type: String,
    enum: ["processing", "paid", "due"],
    default: "due"
  }

}, { timestamps: true });


// ✅ Unique salary per employee per month per year
salarySchema.index(
  { employee: 1, month: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("Salary", salarySchema);
