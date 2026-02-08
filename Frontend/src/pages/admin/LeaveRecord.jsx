import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { MdClose } from 'react-icons/md';
import AdminSidebar from '../../Components/AdminSidebar';
import { employeeService } from '../../services/employeeServices';
import { capitalize } from '../../utils/helper';
import { leaveService } from '../../services/leaveServive';

const LeaveRecord = () => {
  const [leaves, setLeaves] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchData = async () => {
    try {
      const result = await employeeService.getLeavesdetails();
      console.log(result.data);
      setLeaves(result.data);
    } catch (err) {
      console.log("leave err ", err);
      setToast({ 
        show: true, 
        message: "Failed to fetch leave data", 
        type: "error" 
      });
    }
  }

  const handleApprove = async (id, Lid) => {
    try {
      console.log(Lid);
      // Backend expects capitalized "Approved"
      const response = await leaveService.leaveAction(Lid, "Approved");
      console.log(response);
      
      // Check if response is successful
      if (response.success || response.data?.success) {
        // Update state optimistically
        setLeaves(leaves.map(leave => 
          leave?._id === Lid ? { ...leave, status: 'approved' } : leave
        ));
        
        setToast({ 
          show: true, 
          message: "Leave approved successfully!", 
          type: "success" 
        });
      }
    } catch (err) {
      console.log("leave approving err", err);
      setToast({ 
        show: true, 
        message: err.response?.data?.message || "Failed to approve leave", 
        type: "error" 
      });
    }
  };

  const handleReject = async (id, Lid) => {
    try {
      console.log(id);
      // Backend expects capitalized "Rejected"
      const response = await leaveService.leaveAction(Lid, "Rejected");
      console.log(response);
      
      // Check if response is successful
      if (response.success || response.data?.success) {
        // Update state optimistically
        setLeaves(leaves.map(leave => 
          leave?._id === Lid ? { ...leave, status: 'rejected' } : leave
        ));
        
        setToast({ 
          show: true, 
          message: "Leave rejected successfully!", 
          type: "success" 
        });
      }
    } catch (err) {
      console.log("leave rejecting err", err);
      setToast({ 
        show: true, 
        message: err.response?.data?.message || "Failed to reject leave", 
        type: "error" 
      });
    }
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

  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter((leave) => leave?.status === 'pending').length;
  const approvedLeaves = leaves.filter((leave) => leave?.status === 'approved').length;
  const rejectedLeaves = leaves.filter((leave) => leave?.status === 'rejected').length;

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
                        Efficiently manage and process all employee leave requests
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-white bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-lg border border-white/40 rounded-2xl px-6 py-3 shadow-2xl font-semibold min-w-fit group-hover:border-white/60 group-hover:shadow-cyan-400/30 transition-all duration-300">
                    <p className="text-cyan-100 text-xs uppercase tracking-wider mb-1 font-bold">Total Requests</p>
                    <p className="text-3xl font-black text-white">{totalLeaves}</p>
                  </div>
                </div>
              </div>
            </div>

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
            {leaves.length === 0 ? (
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
                        {leaves.map((leave) => (
                          <tr key={leave?._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 group">
                            <td className="px-6 py-5">
                              <div className="min-w-max">
                                <div className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{capitalize(leave?.employee?.firstName)}</div>
                                <div className="text-xs text-gray-500 mt-1 font-medium">{leave?.employee?.employeeId}</div>
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
                              {leave.status === 'pending' ? (
                                <div className="flex gap-2.5 min-w-max">
                                  <button
                                    onClick={() => handleApprove(leave?.employee?._id, leave?._id)}
                                    className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all shadow-lg hover:shadow-xl whitespace-nowrap uppercase tracking-wide"
                                  >
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(leave?.employee?._id, leave?._id)}
                                    className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-lg hover:from-red-600 hover:to-rose-700 active:scale-95 transition-all shadow-lg hover:shadow-xl whitespace-nowrap uppercase tracking-wide"
                                  >
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 whitespace-nowrap font-bold">Processed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View - Visible only on mobile */}
                <div className="md:hidden mt-8 pt-6 border-t-2 border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Leave Requests</h2>
                  <div className="space-y-4">
                    {leaves.map((leave) => (
                      <div key={leave?._id} className="bg-white/95 backdrop-blur rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 px-4 py-4 border-b border-blue-200">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-white text-sm">{capitalize(leave?.employee?.firstName)}</h3>
                              <p className="text-xs text-blue-100 mt-0.5">{leave?.employee?.employeeId}</p>
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
                        {leave.status === 'pending' && (
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                            <button
                              onClick={() => handleApprove(leave?.employee?._id, leave?._id)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white text-sm font-bold rounded-lg hover:from-green-600 hover:to-green-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                              <CheckCircle className="w-5 h-5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(leave?.employee?._id, leave?._id)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white text-sm font-bold rounded-lg hover:from-red-600 hover:to-red-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                              <XCircle className="w-5 h-5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                        {leave.status !== 'pending' && (
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                            <p className="text-center text-xs text-gray-500 font-semibold">Status: {capitalize(leave.status)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
<style>{`
        @media (min-width: 1120px) {
          .main-content {
            margin-left: 256px;
            width: calc(100% - 256px);
          }
        }
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