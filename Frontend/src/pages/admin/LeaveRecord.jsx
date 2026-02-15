import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { MdClose } from 'react-icons/md';
import AdminSidebar from '../../Components/AdminSidebar';
import { employeeService } from '../../services/employeeServices';
import { capitalize } from '../../utils/helper';
import { leaveService } from '../../services/leaveServive';
import { useAuth } from '../../context/AuthContext';

const LeaveRecord = () => {
  const [leaves, setLeaves] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isDepartmentHead = user?.role === "Department Head";
  const [headLeaveType, setHeadLeaveType] = useState("annual");
  const [headFromDate, setHeadFromDate] = useState("");
  const [headToDate, setHeadToDate] = useState("");
  const [headReason, setHeadReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headTab, setHeadTab] = useState("requests");
  const [headLeaveStatusUpdates, setHeadLeaveStatusUpdates] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState("all"); // all, employee, head

  const showToastMessage = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const pushHeadLeaveNotification = (leaveData) => {
    try {
      const existing = JSON.parse(localStorage.getItem('headLeaveRequests') || '[]');
      const entry = {
        id: `head-leave-${Date.now()}`,
        headName: user?.firstName
          ? `${user.firstName} ${user?.lastName || ''}`.trim()
          : 'Department Head',
        leaveType: leaveData.leaveType,
        fromDate: leaveData.fromDate,
        toDate: leaveData.toDate,
        reason: leaveData.reason,
        submittedAt: new Date().toISOString(),
      };
      const next = [entry, ...(Array.isArray(existing) ? existing : [])].slice(0, 20);
      localStorage.setItem('headLeaveRequests', JSON.stringify(next));
    } catch (error) {
      console.error('Failed to store leave notification', error);
    }
  };

  const pushHeadLeaveStatusNotification = (leave, status) => {
    try {
      const existing = JSON.parse(localStorage.getItem('headLeaveStatusNotifications') || '[]');
      const entry = {
        id: leave?._id,
        leaveId: leave?._id,
        leaveType: leave?.leaveType,
        fromDate: leave?.startDate,
        toDate: leave?.endDate,
        status,
        updatedAt: new Date().toISOString(),
      };
      const normalized = Array.isArray(existing) ? existing : [];
      const deduped = normalized.filter((item) => item?.id !== entry.id);
      const next = [entry, ...deduped].slice(0, 20);
      localStorage.setItem('headLeaveStatusNotifications', JSON.stringify(next));
    } catch (error) {
      console.error('Failed to store leave status notification', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isDepartmentHead) {
      return;
    }

    const refreshLeaves = () => {
      fetchData();
    };

    refreshLeaves();
    const intervalId = setInterval(refreshLeaves, 30000);
    const handleFocus = () => refreshLeaves();
    const handleVisibility = () => {
      if (!document.hidden) {
        refreshLeaves();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isDepartmentHead]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (!isDepartmentHead) {
      return;
    }

    const readIds = JSON.parse(localStorage.getItem('headLeaveStatusRead') || '[]');
    const readSet = new Set(Array.isArray(readIds) ? readIds : []);
    const ownLeaves = leaves.filter((leave) => leave?.employee?._id === user?._id);
    const updates = ownLeaves
      .filter((leave) => leave?.status && leave.status !== 'pending')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((leave) => ({
        id: leave._id,
        leaveType: leave.leaveType,
        fromDate: leave.startDate,
        toDate: leave.endDate,
        status: leave.status,
        updatedAt: leave.updatedAt || leave.createdAt,
        isReadByHead: readSet.has(leave._id),
      }));

    setHeadLeaveStatusUpdates(updates);
  }, [isDepartmentHead, leaves, user?._id]);

  const fetchData = async () => {
    try {
      const result = await employeeService.getLeavesdetails();
      console.log(result.data);
      setLeaves(result.data);
    } catch (err) {
      console.log("leave err ", err);
      showToastMessage("Failed to fetch leave data", "error");
    }
  }

  // Check if current user can approve/reject a leave
  const canApproveLeave = (leave) => {
    if (isAdmin) return true; // Admin can approve any leave
    if (isDepartmentHead) {
      // Department Head can approve leaves from their employees
      // Employee's leave (not head's own leave)
      return !leave.isHeadRequest && leave?.employee?._id !== user?._id;
    }
    return false;
  };

  const handleApprove = async (id, Lid) => {
    try {
      console.log("Approving leave:", Lid);
      // Backend expects capitalized "Approved"
      const response = await leaveService.leaveAction(Lid, "Approved");
      console.log("Approve response:", response);
      
      // Check if response is successful
      if (response?.success) {
        const targetLeave = leaves.find((leave) => leave?._id === Lid);
        // Update state optimistically
        setLeaves(leaves.map(leave => 
          leave?._id === Lid ? { ...leave, status: 'approved' } : leave
        ));

        if (targetLeave?.employee?.role === 'Department Head') {
          pushHeadLeaveStatusNotification(targetLeave, 'approved');
        }
        
        showToastMessage("Leave approved successfully!", "success");
      } else {
        showToastMessage(response?.message || "Failed to approve leave", "error");
      }
    } catch (err) {
      console.error("Leave approval error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to approve leave";
      showToastMessage(errorMsg, "error");
    }
  };

  const handleReject = async (id, Lid) => {
    try {
      console.log("Rejecting leave:", Lid);
      // Backend expects capitalized "Rejected"
      const response = await leaveService.leaveAction(Lid, "Rejected");
      console.log("Reject response:", response);
      
      // Check if response is successful
      if (response?.success) {
        const targetLeave = leaves.find((leave) => leave?._id === Lid);
        // Update state optimistically
        setLeaves(leaves.map(leave => 
          leave?._id === Lid ? { ...leave, status: 'rejected' } : leave
        ));

        if (targetLeave?.employee?.role === 'Department Head') {
          pushHeadLeaveStatusNotification(targetLeave, 'rejected');
        }
        
        showToastMessage("Leave rejected successfully!", "success");
      } else {
        showToastMessage(response?.message || "Failed to reject leave", "error");
      }
    } catch (err) {
      console.error("Leave rejection error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to reject leave";
      showToastMessage(errorMsg, "error");
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
        // Remove from state
        setLeaves(leaves.filter(leave => leave?._id !== leaveId));
        showToastMessage("Leave deleted successfully!", "success");
      } else {
        showToastMessage(response?.message || "Failed to delete leave", "error");
      }
    } catch (err) {
      console.error("Leave deletion error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete leave";
      showToastMessage(errorMsg, "error");
    }
  };


  const handleHeadStatusRead = (updateId) => {
    const readIds = JSON.parse(localStorage.getItem('headLeaveStatusRead') || '[]');
    const nextReadIds = Array.from(new Set([...(Array.isArray(readIds) ? readIds : []), updateId]));
    localStorage.setItem('headLeaveStatusRead', JSON.stringify(nextReadIds));
    setHeadLeaveStatusUpdates((prev) =>
      prev.map((update) =>
        update.id === updateId ? { ...update, isReadByHead: true } : update
      )
    );
  };

  const handleHeadStatusReadAll = () => {
    const allIds = headLeaveStatusUpdates.map((update) => update.id);
    localStorage.setItem('headLeaveStatusRead', JSON.stringify(allIds));
    setHeadLeaveStatusUpdates((prev) =>
      prev.map((update) => ({ ...update, isReadByHead: true }))
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const displayLeaves = (() => {
    if (leaveFilter === "employee") {
      return leaves.filter(leave => !leave.isHeadRequest);
    } else if (leaveFilter === "head") {
      return leaves.filter(leave => leave.isHeadRequest);
    } else {
      return leaves;
    }
  })();

  const totalLeaves = displayLeaves.length;
  const pendingLeaves = displayLeaves.filter((leave) => leave?.status === 'pending').length;
  const approvedLeaves = displayLeaves.filter((leave) => leave?.status === 'approved').length;
  const rejectedLeaves = displayLeaves.filter((leave) => leave?.status === 'rejected').length;

  const scrollToForm = () => {
    const target = document.getElementById('head-apply-leave-form');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Check for date conflict with existing head leaves
  const checkForHeadConflicts = () => {
    if (!headFromDate || !headToDate || !leaves || leaves.length === 0) {
      return null;
    }

    const newStart = new Date(headFromDate);
    const newEnd = new Date(headToDate);
    newStart.setHours(0, 0, 0, 0);
    newEnd.setHours(23, 59, 59, 999);

    // Get head's leaves only
    const headLeaves = leaves.filter(leave => leave?.employee?._id === user?._id);

    // Check if head is currently on active leave
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeLeave = headLeaves.find(leave => {
      if (leave.status !== 'approved') return false;
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    });

    if (activeLeave) {
      return {
        type: 'onLeave',
        message: `You are currently on ${activeLeave.leaveType} leave (${new Date(activeLeave.startDate).toLocaleDateString()} to ${new Date(activeLeave.endDate).toLocaleDateString()}). You cannot apply for new leave while on active leave.`
      };
    }

    // Check for pending leaves
    const pendingHeadLeaves = headLeaves.filter(leave => leave.status === 'pending');
    if (pendingHeadLeaves.length > 0) {
      return {
        type: 'pending',
        message: 'You already have a pending leave request'
      };
    }

    // Check for date conflicts
    for (const leave of headLeaves) {
      if (leave.status === 'pending' || leave.status === 'approved') {
        const existingStart = new Date(leave.startDate);
        const existingEnd = new Date(leave.endDate);
        existingStart.setHours(0, 0, 0, 0);
        existingEnd.setHours(23, 59, 59, 999);

        // Check overlap
        if (newStart <= existingEnd && newEnd >= existingStart) {
          return {
            type: 'conflict',
            message: `Dates clash with ${leave.status} leave (${existingStart.toLocaleDateString()} to ${existingEnd.toLocaleDateString()})`
          };
        }
      }
    }

    return null;
  };

  const handleHeadSubmit = (event) => {
    event.preventDefault();

    if (!headFromDate || !headToDate || !headReason.trim()) {
      showToastMessage('Please complete all fields.', 'error');
      return;
    }

    if (new Date(headToDate) < new Date(headFromDate)) {
      showToastMessage('To date cannot be before From date.', 'error');
      return;
    }

    // Check for conflicts
    const conflict = checkForHeadConflicts();
    if (conflict) {
      showToastMessage(conflict.message, 'error');
      return;
    }

    setIsSubmitting(true);

    const leaveData = {
      leaveType: headLeaveType,
      fromDate: headFromDate,
      toDate: headToDate,
      reason: headReason.trim(),
    };

    leaveService
      .applyLeave(leaveData)
      .then((response) => {
        if (response?.success) {
          showToastMessage('Leave request submitted to Admin.', 'success');
          pushHeadLeaveNotification(leaveData);
          fetchData();
          setHeadLeaveType('annual');
          setHeadFromDate('');
          setHeadToDate('');
          setHeadReason('');
        } else {
          showToastMessage(response?.message || 'Unable to submit leave request.', 'error');
        }
      })
      .catch((error) => {
        showToastMessage(
          error?.response?.data?.message || 
          'Unable to submit leave request. Please try again.',
          'error'
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const leaveContent = (
    <>
      {/* Stat Cards Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-700 font-black mb-3">Total</p>
                <p className="text-3xl font-black text-blue-900">{totalLeaves}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-blue-300/50 transition-all duration-300 transform group-hover:rotate-12">
                <Calendar className="w-6 h-6 text-white font-black" />
              </div>
            </div>
            <p className="text-xs text-blue-600 font-semibold">All leave requests</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg hover:shadow-xl hover:border-amber-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-700 font-black mb-3">Pending</p>
                <p className="text-3xl font-black text-amber-900">{pendingLeaves}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-amber-300/50 transition-all duration-300 transform group-hover:rotate-12">
                <Clock className="w-6 h-6 text-white font-black" />
              </div>
            </div>
            <p className="text-xs text-amber-600 font-semibold">Awaiting approval</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg hover:shadow-xl hover:border-emerald-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-black mb-3">Approved</p>
                <p className="text-3xl font-black text-emerald-900">{approvedLeaves}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-emerald-300/50 transition-all duration-300 transform group-hover:rotate-12">
                <CheckCircle className="w-6 h-6 text-white font-black" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-semibold">Confirmed leaves</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200 shadow-lg hover:shadow-xl hover:border-rose-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-rose-700 font-black mb-3">Rejected</p>
                <p className="text-3xl font-black text-rose-900">{rejectedLeaves}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-rose-300/50 transition-all duration-300 transform group-hover:rotate-12">
                <XCircle className="w-6 h-6 text-white font-black" />
              </div>
            </div>
            <p className="text-xs text-rose-600 font-semibold">Declined requests</p>
          </div>
        </div>
      </div>

      {/* No Records Message */}
      {displayLeaves.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-16 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50 flex items-center justify-center mb-8 shadow-lg border border-blue-200">
              <Calendar className="w-14 h-14 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No Leave Requests</h3>
            <p className="text-gray-600 max-w-md mb-3 text-lg font-medium">There are currently no leave requests to display.</p>
            <p className="text-sm text-gray-400">Employees can submit their leave requests, which will appear here.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 border-b-2 border-blue-700">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Employee</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Month</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Date Range</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Leave Type</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Reason</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayLeaves.map((leave) => {
                    const isOwnHeadLeave = isDepartmentHead && leave?.employee?._id === user?._id;

                    return (
                      <tr key={leave?._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 group">
                      <td className="px-6 py-5">
                        <div className="min-w-max">
                          <div className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                            {capitalize(leave?.employee?.firstName || leave?.headName || "Head")}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-medium">
                            {leave?.employee?.employeeId || (leave.isHeadRequest ? "HEAD" : "")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-gray-700 text-sm min-w-max font-medium">
                          <Calendar className="w-4 h-4 mr-2.5 text-blue-500 flex-shrink-0" />
                          <span className="hidden xl:inline">{getMonthYear(leave?.startDate)}</span>
                          <span className="xl:hidden">{new Date(leave?.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-gray-900 min-w-max">
                          {formatDate(leave?.startDate)} - {formatDate(leave?.endDate)}
                        </div>
                              <div className="text-xs text-gray-500 min-w-max mt-1 font-medium">{leave?.totalDays} {leave?.totalDays === 1 ? 'day' : 'days'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-3 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave?.leaveType}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-gray-700 max-w-[200px] min-w-[120px] font-medium">{leave?.reason}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${getStatusColor(leave.status)}`}>
                          {leave?.status === 'pending' && <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                          {leave?.status === 'approved' && <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                          {leave?.status === 'rejected' && <XCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                          {leave?.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2.5 min-w-max">
                          {leave.status === 'pending' ? (
                            canApproveLeave(leave) ? (
                              <div className="flex gap-2.5">
                                <button
                                  onClick={() => handleApprove(leave?.employee?._id, leave?._id)}
                                  className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all shadow-lg hover:shadow-xl whitespace-nowrap uppercase tracking-wide"
                                >
                                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(leave?.employee?._id, leave?._id)}
                                  className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg hover:from-red-600 hover:to-rose-700 active:scale-95 transition-all shadow-lg hover:shadow-xl whitespace-nowrap uppercase tracking-wide"
                                >
                                  <XCircle className="w-4 h-4 flex-shrink-0" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 whitespace-nowrap font-bold">Pending approval</span>
                            )
                          ) : null}
                          <button
                            onClick={() => handleDelete(leave?._id)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-bold rounded-lg hover:from-orange-600 hover:to-red-700 active:scale-95 transition-all shadow-lg hover:shadow-xl whitespace-nowrap uppercase tracking-wide"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="md:hidden mt-8 pt-6 border-t-2 border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Leave Requests</h2>
            <div className="space-y-4">
              {displayLeaves.map((leave) => {
                const isOwnHeadLeave = isDepartmentHead && leave?.employee?._id === user?._id;

                return (
                  <div key={leave?._id} className="bg-white/95 backdrop-blur rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-4 border-b border-blue-200">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {capitalize(leave?.employee?.firstName || leave?.headName || "Head")}
                        </h3>
                        <p className="text-xs text-blue-100 mt-0.5">
                          {leave?.employee?.employeeId || (leave.isHeadRequest ? "HEAD" : "")}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${getStatusColor(leave.status)}`}>
                        {leave.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                        {leave.status === 'approved' && <CheckCircle className="w-4 h-4 mr-1" />}
                        {leave.status === 'rejected' && <XCircle className="w-4 h-4 mr-1" />}
                        {leave.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 py-4 space-y-3">
                    <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                      <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold">Date Range</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {formatDate(leave?.startDate)} - {formatDate(leave?.endDate)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{leave?.totalDays} {leave?.totalDays === 1 ? 'day' : 'days'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Leave Type</p>
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave?.leaveType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                        <div className="w-3 h-3 rounded-full bg-gray-400 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Reason</p>
                        <p className="text-sm text-gray-700 font-medium">{leave?.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col gap-2">
                    {leave.status === 'pending' ? (
                      canApproveLeave(leave) ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(leave?.employee?._id, leave?._id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave?.employee?._id, leave?._id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-semibold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 font-semibold">Pending approval</span>
                      )
                    ) : null}
                    <button
                      onClick={() => handleDelete(leave?._id)}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-br from-orange-500 to-red-600 text-white text-xs font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-white">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg animate-slideLeft ${
          toast.type === "error" 
            ? "bg-red-500 text-white" 
            : "bg-green-500 text-white"
        } max-w-xs sm:max-w-md w-full sm:w-auto`}>
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

      <AdminSidebar />
    
      <div className="flex-1 mt-3 w-full min-w-0 lg:ml-64">
        <div className="p-4 pt-16 md:p-6 md:pt-6 lg:p-8 lg:pt-8 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-full">
            {/* Header Section */}
            <div className="mb-10">
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 text-white relative overflow-hidden group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {/* Decorative corner elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300/20 rounded-full -ml-16 -mb-16 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/50 group-hover:shadow-cyan-500/30 transition-all duration-300">
                      <Calendar className="w-7 h-7 text-white drop-shadow-lg" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">Leave Management</h1>
                      <p className="text-cyan-100 mt-2 text-sm md:text-base font-medium drop-shadow">
                        Manage and Process all employee leave requests
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {isDepartmentHead && (
                      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/30 bg-white/20 p-2">
                        {[
                          { key: "requests", label: "Leave Requests" },
                          // { key: "apply", label: "Apply Leave" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setHeadTab(tab.key)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                              headTab === tab.key
                                ? "bg-white text-blue-600 shadow-md"
                                : "text-white/90 hover:bg-white/15"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/30 bg-white/20 p-2">
                        {[
                          { key: "all", label: "All Leaves" },
                          { key: "employee", label: "Employee Leaves" },
                          { key: "head", label: "Head Leaves" },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setLeaveFilter(tab.key)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                              leaveFilter === tab.key
                                ? "bg-white text-blue-600 shadow-md"
                                : "text-white/90 hover:bg-white/15"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-sm text-white bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-lg border border-white/40 rounded-2xl px-6 py-3 shadow-2xl font-semibold min-w-fit group-hover:border-white/60 group-hover:shadow-cyan-400/30 transition-all duration-300">
                      <p className="text-cyan-100 text-xs uppercase tracking-wider mb-1 font-bold">Total Requests</p>
                      <p className="text-3xl font-black text-white">{totalLeaves}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isDepartmentHead ? (
              <div className="mt-6">
                {headTab === "requests" ? (
                  leaveContent
                ) : (
                  (() => {
                    // Check if head is currently on active leave
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const headLeaves = leaves.filter(leave => leave?.employee?._id === user?._id);
                    const activeLeave = headLeaves.find(leave => {
                      if (leave.status !== 'approved') return false;
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      start.setHours(0, 0, 0, 0);
                      end.setHours(23, 59, 59, 999);
                      return today >= start && today <= end;
                    });

                    return (
                      <div className="flex justify-center">
                        {/* Show orange alert if head is currently on leave */}
                        {activeLeave && (
                          <div className="absolute top-24 left-0 right-0 mx-6 md:mx-[30px] z-40">
                            <div className="mx-auto w-full max-w-3xl p-4 bg-orange-50 border border-orange-300 rounded-xl">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white font-bold text-lg">!</span>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-orange-900 text-sm">You are currently on leave</h3>
                                  <p className="text-orange-800 text-xs mt-1 mb-2">
                                    {activeLeave.leaveType.charAt(0).toUpperCase() + activeLeave.leaveType.slice(1)} leave from <strong>{new Date(activeLeave.startDate).toLocaleDateString()}</strong> to <strong>{new Date(activeLeave.endDate).toLocaleDateString()}</strong>
                                  </p>
                                  <p className="text-orange-700 text-xs font-medium">
                                    Please wait until your current leave ends before applying for new leave.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div
                          id="head-apply-leave-form"
                          className={`w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-blue-100 p-0 min-h-[560px] overflow-hidden ${activeLeave ? 'mt-40' : ''}`}
                        >
                          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-6 py-5 text-white">
                            <h2 className="text-lg font-bold">Apply Leave</h2>
                            <p className="text-sm text-blue-100 mt-1">
                              Send a leave request directly to Admin.
                            </p>
                          </div>
                          <div className="p-6">

                          <form onSubmit={handleHeadSubmit} className="space-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type</label>
                            <select
                              value={headLeaveType}
                              onChange={(event) => setHeadLeaveType(event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="annual">Annual Leave</option>
                              <option value="sick">Sick Leave</option>
                              <option value="casual">Casual Leave</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                              <input
                                type="date"
                                value={headFromDate}
                                onChange={(event) => setHeadFromDate(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                              <input
                                type="date"
                                value={headToDate}
                                min={headFromDate || undefined}
                                onChange={(event) => setHeadToDate(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                            <textarea
                              rows={5}
                              value={headReason}
                              onChange={(event) => setHeadReason(event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Share the reason for your leave request."
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-70"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                          </button>
                          </form>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            ) : (
              leaveContent
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1119px) {
          .main-content {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
      <style>{`
        /* Toast animation */
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
    </div>
  );
};

export default LeaveRecord;