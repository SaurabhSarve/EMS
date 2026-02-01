import React, { useState } from "react";
import {
  MdOutlineAdminPanelSettings,
  MdOutlineVerifiedUser,
} from "react-icons/md";
import { LuLogIn } from "react-icons/lu";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { CiLock } from "react-icons/ci";
import { BsShieldLock } from "react-icons/bs";
import { TbShieldSearch } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth";
import AdminSidePic from "../../assets/images/Admin.jpg";

export default function AdminLogin() {
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const {login} = useAuth();
  
  // Login form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("Admin");
  const [accessKey, setAccessKey] = useState("");
  
  // Forgot password states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("Admin");
  const [secretKey, setSecretKey] = useState("");
  const [name, setName] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const validate = (values) => {
    const errors = {};
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    
    if (!values.email) {
      errors.email = "Email is required!";
    } else if (!regex.test(values.email)) {
      errors.email = "Invalid email format!";
    }
    
    if (!values.password) {
      errors.password = "Password is required!";
    } else if (values.password.length < 4) {
      errors.password = "Password must be at least 4 characters";
    } else if (values.password.length > 15) {
      errors.password = "Password cannot exceed 15 characters";
    }

    if (!values.accessKey) {
      errors.accessKey = `${values.loginType} Access Key is required!`;
    }
    
    return errors;
  };

  const handleLoginSubmit = async () => {
    const errors = validate({ email, password, accessKey, loginType });
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      try {
        const result = await login(email, password, accessKey, null ,loginType);
        console.log(result);
        if(result.success){
          showToast('Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = loginType === "Admin" ? "/admin/dashboard" : "/admin/dashboard";
          }, 1500); 
        }
      } catch (error) {
        console.error("Login error:", error);
        if(error.response?.status === 403){
          return showToast(error.response.data.message, "error");
        }
        showToast(error.response?.data?.message || "Login failed. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast("Please fix the errors in the form", "error");
    }
  };

  const handleForgotPasswordSubmit = async () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    
    if (!email.trim()) {
      showToast("Email is required", "error");
      return;
    }
    
    if (!regex.test(email)) {
      showToast("Please enter a valid email", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.requestForgotpassword(null, email, userType);
      
      if (response.success) {
        showToast("If you are a registered user, you will receive an email with OTP.", "success");
        setView("verifyOTP");
      } else {
        showToast(response.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
      console.log("admin forgot password error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.verifyOtp(email, otp, userType);
      
      console.log(response);
      
      if (response.success) {
        showToast("OTP verified successfully!", "success");
        setView("resetPassword");
      } else {
        showToast(response.message || "Invalid OTP", "error");
      }
    } catch (error) {
      showToast("Verification failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    
    if (!name.trim()) {
      showToast("Name is required for verification", "error");
      return;
    }
    
    if (!secretKey.trim()) {
      showToast("Secret key is required for verification", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const adminSecretKey = userType === "Admin" ? secretKey : undefined;
      const departmentSecretKey = userType === "Department Head" ? secretKey : undefined;

      const response = await authService.resetPassword(
        email,
        otp,
        newPassword,
        confirmPassword,
        userType,
        adminSecretKey,
        departmentSecretKey,
        name,
      );

      console.log(response);
      
      if (response.success) {
        showToast("Password reset successful! Redirecting to login...", "success");
        console.log("✅ Password reset successful, about to change view");

        setTimeout(() => {
          setView("login");
          setEmail("");
          setPassword("");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setSecretKey("");
          setName("");
        }, 2000);
      } else {
        showToast(response.message || "Failed to reset password", "error");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showToast(error.response?.data?.message || "Failed to reset password. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 animate-slideIn ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          } text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-md`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === "error" ? "bg-red-300" : "bg-green-300"
            }`}
          ></div>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-auto text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-[#E3E8EC] px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white">
          
          {/* LEFT IMAGE SIDE */}
          <div className="hidden md:flex items-center justify-center p-0 bg-gradient-to-br from-blue-900 to-blue-800 relative overflow-hidden">
            <img 
              src={AdminSidePic} 
              alt="Admin Login" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-blue-900/30"></div>
            
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h3 className="text-3xl font-bold mb-2">Admin Portal</h3>
              <p className="text-blue-100">Secure access to your dashboard</p>
            </div>
          </div>

          {/* RIGHT FORM SIDE */}
          <div className="p-6 sm:p-8 md:p-10">
            {view === "login" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-blue-100 shadow-md">
                    <MdOutlineAdminPanelSettings className="text-blue-800 text-3xl" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-sm sm:text-base text-blue-600">
                    Please enter your details to sign in.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Login Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Login Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={loginType}
                      onChange={(e) => {
                        setLoginType(e.target.value);
                        setAccessKey("");
                        if (formErrors.accessKey) setFormErrors({ ...formErrors, accessKey: "" });
                      }}
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Department Head">Department Head</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Work Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                      }}
                      disabled={isLoading}
                      className={`
                        w-full px-4 py-3
                        bg-blue-50
                        border-2 
                        ${formErrors.email ? 'border-red-500' : 'border-blue-200'}
                        rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all
                        text-sm font-medium
                      `}
                      autoComplete="off"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (formErrors.password) setFormErrors({ ...formErrors, password: "" });
                        }}
                        disabled={isLoading}
                        className={`
                          w-full px-4 py-3 pr-12
                          bg-blue-50
                          border-2 
                          ${formErrors.password ? 'border-red-500' : 'border-blue-200'}
                          rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all
                          text-sm font-medium
                        `}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-700 hover:text-blue-900 disabled:opacity-50"
                      >
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Access Key Field */}
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      {loginType} Access Key <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showAccessKey ? "text" : "password"}
                        name="accessKey"
                        placeholder="Enter your access key"
                        value={accessKey}
                        onChange={(e) => {
                          setAccessKey(e.target.value);
                          if (formErrors.accessKey) setFormErrors({ ...formErrors, accessKey: "" });
                        }}
                        disabled={isLoading}
                        className={`
                          w-full px-4 py-3 pr-12
                          bg-blue-50
                          border-2 
                          ${formErrors.accessKey ? 'border-red-500' : 'border-blue-200'}
                          rounded-lg
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all
                          text-sm font-medium
                        `}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccessKey(!showAccessKey)}
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-700 hover:text-blue-900 disabled:opacity-50"
                      >
                        {showAccessKey ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                    {formErrors.accessKey && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {formErrors.accessKey}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                      <BsShieldLock size={12} />
                      Unique key for {loginType} authentication
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setView("forgotPassword")}
                      disabled={isLoading}
                      className="font-semibold text-blue-900 text-left underline hover:no-underline disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    onClick={handleLoginSubmit}
                    disabled={isLoading}
                    className="
                      w-full h-12
                      bg-gradient-to-r from-blue-900 to-blue-800
                      text-white font-semibold
                      rounded-lg
                      flex items-center justify-center gap-2
                      shadow-lg shadow-blue-900/30
                      hover:shadow-xl hover:shadow-blue-900/40
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                      active:scale-[0.98]
                    "
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LuLogIn size={20} />
                        Secure Login
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 text-center border-t border-blue-100 pt-6">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1.5 mb-3">
                    <CiLock className="text-base text-green-600" />
                    Protected by Enterprise Grade Security
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 text-xs text-blue-500">
                    <span className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <MdOutlineVerifiedUser size={14} />
                      SOC2
                    </span>
                    <span className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <BsShieldLock size={14} />
                      256-bit AES
                    </span>
                    <span className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                      <TbShieldSearch size={14} />
                      ISO 27001
                    </span>
                  </div>
                </div>
              </>
            )}

            {view === "forgotPassword" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-blue-100 shadow-md">
                    <CiLock className="text-blue-800 text-3xl" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
                    Forgot Password?
                  </h2>
                  <p className="text-sm sm:text-base text-blue-600">
                    Enter your email to receive an OTP
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      User Type
                    </label>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Department Head">Department Head</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Work Email
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                      autoComplete="off"
                    />
                  </div>

                  <button
                    onClick={handleForgotPasswordSubmit}
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <button
                    onClick={() => setView("login")}
                    className="w-full h-12 border-2 border-blue-300 text-blue-800 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                  >
                    Back to Login
                  </button>
                </div>

                <div className="mt-8 text-center border-t border-blue-100 pt-6">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1.5 mb-3">
                    <CiLock className="text-base text-green-600" />
                    Protected by Enterprise Grade Security
                  </p>
                </div>
              </>
            )}

            {view === "verifyOTP" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-blue-100 shadow-md">
                    <BsShieldLock className="text-blue-800 text-3xl" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
                    Verify OTP
                  </h2>
                  <p className="text-sm sm:text-base text-blue-600">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      OTP Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength="6"
                      className="w-full h-14 text-center text-2xl font-mono tracking-widest bg-blue-50 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button
                    onClick={() => setView("forgotPassword")}
                    className="w-full text-sm text-blue-700 font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>

                <div className="mt-8 text-center border-t border-blue-100 pt-6">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1.5">
                    <CiLock className="text-base text-green-600" />
                    Protected by Enterprise Grade Security
                  </p>
                </div>
              </>
            )}

            {view === "resetPassword" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-blue-100 shadow-md">
                    <CiLock className="text-blue-800 text-3xl" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
                    Reset Password
                  </h2>
                  <p className="text-sm sm:text-base text-blue-600">
                    Create a new secure password
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Secret Key ({userType === "Admin" ? "Admin" : "Department"})
                    </label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter secret key"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                      autoComplete="off"
                    />
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0-98]"
                  >
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </button>
                </div>

                <div className="mt-8 text-center border-t border-blue-100 pt-6">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-1.5">
                    <CiLock className="text-base text-green-600" />
                    Protected by Enterprise Grade Security
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}