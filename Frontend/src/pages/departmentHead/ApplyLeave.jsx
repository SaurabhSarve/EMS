import { useState } from "react";
import AdminSidebar from "../../Components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { leaveService } from "../../services/leaveServive";

const leaveOptions = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
];

export default function HeadApplyLeave() {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState("annual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!fromDate || !toDate || !reason.trim()) {
      showToast("Please complete all fields.", "error");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      showToast("To date cannot be before From date.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveData = {
        leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
      };

      const response = await leaveService.applyLeave(leaveData);
      if (response?.success) {
        showToast("Leave request submitted to Admin.");
        pushHeadLeaveNotification(leaveData);
      } else {
        showToast("Unable to submit leave request.", "error");
        return;
      }

      setLeaveType("annual");
      setFromDate("");
      setToDate("");
      setReason("");
    } catch (error) {
      showToast("Unable to submit leave request.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const target = document.getElementById("head-apply-leave-form");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-6 py-6 text-white shadow-xl border border-white/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-100">Department Head</p>
              <h1 className="text-2xl sm:text-3xl font-bold">Apply Leave</h1>
              <p className="text-sm text-blue-100 mt-1">
                Submit a leave request for Admin approval.
              </p>
            </div>
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-md hover:bg-blue-50"
            >
              Apply Leave
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            id="head-apply-leave-form"
            className="rounded-3xl bg-white p-6 shadow-lg border border-blue-100"
          >
            <h2 className="text-lg font-bold text-slate-900">Leave Request Form</h2>
            <p className="text-sm text-slate-500 mt-1">
              Fill in the details below to request time off.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">Leave type</label>
                <select
                  value={leaveType}
                  onChange={(event) => setLeaveType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {leaveOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">From date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">To date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    min={fromDate || undefined}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Share the reason for your leave request."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Leave Request"}
              </button>
            </form>
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-lg border border-blue-100">
            <h3 className="text-lg font-bold text-slate-900">Submission Notes</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Requests are sent to Admin for approval.</li>
              <li>Include clear reasons to speed up review.</li>
              <li>Double-check dates before submitting.</li>
            </ul>
          </aside>
        </section>
      </main>
    </div>
  );
}
