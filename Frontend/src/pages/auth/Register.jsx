import React, { useState } from "react";
import registerImg from "../../assets/images/regis.webp";
import "../../assets/styles/LandingPageStyles/Register.css";
import { useAuth } from "../../context/AuthContext";

export default function CreateAccount() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    registerAs: "Admin",
    secretKey: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const { register } = useAuth();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please provide a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

   

    if (!form.secretKey.trim()) {
      newErrors.secretKey = "Secret key is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fill all required fields correctly", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(form);

     console.log(result);


      if (!result.success) {
        throw new Error(result.message || "Registration failed");
      }

      if (result.success) {
        showToast("Registration successful! Redirecting to login...", "success");
        setForm({
          fullName: "",
          email: "",
          mobileNumber: "",
          password: "",
          confirmPassword: "",
          registerAs: "Admin",
          
          secretKey: ""
        });
        setTimeout(() => {
          window.location.href = "/admin-login";
        }, 2000);
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast(error.response.data.message || "Registration failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="register-page">
      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "12px 24px",
            borderRadius: "8px",
            color: "white",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            backgroundColor: toast.type === "error" ? "#ef4444" : "#22c55e",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: "280px",
            maxWidth: "400px"
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: toast.type === "error" ? "#fca5a5" : "#86efac"
            }}
          ></div>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0",
              lineHeight: "1"
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="register-joined-card">
        {/* FORM (BORDER ONLY HERE) */}
        <div className="register-form-section">
          <h2>Create Account</h2>

          <label>Full Name</label>
          <input
            name="fullName"
            value={form.fullName}
            placeholder="Enter your full name"
            onChange={handleChange}
          />
          {errors.fullName && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {errors.fullName}
            </p>
          )}

          <label>Email Address</label>
          <input
            name="email"
            type="email"
            value={form.email}
            placeholder="Enter your email"
            onChange={handleChange}
          />
          {errors.email && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {errors.email}
            </p>
          )}

          <label>Mobile Number</label>
          <input
            name="mobileNumber"
            value={form.mobileNumber}
            placeholder="Enter your mobile number"
            onChange={handleChange}
          />
          {errors.mobileNumber && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {errors.mobileNumber}
            </p>
          )}

          <label>Register As</label>
          <select name="registerAs" value={form.registerAs} onChange={handleChange}>
            <option value="Admin">Admin</option>
            <option value="Department Head">Department Head</option>
          </select>

         {/* {form.registerAs === "Department Head" && (
            <>
              <label>Department</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option value="">Select Department</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
              </select>
              {errors.department && (
                <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                  {errors.department}
                </p>
              )}
            </>
          )} */}

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            placeholder="********"
            onChange={handleChange}
          />
          {errors.password && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {errors.password}
            </p>
          )}

          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            placeholder="Re-enter your password"
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {errors.confirmPassword}
            </p>
          )}

          <label>Secret Key for {form.registerAs}</label>
          <input
            type="password"
            name="secretKey"
            value={form.secretKey}
            placeholder={`Enter ${form.registerAs} secret key`}
            onChange={handleChange}
          />
          {errors.secretKey && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
              {errors.secretKey}
            </p>
          )}

          <button className="register-btn" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </button>

          <p className="login-link">
            Already have an account?{" "}
            <span onClick={() => (window.location.href = "/admin-login")}>Login here</span>
          </p>
        </div>

        {/* IMAGE (NO BORDER, WIDER IMAGE) */}
        <div className="register-image-section">
          <img src={registerImg} alt="Register Illustration" />
        </div>
      </div>
    </div>
  );
}