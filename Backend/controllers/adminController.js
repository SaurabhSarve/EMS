const User = require("../models/user");
const Department = require("../models/Department");
const Leave = require("../models/Leave");
const { status } = require("http-status");
const Salary = require("../models/Salary");
const Task = require("../models/tasks");
const SupportTicket = require("../models/supportTicket");
const { sendEmployeeRegistrationEmail, sendSalaryReceiptEmail } = require("../services/emailService.js");
const mongoose = require("mongoose");
// const logActivity = require("../models/Activity.js");
const logActivity = require("../utils/activityLogger.js");
const Counter = require("../models/counter");
const generateInvoiceNo = require("../utils/generateInvoiceNo.js");
const generateInvoicePDF = require("../utils/generateInvoicePDF.js");
const uploadInvoicePDF = require("../utils/uploadInvoiceToCloudinary.js");
const cron = require("node-cron");

const getDashboardstats = async (req, res, next) => {
  try {
    let Admin = await User.findOne({ _id: req.user._id });
    let totalEmployees = await User.countDocuments({ role: "employee" });
    let totalDepartments = await Department.countDocuments({ isActive: true });
    let activeEmployess = await User.countDocuments({
      role: "employee",
      isActive: true
    });


    const pendingLeaves = await Leave.countDocuments({
      status: "pending",
    });
    const departmentsManager = await Department.find({}).select("name manager").populate("manager", "firstName");



    res.status(200).json({
      success: true,
      data: {
        stats: {
          Admin,
          totalEmployees,
          activeEmployess,
          totalDepartments,
          departmentsManager,

          pendingLeaves,

        },
      }
    })


  } catch (err) {
    console.log("Dashboard data Error", err);
    res.status(500).json({
      success: "false",
      message: "error fetching dashboard details"
    })
  }
}


const createEmployee = async (req, res, next) => {
  try {
    let url = null;
    let filename = null;
    console.log(req.file);

    if (req.file) {
      url = req.file.path;
      filename = req.file.filename;
    }

    const {
      firstName,
      lastName,
      personalEmail,
      contactNumber,
      address,
      department,
      position,
      gender,
      dob,
      baseSalary,
      allowances,
      deductions,
      taxApply,
      joinningDate,
      netSalary,
      jobType = 'full-time',
      // Bank details fields
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName
    } = req.body;

    // Validation
    if (!firstName || !personalEmail || !position || !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide necessary details (firstName, personalEmail, position, department)"
      });
    }

    // Check if personal email already exists
    const existingEmail = await User.findOne({ personalEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Generate employee ID
    // const generateEmployeeId = async () => {
    //   const lastEmployee = await User.findOne(
    //     { employeeId: true }
    //   ).sort({ createdAt: -1 });

    //   let nextNum = 2025;
    //   if (lastEmployee && lastEmployee.employeeId) {
    //     const match = lastEmployee.employeeId.match(/EMP-(\d+)/);
    //     if (match && match[1]) {
    //       nextNum = parseInt(match[1]) + 1;
    //     }
    //   }
    //   return `EMP-${nextNum}`;
    // };

    const generateEmployeeId = async () => {
      const counter = await Counter.findOneAndUpdate(
        { name: "employeeId" },
        { $inc: { seq: 1 } },
        {
          new: true,
          upsert: true
        }
      );

      return `EMP-${counter.seq}`;
    };


    const employeeId = await generateEmployeeId();


    const departmentName = department;
    const departmentInfo = await Department.findOne({
      name: departmentName
    }).populate("manager", "firstName lastName");

    // Check if department exists
    if (!departmentInfo) {
      return res.status(404).json({
        success: false,
        message: `Department '${department}' not found`
      });
    }

    // Prepare bank details object (only if data is provided)
    const bankDetails = {};
    if (accountHolderName || accountNumber || ifscCode || bankName || branchName) {
      if (accountHolderName) bankDetails.accountHolderName = accountHolderName;
      if (accountNumber) bankDetails.accountNumber = accountNumber;
      if (ifscCode) bankDetails.ifscCode = ifscCode.toUpperCase();
      if (bankName) bankDetails.bankName = bankName;
      if (branchName) bankDetails.branchName = branchName;
      bankDetails.addedAt = new Date();
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    // Create employee
    const employee = new User({
      employeeId,
      firstName,
      lastName,
      personalEmail,
      contactNumber,
      address,
      department: departmentInfo._id,
      position,
      gender,
      dob,
      reportingManager: departmentInfo?.manager
        ? `${departmentInfo.manager.firstName} ${departmentInfo.manager.lastName}`
        : "NOT ALLOTED",
      joiningDate: joinningDate,
      jobType,
      baseSalary: baseSalary || 0,
      allowances: allowances || 0,
      deductions: deductions || 0,
      taxApply: taxApply || 0,
      netSalary: netSalary || 0,
      role: 'employee',
      profilePhoto: req.file ? {
        url: url,
        filename: filename
      } : null,
      isActive: true,
      // Add bank details if provided
      ...(Object.keys(bankDetails).length > 0 && { bankDetails })
    });

    const emp = await employee.save();

    const salaryDetail = new Salary({
      employee: emp._id,
      employeeId,
      month: currentMonth,
      year: currentYear,
      baseSalary,
      allowances,
      deductions,
      taxApply,
      netSalary
    });

    await salaryDetail.save();

    // Log activity
    await logActivity('employee_added', emp._id, {
      department: departmentInfo.name,
      targetUserId: employee._id,
      relatedModel: 'User',
      relatedId: employee._id,
      metadata: {
        position: position,
        department: departmentInfo.name,
        email: personalEmail
      }
    });


    const savedEmployee = await User.findById(employee._id)
      .select('employeeId firstName lastName personalEmail position')
      .populate('department', 'name');

    res.status(201).json({ // Using 201 for created
      success: true,
      message: "Employee created successfully",
      data: savedEmployee
    });

  } catch (err) {
    console.log("create employee error:", err);
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: err.message
    });
  }
};


const sentEmail = async (req, res) => {
  try {
    const { employeeId, formData } = req.body;



    const emailResult = await sendEmployeeRegistrationEmail({
      email: formData.personalEmail,
      employeeId: employeeId,
      name: `${formData.firstName} ${formData.lastName}`
    });

    res.status(201).json({
      success: true,
      message: 'Registration email sent.',
    });

  } catch (error) {
    console.error('Employee registration error email cant sent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sent email',
      error: error.message
    });
  }
}


const getEmployeebyId = async (req, res, next) => {
  try {
    // console.log(req.params);
    const employee = await User.findById(req.params.id).select("+resetPasswordToken").populate("department", "name manager code").populate("createdBy", "firstName lastName");


    if (!employee) {
      return res.status(status.NOT_FOUND).json({
        success: false,
        message: "Employee Not found"
      })
    }

    if (employee.role != "employee") {
      return res.status(status.NOT_FOUND).json({
        success: false,
        message: "User is not an Employee"
      })
    }
    const employeeTasks = await Task.find({ employee: req.params.id });
    const employeeLeave = await Leave.find({ employee: req.params.id });
    const employeeSalaries = await Salary.find({ employee: req.params.id });


    res.status(200).json({
      success: true,
      data: employee,
      tasks: employeeTasks,
      leaves: employeeLeave,
      Salaries: employeeSalaries
    })
  } catch (err) {

    console.log("get employee error", err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching employee'
    });

  }
}

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    console.log("Update Data:", updatedData);

    const {
      department,
      personalLeave,
      sickLeave,
      annualLeave,
      ...otherData
    } = updatedData;

    // Prepare update object
    const updateFields = { ...otherData };

    // Handle department update
    if (department) {
      const departmentInfo = await Department.findOne({ name: department }).populate("manager", "firstName lastName");

      if (departmentInfo) {
        updateFields.department = departmentInfo._id;
        updateFields.reportingManager = departmentInfo?.manager
          ? `${departmentInfo.manager.firstName} ${departmentInfo.manager.lastName}`
          : "NOT ALLOTED";
      }
    }

    // Handle profile photo update
    if (typeof req.file !== "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      updateFields.profilePhoto = { url, filename };
    }

    // Handle leave balance update
    if (personalLeave !== undefined || sickLeave !== undefined || annualLeave !== undefined) {
      // Get current employee to preserve existing leave balance
      const currentEmployee = await User.findById(id);

      updateFields.leaveBalance = {
        personal: personalLeave !== undefined ? parseInt(personalLeave) : (currentEmployee?.leaveBalance?.personal || 0),
        sick: sickLeave !== undefined ? parseInt(sickLeave) : (currentEmployee?.leaveBalance?.sick || 0),
        annual: annualLeave !== undefined ? parseInt(annualLeave) : (currentEmployee?.leaveBalance?.annual || 0)
      };

      console.log("Updated Leave Balance:", updateFields.leaveBalance);
    }

    // Update employee
    const employee = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('department', 'name');

    console.log("Updated Employee:", employee);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });

  } catch (err) {
    console.log("Update employee error:", err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: err.message
    });
  }
};


const updateProfile = async (req, res) => {
  try {
    console.log("Update Profile Request");
    console.log("Request Body:", req.body);
    console.log("Request File:", req.file);

    const userId = req.user._id; // Get user ID from authenticated user
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      position,
      AccessKey,
      address
    } = req.body;

    // Find the current user
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // // Verify AccessKey if provided (for security - optional)
    // if (AccessKey) {
    //   const isAccessKeyValid = await .compare(currentUser.password);

    //   if (!isAccessKeyValid) {
    //     return res.status(401).json({
    //       success: false,
    //       message: 'Invalid Access Key. Please enter correct password.'
    //     });
    //   }
    // }

    // Check if email is being changed and if it already exists
    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Prepare update object
    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (contactNumber) updateFields.contactNumber = contactNumber;
    if (position) updateFields.position = position;
    if (address) updateFields.address = address;
    if (AccessKey) updateFields.AccessKey = AccessKey;

    // Handle profile photo update
    if (typeof req.file !== "undefined") {
      const url = req.file.path;
      const filename = req.file.filename;
      updateFields.profilePhoto = { url, filename };

      console.log("Profile Photo Updated:", updateFields.profilePhoto);
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .select('-password') // Exclude password from response
      .populate('department', 'name code');

    console.log("Updated User:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (err) {
    console.error("Update profile error:", err);

    // Handle specific errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: err.message
    });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const password = req.headers['x-password'];
    const hardDelete = req.headers['x-hard-delete'];
    const status = req.headers['x-status'];


    if (hardDelete) {

      const user = req.user;
      const Admin = await User.findOne({ _id: user._id }).select("+password");
      const isPasswordValid = await Admin.comparePassword(password);


      if (isPasswordValid) {
        console.log(isPasswordValid);


        const employee = await User.findByIdAndDelete(id).populate("department", "name");
        await Salary.deleteMany({ employee: employee._id });
        await Task.deleteMany({ employee: employee._id });
        await Leave.deleteMany({ employee: employee._id });
        await SupportTicket.deleteMany({ employee: employee._id });
        await logActivity('employee_deleted', req.user._id, {
          relatedModel: 'User',
          relatedId: id,
          metadata: {
            employeeName: employee?.firstName,
            department: employee?.department?.name,
            email: employee?.personalEmail,
            deletionType: 'permanent'
          }
        });
        if (!employee) {
          return res.status(400).json({
            success: false,
            message: "Employee Not found"
          });

        }

        return res.status(200).json({
          success: true,
          message: 'Employee permanently deleted'
        });
      } else if (isPasswordValid === false) {
        return res.status(400).json({
          success: false,
          message: "Wrong password can't Delete Employee"
        });
      }


    } else {
      if (status === "active") {
        const employee = await User.findByIdAndUpdate(id, {
          status: "inactive",
          isActive: false
        });
        if (!employee) {
          return res.status(400).json({
            success: false,
            message: "Employee Not found"
          });
        }
        await logActivity('employee_updated', employee._id, {
          targetUserId: employee._id,
          relatedModel: 'User',
          relatedId: employee._id,
          metadata: {
            action: 'deactivated',
            employeeName: `${employee.firstName} ${employee.lastName}`,
            previousStatus: 'active',
            newStatus: 'inactive'
          }
        });
        return res.status(200).json({
          success: true,
          message: "Employee Account deactivated succesfully"
        })
      } else {
        const employee = await User.findByIdAndUpdate(id, {
          status: "active",
          isActive: true
        });
        if (!employee) {
          return res.status(400).json({
            success: false,
            message: "Employee Not found"
          });
        }
        await logActivity('employee_updated', employee._id, {
          targetUserId: employee._id,
          relatedModel: 'User',
          relatedId: employee._id,
          metadata: {
            action: 'activated',
            employeeName: `${employee.firstName} ${employee.lastName}`,
            previousStatus: 'inactive',
            newStatus: 'active'
          }
        });
        return res.status(200).json({
          success: true,
          message: "Employee Activated succesfully"
        })

      }



    }
  } catch (err) {
    console.log("delete employee error", err);
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting employee'
    });
  }
}


// route   GET /api/v1/admin/departments
const getAlldepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('manager', 'firstName lastname email')
      .sort({ name: 1 });
    console.log()
    res.status(status.OK).json({
      success: true,
      data: departments
    })

  } catch (err) {
    console.error('Get departments error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments'
    });
  }
}


const createDepartment = async (req, res) => {
  try {
    const { name, code, description, budget, manager } = req.body;
    console.log(req.body);

    // Validation
    if (!name || !code || !description) {
      return res.status(400).json({
        success: false,
        message: "Name, code and description are required"
      });
    }

    // If manager is provided, validate
    if (manager) {
      // Check if the user exists and is a Department Head
      const managerUser = await User.findById(manager);

      if (!managerUser) {
        return res.status(404).json({
          success: false,
          message: "Selected manager not found"
        });
      }

      // Check if user is a Department Head
      if (managerUser.role !== "Department Head" && managerUser.position !== "Department Head") {
        return res.status(400).json({
          success: false,
          message: "Selected employee is not a Department Head"
        });
      }

      // Check if this Department Head is already managing another department
      const existingDepartment = await Department.findOne({
        manager: manager,
        isActive: true
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: `This Department Head is already managing ${existingDepartment.name} department`
        });
      }
    }

    // Create department
    const department = new Department({
      name,
      code,
      description,
      manager: manager || null,
      budget: budget || 0
    });

    const departmentInfo = await department.save();

    // Populate manager details for response
    await department.populate('manager', 'firstName lastName email employeeId');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });

  } catch (err) {
    console.error('Create department error:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: err.message
    });
  }
};
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find department
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if there are employees in this department
    const employeeCount = await User.countDocuments({ department: id });
    console.log(employeeCount);
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. ${employeeCount} employee(s) are assigned to this department. Please reassign or remove employees first.`
      });
    }

    // Delete department
    await Department.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};


const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, budget, manager } = req.body;

    // Find existing department
    const existingDept = await Department.findById(id);
    if (!existingDept) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    let managerChanged = false;
    let newManagerFullName = "NOT ALLOTED";

    // If manager is being updated, validate
    if (manager && manager !== existingDept.manager?.toString()) {
      // Check if the new manager exists and is a Department Head
      const managerUser = await User.findById(manager);

      if (!managerUser) {
        return res.status(404).json({
          success: false,
          message: "Selected manager not found"
        });
      }

      // Check if user is a Department Head
      if (managerUser.role !== "Department Head" && managerUser.position !== "Department Head") {
        return res.status(400).json({
          success: false,
          message: "Selected employee is not a Department Head"
        });
      }

      // Check if this Department Head is already managing another department
      const otherDepartment = await Department.findOne({
        manager: manager,
        _id: { $ne: id },  // Exclude current department
        isActive: true
      });

      if (otherDepartment) {
        return res.status(400).json({
          success: false,
          message: `This Department Head is already managing ${otherDepartment.name} department`
        });
      }

      // Set flag and manager name
      managerChanged = true;
      newManagerFullName = `${managerUser.firstName} ${managerUser.lastName}`;
    }

    // If manager is being removed (set to null or empty)
    if (manager === null || manager === "" || manager === undefined) {
      if (existingDept.manager) {
        managerChanged = true;
        newManagerFullName = "NOT ALLOTED";
      }
    }

    // Update department
    const updateData = {
      name: name || existingDept.name,
      code: code || existingDept.code,
      description: description || existingDept.description,
      budget: budget !== undefined ? budget : existingDept.budget,
      manager: manager || null
    };

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName email employeeId');

    // Update all employees' reporting manager if manager changed
    if (managerChanged) {
      await User.updateMany(
        { department: updatedDepartment._id },
        { $set: { reportingManager: newManagerFullName } }
      );

      console.log(`Updated reporting manager to "${newManagerFullName}" for all employees in ${updatedDepartment.name}`);
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });

  } catch (err) {
    console.error('Update department error:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Department name or code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: err.message
    });
  }
};

//todo getAllEmployees 
const getAllEmployees = async (req, res) => {

  try {
    const { search, department, status, page = 1, limit = 50 } = req.query;


    const filter = {};

    // Search filter (searches in name, email, employeeId, position)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Department filter
    if (department && department !== 'all') {
      filter.department = { $regex: new RegExp(department, 'i') };
    }

    // Status filter
    if (status && status !== 'all') {
      let statusValue = status.toLowerCase();
      // Converting frontend status to backend status
      if (statusValue === 'on leave') statusValue = 'on_leave';
      filter.status = statusValue;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    filter.role = 'employee';
    const employees = await User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .populate("department", "name")
      .limit(parseInt(limit));


    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      data: employees
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

const getAllEmployeesByDepartement = async (req, res) => {
  try {
    const { search, department, status } = req.query;

    const employeeMatch = { role: "employee" };

    if (search && search.trim() !== "") {
      const searchValue = search.trim();

      employeeMatch.$or = [
        { firstName: { $regex: searchValue, $options: "i" } },
        { lastName: { $regex: searchValue, $options: "i" } },
        { personalEmail: { $regex: searchValue, $options: "i" } },
        { employeeId: { $regex: searchValue, $options: "i" } },
        { position: { $regex: searchValue, $options: "i" } }
      ];
    }

    if (status && status !== "all") {
      let statusValue = status.toLowerCase();
      if (statusValue === "on leave") statusValue = "on_leave";
      employeeMatch.status = statusValue;
    }

    const pipeline = [
      { $match: employeeMatch },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
    ];

    if (department && department !== "all") {
      pipeline.push({
        $match: {
          "department.name": { $regex: department, $options: "i" },
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $project: { __v: 0 } }
    );

    const employees = await User.aggregate(pipeline);

    let departmentHead = null;

    if (department && department !== "all") {
      const managerResult = await Department.aggregate([
        { $match: { name: { $regex: department, $options: "i" } } },
        {
          $lookup: {
            from: "users",
            localField: "manager",
            foreignField: "_id",
            as: "manager",
          },
        },
        {
          $unwind: {
            path: "$manager",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            manager: 1,
          },
        },
      ]);

      departmentHead = managerResult[0]?.manager || null;
    }

    res.status(200).json({
      success: true,
      departmentHead,
      count: employees.length,
      data: employees,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getAllEmployeesDuePayment = async (req, res) => {
  try {
    const now = new Date();

    // Start of current month
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    // End of current month
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const paidEmployees = await Salary.find({
      Status: "due",
      updatedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).populate(
      "employee",
      "firstName lastName position jobType status bankDetails"
    );

    res.status(200).json({
      success: true,
      month: now.toLocaleString("default", { month: "long" }),
      year: now.getFullYear(),
      count: paidEmployees.length,
      data: paidEmployees
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getleavesDetail = async (req, res) => {
  try {
    const { role, _id } = req.user;

    let employeeLeaves;

    // If Department Head, show only their department's employees' leaves
    if (role === 'Department Head') {

      // Find the department where this user is the manager
      const managedDepartment = await Department.findOne({
        manager: _id,
        isActive: true
      });

      // If no department found
      if (!managedDepartment) {
        return res.status(200).json({
          success: true,
          message: 'No department assigned to this Department Head',
          data: []
        });
      }

      console.log(`Department Head managing: ${managedDepartment.name}`);

      // Find all employees in this department
      const departmentEmployees = await User.find({
        department: managedDepartment._id, // Assuming User has department field as ObjectId
        isActive: true
      }).select('_id firstName lastName');

      // Also include the department head themselves
      const employeeIds = [_id, ...departmentEmployees.map(emp => emp._id)];

      console.log(`Found ${employeeIds.length} employees in department (including head)`);

      // Get leaves for these employees only
      employeeLeaves = await Leave.find({
        employee: { $in: employeeIds }
      })
        .populate("employee", "firstName lastName employeeId")
        .sort({ createdAt: -1 });

    } else {
      // For Admin or other roles, show all leaves
      employeeLeaves = await Leave.find({})
        .populate("employee", "firstName lastName employeeId")
        .sort({ createdAt: -1 });
    }

    console.log(`Total leaves returned: ${employeeLeaves.length}`);

    return res.status(200).json({
      message: "success",
      success: true,
      data: employeeLeaves
    });

  } catch (error) {
    console.error('Error fetching employees leave detail:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

// const updateLeavebalance = async(req,res) => {

// }

const leaveAction = async (req, res) => {
  try {
    const { Leaveid, action } = req.body;
    console.log(Leaveid);
    console.log(req.body);

    const updatedLeave = await Leave.findById(Leaveid).populate('employee', 'leaveBalance firstName lastName');
    console.log(updatedLeave);

    if (!updatedLeave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (action === 'Approved' || action === 'approved') {
      const employee = await User.findById(updatedLeave.employee._id).select('leaveBalance firstName lastName');

      if (employee) {
        const leaveType = updatedLeave.leaveType; // 'personal', 'annual', or 'sick'
        const daysToDeduct = updatedLeave.duration || updatedLeave.totalDays;

        if (employee.leaveBalance[leaveType] >= daysToDeduct) {
          employee.leaveBalance[leaveType] -= daysToDeduct;
          await employee.save();
          console.log(`Deducted ${daysToDeduct} days from ${leaveType} leave`);
        } else {
          // ADD RETURN HERE to stop execution
          return res.status(401).json({
            success: false,
            message: `Insufficient ${leaveType} leave balance`
          });
        }
      }

      // UPDATE LEAVE STATUS TO APPROVED
      updatedLeave.status = 'approved';
      await updatedLeave.save();

      // LOG ACTIVITY - Leave Approved
      await logActivity('leave_approved', employee._id, {
        targetUserId: updatedLeave.employee._id,
        relatedModel: 'Leave',
        relatedId: updatedLeave._id,
        metadata: {
          leaveType: updatedLeave.leaveType,
          numberOfDays: updatedLeave.duration || updatedLeave.totalDays,
          employeeName: `${updatedLeave.employee.firstName} ${updatedLeave.employee.lastName}`,
          approvedBy: req.user._id
        }
      });

    } else if (action === 'Rejected' || action === 'rejected') {
      // UPDATE LEAVE STATUS TO REJECTED
      updatedLeave.status = 'rejected';
      await updatedLeave.save();

      // LOG ACTIVITY - Leave Rejected
      await logActivity('leave_rejected', updatedLeave.employee._id, {
        targetUserId: updatedLeave.employee._id,
        relatedModel: 'Leave',
        relatedId: updatedLeave._id,
        metadata: {
          leaveType: updatedLeave.leaveType,
          numberOfDays: updatedLeave.duration || updatedLeave.totalDays,
          employeeName: `${updatedLeave.employee.firstName} ${updatedLeave.employee.lastName}`,
          rejectedBy: req.user._id,
          reason: updatedLeave.rejectionReason || 'No reason provided'
        }
      });
    }

    console.log(updatedLeave);

    // SINGLE RESPONSE at the end
    return res.status(200).json({
      message: `Successfully ${action} leave`,
      success: true,
    });

  } catch (error) {
    console.error('Error action on leave', error);
    // ADD RETURN here too
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


const getEmployeesSalary = async (req, res) => {
  try {
    const employeesSalary = await Salary.find({}).populate("employee", "firstName lastName position jobType status bankDetails");
    // console.log(employeeLeaves);

    return res.status(200).json({
      message: "working",
      success: true,
      data: employeesSalary
    })


  } catch (error) {
    console.error('Error fetching employees salary details :', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

const updateSalary = async (req, res) => {
  try {
    const { updateData } = req.body;
    console.log(updateData);
    if (!updateData) {
      return res.status(400).json({
        message: "Fill the fields properly",
        success: false,

      })
    }

    const updatedSalary = await Salary.findByIdAndUpdate(updateData.id, {
      baseSalary: updateData.baseSalary,
      allowances: updateData.allowances,
      taxApply: updateData.taxApply,
      deductions: updateData.deductions,
      netSalary: updateData.netSalary
    });

    if (!updatedSalary) {
      return res.status(400).json({
        message: "no salary data of this employee",
        success: false,

      })
    }
    console.log(updatedSalary);

    return res.status(200).json({
      message: "Salary updated succesfully",
      success: true,

    })


  } catch (error) {
    console.error('Error updating salary details :', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

const runPayroll = async (req, res) => {
  try {

    const updatedSalaries = await Salary.updateMany(
      { Status: "due" },
      { $set: { Status: "paid", salaryPayDate: new Date() } }
    );
    if (!updatedSalaries) {
      return res.status(400).json({
        message: "no salary data to run payroll",
        success: false,

      })
    }
    // console.log(updatedSalaries);

    return res.status(200).json({
      message: "succesfully executed payroll",
      success: true,

    })


  } catch (error) {
    console.error('payroll error :', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

const getCurrentMonthPaidEmployees = async (req, res) => {
  try {
    const now = new Date();

    // Start of current month
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    // End of current month
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const paidEmployees = await Salary.find({
      Status: "paid",
      updatedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).populate(
      "employee",
      "firstName lastName position jobType status bankDetails"
    );

    res.status(200).json({
      success: true,
      month: now.toLocaleString("default", { month: "long" }),
      year: now.getFullYear(),
      count: paidEmployees.length,
      data: paidEmployees
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getPaidEmployeesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate && !endDate) {
      return res.status(400).json({
        success: false,
        message: "At least one of startDate or endDate is required",
      });
    }

    const dateFilter = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const paidEmployees = await Salary.find({
      Status: "paid",
      createdAt: dateFilter,
    }).populate(
      "employee",
      "firstName lastName position jobType status bankDetails"
    );

    res.status(200).json({
      success: true,
      startDate: startDate || null,
      endDate: endDate || null,
      count: paidEmployees.length,
      data: paidEmployees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const addTask = async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(req.body);
    const { taskName, description, dueDate, priority } = req.body;


    const newTask = new Task({

      employee: id,
      taskName,
      description,
      dueDate,
      priority,
      startDate: Date.now()
    });

    const task = await newTask.save();


    await logActivity('task_assigned', req.user._id, {
      targetUserId: id, // The employee who got the task
      // relatedModel: 'Task',
      relatedId: task._id,
      metadata: {
        taskName,
        priority,
        dueDate,
        assignedTo: id
      }
    });

    return res.status(200).json({
      message: "working",
      success: true,

    })


  } catch (error) {
    console.error('Error fetching employees salary details :', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (!['Admin', 'Department Head'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete tasks"
      });
    }

    if (req.user.role === 'Department Head') {
      const employee = await User.findById(task.employee).select('department');
      let departmentId = req.user.department;

      if (!departmentId) {
        const dept = await Department.findOne({ manager: req.user._id }).select('_id');
        departmentId = dept?._id;
      }

      if (!employee || !employee.department || !departmentId || employee.department.toString() !== departmentId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only delete tasks from your department"
        });
      }
    }

    await Task.deleteOne({ _id: taskId });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}


const getDepartmentTasks = async (req, res) => {
  try {
    const { id } = req.user._id;
    let departmentDetails;
    let departmentEmployees;
    let departmentTasks;
    if (req.user.role === "Admin" || req.user.role === "Department Head") {
      departmentDetails = await Department.find({}).populate("manager", "firstName lastName");
      departmentEmployees = await User.find({
        role: { $in: ["employee", "Department Head"] }
      });
    } else {
      departmentDetails = await Department.findOne({
        manager: new mongoose.Types.ObjectId(id)
      }).populate("manager", "firstName lastName");
      departmentEmployees = await User.find({ department: departmentDetails._id });

    }

    if (!departmentDetails) {
      return res.status(201).json({
        success: false,
        message: "No department Details"
      })
    }

    departmentTasks = await Task.find({});

    if (!departmentEmployees) {
      return res.status(201).json({
        success: false,
        message: "No Employees in the department"
      })
    }
    return res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        departmentDetails,
        departmentEmployees,
        departmentTasks,

      }
    })

  } catch (err) {
    console.error('Error getting department Task:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
}



// const payIndividual = async (req, res) => {
//   try {
//     const { salaryId } = req.params;
//     console.log(salaryId);

//     // Find the salary record
//     const salaryRecord = await Salary.findById(salaryId).populate('employee');

//     if (!salaryRecord) {
//       return res.status(404).json({
//         success: false,
//         message: 'Salary record not found'
//       });
//     }

//     // Check if already paid
//     if (salaryRecord.Status.toLowerCase() === 'paid') {
//       return res.status(400).json({
//         success: false,
//         message: 'Payment already processed for this employee'
//       });
//     }

//     // Check if bank details exist
//     if (!salaryRecord.employee.bankDetails || !salaryRecord.employee.bankDetails.accountNumber) {
//       return res.status(400).json({
//         success: false,
//         message: 'Bank details not found for this employee'
//       });
//     }

//     // Update status to Paid
//     salaryRecord.Status = 'paid';
//     salaryRecord.paymentDate = new Date();
//     await salaryRecord.save();

//     // Send confirmation email to employee
//     // const emailSent = await sendPaymentConfirmationEmail(
//     //   salaryRecord.employee.email,
//     //   {
//     //     employeeName: `${salaryRecord.employee.firstName} ${salaryRecord.employee.lastName}`,
//     //     amount: salaryRecord.netSalary,
//     //     month: salaryRecord.month,
//     //     accountNumber: salaryRecord.employee.bankDetails.accountNumber.slice(-4),
//     //     bankName: salaryRecord.employee.bankDetails.bankName
//     //   }
//     // );

//     return res.status(200).json({
//       success: true,
//       message: 'Payment processed successfully',
//       data: {
//         salaryRecord,
//       }
//     });

//   } catch (error) {
//     console.error('Error processing individual payment:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to process payment',
//       error: error.message
//     });
//   }
// };

const payIndividual = async (req, res) => {
  try {
    const { salaryId } = req.params;


    const salary = await Salary.findById(salaryId).populate("employee");

    if (!salary) {
      return res.status(404).json({ success: false, message: "Salary not found" });
    }

    if (salary.Status === "paid") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    if (!salary.employee.bankDetails?.accountNumber) {
      return res.status(400).json({ success: false, message: "Bank details missing" });
    }

    const invoiceNo = await generateInvoiceNo();

    const pdfPath = await generateInvoicePDF(salary, invoiceNo);

    const invoiceUrl = await uploadInvoicePDF(pdfPath, invoiceNo);

    salary.Status = "paid";
    salary.salaryPayDate = new Date();
    salary.invoice = {
      invoiceNo,
      invoiceDate: new Date(),
      amount: parseFloat(salary.netSalary),
      invoiceUrl,
    };

    await salary.save();

    res.status(200).json({
      success: true,
      message: "Payment successful & invoice generated",
      data: {
        invoiceNo,
        invoiceUrl,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Payment failed",
      error: error.message,
    });
  }
}


const getCurrentMonthYear = () => {
  const now = new Date();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return {
    month: monthNames[now.getMonth() + 1],
    year: now.getFullYear()
  };
};


const generateMonthlySalary = async () => {
  try {

    const { month, year } = getCurrentMonthYear();

    console.log(`Running payroll for ${month} ${year}`);

    // Fetch active employees
    const employees = await User.find({
      $or: [
        { status: "active" },
        { status: "on leave" }
      ]
    });

    for (let emp of employees) {

      console.log(emp)

      const baseSalary = Number(emp.baseSalary || 0);
      const allowances = Number(emp.allowances || 0);
      const deductions = Number(emp.deductions || 0);
      const taxApply = Number(emp.taxApply || 0);

      const taxAmount = (baseSalary * taxApply) / 100;

      const netSalary =
        baseSalary + allowances - deductions - taxAmount;


      await Salary.findOneAndUpdate(
        { employee: emp._id, month, year },
        {
          $setOnInsert: {
            employeeId: emp.employeeId,
            baseSalary,
            allowances,
            deductions,
            taxApply,
            netSalary,
            Status: "due"
          }
        },
        { upsert: true }
      );

      console.log(`Salary processed for ${emp.employeeId}`);
    }

    console.log("Monthly payroll completed successfully");

  } catch (err) {
    console.error("Payroll Cron Error:", err);
  }
};


cron.schedule("1 0 1 * *", async () => {
  console.log("Running Monthly Salary Cron...");
  await generateMonthlySalary();
});


module.exports = {
  getDashboardstats,
  getAllEmployees,
  getEmployeebyId,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAlldepartments,
  createDepartment,
  deleteDepartment,
  updateDepartment,
  getleavesDetail,
  getEmployeesSalary,
  updateSalary,
  addTask,
  deleteTask,
  updateProfile,
  runPayroll,
  leaveAction,
  sentEmail,
  getDepartmentTasks,
  payIndividual,
  getAllEmployeesByDepartement,
  getCurrentMonthPaidEmployees,
  getPaidEmployeesByDateRange,
  getAllEmployeesDuePayment
}