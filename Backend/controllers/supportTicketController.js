
const User = require('../models/user.js');
const SupportTicket = require('../models/supportTicket.js');
const Department = require('../models/Department.js');

// Create a new support ticket
// POST /api/support-tickets
// Employee
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;

    if (!subject || !category || !priority || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let assignedTo = null;
    let forwardedToAdmin = false;

    // EMPLOYEE FLOW
    if (user.role === "Employee") {
      if (!user.department) {
        return res.status(400).json({ message: "No department assigned" });
      }

      const dept = await Department.findById(user.department);
      assignedTo = dept?.manager || null;
    }

    // DEPARTMENT HEAD FLOW
    if (user.role === "Department Head") {
      forwardedToAdmin = true;
    }

    // Normalize role for raisedByRole enum (model expects 'Employee' not 'employee')
    const normalizedRole = user.role === 'employee' ? 'Employee' : user.role;

    const ticket = await SupportTicket.create({
      employee: user._id,
      raisedByRole: normalizedRole,
      subject,
      category,
      priority,
      description,
      assignedTo,
      forwardedToAdmin,
    });

    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (err) {
    console.error("Create Ticket Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// get tickets 
const getTickets = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "Employee") {
      query.employee = req.user._id;
    }

    if (req.user.role === "Department Head") {
      query = {
        $or: [
          { assignedTo: req.user._id },
          { raisedByRole: "Department Head", employee: req.user._id },
        ],
      };
    }

    if (req.user.role === "Admin") {
      query.forwardedToAdmin = true;
    }

    const tickets = await SupportTicket.find(query)
      .populate("employee", "firstName lastName")
      .populate("assignedTo", "firstName lastName")
      .populate("comments")
      .sort({ createdAt: -1 });

    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  };
};


// Get all tickets for admin/department head
// IMPORTANT: Department Heads should only see tickets from employees CURRENTLY in their department
// This prevents department heads from seeing tickets after they are reassigned to a new department
const getAdminTickets = async (req, res) => {
  try {
    const adminId = req.user.id;
    let query = {};

    if (req.user.role === "Department Head") {
      // Get the department - first try user's department field, then look for department where user is manager
      let departmentId = req.user.department;

      if (!departmentId) {
        const dept = await Department.findOne({ manager: adminId });
        if (dept) {
          departmentId = dept._id;
        }
      }

      if (!departmentId) {
        return res.status(400).json({ message: "Department not assigned" });
      }

      // Only get employees CURRENTLY in this department
      // This ensures that when a department head is moved to a new department,
      // they can no longer see tickets from employees in their old department
      const employees = await User.find({ department: departmentId, role: "Employee" }).select('_id');
      const employeeIds = employees.map(emp => emp._id);

      if (employeeIds.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          unreadCount: 0,
          tickets: [],
          message: "No employees found in your department"
        });
      }

      query = {
        raisedByRole: "Employee",
        employee: { $in: employeeIds }
      };
    }

    const tickets = await SupportTicket.find(query)
      .populate("employee", "firstName lastName profilePhoto employeeId personalEmail department")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 });

    console.log(tickets);

    res.status(200).json({
      success: true,
      count: tickets.length,
      unreadCount: tickets.filter(t => !t.isReadByAdmin).length,
      tickets: tickets
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
};


const updateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { isReadByAdmin: true },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// const updateTicketStatus = async (req, res) => {
//     try {
//         const { status, comment } = req.body;

//         const allowed = ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
//         if (!allowed.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid status value',
//             });
//         }

//         const ticket = await SupportTicket.findById(req.params.id);

//         if (!ticket) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Ticket not found',
//             });
//         }

//         // Status update
//         ticket.status = status;

//         if (comment && comment.trim()) {
//             let roleForComment = "Admin";
//             if (req.user.role === "department_head") {
//                 roleForComment = "Department Head";
//             }

//             ticket.comments.push({
//                 message: comment,
//                 commentedBy: req.user._id,
//                 role: roleForComment,
//                 statusAtThatTime: status,
//             });
//             // employee ke liye unread
//             ticket.isReadByEmployee = false;
//         }

//         await ticket.save();

//         await ticket.populate('employee', 'firstName lastName email employeeId');
//         await ticket.populate('assignedTo', 'firstName lastName email');

//         return res.status(200).json({
//             success: true,
//             ticket,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

const updateTicketStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;

    if (comment?.trim()) {
      ticket.comments.push({
        message: comment,
        commentedBy: req.user._id,
        role: req.user.role,
        statusAtThatTime: status,
      });
      ticket.isReadByEmployee = false;
    }

    await ticket.save();

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  };
};


// // Get employee's own tickets
// exports.getMyTickets = async (req, res) => {
//     try {
//         const tickets = await SupportTicket.find({ 
//             employeeId: req.user._id 
//         })
//         .populate('assignedTo', 'firstName lastName email')
//         .populate('department', 'departmentName')
//         .sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             count: tickets.length,
//             tickets
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching tickets',
//             error: error.message
//         });
//     }
// };



// // Get single ticket details
// exports.getTicketById = async (req, res) => {
//     try {
//         const ticket = await SupportTicket.findById(req.params.id)
//             .populate('employeeId', 'firstName lastName email employeeId profilePhoto')
//             .populate('assignedTo', 'firstName lastName email')
//             .populate('department', 'departmentName')
//             .populate('respondedBy', 'firstName lastName')
//             .populate('comments.commentedBy', 'firstName lastName role');

//         if (!ticket) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Ticket not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             ticket
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching ticket',
//             error: error.message
//         });
//     }
// };

// forwaredd to admin 

// const forwardToAdmin = async (req, res) => {
//     try {
//         const ticketId = req.params.id;

//         const ticket = await SupportTicket.findById(ticketId);

//         if (!ticket) {
//             return res.status(404).json({ message: "Ticket not found" });
//         }

//         //  MAIN FIX
//         ticket.forwardedToAdmin = true;

//         await ticket.save(); // ❗ REQUIRED

//         res.status(200).json({
//             success: true,
//             ticket,
//             message: "Ticket forwarded to admin successfully",
//         });
//     } catch (error) {
//         console.error("Forward error:", error);
//         res.status(500).json({ message: "Forwarding failed" });
//     }
// };


const forwardToAdmin = async (req, res) => {
  try {
    if (req.user.role !== "Department Head") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.forwardedToAdmin = true;
    await ticket.save();

    res.json({ success: true, message: "Forwarded to admin" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  };
};

// Get queries raised by the logged-in Department Head
const getMyQueriesForDepartmentHead = async (req, res) => {
  try {
    if (req.user.role !== "Department Head") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const query = {
      raisedByRole: "Department Head",
      employee: req.user._id,
    };

    const tickets = await SupportTicket.find(query)
      .populate("employee", "firstName lastName profilePhoto employeeId personalEmail department")
      .populate("assignedTo", "firstName lastName email")
      .populate("comments")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      unreadCount: tickets.filter(t => !t.isReadByAdmin).length,
      tickets: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your queries',
      error: error.message
    });
  }
};

// Get all queries raised by Department Heads (for Admin)
const getDepartmentHeadQueries = async (req, res) => {
  try {
    const query = { raisedByRole: "Department Head" };

    const tickets = await SupportTicket.find(query)
      .populate("employee", "firstName lastName profilePhoto employeeId personalEmail department")
      .populate("assignedTo", "firstName lastName email")
      .populate("comments")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      unreadCount: tickets.filter(t => !t.isReadByAdmin).length,
      tickets: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department head queries',
      error: error.message
    });
  }
};

// Get tickets raised by employees in the department (for Department Head)
// This endpoint ensures department heads can only see tickets from employees CURRENTLY in their department
// When a department head is reassigned to a new department, they lose access to tickets from employees in their old department
const getDepartmentEmployeesTickets = async (req, res) => {
  try {
    const dept = await Department.findOne({ manager: req.user._id });
    console.log("Department Found:", dept);

    if (req.user.role !== "Department Head") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    console.log("REQ USER:", req.user);

    // Get the department - first try user's department field, then look for department where user is manager
    let departmentId = req.user.department;

    if (!departmentId) {
      // Find department where this user is the manager
      const dept = await Department.findOne({ manager: req.user._id });
      if (dept) {
        departmentId = dept._id;
      }
    }

    if (!departmentId) {
      return res.status(400).json({ message: "Department not assigned" });
    }

    // CRITICAL: Only get employees CURRENTLY in this department
    // This ensures that when a department head is moved to a new department,
    // they can no longer see tickets from employees in their old department
    const employees = await User.find({ department: departmentId, role: { $regex: /^employee$/i } }).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // If no employees in current department, return empty array
    if (employeeIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        unreadCount: 0,
        tickets: [],
        message: "No employees found in your department"
      });
    }

    const query = {
      raisedByRole: "Employee",
      employee: { $in: employeeIds }
    };

    const tickets = await SupportTicket.find(query)
      .populate("employee", "firstName lastName profilePhoto employeeId personalEmail department")
      .populate("assignedTo", "firstName lastName email")
      .populate("comments")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      unreadCount: tickets.filter(t => !t.isReadByAdmin).length,
      tickets: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department employee tickets',
      error: error.message
    });
  }
};

// Delete a employee query ticket from head and admin side 

const deleteEmployeeTicket = async (req, res) => {
  try {
    // Role guard
    if (!["Department Head", "Admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Optional: Admin sirf forwarded ticket delete kare
    // if (req.user.role === "Admin" && !ticket.forwardedToAdmin) {
    //   return res.status(403).json({
    //     message: "Admin can delete only forwarded tickets",
    //   });
    // }

    await ticket.deleteOne();

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete Department head ticket from admin side

const deleteDepartmentHeadTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
      ticketId: id,
    });
  } catch (error) {
    console.error("DELETE TICKET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  createTicket,
  getAdminTickets,
  updateTicket,
  getTickets,
  updateTicketStatus,
  forwardToAdmin,
  getDepartmentHeadQueries,
  getMyQueriesForDepartmentHead,
  getDepartmentEmployeesTickets,
  deleteEmployeeTicket,
  deleteDepartmentHeadTicket,
  
}
