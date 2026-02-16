
const User = require('../models/user.js');
const SupportTicket = require('../models/supportTicket.js');
const Department = require('../models/Department.js');

// @desc    Create a new support ticket
// @route   POST /api/support-tickets
// @access  Employee
const createTicket = async (req, res) => {
    try {
        const { subject, category, priority, description } = req.body;
        console.log("=== CREATE TICKET DEBUG ===");
        console.log("Request Body:", req.body);
        console.log("User from middleware:", req.user);

        // Validation: Check required fields
        if (!subject || !category || !priority || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: ['subject', 'category', 'priority', 'description']
            });
        }

        // Get employee ID from authenticated user
        const employeeId = req.user._id || req.user.id;
        console.log("Employee ID:", employeeId);

        // Verify the user exists and is an employee
        const employee = await User.findById(employeeId);
        console.log("Employee found:", employee);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        if (employee.role !== 'employee') {
            return res.status(403).json({
                success: false,
                message: 'Only employees can create support tickets',
                currentRole: employee.role
            });
        }

        // Check if employee has a department
        if (!employee.department) {
            return res.status(400).json({
                success: false,
                message: 'Employee is not assigned to any department'
            });
        }

        // Get department details
        const department = await Department.findById(employee.department);
        console.log("Department found:", department);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Check if department has a manager
        if (!department.manager) {
            console.log("Department has no manager - creating ticket without assignment");
        }

        // Create ticket with assigned manager
        const ticket = await SupportTicket.create({
            employee: employeeId,
            subject,
            category,
            priority,
            description,
            assignedTo: department.manager || null,
            status: 'Open'
        });

        console.log("Ticket created:", ticket);

        // Populate fields for response
        await ticket.populate([
            { path: 'employee', select: 'firstName lastName email employeeId' },
            { path: 'assignedTo', select: 'firstName lastName email' }
        ]);

        console.log("Ticket after populate:", ticket);

        // Create notification for department head
        try {
            console.log("Ticket assigned to department manager");
        } catch (notifError) {
            console.error("Error creating notification:", notifError);
            // Continue even if notification fails
        }

        return res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            ticket
        });

    } catch (error) {
        console.error("=== CREATE TICKET ERROR ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Handle specific errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format',
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error creating support ticket',
            error: error.message
        });
    }
};


// Get all tickets for admin (department head)
const getAdminTickets = async (req, res) => {
    try {
        const adminId = req.user.id;
        let query = {};
        if (req.user.role === "Department Head") {
            query = { assignedTo: adminId };
        }

        const tickets = await SupportTicket.find(query)
            .populate("employee", "firstName lastName profilePhoto employeeId personalEmail")
            .populate("assignedTo", "firstName lastName email")
            .sort({ createdAt: -1 });

        // const id = tickets[0].employee;
        // console.log(id);
        //        const employee = await User.findById(id);
        //        console.log(employee);

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

const updateTicketStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;

        const allowed = ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value',
            });
        }

        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found',
            });
        }

        // Status update
        ticket.status = status;

        if (comment && comment.trim()) {
            let roleForComment = "Admin";
            if (req.user.role === "department_head") {
                roleForComment = "Department Head";
            }

            ticket.comments.push({
                message: comment,
                commentedBy: req.user._id,
                role: roleForComment,
                statusAtThatTime: status,
            });
            // employee ke liye unread
            ticket.isReadByEmployee = false;
        }

        await ticket.save();

        await ticket.populate('employee', 'firstName lastName email employeeId');
        await ticket.populate('assignedTo', 'firstName lastName email');

        return res.status(200).json({
            success: true,
            ticket,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
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

const forwardToAdmin = async (req, res) => {
    try {
        const ticketId = req.params.id;

        const ticket = await SupportTicket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        //  MAIN FIX
        ticket.forwardedToAdmin = true;

        await ticket.save(); // ❗ REQUIRED

        res.status(200).json({
            success: true,
            ticket,
            message: "Ticket forwarded to admin successfully",
        });
    } catch (error) {
        console.error("Forward error:", error);
        res.status(500).json({ message: "Forwarding failed" });
    }
};



module.exports = {
    createTicket,
    getAdminTickets,
    updateTicket,
    updateTicketStatus,
    forwardToAdmin

}