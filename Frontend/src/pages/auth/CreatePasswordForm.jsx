import { useState } from "react";
import { emailService } from "../../services/emailServices";

/* 🔹 IMAGE */
import sideImage from "../../assets/images/pass.png";
import {useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const CreatePasswordForm = () => {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("employeeId");
  
  const [formData, setFormData] = useState({
    employeeId: "",
    password: "",
    confirmPassword: ""
  });

 useEffect(() => {
  setFormData((prev) => ({
    ...prev,
    employeeId: employeeId
  }));
}, [employeeId]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { employeeId, password, confirmPassword } = formData;

    if (!employeeId || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
try {
  const response = await emailService.createPassword(formData);

  if (response.success) {
    showToast("Password created successfully", "success");
    setSuccess("Password created successfully!");

    setFormData({
      employeeId,
      password: "",
      confirmPassword: ""
    });
  }
} catch (err) {
  console.error("Password creation error:", err);
  showToast(
    err.response?.data?.message || "Password Creation failed",
    "error"
  );
}

 
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#EEF2F7]">
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
      {/* MAIN CARD */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT – FORM (UNCHANGED) */}
        <div className="p-8 flex flex-col justify-center">
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="w-7 h-7 text-blue-800"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" ry="2" />
                <path d="M8 10V7a4 4 0 118 0v3" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-blue-900">
              Create Password
            </h2>
            <p className="text-sm text-blue-600 mt-1">
              Set a secure password to access your account
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                placeholder="#EMP-001"
                value={formData.employeeId}
                onChange={handleChange}
                readOnly
                className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-800 to-blue-700 text-white rounded-lg font-semibold shadow-lg hover:from-blue-900 hover:to-blue-800 transition"
            >
              Create Password
            </button>
          </form>

          <p className="text-xs text-center text-blue-500 mt-6">
            Protected by Enterprise-Grade Security
          </p>
        </div>

        {/* RIGHT – IMAGE (REDUCED FROM ALL SIDES) */}
        <div className="hidden md:flex items-center justify-center p-8 bg-white">
          <img
            src={sideImage}
            alt="Password Security"
            className="w-full h-full object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePasswordForm;
