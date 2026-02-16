import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";
import "../../assets/styles/EmployeeProfileCSS/EmployeeEdit.css";
import {
  MdPerson,
  MdBadge,
  MdAttachMoney,
  MdCheckCircle,
  MdEmail,
  MdPersonAdd,
  MdClose,
  MdEventAvailable,
} from "react-icons/md";

export default function EmployeeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    personalEmail: "",
    contactNumber: "",
    department: "",
    jobType: "",
    joiningDate: "",
    dob: "",
    gender: "",
    address: "",
    position: "",
    currentProfilePhoto: "",
    // Leave balance fields
    personalLeave: "",
    sickLeave: "",
    annualLeave: "",
  });

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const result = await employeeService.getDetailsbyId(id);
        const employee = result.data;
        console.log(employee);

        setFormData({
          firstName: employee.firstName || "",
          lastName: employee.lastName || "",
          personalEmail: employee.personalEmail || "",
          contactNumber: employee.contactNumber || "",
          department: employee.department.name || "",
          jobType: employee.jobType || "",
          joiningDate: employee.joiningDate
            ? employee.joiningDate.split("T")[0]
            : "",
          dob: employee.dob ? employee.dob.split("T")[0] : "",
          gender: employee.gender || "",
          address: employee.address || "",
          position: employee.position || "",
          currentProfilePhoto: employee.profilePhoto || null,
          // Leave balance
          personalLeave: employee.leaveBalance?.personal || 0,
          sickLeave: employee.leaveBalance?.sick || 0,
          annualLeave: employee.leaveBalance?.annual || 0,
        });

        if (employee.profilePhoto) {
          setProfilePhotoPreview(employee.profilePhoto.url);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching employee:", err);
        setLoading(false);
      }
    };

    setDepartments([
      { _id: "1", name: "Information Technology" },
      { _id: "2", name: "Human Resources" },
      { _id: "3", name: "Finance" },
      { _id: "4", name: "Sales" },
      { _id: "5", name: "Marketing" },
      { _id: "6", name: "Operations" },
    ]);

    fetchEmployeeData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "error");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size should be less than 5MB", "error");
        return;
      }

      setProfilePhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoPreview(formData.currentProfilePhoto || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;

      if (profilePhotoFile) {
        const formDataWithFile = new FormData();

        formDataWithFile.append("profilePhoto", profilePhotoFile);

        Object.keys(formData).forEach((key) => {
          if (typeof formData[key] === "object" && formData[key] !== null) {
            formDataWithFile.append(key, JSON.stringify(formData[key]));
          } else {
            formDataWithFile.append(key, formData[key]);
          }
        });

        result = await employeeService.updateEmployee(id, formDataWithFile);
      } else {
        result = await employeeService.updateEmployee(id, formData);
      }

      console.log("result", result);

      if (result.success) {
        showToast(`Employee Updated Successfully`, "success");
        setTimeout(() => {
          navigate(`/admin/employees/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error("Error updating employee:", err);
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Failed to update employee",
        "error",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 p-8 flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg animate-slideLeft ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          } max-w-xs sm:max-w-md w-full sm:w-auto`}
        >
          <div className="flex-1 text-sm sm:text-base font-medium">
            {toast.message}
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>
      )}

      <style>{`
                        @keyframes slideLeft {
                            from {
                                opacity: 0;
                                transform: translateX(100%);
                            }
                            to {
                                opacity: 1;
                                transform: translateX(0);
                            }
                        }
                        .animate-slideLeft {
                            animation: slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                        }
                    `}</style>
      <AdminSidebar />

      <div className="flex-1 w-full min-w-0 lg:ml-64">
        <div className="p-4 pt-16 md:p-6 md:pt-6 lg:p-8 lg:pt-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Employee
              </h1>
              <p className="text-gray-600 mt-2">Update employee information</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200">
              <form onSubmit={handleSubmit} className="p-6 md:p-8 profile-edit-form">
                {/* Profile Photo Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Profile Photo
                  </h2>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {profilePhotoPreview ? (
                          <img
                            src={profilePhotoPreview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl text-gray-400">
                            {formData.firstName.charAt(0)}
                            {formData.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      {profilePhotoPreview && profilePhotoFile && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="profilePhoto"
                      />
                      <label
                        htmlFor="profilePhoto"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                      >
                        <Camera size={18} />
                        {profilePhotoPreview ? "Change Photo" : "Upload Photo"}
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG or GIF. Max size 5MB
                      </p>
                      {formData.currentProfilePhoto && !profilePhotoFile && (
                        <p className="text-xs text-gray-600 mt-1">
                          Current photo will be kept if no new photo is uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter last name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Personal Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.personalEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        required
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter contact number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dob"
                        required
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Information Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    Employment Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Department: <span className="text-blue-600">{formData.department}</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Update Department</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Position <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Enter position"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Type: <span className="text-blue-600 capitalize">{formData.jobType}</span>
                      </label>
                      <select
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Update Contract Type</option>
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date of Joining <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="joiningDate"
                        value={formData.joiningDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Leave Balance Section */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <MdEventAvailable className="text-blue-600" size={24} />
                    Leave Balance Quota
                  </h2>
                  
                  {/* Info Box */}
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Update the leave quota allocated to this employee. These values represent the total days available for each leave type.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Personal Leave (Days)
                      </label>
                      <input
                        type="number"
                        name="personalLeave"
                        min="0"
                        value={formData.personalLeave}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g., 12"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Currently allocated: {formData.personalLeave || 0} days
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sick Leave (Days)
                      </label>
                      <input
                        type="number"
                        name="sickLeave"
                        min="0"
                        value={formData.sickLeave}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g., 10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Currently allocated: {formData.sickLeave || 0} days
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Annual Leave (Days)
                      </label>
                      <input
                        type="number"
                        name="annualLeave"
                        min="0"
                        value={formData.annualLeave}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g., 15"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Currently allocated: {formData.annualLeave || 0} days
                      </p>
                    </div>
                  </div>

                  {/* Leave Summary Card */}
                  <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Leave Balance Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 mb-1">Personal Leave</p>
                        <p className="text-2xl font-bold text-blue-600">{formData.personalLeave || 0}</p>
                        <p className="text-xs text-gray-500">days available</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 mb-1">Sick Leave</p>
                        <p className="text-2xl font-bold text-purple-600">{formData.sickLeave || 0}</p>
                        <p className="text-xs text-gray-500">days available</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-gray-600 mb-1">Annual Leave</p>
                        <p className="text-2xl font-bold text-green-600">{formData.annualLeave || 0}</p>
                        <p className="text-xs text-gray-500">days available</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Total Leave Days:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {(parseInt(formData.personalLeave) || 0) + 
                           (parseInt(formData.sickLeave) || 0) + 
                           (parseInt(formData.annualLeave) || 0)} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/employees/${id}`)}
                    className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}