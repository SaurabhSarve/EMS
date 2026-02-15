import { useState, useEffect } from "react";
import AdminSidebar from "../../Components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { leaveService } from "../../services/leaveServive";
import { employeeService } from "../../services/employeeServices";
import { Calendar, CheckCircle, XCircle, Clock, Upload } from "lucide-react";
import { MdClose } from "react-icons/md";

const leaveOptions = [
  { value: "planned_leave", label: "Planned Leave (48 hours advance)", minHours: 48, requiresDocument: false },
  { value: "unplanned_leave", label: "Unplanned Leave (2 hours advance)", minHours: 2, requiresDocument: false },
  { value: "sick_leave", label: "Sick Leave (4 hours advance)", minHours: 4, requiresDocument: true },
];

export default function HeadApplyLeave() {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState("planned_leave");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });
  const [leaves, setLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("apply");
  const [currentLeaveStatus, setCurrentLeaveStatus] = useState(null);

  useEffect(() => {
    fetchLeaves();
    fetchCurrentLeaveStatus();
  }, []);

  const fetchCurrentLeaveStatus = async () => {
    try {
      const result = await employeeService.getEmployeedashboardStats();
      if (result?.data?.currentLeaveStatus) {
        setCurrentLeaveStatus(result.data.currentLeaveStatus);
      }
    } catch (error) {
      console.error("Error fetching leave status:", error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const result = await employeeService.getLeavesdetails();
      setLeaves(result.data || []);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      showToast("Failed to fetch leave data", "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast({ show: false, type: "success", message: "" }), 3500);
  };

  const pushHeadLeaveNotification = (leaveData) => {
    try {
      const existing = JSON.parse(localStorage.getItem("headLeaveRequests") || "[]");
      const entry = {
        id: `head-leave-${Date.now()}`,
        headName: user?.firstName
          ? `${user.firstName} ${user?.lastName || ""}`.trim()
          : "Department Head",
        leaveType: leaveData.leaveType,
        fromDate: leaveData.fromDate,
        toDate: leaveData.toDate,
        reason: leaveData.reason,
        submittedAt: new Date().toISOString(),
      };
      const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, 20);
      localStorage.setItem("headLeaveRequests", JSON.stringify(next));
    } catch (error) {
      console.error("Failed to store leave notification", error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast("File size must be less than 10MB", "error");
        return;
      }
      // Check file type - Only PDF, JPG, PNG
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        showToast("Only PDF, JPG, and PNG files are allowed", "error");
        return;
      }
      setUploadedFile(file);
    }
  };

  const validateAdvanceNotice = (leaveType, fromDate) => {
    const selectedLeave = leaveOptions.find(opt => opt.value === leaveType);
    if (!selectedLeave) return { valid: true };

    const minHours = selectedLeave.minHours;
    const now = new Date();
    const leaveStart = new Date(fromDate);
    
    const hoursUntilLeave = (leaveStart - now) / (1000 * 60 * 60);
    
    if (hoursUntilLeave < minHours) {
      return {
        valid: false,
        message: `${selectedLeave.label.split('(')[0].trim()} requires ${minHours} hours advance notice. Leave starts in ${Math.round(hoursUntilLeave)} hours.`
      };
    }
    
    return { valid: true };
  };

  const checkOverlappingLeaves = (fromDate, toDate) => {
    const leaveStart = new Date(fromDate);
    const leaveEnd = new Date(toDate);
    leaveStart.setHours(0, 0, 0, 0);
    leaveEnd.setHours(23, 59, 59, 999);

    const userLeaves = leaves.filter(leave => leave.isHeadRequest);
    
    for (let leave of userLeaves) {
      if (leave.status !== 'rejected') { // Don't check rejected leaves
        const existingStart = new Date(leave.startDate);
        const existingEnd = new Date(leave.endDate);
        existingStart.setHours(0, 0, 0, 0);
        existingEnd.setHours(23, 59, 59, 999);

        // Check for overlap
        if (leaveStart <= existingEnd && leaveEnd >= existingStart) {
          return {
            valid: false,
            message: `You already have a ${leave.status} leave from ${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}.`
          };
        }
      }
    }
    
    return { valid: true };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!fromDate || !toDate || !reason.trim()) {
      showToast("Please complete all fields.", "error");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      showToast("End date cannot be before start date.", "error");
      return;
    }

    // Validate advance notice
    const advanceValidation = validateAdvanceNotice(leaveType, fromDate);
    if (!advanceValidation.valid) {
      showToast(advanceValidation.message, "error");
      return;
    }

    // Check for overlapping leaves
    const overlapValidation = checkOverlappingLeaves(fromDate, toDate);
    if (!overlapValidation.valid) {
      showToast(overlapValidation.message, "error");
      return;
    }

    // Check if document is required for Sick Leave
    const selectedLeave = leaveOptions.find(opt => opt.value === leaveType);
    if (selectedLeave?.requiresDocument && !uploadedFile) {
      showToast("Supporting document is mandatory for Sick Leave.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('leaveData', JSON.stringify({
        leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
      }));
      
      if (uploadedFile) {
        formData.append('document', uploadedFile);
      }

      const response = await leaveService.applyLeaveWithDocument(formData);
      if (response?.success) {
        showToast("Leave request submitted successfully!");
        pushHeadLeaveNotification({ leaveType, fromDate, toDate, reason: reason.trim() });
        fetchLeaves();
        fetchCurrentLeaveStatus();
        setLeaveType("planned_leave");
        setFromDate("");
        setToDate("");
        setReason("");
        setUploadedFile(null);
      } else {
        showToast("Unable to submit leave request.", "error");
        return;
      }
    } catch (error) {
      showToast("Unable to submit leave request.", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      console.log("Approving leave:", leaveId);
      const response = await leaveService.leaveAction(leaveId, "Approved");
      console.log("Approve response:", response);
      if (response?.success) {
        showToast("Leave approved successfully!");
        fetchLeaves();
      } else {
        showToast(response?.message || "Failed to approve leave", "error");
      }
    } catch (error) {
      console.error("Leave approval error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Error approving leave";
      showToast(errorMsg, "error");
    }
  };

  const handleReject = async (leaveId) => {
    try {
      console.log("Rejecting leave:", leaveId);
      const response = await leaveService.leaveAction(leaveId, "Rejected");
      console.log("Reject response:", response);
      if (response?.success) {
        showToast("Leave rejected successfully!");
        fetchLeaves();
      } else {
        showToast(response?.message || "Failed to reject leave", "error");
      }
    } catch (error) {
      console.error("Leave rejection error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Error rejecting leave";
      showToast(errorMsg, "error");
    }
  };

  const handleDelete = async (leaveId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this leave request?")) {
        return;
      }

      console.log("Deleting leave:", leaveId);
      const response = await leaveService.deleteLeave(leaveId);
      console.log("Delete response:", response);

      if (response?.success) {
        showToast("Leave deleted successfully!");
        fetchLeaves();
      } else {
        showToast(response?.message || "Failed to delete leave", "error");
      }
    } catch (error) {
      console.error("Leave deletion error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Error deleting leave";
      showToast(errorMsg, "error");
    }
  };

  const canApproveLeave = (leave) => {
    // Can approve leaves from employees, but not own leaves
    return !leave.isHeadRequest && leave?.employee?._id !== user?._id;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      planned_leave: 'bg-blue-100 text-blue-800',
      unplanned_leave: 'bg-purple-100 text-purple-800',
      sick_leave: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getLeaveTypeLabel = (type) => {
    const option = leaveOptions.find(opt => opt.value === type);
    return option ? option.label.split('(')[0].trim() : type;
  };

  const scrollToForm = () => {
    const target = document.getElementById("head-apply-leave-form");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderLeaveNotification = () => {
    if (!currentLeaveStatus || !currentLeaveStatus.onLeave) return null;

    const activeLeave = currentLeaveStatus.activeLeave;
    if (!activeLeave) return null;

    return (
      <div className="mx-[15px] md:mx-[30px] mb-6 p-4 bg-orange-50 border border-orange-300 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white font-bold text-sm">!</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-orange-900 text-base">You are currently on leave</h3>
            <p className="text-orange-800 text-sm mt-1">
              Your {activeLeave.leaveType} leave is active from {new Date(activeLeave.startDate).toLocaleDateString()} to {new Date(activeLeave.endDate).toLocaleDateString()}
            </p>
            <p className="text-orange-700 text-xs mt-2 font-medium">
              You cannot apply for new leave while on active leave. Please wait until your current leave ends.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <AdminSidebar />

      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        {renderLeaveNotification()}
        
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-6 py-6 text-white shadow-xl border border-white/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-100">Department Head</p>
              <h1 className="text-2xl sm:text-3xl font-bold"> My Leave Management</h1>
              <p className="text-sm text-blue-100 mt-1">
                Efficiently manage and process all leave requests.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("myLeaves")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "myLeaves"
                    ? "bg-white text-blue-600"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                My Leaves
              </button>
              <button
                onClick={() => setActiveTab("apply")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "apply"
                    ? "bg-white text-blue-600"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Apply Leaves
              </button>
            </div>
          </div>
        </header>

        {/* Quick Stats - My Leaves Summary */}
        {activeTab === "myLeaves" && leaves.filter((leave) => leave.isHeadRequest).length > 0 && (
          <section className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-md border border-blue-100">
              <p className="text-sm text-slate-600 font-medium">Total My Leaves</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{leaves.filter((leave) => leave.isHeadRequest).length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-md border border-green-100">
              <p className="text-sm text-slate-600 font-medium">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{leaves.filter((leave) => leave.isHeadRequest && leave.status === "approved").length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-md border border-yellow-100">
              <p className="text-sm text-slate-600 font-medium">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{leaves.filter((leave) => leave.isHeadRequest && leave.status === "pending").length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-md border border-red-100">
              <p className="text-sm text-slate-600 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{leaves.filter((leave) => leave.isHeadRequest && leave.status === "rejected").length}</p>
            </div>
          </section>
        )}

        {/* Tab Content */}
        {activeTab === "myLeaves" && (
          <section className="mt-8">
            <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                My Leaves
              </h2>

              {leaves.filter((leave) => leave.isHeadRequest).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">You haven't applied for any leaves yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.filter((leave) => leave.isHeadRequest).map((leave) => (
                    <div
                      key={leave._id}
                      className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getLeaveTypeColor(leave.leaveType)}`}>
                              {leave.leaveType}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{leave.reason}</p>
                          <p className="text-xs text-gray-500 mt-2 font-medium">Duration: {leave.totalDays} days</p>
                        </div>
                        <button
                          onClick={() => handleDelete(leave._id)}
                          className="px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all w-full sm:w-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "leaves" && (
          <section className="mt-8">
            <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Employee Leave Requests
              </h2>

              {leaves.filter((leave) => !leave.isHeadRequest).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No employee leave requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.filter((leave) => !leave.isHeadRequest).map((leave) => (
                    <div
                      key={leave._id}
                      className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-bold text-gray-900">
                              {leave?.employee?.firstName || "Employee"}
                            </h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getLeaveTypeColor(leave.leaveType)}`}>
                              {leave.leaveType}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(leave.status)}`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{leave.reason}</p>
                        </div>

                        <div className="flex gap-2">
                          {leave.status === "pending" && canApproveLeave(leave) && (
                            <>
                              <button
                                onClick={() => handleApprove(leave._id)}
                                className="px-3 py-2 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleReject(leave._id)}
                                className="px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-all"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(leave._id)}
                            className="px-3 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "apply" && (
          <section className="mt-8">
            <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Apply New Leave</h2>
              <p className="text-sm text-slate-500 mb-6">Fill in the details below to request time off.</p>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: main form fields (span 2 on large screens) */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Leave Type with Rules */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Leave Type</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {leaveOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {/* Info Box for Selected Leave Type */}
                    <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900">
                        {leaveOptions.find(opt => opt.value === leaveType)?.label}
                      </p>
                      <p className="text-xs text-blue-800 mt-1">
                        {leaveType === 'planned_leave' && 'Must be applied at least 48 hours before leave start date.'}
                        {leaveType === 'unplanned_leave' && 'Must be applied at least 2 hours before leave start date.'}
                        {leaveType === 'sick_leave' && 'Must be applied within 4 hours before leave start date. Supporting document is mandatory.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">From</label>
                      <div className="mt-2 relative">
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">To</label>
                      <div className="mt-2 relative">
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          min={fromDate || undefined}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Reason</label>
                    <textarea
                      rows={5}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Describe why you need this leave (provide context or coverage plans)."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-70"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLeaveType('planned_leave'); setFromDate(''); setToDate(''); setReason(''); setUploadedFile(null); }}
                      className="px-5 py-3 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Right: upload panel */}
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                  <label className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-slate-600" />
                        Supporting Document
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                    <div className={`text-xs font-semibold px-2 py-1 rounded ${
                      leaveType === 'sick_leave' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {leaveType === 'sick_leave' ? 'Required' : 'Optional'}
                    </div>
                  </label>

                  <div
                    className="mt-4 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-white p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => document.getElementById('head-upload-input')?.click()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } }); }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600">Click or drag file here</p>
                    <p className="text-xs text-slate-400">PDF, JPG, PNG only</p>
                    <input id="head-upload-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                  </div>

                  {uploadedFile ? (
                    <div className="mt-4 bg-white p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {uploadedFile.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(uploadedFile)} alt="preview" className="w-12 h-12 object-cover rounded-md" />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">{uploadedFile.name.split('.').pop().toUpperCase()}</div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{uploadedFile.name}</p>
                            <p className="text-xs text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setUploadedFile(null)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Remove</button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
