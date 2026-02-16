import React, { useEffect, useState } from "react";
import { Search, History } from "lucide-react";
import AdminSidebar from "../../Components/AdminSidebar";
import { paymentService } from "../../services/paymentService";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PaymentHistory() {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  // const handleDownloadInvoice = (invoiceUrl) => {
  //   if (!invoiceUrl) {
  //     showToast("Invoice not available for this payment", "error");
  //     return;
  //   }
  //   window.open(invoiceUrl, "_blank");
  // };

  const navigate = useNavigate();



  const loadDefaultHistory = async () => {
    try {
      const response = await paymentService.PaymentHistory();
      setEmployees(response.data);
      console.log(response.data)
    } catch (error) {
      console.error(error);
      showToast("Failed to load payment history", "error");
    }
  };

  const loadCustomDateHistory = async () => {
    try {
      const response = await paymentService.CustomPaymentHistory(
        startDate,
        endDate
      );
      setEmployees(response.data);
      console.log(response.data)
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch payment history for selected dates", "error");
    }
  };

  const downloadInvoice = async (invoiceUrl, invoiceNo) => {
  try {
    if (!invoiceUrl) {
      showToast("Invoice not available", "error");
      return;
    }

    const response = await fetch(invoiceUrl);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${invoiceNo}.pdf`; // proper file name
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error(error);
    showToast("Download failed", "error");
  }
};





  useEffect(() => {
    loadDefaultHistory();
  }, []);

  useEffect(() => {
    if (startDate || endDate) {
      loadCustomDateHistory();
    }
  }, [startDate, endDate]);

  const filteredEmployees = employees.filter((emp) => {
    if (emp.Status?.toLowerCase() !== "paid") return false;

    const name = `${emp.employee.firstName} ${emp.employee.lastName}`.toLowerCase();
    const empId = emp.employeeId.toLowerCase();

    return (
      searchQuery === "" ||
      name.includes(searchQuery.toLowerCase()) ||
      empId.includes(searchQuery.toLowerCase())
    );
  });

  const totalPaidAmount = filteredEmployees.reduce(
    (sum, emp) => sum + parseFloat(emp.netSalary || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <AdminSidebar />

      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm
            ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}
        >
          {toast.message}
        </div>
      )}

      <div className="lg:ml-64 p-4 sm:p-6">

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6">

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            >
              <ArrowLeft size={22} />
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <History size={26} />
                Payment History
              </h1>
              <p className="text-indigo-100 text-sm mt-1">
                Paid salary records
              </p>
            </div>

          </div>
        </div>


        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div className="relative sm:col-span-2 flex items-center">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name or employee ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 border rounded-lg"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 border rounded-lg"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <button
              onClick={async () => {
                setStartDate("");
                setEndDate("");
                await loadDefaultHistory();
              }}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              Clear Date Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm">Paid Employees</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredEmployees.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600 text-sm">Total Paid Amount</p>
            <p className="text-3xl font-bold text-indigo-600">
              ₹{totalPaidAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">Employee</th>
                <th className="px-6 py-4 text-left">Employee ID</th>
                <th className="px-6 py-4 text-left">Month</th>
                <th className="px-6 py-4 text-left">Paid On</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {emp.employee.firstName} {emp.employee.lastName}
                    </td>
                    <td className="px-6 py-4">{emp.employeeId}</td>
                    <td className="px-6 py-4">{emp.month}</td>
                    <td className="px-6 py-4">
                      {new Date(emp.salaryPayDate || emp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      ₹{Number(emp.netSalary).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {emp.invoice?.invoiceUrl ? (
                        <button
                          onClick={() => downloadInvoice(emp.invoice?.invoiceUrl, emp.invoice?.invoiceNo)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg
                   bg-indigo-600 text-white hover:bg-indigo-700
                   transition shadow"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
