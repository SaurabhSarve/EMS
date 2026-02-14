const mongoose = require("mongoose");

// Comment Schema for ticket updates and communication
const commentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Department Head", "Admin"],
      required: true,
    },
    statusAtThatTime: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed", "Reopened"],
      required: true,
    },
  },
  { timestamps: true }
);

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema(
  {
    
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    raisedByRole: {
      type: String,
      enum: ["Employee", "Department Head"],
      default: "Employee",
      required: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      // ❗ NO ENUM (Frontend controls it)
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      required: true,
    },

    impact: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: false, // Only for Dept Head queries
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Dept Head / Admin
    },

    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed", "Reopened"],
      default: "Open",
    },

    forwardedToAdmin: {
      type: Boolean,
      default: false,
    },

    isReadByAdmin: {
      type: Boolean,
      default: false,
    },

    isReadByEmployee: {
      type: Boolean,
      default: true,
    },

    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);

// const commentSchema = new mongoose.Schema(
//     {
//         message: {
//             type: String,
//             required: true,
//             trim: true,
//         },
//         commentedBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         role: {
//             type: String,
//             enum: ["Department Head", "Admin"],
//             required: true,
//         },
//         statusAtThatTime: {
//             type: String,
//             enum: ["Open", "In Progress", "Resolved", "Closed", "Reopened"],
//             required: true,
//         },
//     },
//     { timestamps: true }
// );


// const supportTicketSchema = new mongoose.Schema({
//     // Employee who raised the ticket
//     employee: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },

//     // raised by 
//     raisedByRole: {
//         type: String,
//         enum: ['Employee', 'Department Head'],
//         required: true,
//         default: 'Employee'
//     },

//     // Ticket details
//     subject: {
//         type: String,
//         required: [true, 'Subject is required'],
//         trim: true,
//         // required: true,
//         maxlength: [200, 'Subject cannot exceed 200 characters']
//     },

//     category: {
//         type: String,
//         required: [true, 'Category is required'],
//         // enum: [
//         //     'Technical issue',
//         //     'Payroll & Compensation',
//         //     'Benefits',
//         //     'Access Control',
//         //     'HR Policy Inquiry',
//         //     'Equipment/Resources',
//         //     'Training',
//         //     'Policy Clarification',
//         //     'Other'
//         // ]
//     },

//     priority: {
//         type: String,
//         required: [true, 'Priority level is required'],
//         enum: ['Low', 'Medium', 'High', 'Urgent'],
//         default: 'Medium'
//     },

//     description: {
//         type: String,
//         required: [true, 'Description is required'],
//         trim: true,
//         maxlength: [2000, 'Description cannot exceed 2000 characters']
//     },

//     // // Department and Admin assignment
//     // department: {
//     //     type: mongoose.Schema.Types.ObjectId,
//     //     ref: 'Department',
//     //     required: true
//     // },

//     assignedTo: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',  // Department head/admin
//         required: false
//     },

//     // Ticket status
//     status: {
//         type: String,
//         enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
//         default: 'Open'
//     },

//     isReadByAdmin: {
//         type: Boolean,
//         default: false
//     },

//     isReadByEmployee: {
//         type: Boolean,
//         default: true
//     },

//     forwardedToAdmin: {
//         type: Boolean,
//         default: false,
//     },

//     comments: [commentSchema],

// }, {
//     timestamps: true
// });

// // Index for faster queries
// supportTicketSchema.index({ employeeId: 1, status: 1 });
// supportTicketSchema.index({ assignedTo: 1});
// // supportTicketSchema.index({ department: 1 });

// // Pre-save middleware to set department and assignedTo
// supportTicketSchema.pre('save', async function(next) {
//     if (this.isNew) {
//         try {
//             // Get employee details with department
//             const employee = await mongoose.model('User')
//                 .findById(this.employeeId)
//                 .populate('department');

//             if (!employee || !employee.department) {
//                 throw new Error('Employee department not found');
//             }

//             // Set department
//             // this.department = employee.department._id;

//             // Get department head (admin of this department)
//             const Department = mongoose.model('Department');
//             const department = await Department.findById(employee.department._id);

//             if (!department || !department.departmentHead) {
//                 throw new Error('Department head not found');
//             }

//             // Assign ticket to department head
//             this.assignedTo = department.manager;

//         } catch (error) {
//             return next(error);
//         }
//     }
//     next();
// });

// const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

// module.exports = SupportTicket;