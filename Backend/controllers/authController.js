const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { status } = require('http-status');
const dotenv = require("dotenv");
const Department = require("../models/Department");
const OTP = require("../models/Otp");
const generateEmployeeId = require("../utils/generateEmployeeId");

const { sendOtp } = require("../services/emailService");
dotenv.config();


const crypto = require('crypto');


// 1. Request Password Reset
const requestPasswordReset = async (req, res) => {
  try {
    console.log("helo");
    const { email, employeeId, userType } = req.body;

    let user;
    let identifier;

    if (userType === 'Admin' || userType === 'Department Head') {
      // For Admin/Department Head
      user = await User.findOne({ email });
      identifier = email;
    } else {
      // For Employee
      user = await User.findOne({
        employeeId,
        personalEmail: email
      });
      identifier = employeeId;
    }





    if (!user) {

      return res.status(200).json({
        success: true,
        message: 'If you are a registered user, you will receive an email with reset instructions.'
      });
    }



    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const emailResult = await sendOtp({
      user: user,
      otp: otp
    });

    await OTP.create({
      identifier: userType === 'employee' ? employeeId : email,
      otp,
      userId: user._id,
      userType
    });



    res.status(200).json({
      success: true,
      message: 'If you are a registered user, you will receive an email with OTP.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// 2. Verify OTP
const verifyOTP = async (req, res) => {
  try {
    console.log(req.body);
    const { identifier, otp, userType } = req.body;

    const otpDoc = await OTP.findOne({ identifier, otp });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }


    if (Date.now() > otpDoc.expiresAt) {

      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (otpDoc.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      //   resetToken: crypto.randomBytes(32).toString('hex')
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};

// 3. Reset Password
const resetPassword = async (req, res) => {
  try {
    const {
      identifier,
      otp,
      password,
      confirmPassword,
      userType,
      adminSecretkey,
      departmentSecretkey, // for department head

      name // for admin/dept head
    } = req.body;
    console.log(req.body);

    console.log(adminSecretkey);
    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Verify OTP again
    const otpDoc = await OTP.findOne({ identifier, otp });

    if (!otpDoc || otpDoc.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    let user;

    if (userType === 'Admin') {
      // Verify admin secret key
      const savedUser = User.findOne({ email, role: "Admin" });
      if (adminSecretkey !== savedUser.AccessKey) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin secret key'
        });
      }

      user = await User.findById(otpDoc.userId);

      // if (user.name !== name) {
      //   return res.status(401).json({
      //     success: false,
      //     message: 'Name does not match'
      //   });
      // }

    } else if (userType === 'Department Head') {
      // Verify department secret key
      const department = await Department.findOne({ manager: otpDoc.userId });

      if (!department || departmentSecretkey !== process.env.DEPARTMENT_SECRET_KEY) {
        return res.status(401).json({
          success: false,
          message: 'Invalid department secret key'
        });
      }

      user = await User.findById(otp.userId);

      // if (`${user.firstName} ${user.lastName}` !== name) {
      //   return res.status(401).json({
      //     success: false,
      //     message: 'Name does not match'
      //   });
      // }

    } else {
      // Employee
      user = await User.findOne({ employeeId: otpDoc.identifier });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // // Hash new password
    // const bcrypt = require('bcryptjs');
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = password;
    await user.save();

    // Clear OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// api = api/v1/auth/login
const login = async (req, res, next) => {
  try {
    console.log("Login attempt:", req.body);
    const { email, password, employeeId, loginType, accessKey } = req.body;

    // Validation
    if (!email && !employeeId) {
      return res.status(400).json({ message: "Please fill all given fields" });
    }


    console.log(employeeId);
    let currUser;
    let loginWay;

    // Admin Login
    if (loginType === "Admin" && email) {
      console.log("Admin login attempt for:", loginType);

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      if (!accessKey) {
        return res.status(400).json({ message: "Access key is required" });
      }

      currUser = await User.findOne({ email: email });
      loginWay = 'email';

      if (!currUser) {
        return res.status(404).json({ message: "Wrong email or password" });
      }

      if (currUser.role !== 'Admin') {
        return res.status(403).json({ message: "Access Denied! Only Admin can login with Admin credentials" });
      }

      // Validate Admin Access Key
      if (!currUser.AccessKey) {
        return res.status(403).json({ message: "Admin access key not configured. Contact system administrator" });
      }

      if (currUser.AccessKey !== accessKey) {
        return res.status(403).json({ message: "Invalid Admin access key" });
      }

      const isPasswordValid = await currUser.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Wrong password" });
      }
    }
    // Department Head Login
    else if (loginType === "Department Head" && email) {
      console.log("Department Head login attempt");
      if (!accessKey) {
        return res.status(400).json({ message: "Access key is required" });
      }

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      currUser = await User.findOne({ email: email });
      loginWay = 'email';

      if (!currUser) {
        return res.status(404).json({ message: "Wrong email or password" });
      }

      if (currUser.role !== 'Department Head') {
        return res.status(403).json({ message: "Access Denied! Only Department Heads can login with these credentials" });
      }

      // Validate Department Head Access Key
      if (!currUser.AccessKey) {
        return res.status(403).json({ message: "Department access key not configured. Contact administrator" });
      }

      if (currUser.AccessKey !== accessKey) {
        return res.status(403).json({ message: "Invalid Department Head access key" });
      }

      const isPasswordValid = await currUser.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Wrong password" });
      }
    }
    // Employee Login
    else if (loginType === "employee" && employeeId) {
      currUser = await User.findOne({ employeeId: employeeId });
      console.log("Employee login:", currUser);
      loginWay = 'employeeId';

      if (!currUser) {
        return res.status(400).json({ message: "Invalid Employee ID" });
      }

      if (currUser.personalEmail !== email) {
        return res.status(400).json({ message: "Invalid email ID" });
      }

      if (currUser.role !== "employee") {
        return res.status(403).json({ message: "Access Denied! Only employees can login with Employee ID" });
      }

      // Employee doesn't use access keys
      if (password) {
        const isPasswordValid = await currUser.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: "Wrong password" });
        }
      } else {
        return res.status(403).json({ message: "Enter password" });
      }
    } else {
      return res.status(400).json({ message: "Invalid login credentials" });
    }

    // Check if account is active
    if (currUser.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated. Please contact administrator" });
    }

    // Update last login
    currUser.lastLogin = new Date();
    await currUser.save();

    // Create token payload
    const tokenPayload = {
      userId: currUser._id,
      role: currUser.role,
      email: currUser.email,
      employeeId: currUser.employeeId,
      name: `${currUser.firstName} ${currUser.lastName}`
    };

    const tokenExpiry = currUser.role === 'Admin' ? '24h' : '8h';

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Determine redirect URL
    let redirectTo;
    if (currUser.role === 'Admin') {
      redirectTo = '/admin/dashboard';
    } else if (currUser.role === 'Department Head') {
      redirectTo = '/admin/dashboard';
    } else {
      redirectTo = '/employee/dashboard';
    }

    const userResponse = {
      id: currUser._id,
      firstName: currUser.firstName,
      lastName: currUser.lastName,
      fullName: currUser.fullName,
      email: currUser.email,
      employeeId: currUser.employeeId,
      role: currUser.role,
      isActive: currUser.isActive,
      lastLogin: currUser.lastLogin
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
      redirectTo,
      loginType,
      expiresIn: tokenExpiry
    });

  } catch (err) {
    console.log("Login error:", err);
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
};




const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};





const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(status.OK).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}


const register = async (req, res) => {
  try {
    const { form } = req.body;
    const {
      fullName,
      email,
      mobileNumber,
      password, //admin123
      confirmPassword,

      registerAs,
      secretKey
    } = form;
    // console.log(req.body);
    // Validation
    if (!fullName || !email || !password || !confirmPassword || !registerAs) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }


    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }


    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // registerAs
    if (!['Department Head', 'Admin'].includes(registerAs)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration type. Must be Department Head or Admin'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const nameParts = fullName.trim().split(/\s+/);

    const firstName = nameParts[0];
    const lastName = nameParts.length > 1
      ? nameParts.slice(1).join(' ')
      : "";


    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
    const DEPARTMENT_HEAD_SECRET_KEY = process.env.DEPARTMENT_HEAD_SECRET_KEY;

    if (registerAs === 'Admin' && secretKey === ADMIN_SECRET_KEY) {
      const employeeId = await generateEmployeeId();
      const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber: mobileNumber || null,
        password, // Will be hashed by pre-save middleware
        role: registerAs,
        isActive: true,
        status: 'active',
        AccessKey: ADMIN_SECRET_KEY,
        employeeId
      });

    } else if (registerAs === 'Department Head' && secretKey === DEPARTMENT_HEAD_SECRET_KEY) {
      //to add employee id to the department head
      const employeeId = await generateEmployeeId();

      const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber: mobileNumber || null,
        password, // Will be hashed by pre-save middleware
        role: registerAs,
        isActive: true,
        status: 'active',
        AccessKey: DEPARTMENT_HEAD_SECRET_KEY,
        employeeId
      });
      // const departmentInfo = await Department.findOneAndUpdate(
      //     { name : department }, 
      //     { manager: user._id }, 
      //     { 
      //         new: true, 
      //         upsert: false 
      //     }
      // );

      // console.log(departmentInfo);



    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid secret key. Only authorized Head can register.'
      });
    }



    res.status(201).json({
      success: true,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};



const createPassword = async (req, res) => {
  try {
    const { employeeId, password, confirmPassword } = req.body;

    if (!employeeId || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }


    const employee = await User.findOne({ employeeId }).select('password');
    console.log(employee);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Prevent resetting if password already exists
    if (employee.password) {
      return res.status(400).json({
        success: false,
        message: "Password already created"
      });
    }


    employee.password = password;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Password created successfully"
    });

  } catch (err) {
    console.error("Password creation error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



module.exports = {
  login,
  logout,
  resetPassword,
  requestPasswordReset,
  verifyOTP,
  getCurrentUser,
  createPassword,
  register
}