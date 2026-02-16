import React, { useEffect, useState } from "react";
import {
  Bell,
  HelpCircle,
  Edit3,
  MoreVertical,
  Calendar,
  DollarSign,
  FileText,
  User,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Star,
  Info,
  Settings,
  ClipboardList,
  Trash2,
  Ban,
  CheckCircle,
  Camera,
  XCircle,
  Clock,
  Plus,
  X,
  Eye,
  EyeOff,
  Copy,
  Key,
  ShieldCheck,
  IndianRupee
} from "lucide-react";
import "../../assets/styles/EmployeeProfileCSS/EmployeeProfile.css";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";
import { useParams, useNavigate } from "react-router-dom";
import { capitalize } from "../../utils/helper";
import { Link } from "react-router-dom";
import { MdClose, MdSecurity } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth";

export default function EmployeeProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [activeTab, setActiveTab] = useState("personal-info");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [salaryData, setSalaryData] = useState();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [profile, setProfile] = useState({});
  const [owner, setOwner] = useState();
  const [tasksData, setTasksData] = useState([]);
  const [leavesData, setLeavesData] = useState();

  // Password and Secret Key States
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [secretKeyForm, setSecretKeyForm] = useState({
    currentKey: "",
    newKey: "",
    confirmKey: "",
  });
  const [secretKey, setSecretKey] = useState("");
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [showCurrentKey, setShowCurrentKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showConfirmKey, setShowConfirmKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };
  const [taskForm, setTaskForm] = useState({
    taskName: "",
    description: "",
    dueDate: "",
    priority: "Medium",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setOwner(user.firstName + " " + user.lastName);

        const result = await employeeService.getDetailsbyId(id);

        console.log("result", result);

        const employeeDetail = {
          name: `${result.data.firstName} ${result.data.lastName}`,
          contactNumber: result.data.contactNumber,
          address: result.data.address,
          employeeId: result.data.employeeId,
          status: result.data.status,
          gender: result.data.gender,
          personalEmail: result.data.personalEmail,
          department: result.data.department.name,
          profilePhoto: result.data.profilePhoto,
          dob: new Date(result.data.dob).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          joiningDate: result.data.joiningDate,
          jobType: result.data.jobType,
          reportingManager: result.data.reportingManager,
          position: result.data.position,
        };
        setProfile(employeeDetail);

        setTasksData(result.tasks);

        setSalaryData(result.Salaries);
        setLeavesData(result.leaves);

        console.log(salaryData);
      } catch (err) {
        console.log("error", err);
      }
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    try {
      const result = await employeeService.deleteEmployee(
        id,
        deletePassword,
        showDeleteModal,
        profile?.status,
      );
      if (result.success) {
        console.log(result);
        showToast(result.message, "success");
        setTimeout(() => {
          navigate(`/admin/employees`);
        }, 1500);
      }
    } catch (err) {
      const { response } = err;
      console.log("delete user error ", err);
      showToast(response.data.message);
    }

    setShowDeleteModal(false);
    setDeletePassword("");
  };

  // Sample data
  const attendanceData = [
    {
      month: "January 2025",
      workingDays: 22,
      present: 21,
      absent: 1,
      onLeave: 2,
    },
    {
      month: "December 2024",
      workingDays: 21,
      present: 20,
      absent: 0,
      onLeave: 1,
    },
    {
      month: "November 2024",
      workingDays: 22,
      present: 22,
      absent: 0,
      onLeave: 0,
    },
  ];

  // const leavesData = [
  //   { id: 1, period: 'Jan 15 - Jan 17, 2025', type: 'Sick Leave', status: 'Approved', reason: 'Medical emergency' },
  //   { id: 2, period: 'Dec 24 - Dec 26, 2024', type: 'Casual Leave', status: 'Approved', reason: 'Personal work' },
  //   { id: 3, period: 'Nov 10 - Nov 11, 2024', type: 'Earned Leave', status: 'Rejected', reason: 'Family function' },
  // ];

  const getStatusColor = (Status) => {
    switch (Status.toLowerCase() || " ") {
      case "paid":
        return "#48bb78";
      case "processing":
        return "#ed8936";
      case "due":
        return "#f56565";
      default:
        return "#718096";
    }
  };

  const taskStatusColor = (status) => {
    switch (status?.toLowerCase() || " ") {
      case "completed":
        return "#10b981"; // green
      case "in progress":
        return "#3b82f6"; // blue
      case "pending":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "#f56565";
      case "medium":
        return "#ed8936";
      case "low":
        return "#48bb78";
      default:
        return "#718096";
    }
  };
  function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = now.getFullYear();

    return `${year}-${month}-${day}`;
  }
  const validateNewtaskForm = (newTask) => {
    console.log(newTask.dueDate + " " + getCurrentDate());
    const currentDate = getCurrentDate();
    if (newTask.dueDate < currentDate) {
      return false;
    }
    return true;
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const newTask = {
      id: tasksData.length + 1,
      ...taskForm,
    };

    try {
      if (validateNewtaskForm(newTask)) {
        const result = await employeeService.addTask(id, newTask);
        setTasksData([...tasksData, newTask]);
        showToast("New task Submitted", "success");

        console.log(result);
      } else {
        showToast("Enter valid Due date", "error");

        return;
      }
    } catch (err) {
      console.log("task err", err);
    }

    setShowTaskModal(false);
    setTaskForm({
      taskName: "",
      description: "",
      dueDate: "",
      priority: "Medium",
    });
  };

  const gettaskStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10b981"; // green
      case "in progress":
        return "#3b82f6"; // blue
      case "pending":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showToast("New passwords do not match", "error");
        return;
      }
      if (passwordForm.newPassword.length < 8) {
        showToast("Password must be at least 8 characters", "error");
        return;
      }

      setIsUpdatingPassword(true);
      const result = await authService.changePassword(
        passwordForm.oldPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword,
      );

      if (result.success) {
        showToast("Password changed successfully", "success");
        setShowChangePasswordModal(false);
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showToast(result.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Password change error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to change password";
      showToast(errorMessage, "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Update Secret Key
  const handleUpdateSecretKey = async (e) => {
    e.preventDefault();
    try {
      if (secretKeyForm.newKey !== secretKeyForm.confirmKey) {
        showToast("New keys do not match", "error");
        return;
      }
      if (secretKeyForm.newKey.length < 16) {
        showToast("Secret key must be at least 16 characters", "error");
        return;
      }

      setIsUpdatingKey(true);
      const result = await authService.updateSecretKey(
        secretKeyForm.currentKey,
        secretKeyForm.newKey,
        secretKeyForm.confirmKey,
      );

      if (result.success) {
        setSecretKey(secretKeyForm.newKey);
        showToast("Secret key updated successfully", "success");
        setTimeout(() => {
          setShowSecretKeyModal(false);
          setSecretKeyForm({
            currentKey: "",
            newKey: "",
            confirmKey: "",
          });
          setSecretKey("");
        }, 1500);
      } else {
        showToast(result.message || "Failed to update secret key", "error");
      }
    } catch (err) {
      console.error("Secret key update error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update secret key";
      showToast(errorMessage, "error");
    } finally {
      setIsUpdatingKey(false);
    }
  };

  const generateSecretKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecretKeyForm({
      ...secretKeyForm,
      newKey: key,
      confirmKey: key,
    });
    showToast("Secret key generated", "success");
  };

  return (
    <>
      <div className="ems-container">
        <AdminSidebar />
        {toast.show && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg animate-slideLeft ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            } max-w-xs sm:max-w-md w-full sm:w-auto backdrop-blur-sm`}
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
        {/* MAIN CONTENT */}
        <main className="main-content">
          {/* TOP HEADER */}
          <header className="top-header flex justify-between items-center bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 border-b-4 border-blue-700 shadow-lg">
            <h1 className="text-3xl font-bold text-black border-l-4 border-white pl-6 drop-shadow-lg flex items-center">
              <User size={22} className="mr-2" />
              Employee Profile
            </h1>
          </header>

          {/* SCROLLABLE CONTENT */}
          <div className="scrollable-content">
            {/* PROFILE CARD */}
            <div
              className="profile-card bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 
               text-white hover:from-blue-700 hover:via-blue-600 hover:to-cyan-500 shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
             >
              <div className="profile-avatar-section">
                <div className="relative">
                  <img
                    src={profile?.profilePhoto?.url || "profilePhoto"}
                    alt={profile?.name}
                    className="profile-img ring-4 ring-white/30 ring-offset-4 ring-offset-blue-600 rounded-full shadow-xl"
                  />
                  <div className="status-indicator bg-white text-blue-600 shadow-lg">
                    <Camera size={16} />
                  </div>
                </div>
              </div>

              <div className="profile-info flex gap-4 items-center justify-center w-full">
                <div className="bg-white/10 !p-4 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/20 shadow-lg max-w-2xl text-left w-full">
                  <div className="flex flex-col gap-2 items-start">
                    <h1 className="profile-name text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                      {capitalize(profile?.name)}
                    </h1>
                    <div className="flex flex-wrap items-center justify-start gap-2 text-white/85 text-sm md:text-base">
                      <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20">
                        Employee ID: {profile?.employeeId}
                      </span>
                      <span className="hidden sm:inline-block text-white/60">
                        •
                      </span>
                      <span className="job-title font-semibold flex items-center">
                        <Briefcase size={16} className="mr-2" />
                        {capitalize(profile?.position)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <span
                      className={`status-badge px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                        profile?.status === "active"
                          ? "bg-green-400/95 text-white"
                          : "bg-red-400/95 text-white"
                      }`}
                    >
                      {capitalize(profile?.status)}
                    </span>
                    <span className="text-white/70 text-xs md:text-sm">
                      Last updated just now
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-actions gap-4 flex flex-wrap items-center justify-end">
                <Link
                  to={`/admin/employees/${id}/edit`}
                  className="edit-btn bg-white/25 hover:bg-white/40 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all font-semibold"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </Link>
                {/* <button className="menu-btn hover:bg-white/30 transition-all transform hover:scale-105">
                  <MoreVertical size={20} />
                </button> */}
              </div>
            </div>

            {/* TABS */}
            <div className="tabs-wrapper mt-8">
              <div className="tabs border-b-2 border-gray-200 gap-1 bg-white/90 backdrop-blur rounded-2xl p-2 shadow-md border border-gray-200">
                {[
                  {
                    name: "Personal Info",
                    icon: User,
                  },
                  {
                    name: "Attendance",
                    icon: Calendar,
                  },
                  {
                    name: "Salary & Payroll",
                    icon: IndianRupee,
                  },
                  {
                    name: "Leaves",
                    icon: FileText,
                  },
                  {
                    name: "Assigned Tasks",
                    icon: ClipboardList,
                  },
                ].map((tab) => (
                  <button
                    key={tab.name}
                    className={`tab px-6 py-3 font-bold border-b-4 transition-all rounded-t-lg transform hover:scale-105 ${
                      activeTab === tab.name.toLowerCase().replace(/\s+/g, "-")
                        ? "border-blue-600 text-blue-600 bg-blue-50 shadow-md"
                        : "border-transparent text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    onClick={() =>
                      setActiveTab(tab.name.toLowerCase().replace(/\s+/g, "-"))
                    }
                  >
                    <tab.icon size={16} className="mr-2" />
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>

            {/* PERSONAL INFO TAB */}
            {activeTab === "personal-info" && (
              <>
                {/* FIRST ROW - CONTACT & QUICK STATS */}
                <div className="content-grid">
                  {/* LEFT: CONTACT INFORMATION */}
                  <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-all">
                    <div className="card-header bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
                      <h3 className="card-title text-xl font-bold text-blue-700 flex items-center">
                        <Phone size={18} className="mr-2" />
                        Contact Information
                      </h3>
                    </div>

                    <div className="contact-info-grid p-6 space-y-4">
                      <div className="info-field bg-blue-50 rounded-xl p-4 transform hover:scale-105 transition-all">
                        <label className="info-label text-blue-600 font-bold text-sm">
                          Phone Number
                        </label>
                        <div className="info-value text-gray-800 font-semibold text-lg mt-2">
                          <Phone size={16} className="text-blue-600 mr-2" />
                          <span>{profile?.contactNumber}</span>
                        </div>
                      </div>

                      <div className="info-field bg-cyan-50 rounded-xl p-4 transform hover:scale-105 transition-all">
                        <label className="info-label text-cyan-600 font-bold text-sm">
                          Personal Email
                        </label>
                        <div className="info-value text-gray-800 font-semibold text-lg mt-2">
                          <Mail size={16} className="text-cyan-600 mr-2" />
                          <span>{profile?.personalEmail}</span>
                        </div>
                      </div>

                      <div className="info-field bg-indigo-50 rounded-xl p-4 transform hover:scale-105 transition-all">
                        <label className="info-label text-indigo-600 font-bold text-sm">
                          Work Location
                        </label>
                        <div className="info-value text-gray-800 font-semibold text-lg mt-2">
                          <MapPin size={16} className="text-indigo-600 mr-2" />
                          <span>Bangalore</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: QUICK STATS */}
                  <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-green-600 hover:shadow-xl transition-all">
                    <h3 className="quick-stats-title bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 p-6 text-xl font-bold text-green-700 flex items-center">
                      <BarChart3 size={18} className="mr-2" />
                      Quick Stats
                    </h3>

                    <div className="p-6 space-y-4">
                      <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-l-4 border-blue-600 hover:shadow-lg transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="stat-label text-gray-600 font-semibold text-sm">
                              Attendance
                            </p>
                            <p className="stat-value text-2xl font-bold text-blue-600 mt-1">
                              98.5%
                            </p>
                          </div>
                          <Calendar size={26} className="text-blue-600" />
                        </div>
                        <span className="stat-change text-green-600 font-bold text-sm mt-2 block">
                          ↑ +2%
                        </span>
                      </div>

                      <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-l-4 border-purple-600 hover:shadow-lg transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="stat-label text-gray-600 font-semibold text-sm">
                              Leave Balance
                            </p>
                            <p className="stat-value text-2xl font-bold text-purple-600 mt-1">
                              12 Days
                            </p>
                          </div>
                          <FileText size={26} className="text-purple-600" />
                        </div>
                      </div>

                      <div className="stat-card bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-l-4 border-orange-600 hover:shadow-lg transition-all transform hover:scale-105">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="stat-label text-gray-600 font-semibold text-sm">
                              Performance
                            </p>
                            <p className="stat-value text-2xl font-bold text-orange-600 mt-1">
                              4.8/5.0
                            </p>
                          </div>
                          <Star size={26} className="text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EMPLOYMENT DETAILS - FULL WIDTH */}
                <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-indigo-600 hover:shadow-xl transition-all">
                  <div className="card-header bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
                    <h3 className="card-title text-xl font-bold text-indigo-700 flex items-center">
                      <Briefcase size={18} className="mr-2" />
                      Employment Details
                    </h3>
                  </div>

                  <div className="details-grid p-6 gap-6">
                    <div className="detail-item bg-indigo-50 rounded-xl p-5 border-l-4 border-indigo-600 transform hover:scale-105 transition-all">
                      <label className="detail-label text-indigo-600 font-bold text-sm">
                        Department
                      </label>
                      <p className="detail-value text-gray-900 font-semibold text-lg mt-2">
                        {profile?.department}
                      </p>
                    </div>

                    <div className="detail-item bg-blue-50 rounded-xl p-5 border-l-4 border-blue-600 transform hover:scale-105 transition-all">
                      <label className="detail-label text-blue-600 font-bold text-sm">
                        Reporting Manager
                      </label>
                      <div className="manager-card flex items-center gap-3 mt-2">
                        <div className="manager-avatar bg-gradient-to-br from-blue-600 to-blue-400 text-white font-bold text-lg">
                          {profile.reportingManager
                            ? profile?.reportingManager.charAt(0).toUpperCase()
                            : "NA"}
                        </div>
                        <span className="detail-value text-gray-900 font-semibold">
                          {profile?.reportingManager}
                        </span>
                      </div>
                    </div>

                    <div className="detail-item bg-cyan-50 rounded-xl p-5 border-l-4 border-cyan-600 transform hover:scale-105 transition-all">
                      <label className="detail-label text-cyan-600 font-bold text-sm">
                        Date of Joining
                      </label>
                      <p className="detail-value text-gray-900 font-semibold text-lg mt-2">
                        {new Date(profile.joiningDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    <div className="detail-item bg-purple-50 rounded-xl p-5 border-l-4 border-purple-600 transform hover:scale-105 transition-all">
                      <label className="detail-label text-purple-600 font-bold text-sm">
                        Contract Type
                      </label>
                      <p className="detail-value text-gray-900 font-semibold text-lg mt-2">
                        {capitalize(profile?.jobType)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECOND ROW - PERSONAL INFO & ACCOUNT ACTIONS */}
                <div className="content-grid">
                  {/* LEFT: PERSONAL INFORMATION */}
                  <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-all">
                    <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                      <h3 className="card-title text-xl font-bold text-blue-700 flex items-center">
                        <Info size={18} className="mr-2" />
                        Personal Information
                      </h3>
                    </div>

                    <div className="details-grid p-6 space-y-4">
                      <div className="detail-item bg-blue-50 rounded-xl p-4 border-l-4 border-blue-600 transform hover:scale-105 transition-all">
                        <label className="detail-label text-blue-600 font-bold text-sm">
                          Date of Birth
                        </label>
                        <p className="detail-value text-gray-900 font-semibold text-lg mt-2">
                          <Calendar size={16} className="text-blue-600 mr-2" />
                          {profile?.dob || "no record"}
                        </p>
                      </div>

                      <div className="detail-item bg-blue-50 rounded-xl p-4 border-l-4 border-blue-600 transform hover:scale-105 transition-all">
                        <label className="detail-label text-blue-600 font-bold text-sm">
                          Gender
                        </label>
                        <p className="detail-value text-gray-900 font-semibold text-lg mt-2">
                          <User size={16} className="text-blue-600 mr-2" />
                          {profile?.gender || "no record"}
                        </p>
                      </div>

                      <div
                        className="detail-item bg-blue-50 rounded-xl p-4 border-l-4 border-blue-600 transform hover:scale-105 transition-all"
                        style={{ gridColumn: "1 / -1" }}
                      >
                        <label className="detail-label text-blue-600 font-bold text-sm">
                          Current Address
                        </label>
                        <p className="detail-value text-gray-900 font-semibold text-lg mt-2">
                          <MapPin size={16} className="text-blue-600 mr-2" />
                          {profile?.address || "India"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: ACCOUNT ACTIONS & TEAM MEMBERS */}
                  <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-red-600 hover:shadow-xl transition-all">
                    <h3 className="quick-stats-title bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200 p-6 text-xl font-bold text-red-700 flex items-center">
                      <Settings size={18} className="mr-2" />
                      Account Actions
                    </h3>

                    <div className="account-actions-section p-6 space-y-3">
                      <div
                        className="action-item bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border-l-4 border-orange-600 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 size={20} className="text-orange-700" />
                          <div className="font-bold text-orange-700">
                            Delete Employee
                          </div>
                        </div>
                      </div>
                      {profile?.status === "active" ? (
                        <div
                          className="action-item bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border-l-4 border-red-600 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
                          onClick={handleDeleteUser}
                        >
                          <div className="flex items-center gap-3">
                            <Ban size={20} className="text-red-700" />
                            <div className="font-bold text-red-700">
                              Deactivate Employee
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="action-item bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-4 border-l-4 border-green-600 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
                          onClick={handleDeleteUser}
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle size={20} className="text-green-700" />
                            <div className="font-bold text-green-700">
                              Activate Employee
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CHANGE PASSWORD & SECRET KEY BUTTONS */}
                      {/* <div
                        className="action-item bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-l-4 border-purple-600 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
                        onClick={() => setShowChangePasswordModal(true)}
                      >
                        <div className="flex items-center gap-3">
                          <Key size={20} className="text-purple-700" />
                          <div className="font-bold text-purple-700">
                            Change Password
                          </div>
                        </div>
                      </div> */}

                      {/* {user?.role === "Admin" && (
                        <div
                          className="action-item bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-l-4 border-blue-600 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
                          onClick={() => setShowSecretKeyModal(true)}
                        >
                          <div className="flex items-center gap-3">
                            <MdSecurity size={20} className="text-blue-700" />
                            <div className="font-bold text-blue-700">
                              Update Secret Key
                            </div>
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* CHANGE PASSWORD MODAL */}
            {showChangePasswordModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <Key size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Change Password</h3>
                        <p className="text-purple-100 text-sm">
                          Update your account password
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowChangePasswordModal(false);
                        setPasswordForm({
                          oldPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <form
                    onSubmit={handleChangePassword}
                    className="p-6 space-y-5"
                  >
                    {/* Info Box */}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-900 font-semibold flex items-center">
                        <ShieldCheck size={16} className="mr-2" />
                        Update your account password
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        Enter your current password and then set a new secure
                        password. Minimum 8 characters required.
                      </p>
                    </div>

                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              oldPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all pr-12"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showOldPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all pr-12"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 8 characters
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm New Password{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all pr-12"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePasswordModal(false);
                          setPasswordForm({
                            oldPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="flex-1 px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 font-semibold transition-all disabled:opacity-50"
                      >
                        {isUpdatingPassword ? "Updating..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* SECRET KEY MODAL */}
            {showSecretKeyModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-lg">
                        <MdSecurity size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          Update Admin Secret Key
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Secure authentication update
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSecretKeyModal(false);
                        setSecretKey("");
                      }}
                      className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <form
                    onSubmit={handleUpdateSecretKey}
                    className="p-6 space-y-5"
                  >
                    {/* Info Box */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900 font-semibold flex items-center">
                        <ShieldCheck size={16} className="mr-2" />
                        Update your admin authentication key
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Enter your current key and set a new secure key. Keep it
                        confidential and change regularly.
                      </p>
                    </div>

                    {/* Current Secret Key */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Secret Key{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentKey ? "text" : "password"}
                          required
                          value={secretKeyForm.currentKey}
                          onChange={(e) =>
                            setSecretKeyForm({
                              ...secretKeyForm,
                              currentKey: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                          placeholder="Enter current secret key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentKey(!showCurrentKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentKey ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Secret Key */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Secret Key <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewKey ? "text" : "password"}
                          required
                          value={secretKeyForm.newKey}
                          onChange={(e) =>
                            setSecretKeyForm({
                              ...secretKeyForm,
                              newKey: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-24"
                          placeholder="Enter new secret key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewKey(!showNewKey)}
                          className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewKey ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={generateSecretKey}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
                          title="Generate"
                        >
                          <Key size={18} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 16 characters
                      </p>
                    </div>

                    {/* Confirm Secret Key */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Secret Key{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmKey ? "text" : "password"}
                          required
                          value={secretKeyForm.confirmKey}
                          onChange={(e) =>
                            setSecretKeyForm({
                              ...secretKeyForm,
                              confirmKey: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                          placeholder="Confirm new secret key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmKey(!showConfirmKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmKey ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Latest Key Display */}
                    {secretKey && (
                      <div className="bg-gray-900 text-white font-mono text-xs p-3 rounded-lg break-all">
                        {showSecretKey
                          ? secretKey
                          : secretKey.replace(/./g, "•")}
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="ml-3 text-gray-300 hover:text-white"
                        >
                          {showSecretKey ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(secretKey)}
                          className="ml-3 text-blue-300 hover:text-blue-200"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSecretKeyModal(false);
                          setSecretKey("");
                          setSecretKeyForm({
                            currentKey: "",
                            newKey: "",
                            confirmKey: "",
                          });
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingKey}
                        className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold transition-all disabled:opacity-50"
                      >
                        {isUpdatingKey ? "Updating..." : "Update Secret Key"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* DELETE USER MODAL */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                  <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                      Delete Employee
                    </h3>
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword("");
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <form onSubmit={handleDeleteUser} className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter Your Password{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                        placeholder="Enter your password"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeletePassword("");
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Delete User
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === "attendance" && (
              <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b-2 border-blue-200 rounded-t-2xl">
                  <h3 className="text-2xl font-bold text-blue-700 flex items-center">
                    <BarChart3 size={20} className="mr-2" />
                    Attendance Records
                  </h3>
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wider">
                          Month
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wider">
                          Total Working Days
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wider">
                          Total Present
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wider">
                          Total Absent
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wider">
                          On Leave
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wider">
                          Attendance %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {attendanceData.map((record, idx) => {
                        const percentage = (
                          (record.present / record.workingDays) *
                          100
                        ).toFixed(1);
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-blue-50 transition-all"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="font-bold text-gray-900">
                                {record.month}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-gray-700 font-semibold">
                              {record.workingDays}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-4 py-2 text-sm font-bold rounded-full bg-green-100 text-green-800 shadow-sm">
                                {record.present}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-4 py-2 text-sm font-bold rounded-full bg-red-100 text-red-800 shadow-sm">
                                {record.absent}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-4 py-2 text-sm font-bold rounded-full bg-yellow-100 text-yellow-800 shadow-sm">
                                {record.onLeave}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`text-lg font-bold px-3 py-1 rounded-full ${
                                  parseFloat(percentage) >= 95
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {percentage}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SALARY & PAYROLL TAB */}
            {activeTab === "salary-&-payroll" && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-lg border-l-4 border-green-700 p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold flex items-center">
                      <IndianRupee size={20} className="mr-2" />
                      Salary & Payroll
                    </h3>
                    <span className="bg-white/20 px-4 py-2 rounded-full font-bold text-sm">
                      {salaryData.length} records
                    </span>
                  </div>
                </div>

                {salaryData.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border-l-4 border-gray-300 p-12 text-center">
                    <IndianRupee
                      size={48}
                      className="text-gray-400 mx-auto mb-4"
                    />
                    <p className="text-gray-900 font-bold text-lg">
                      No Salary Records
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-lg border-l-4 border-green-600 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                          <tr>
                            <th className="px-4 py-4 text-left text-sm font-bold uppercase">
                              Month
                            </th>
                            <th className="px-4 py-4 text-right text-sm font-bold uppercase">
                              Basic
                            </th>
                            <th className="px-4 py-4 text-right text-sm font-bold uppercase">
                              Allow.
                            </th>
                            <th className="px-4 py-4 text-right text-sm font-bold uppercase">
                              Deduct.
                            </th>
                            <th className="px-4 py-4 text-right text-sm font-bold uppercase">
                              Tax %
                            </th>
                            <th className="px-4 py-4 text-right text-sm font-bold uppercase">
                              Net
                            </th>
                            <th className="px-4 py-4 text-center text-sm font-bold uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {salaryData.map((record) => (
                            <tr
                              key={record._id}
                              className="hover:bg-green-50 transition-all"
                            >
                              <td className="px-4 py-4 font-bold text-gray-900">
                                {record?.month || "N/A"} '26
                              </td>
                              <td className="px-4 py-4 text-right text-gray-700 font-semibold">
                                ₹{(record.baseSalary || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-right text-green-600 font-bold">
                                +₹{(record.allowances || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-right text-red-600 font-bold">
                                −₹{(record.deductions || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-right text-amber-600 font-bold">
                                {record.taxApply || 0}%
                              </td>
                              <td className="px-4 py-4 text-right font-bold text-green-600 text-lg">
                                ₹{(record.netSalary || 0).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span
                                  className="px-3 py-2 text-xs font-bold rounded-full inline-block shadow-sm"
                                  style={{
                                    backgroundColor:
                                      getStatusColor(record.Status) + "20",
                                    color: getStatusColor(record.Status),
                                  }}
                                >
                                  {record.Status || "?"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-3">
                      {salaryData.map((record, idx) => (
                        <div
                          key={record.employee || idx}
                          className="bg-white rounded-2xl shadow-lg border-l-4 border-green-600 p-6 hover:shadow-xl transition-all"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-bold text-gray-900 text-lg">
                                {record.month || "N/A"} 2026
                              </p>
                              <p className="text-2xl font-bold text-green-600 mt-2">
                                ₹{(record.netSalary || 0).toLocaleString()}
                              </p>
                            </div>
                            <span
                              className="px-3 py-2 text-xs font-bold rounded-full shadow-sm"
                              style={{
                                backgroundColor:
                                  getStatusColor(record.Status) + "20",
                                color: getStatusColor(record.Status),
                              }}
                            >
                              {record.Status || "?"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-600 font-semibold">
                                Basic:
                              </span>
                              <p className="font-bold text-gray-900">
                                ₹{(record.baseSalary || 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                              <span className="text-green-600 font-semibold">
                                Allow:
                              </span>
                              <p className="font-bold text-green-700">
                                +₹{(record.allowances || 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3">
                              <span className="text-red-600 font-semibold">
                                Deduct:
                              </span>
                              <p className="font-bold text-red-700">
                                −₹{(record.deductions || 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3">
                              <span className="text-amber-600 font-semibold">
                                Tax:
                              </span>
                              <p className="font-bold text-amber-700">
                                {record.taxApply || 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* LEAVES TAB */}
            {activeTab === "leaves" && (
              <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-purple-600 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-2 border-purple-200 rounded-t-2xl">
                  <h3 className="text-2xl font-bold text-purple-700 flex items-center">
                    <FileText size={20} className="mr-2" />
                    Leave Records
                  </h3>
                  <FileText size={24} className="text-purple-600" />
                </div>

                {leavesData && leavesData.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {leavesData.map((leave) => (
                      <div
                        key={leave.id}
                        className="border-2 border-purple-200 rounded-2xl p-5 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-lg hover:border-purple-400 transform hover:scale-105 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-purple-600" />
                            <span className="font-bold text-gray-900 text-lg">
                              {leave?.leaveType}
                            </span>
                          </div>
                          <span
                            className="px-4 py-2 text-sm font-bold rounded-full inline-flex items-center gap-2 shadow-md"
                            style={{
                              backgroundColor:
                                leave.status === "approved"
                                  ? "#d4edda"
                                  : "#f8d7da",
                              color:
                                leave.status === "approved"
                                  ? "#155724"
                                  : "#721c24",
                            }}
                          >
                            {leave.status === "approved" ? (
                              <CheckCircle size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}
                            {leave.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white rounded-lg p-3">
                          <Clock size={18} className="text-purple-600" />
                          <span>
                            {new Date(leave?.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}{" "}
                            -{" "}
                            {new Date(leave?.endDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                      <FileText size={40} className="text-purple-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      No Leave Records
                    </h4>
                    <p className="text-sm text-gray-500 text-center">
                      This employee hasn't taken any leaves yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ASSIGN TASKS TAB */}
            {activeTab === "assigned-tasks" && (
              <div className="card bg-white rounded-2xl shadow-lg border-l-4 border-orange-600 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-6 border-b-2 border-orange-200 rounded-t-2xl">
                  <h3 className="text-2xl font-bold text-orange-700 flex items-center">
                    <ClipboardList size={20} className="mr-2" />
                    Assigned Tasks
                  </h3>
                  <Plus
                    size={24}
                    className="text-orange-600 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setShowTaskModal(true)}
                  />
                </div>

                {tasksData && tasksData.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {tasksData.map((task) => (
                      <div
                        key={task._id}
                        className="border-2 border-orange-200 rounded-2xl p-5 bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-lg hover:border-orange-400 transform hover:scale-105 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-bold text-gray-900">
                            {task?.taskName}
                          </h4>
                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <span
                              className="px-3 py-1 text-xs font-bold rounded-full uppercase shadow-sm"
                              style={{
                                backgroundColor:
                                  getStatusColor(task?.status) + "20",
                                color: taskStatusColor(task?.status),
                              }}
                            >
                              {task?.status}
                            </span>
                            {/* Priority Badge */}
                            <span
                              className="px-3 py-1 text-xs font-bold rounded-full uppercase shadow-sm"
                              style={{
                                backgroundColor:
                                  getPriorityColor(task?.priority) + "20",
                                color: getPriorityColor(task?.priority),
                              }}
                            >
                              {task?.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed bg-white rounded-lg p-3">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white rounded-lg p-3">
                          <Calendar size={18} className="text-orange-600" />
                          <span>
                            Due:{" "}
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                      <FileText size={40} className="text-orange-400" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      No Tasks Assigned
                    </h4>
                    <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                      This employee doesn't have any assigned tasks yet.
                    </p>
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="px-6 py-3 bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 font-bold transition-all transform hover:scale-105 shadow-lg"
                    >
                      <Plus size={18} className="inline mr-2" />
                      Assign New Task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm?.taskName}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, taskName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter task name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, priority: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
