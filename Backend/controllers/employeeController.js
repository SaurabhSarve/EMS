const User = require("../models/user");
const Department = require("../models/Department");
const Task = require("../models/tasks.js");
const Leave = require("../models/Leave.js");
const SupportTicket = require('../models/supportTicket.js');

const logActivity = require("../utils/activityLogger.js");

const { status } = require("http-status");
const Attendance = require("../models/Attendance");
const Salary = require("../models/Salary");



const getEmployeedashboard = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const employee = await User.findById(employeeId)
      .select('firstName lastName personalEmail employeeId position department joiningDate leaveBalance')
      .populate('department', 'name code');

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Employee Not found"
      });
    }
    const salaryDetails = await Salary.find({ employee: employeeId });
    const taskDetails = await Task.find({ employee: employeeId });
    const ticketDetails = await SupportTicket.find({ employee: employeeId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        employee,
        salaryDetails,
        taskDetails,
        ticketDetails
      }
    });





  } catch (err) {
    console.log("get employee dashboard error", err);

    res.status(500).json({
      success: false,
      message: 'Error deleting employee'
    });


  }
}



const getTasks = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const taskDetails = await Task.find({ employee: employeeId });


    if (!taskDetails) {
      return res.status(400).json({
        success: false,
        message: "no tasks"
      });
    }


    return res.status(200).json({
      success: true,
      data: {
        taskDetails
      }
    });





  } catch (err) {
    console.log("get tasks error", err);

    res.status(500).json({
      success: false,
      message: 'Error getting tasks'
    });


  }
}




const updateTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    console.log(taskId);
    const taskDetails = await Task.findByIdAndUpdate(taskId, {
      status: "completed"
    });



    if (!taskDetails) {
      return res.status(400).json({
        success: false,
        message: "no tasks"
      });
    }


    return res.status(200).json({
      success: true,
      data: {
        taskDetails
      }
    });





  } catch (err) {
    console.log("updating task error", err);

    res.status(500).json({
      success: false,
      message: 'Error updating tasks'
    });


  }
}

const getProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const profile = await User.findById(id).populate("department", "name description");
    if (!profile) {
      return res.status(400).json({
        message: "no employee with this id",
        success: false
      })
    }

    return res.status(200).json({

      success: true,
      data: profile
    })

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}


const getAppliedLeave = async (req, res) => {
  try {
    const id = req.user.id;
    const employeeLeaves = await Leave.find({ employee: id }).populate("employee", "firstName employeeId");
    const leaveBalance = await User.findById(id).select("leaveBalance");

    console.log(employeeLeaves);

    return res.status(200).json({
      message: "working",
      success: true,
      data: {
        employeeLeaves,
        leaveBalance
      }
    })


  } catch (error) {
    console.error('Error fetching employees leave detail:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

const applyLeave = async (req, res) => {
  try {
    const { leaveData } = req.body;


    const appliedLeave = new Leave({

      leaveType: leaveData.leaveType,
      startDate: leaveData.fromDate,
      endDate: leaveData.toDate,
      reason: leaveData.reason,
      employee: req.user.id
    })


    const result = await appliedLeave.save();

    await logActivity('leave_request', req.user.id, {
      relatedModel: 'Leave',
      relatedId: result._id,
      metadata: {
        leaveType: result.leaveType,
        startDate: result.fromDate,
        endDate: result.toDate,
        numberOfDays: calculateDays(result.fromDate, result.toDate)
      }
    });



    return res.status(200).json({
      success: true,
      message: "leave applied succesfully"
    });





  } catch (err) {
    console.log("apply leave  error", err);

    res.status(500).json({
      success: false,
      message: 'Error applying leave'
    });


  }
}
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
};



// Employee check-in
// route   POST /api/employee/checkin
// access  Private (Employee only)

const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const now = new Date();
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // raat 12 se agle din 11:59 raaat tk
      }
    })

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    let attendance;

    if (existingAttendance) {
      existingAttendance.checkIn = now;
      attendance = await existingAttendance.save();
    } else {
      attendance = await Attendance.create({
        employee: employeeId,
        date: today,
        checkIn: now,
        status: "Working"
      })
      attendance.save(); //see later
    }

    res.status(status.OK).json({
      success: true,
      message: "checked in successfully",
      data: {
        checkIn: attendance.checkIn,
        date: attendance.date,
        status: attendance.status
      }
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({
      success: false,
      message: 'Error during check-in'
    });
  }
}

//  Employee check-in
// route   POST /api/employee/checkOut
// access  Private (Employee only)
const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const now = new Date();
    const today = new Date();


    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'You need to check in first'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    attendance.checkOut = now;
    await attendance.save();

    res.status(status.OK).json({
      message: 'checkout - succesfully',
      data: {
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        workingHours: attendance.workingHours,
        status: attendance.status
      }
    })

  } catch (err) {

    console.error('Check-out error:', eror);
    res.status(500).json({
      success: false,
      message: 'Error during check-out'
    });
  }
}

const getMyTickets = async (req, res) => {
  try {
    const employeeId = req.user._id;


    const tickets = await SupportTicket.find({ employee: employeeId })
      .populate('employee', 'name email')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 });


    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });

  } catch (err) {
    console.error('Error fetching tickets:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: err.message
    });
  }
}

// Change Password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.markModified('password');
    await user.save();

    // Log activity
    logActivity({
      userId: userId,
      action: 'Password Changed',
      details: `User ${user.firstName} ${user.lastName} changed their password`
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// Update Security Key (for Admin users)
const updateSecurityKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentKey, newKey } = req.body;

    // Validation
    if (!currentKey || !newKey) {
      return res.status(400).json({
        success: false,
        message: 'Current key and new key are required'
      });
    }

    if (newKey.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Secret key must be at least 8 characters'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update secret key'
      });
    }

    // Verify current key
    if (user.AccessKey !== currentKey) {
      return res.status(401).json({
        success: false,
        message: 'Current secret key is incorrect'
      });
    }

    // Update secret key
    user.AccessKey = newKey;
    user.markModified('AccessKey');
    await user.save();

    // Log activity
    logActivity({
      userId: userId,
      action: 'Security Key Updated',
      details: `Admin ${user.firstName} ${user.lastName} updated their security key`
    });

    res.status(200).json({
      success: true,
      message: 'Secret key updated successfully'
    });
  } catch (error) {
    console.error('Update security key error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating secret key'
    });
  }
};

module.exports = {
  getEmployeedashboard,
  getTasks,
  updateTask,
  applyLeave,
  getAppliedLeave,
  getProfile,
  getMyTickets,
  changePassword,
  updateSecurityKey

}