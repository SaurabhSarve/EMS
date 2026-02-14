import React, { useState } from "react";
import { User, ArrowRight, Lock, Mail, KeyRound } from "lucide-react";
import authService from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import EMPloginPic from "../../assets/images/Employee.jpeg";

export default function EmployeeLogin() {
  const [view, setView] = useState("login");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const {login} = useAuth();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!employeeId.trim()) newErrors.employeeId = "Employee ID is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const result = await login(email, password, null ,employeeId, "employee");
      console.log(result);
      if(result.success){
        showToast('Login successfully! Redirecting!', 'success');
        setTimeout(() => {
          window.location.href = "/employee/dashboard";
        }, 1500); 
      }
    } catch (error) {
      console.error("Login error:", error);
      if(error.response.status === 403){
        return showToast(`${error.response.data.message}`, "error");
      }
      showToast(`${error.response.data.message}` || "Invalid Employee ID. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!employeeId.trim() || !email.trim()) {
      showToast("Please enter both Employee ID and Email", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authService.requestForgotpassword(employeeId, email, "employee");
      
      console.log(response);
      if (response.success) {
        showToast("If you are a registered user, you will receive an email with OTP.", "success");
        setView("verifyOTP");
      } else {
        showToast(response.message || "Failed to send OTP", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
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
      const response = await authService.verifyOtp(employeeId, otp, "employee");
      
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

    setIsLoading(true);
    
    try {
      const response = await authService.resetPassword(employeeId, otp, newPassword, confirmPassword, "employee");
      
      console.log(response);
      
      if (response.success) {
        showToast("Password reset successful! Redirecting to login...", "success");
        setTimeout(() => {
          setView("login");
          setEmployeeId("");
          setEmail("");
          setPassword("");
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      } else {
        showToast(response.message || "Failed to reset password", "error");
      }
    } catch (error) {
      showToast("Failed to reset password. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-8">
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 animate-slideIn px-6 py-3 rounded-lg shadow-lg text-white flex items-center gap-3 min-w-[280px] ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${toast.type === "error" ? "bg-red-300" : "bg-green-300"}`}></div>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-auto text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 shadow-2xl rounded-2xl overflow-hidden bg-white">
        
        {/* LEFT IMAGE SIDE */}
        <div className="hidden md:flex items-center justify-center p-0 bg-gradient-to-br from-blue-900 to-blue-800 relative overflow-hidden">
          <img 
            src={EMPloginPic} 
            alt="Employee Login" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-blue-900/30"></div>
          
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <h3 className="text-3xl font-bold mb-2">Employee Portal</h3>
            <p className="text-blue-100">Securely access your dashboard</p>
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <div className="p-8">
          {view === "login" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="text-blue-600" size={32} />
                </div>
                <h2 className="text-3xl font-bold text-blue-900 mb-2">Employee Portal</h2>
                <p className="text-sm text-slate-500">Securely access your dashboard</p>
              </div>

              <div>
                <label className="block mb-3">
                  <span className="text-sm font-semibold text-blue-900">Employee ID</span>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Ex: EMP-001"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
                </label>

                <label className="block mb-3">
                  <span className="text-sm font-semibold text-blue-900">Email</span>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@email.com"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </label>

                <label className="block mb-3">
                  <span className="text-sm font-semibold text-blue-900">Password</span>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </label>

                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => setView("forgotPassword")}
                    className="text-sm text-blue-700 font-medium hover:text-blue-900 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  onClick={handleLoginSubmit}
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isLoading ? "Authenticating..." : "Secure Login"}
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="text-xs text-slate-400 flex justify-center items-center gap-1 mt-6">
                <Lock size={14} />
                Protected by Enterprise Grade Security
              </div>
            </>
          )}

          {view === "forgotPassword" && (
            <>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Forgot Password?</h2>
                <p className="text-sm text-slate-500">Enter your Employee ID and Email to receive an OTP</p>
              </div>

              <div>
                <label className="block mb-3">
                  <span className="text-sm font-semibold text-blue-900">Employee ID</span>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="Ex: EMP-001"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </label>

                <label className="block mb-6">
                  <span className="text-sm font-semibold text-blue-900">Email</span>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@email.com"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </label>

                <button
                  onClick={handleForgotPasswordSubmit}
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold transition disabled:opacity-50 mb-4"
                >
                  {isLoading ? "Sending OTP..." : "Send OTP"}
                </button>

                <button
                  onClick={() => setView("login")}
                  className="w-full h-12 border border-blue-300 text-blue-800 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}

          {view === "verifyOTP" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Verify OTP</h2>
                <p className="text-sm text-slate-500">Enter the 6-digit code sent to your email</p>
              </div>

              <div>
                <label className="block mb-6">
                  <span className="text-sm font-semibold text-blue-900">OTP Code</span>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    className="w-full h-14 text-center text-2xl font-mono tracking-widest border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent mt-2"
                  />
                </label>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold transition disabled:opacity-50 mb-4"
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
            </>
          )}

          {view === "resetPassword" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Reset Password</h2>
                <p className="text-sm text-slate-500">Create a new secure password</p>
              </div>

              <div>
                <label className="block mb-5">
                  <span className="text-sm font-semibold text-blue-900">New Password</span>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </label>

                <label className="block mb-6">
                  <span className="text-sm font-semibold text-blue-900">Confirm Password</span>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-4 text-blue-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full h-12 pl-11 pr-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </label>

                <button
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </button>
              </div>
            </>
          )}
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
      `}</style>
    </div>
  );
}