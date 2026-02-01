import React, { useState, useEffect } from 'react'
import EmployeesSidebar from '../../../Components/EmployeesSidebar'
import LeaveSummaryGrid from './LeaveSummaryGrid'
import LeaveCard from './LeaveCard'
import RequestHistory from './RequestHistory'
import { leaveService } from '../../../services/leaveServive'

const EmployeeLeave = () => {
    const [leaveType, setLeaveType] = useState("sick");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [reason, setReason] = useState("");
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

        // if (reason.trim().length < 10) {
        //     showToast("Please provide a detailed reason (at least 10 characters)", "error");
        //     return;
        // }

        setLoading(true);

        try {
            const leaveData = {
                leaveType,
                fromDate,
                toDate,
                reason: reason.trim(),

            };

            const response = await leaveService.applyLeave(leaveData);

            if (response.success) {
                showToast("Leave request submitted successfully!", "success");
                fetchEmployeeLeaves();
                // Reset form
                setLeaveType("sick");
                setFromDate("");
                setToDate("");
                setReason("");


            }
        } catch (err) {
            console.error("Error submitting leave request:", err);
            showToast(
                err.response?.data?.message ||
                err.message ||
                "Failed to submit leave request. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setLeaveType("sick");
        setFromDate("");
        setToDate("");
        setReason("");
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
                                        <option value="annual">Annual Leave</option>
                                        <option value="sick">Sick Leave</option>
                                        <option value="personal">Casual Leave</option>
                                    </select>
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
                                    <div className="text-xs text-slate-400 mt-1">
                                        {leaveType === 'sick' && duration > 2 && (
                                            <span className="text-orange-500 font-medium">⚠ Medical certificate required for sick leave &gt; 2 days</span>
                                        )}
                                        {(!leaveType || leaveType !== 'sick' || duration <= 2) && (
                                            <span>Attach document if sick leave &gt; 2 days</span>
                                        )}
                                    </div>
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