import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  IndianRupee,
  TrendingUp,
  Users,
  ChevronDown,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// API Configuration - Replace these with your actual API endpoints
const API_CONFIG = {
  BASE_URL: "http://localhost:5000/api", // Change this to your backend URL
  ENDPOINTS: {
    GET_SALARY_HISTORY: "/salary/history",
    GET_SALARY_STATS: "/salary/stats",
    EXPORT_REPORT: "/salary/export",
    UPDATE_SALARY: "/salary/update",
  },
};

export default function AdminPaymentHistory() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch salary history data from API
  const fetchSalaryHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SALARY_HISTORY}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Assuming the API returns data in format: { success: true, data: [...] }
      // Adjust based on your actual API response structure
      setSalaryData(data.data || data);
    } catch (err) {
      console.error("Error fetching salary history:", err);
      setError(err.message || "Failed to fetch salary data");
      // Fallback to empty array if fetch fails
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSalaryHistory();
    setRefreshing(false);
  };

  // Export salary report
  const handleExportReport = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EXPORT_REPORT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            filter: selectedFilter,
            searchQuery: searchQuery,
            // Add any other filter parameters
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary-report-${new Date().toISOString()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting report:", err);
      alert("Failed to export report. Please try again.");
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSalaryHistory();
  }, []);

  // Calculate statistics from fetched data
  const stats = {
    totalPaid: salaryData
      .filter((s) => s.status === "Paid")
      .reduce((acc, s) => acc + (s.currentSalary || 0), 0),
    totalEmployees: salaryData.length,
    avgIncrement:
      salaryData.length > 0
        ? (
            salaryData.reduce((acc, s) => acc + (s.increment || 0), 0) /
            salaryData.length
          ).toFixed(2)
        : "0.00",
    pendingPayments: salaryData.filter((s) => s.status === "Pending").length,
  };

  const filteredData = salaryData.filter((employee) => {
    const matchesSearch =
      employee.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "paid")
      return matchesSearch && employee.status === "Paid";
    if (selectedFilter === "pending")
      return matchesSearch && employee.status === "Pending";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white shadow-md p-4 rounded-xl flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 mb-2">
              Salary Tracking
            </h1>
            <p className="text-gray-600">
              Track and manage employee salary records and payment history
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md ${
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 shadow-md rounded-2xl  bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-1" />

            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">
                Error Loading Data
              </h3>
              <button
                onClick={fetchSalaryHistory}
                className="text-sm text-red-800 underline hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading salary data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Total Paid (Monthly)
                    </p>
                    <h3 className="flex items-center text-2xl font-bold text-gray-800">
                      <IndianRupee />
                      {stats.totalPaid.toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Total Employees
                    </p>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {stats.totalEmployees}
                    </h3>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg. Increment</p>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {stats.avgIncrement}%
                    </h3>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Pending Payments
                    </p>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {stats.pendingPayments}
                    </h3>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedFilter("all")}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                      selectedFilter === "all"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedFilter("paid")}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                      selectedFilter === "paid"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => setSelectedFilter("pending")}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                      selectedFilter === "pending"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Pending
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportReport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md w-full md:w-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Salary Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Employee ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Position
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Previous Salary
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Current Salary
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Increment
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((employee, index) => (
                      <tr
                        key={employee.id}
                        className={`hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">
                          {employee.employeeId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employeeName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          ${employee.previousSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ${employee.currentSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              employee.increment > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {employee.increment > 0 ? "+" : ""}
                            {employee.increment}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              employee.status === "Paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedEmployee(employee)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No salary records found
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Detailed View Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Salary Details</h2>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="text-white hover:bg-blue-500 p-2 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Employee ID</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.employeeId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Employee Name</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.employeeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Position</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.position}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Salary Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Previous Salary
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${selectedEmployee.previousSalary.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Current Salary
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${selectedEmployee.currentSalary.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Increment Percentage
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        +{selectedEmployee.increment}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Increment Amount
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        $
                        {(
                          selectedEmployee.currentSalary -
                          selectedEmployee.previousSalary
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Payment Details
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Effective Date
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.effectiveDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payment Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.paymentDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Payment Method
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedEmployee.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Download Slip
                  </button>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
