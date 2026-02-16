import React, { useState, useEffect } from 'react'
import EmployeesSidebar from '../../../Components/EmployeesSidebar'
import LeaveSummaryGrid from './LeaveSummaryGrid'
import LeaveCard from './LeaveCard'
import RequestHistory from './RequestHistory'
import { leaveService } from '../../../services/leaveServive'

const leaveOptions = [
  { value: "planned_leave", label: "Planned Leave (48 hours advance)", minHours: 48, requiresDocument: false },
  { value: "unplanned_leave", label: "Unplanned Leave (2 hours advance)", minHours: 2, requiresDocument: false },
  { value: "sick_leave", label: "Sick Leave (4 hours advance)", minHours: 4, requiresDocument: true },
];

const EmployeeLeave = () => {
    const [leaveType, setLeaveType] = useState("planned_leave");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [reason, setReason] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [leaveDetails, setLeaveDetails] = useState();
    const [leaveBalance, setLeaveBalance] = useState();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    };

    useEffect(() => {
        fetchEmployeeLeaves();
    }, [])

    const fetchEmployeeLeaves = async () => {
        try {

            const result = await leaveService.getAppliedLeave();
            console.log(result);
            if (result.success && result) {
                setLeaveDetails(result.data.employeeLeaves);
                setLeaveBalance(result.data.leaveBalance);

            }


        } catch (error) {
            console.error("error fetching requested leave : ", error);

        }
    };

    // Check for date overlap with existing leaves
    const checkForConflicts = () => {
        if (!fromDate || !toDate || !leaveDetails || leaveDetails.length === 0) {
            return null;
        }

        const newStart = new Date(fromDate);
        const newEnd = new Date(toDate);
        newStart.setHours(0, 0, 0, 0);
        newEnd.setHours(23, 59, 59, 999);

        // Check for pending or approved leaves that overlap
        for (const leave of leaveDetails) {
            if (leave.status === 'pending' || leave.status === 'approved') {
                const existingStart = new Date(leave.startDate);
                const existingEnd = new Date(leave.endDate);
                existingStart.setHours(0, 0, 0, 0);
                existingEnd.setHours(23, 59, 59, 999);

                // Check overlap
                if (newStart <= existingEnd && newEnd >= existingStart) {
                    return {
                        type: 'conflict',
                        message: `You already have a ${leave.status} leave from ${existingStart.toLocaleDateString()} to ${existingEnd.toLocaleDateString()}.`
                    };
                }
            }
        }

        return null;
    };

    // Validate advance notice requirement
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

    // Handle file upload
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

    // Calculate duration between two dates
    const calculateDuration = () => {
        if (!fromDate || !toDate) return 0;

        const from = new Date(fromDate);
        const to = new Date(toDate);

        if (to < from) return 0;

        const diffTime = Math.abs(to - from);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days

        return diffDays;
    };


    // Alternative component to show when already on leave
    const OnLeaveAlert = () => {
        // Find the active approved leave
        const activeLeave = leaveDetails?.find(leave => {
            if (leave.status !== 'approved') return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return today >= start && today <= end;
        });

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

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!leaveType) {
            showToast("Please select a leave type", "error");
            return;
        }

        if (!fromDate) {
            showToast("Please select a start date", "error");
            return;
        }

        if (!toDate) {
            showToast("Please select an end date", "error");
            return;
        }

        if (new Date(toDate) < new Date(fromDate)) {
            showToast("End date cannot be before start date", "error");
            return;
        }

        if (!reason.trim()) {
            showToast("Please provide a reason for your leave", "error");
            return;
        }

        // Validate advance notice
        const advanceValidation = validateAdvanceNotice(leaveType, fromDate);
        if (!advanceValidation.valid) {
            showToast(advanceValidation.message, "error");
            return;
        }

        // Check for conflicts
        const conflict = checkForConflicts();
        if (conflict) {
            showToast(conflict.message, "error");
            return;
        }

        // Check if document is required for Sick Leave
        const selectedLeave = leaveOptions.find(opt => opt.value === leaveType);
        if (selectedLeave?.requiresDocument && !uploadedFile) {
            showToast("Supporting document is mandatory for Sick Leave.", "error");
            return;
        }

        setLoading(true);

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

            // Use appropriate API endpoint
            const response = await leaveService.applyLeave({
                leaveType,
                fromDate,
                toDate,
                reason: reason.trim(),
            });

            if (response.success) {
                showToast("Leave request submitted successfully!", "success");
                fetchEmployeeLeaves();
                // Reset form
                setLeaveType("planned_leave");
                setFromDate("");
                setToDate("");
                setReason("");
                setUploadedFile(null);
            }
        } catch (err) {
            console.error("Error submitting leave request:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to submit leave request. Please try again.";
            showToast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setLeaveType("planned_leave");
        setFromDate("");
        setToDate("");
        setReason("");
        setUploadedFile(null);
    };

    const duration = calculateDuration();

    return (
        <>
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 animate-slideIn ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-md`}>
                    <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-300' : 'bg-green-300'}`}></div>
                    <span className="font-medium">{toast.message}</span>
                    <button onClick={() => setToast({ show: false, message: '', type: '' })} className="ml-auto text-white/80 hover:text-white">
                        ✕
                    </button>
                </div>
            )}

            <div className='main md:flex'>
                <div className='left lg:w-64 '>
                    <EmployeesSidebar />
                </div>
                <div className='right-main lg:w-[100%]  md:px-[30px] '>

                    <div className='main-1 md:mt-[35px] '>
                        <div className='h-[130px] mt-5 '>
                            <span className='text-[25px] md:text-[32px] font-bold px-[30px] '>
                                Leave Management
                            </span>
                            <div className=' md:flex justify-between px-[30px]'>
                                <p className='text-sm md:text-lg text-slate-700 mb-2'>
                                    Request time off, track your balance and view request history.
                                </p>
                                <span className='border-1 border-blue-500 bg-blue-50 text-sm text-slate-600 rounded-full px-3 py-1.5 shadow-sm'>Current Cycle: 2026-2027</span>
                            </div>
                        </div>

                        {/* <LeaveCard /> */}
                        <LeaveSummaryGrid leaveBalanceDetails={leaveBalance} />
                        
                        {/* Show alert if currently on leave */}
                        <OnLeaveAlert />
                    </div>
                    <div className="right-main-2 md:mx-[17px] md:flex">

                        <div className=" max-w-screen-sm md:w-[50%] m-[15px] bg-white rounded-2xl border-1 border-blue-200    overflow-hidden">

                            {/* HEADER */}
                            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-6 py-5 text-white">
                                <h3 className="text-[15px] md:text-lg font-semibold">New Request</h3>
                                <p className="text-[13px] md:text-sm text-white">Submit a new leave application</p>
                            </div>

                            {/* BODY */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5 ">

                                {/* LEAVE TYPE */}
                                <div>
                                    <label htmlFor="leaveType" className="block mb-2 text-sm font-medium text-slate-600">
                                        Leave Type
                                    </label>
                                    <select
                                        id="leaveType"
                                        value={leaveType}
                                        onChange={(e) => setLeaveType(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        disabled={loading}
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

                                {/* DATES */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            From
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            disabled={loading}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
                                            To
                                        </label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            disabled={loading}
                                            min={fromDate || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                {/* DURATION */}
                                <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
                                    Total Duration: <strong>{duration} {duration === 1 ? 'Day' : 'Days'}</strong>
                                </div>

                                {/* REASON */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Reason
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Please describe the reason for your leave..."
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={loading}
                                    />
                                    {/* <div className="text-xs text-slate-400 mt-1">
                                        {leaveType === 'sick' && duration > 2 && (
                                            <span className="text-orange-500 font-medium">⚠ Medical certificate required for sick leave &gt; 2 days</span>
                                        )}
                                        {(!leaveType || leaveType !== 'sick' || duration <= 2) && (
                                            <span>Attach document if sick leave &gt; 2 days</span>
                                        )}
                                    </div> */}
                                </div>

                                {/* SUPPORTING DOCUMENT UPLOAD */}
                                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                                    <label className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Supporting Document</p>
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
                                        onClick={() => document.getElementById('emp-upload-input')?.click()}
                                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload({ target: { files: [f] } }); }}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-600">Click or drag file here</p>
                                        <p className="text-xs text-slate-400">PDF, JPG, PNG only</p>
                                        <input id="emp-upload-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
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
                                                <button type="button" onClick={() => setUploadedFile(null)} className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Remove</button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {/* BUTTONS */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        {loading ? "Submitting..." : "Submit Request"}
                                    </button>
                                </div>

                            </form>
                        </div>

                        <div className='right-right m-[15px] md:w-[50%]'>
                            <RequestHistory requestedLeaves={leaveDetails} />
                        </div>

                    </div>


                </div>

            </div>
        </>
    )
}

export default EmployeeLeave