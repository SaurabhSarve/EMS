import { useState, useEffect } from "react";
import { SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../Components/AdminSidebar.jsx";
import { employeeService } from "../../services/employeeServices.js";
import { capitalize } from "../../utils/helper.js";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PromotionForm from "../../Components/PromotionForm.jsx";


export default function DepartmentEmployeesList() {

    const location = useLocation();

    const { department } = location.state || {};

    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentHeadData, setDepartmentHeadData] = useState(null)

    const [showPromotionForm, setShowPromotionForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);



    const openPromotionForm = (employee = null) => {
        setSelectedEmployee(employee);
        setShowPromotionForm(true);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const result = await employeeService.getAllEmployeesByDepartment(department);
            if (result && result.data) {
                setEmployees(result.data);
                setDepartmentHeadData(result.departmentHead)

                console.log(result)
            }
            setLoading(false);
        } catch (error) {
            console.error("Error:", error);
            setLoading(false);
        }
    };
    const filteredEmployees = employees.filter((employee) => {
        const matchesSearch =
            searchTerm === "" ||
            (employee.firstName?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
            ) ||
            (employee.personalEmail?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
            ) ||
            (employee.employeeId?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
            ) ||
            (employee.position?.toLowerCase() || "").includes(
                searchTerm.toLowerCase(),
            );

        const matchesDept =
            departmentFilter === "all" ||
            (employee.department?.name?.toLowerCase() || "") ===
            departmentFilter.toLowerCase();

        const matchesStatus =
            statusFilter === "all" ||
            (employee.status?.toLowerCase() || "") ===
            statusFilter.toLowerCase().replace(" ", "_");

        return matchesSearch && matchesDept && matchesStatus;
    });

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };


    const handleEmployeeClick = (employeeId) => {
        setTimeout(() => {
            navigate(`/admin/employees/${employeeId}`);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-white">
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="main-content w-full">
                {/* Top Navigation */}

                {/* Main Content */}
                <main className="p-4 md:p-6 lg:p-8">

                    {showPromotionForm && selectedEmployee && (
                        <PromotionForm
                            employee={selectedEmployee}
                            department={department}
                            departmentHead={departmentHeadData}
                            onClose={() => setShowPromotionForm(false)}
                        />
                    )}

                    {/* Page Header */}
                    <div className="mb-6">
                        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-white/20 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

                                    {/* Left Section */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

                                            {/* Left Section */}
                                            <div className="flex items-start sm:items-center gap-4">

                                                {/* Back Button */}
                                                <button
                                                    onClick={() => navigate(-1)}
                                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                                                >
                                                    <ArrowLeft size={20} className="text-gray-700" />
                                                </button>

                                                {/* Title Section */}
                                                <div>
                                                    <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                                                        Employee Directory
                                                    </h1>

                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        {department && (
                                                            <span className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                                                                {department}
                                                            </span>
                                                        )}

                                                        <span className="text-sm text-gray-500">
                                                            {loading
                                                                ? "Loading employees..."
                                                                : `${filteredEmployees.length} employees`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                                                        Total Employees
                                                    </p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        {loading ? "--" : filteredEmployees.length}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    </div>


                                </div>

                            </div>
                        </div>
                    </div>



                    {/* Search and Filters */}
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border border-blue-100 hover:shadow-xl transition-shadow">
                        <div className="space-y-4">
                            {/* Search Input */}
                            <div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                                    placeholder="Search by name, ID, email, or role..."
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 bg-white shadow-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select> */}

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 bg-white shadow-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on_leave">On Leave</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Employee Table */}
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-gray-100">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading employees...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-lg p-10 sm:p-12 text-center border border-gray-100 overflow-hidden relative">
                            <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-50 rounded-full blur-2xl" />
                            <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-blue-100/60 rounded-full blur-3xl" />

                            <div className="relative">
                                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-md">
                                    <SearchX className="text-white" size={28} />
                                </div>
                                <p className="text-gray-900 font-bold text-lg">No employees found</p>
                                <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                                    We couldn’t match your search or filters. Try clearing filters or add a new employee.
                                </p>
                                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("all");
                                        }}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}

                            <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400">
                                            <tr className="text-left text-white text-sm font-semibold">
                                                <th className="p-4 pl-6">MANAGER EMPLOYEE</th>
                                                <th className="p-4">ID</th>
                                                <th className="p-4">ROLE & DEPT</th>
                                                <th className="p-4">STATUS</th>
                                                <th className="p-4 pr-6">JOINED DATE</th>
                                                <th className="p-4 text-center">Promotion</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">

                                            {(departmentHeadData && departmentHeadData._id && department) ? (
                                                <tr
                                                    key={departmentHeadData._id}
                                                    className="hover:bg-blue-50/60 cursor-pointer transition-colors"
                                                    onClick={() => handleEmployeeClick(departmentHeadData._id)}
                                                >
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            {departmentHeadData?.profilePhoto?.url ? (
                                                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                                                    <img
                                                                        src={departmentHeadData.profilePhoto.url}
                                                                        alt={departmentHeadData.firstName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-semibold shadow-sm">
                                                                    {capitalize(departmentHeadData.firstName?.charAt(0)) || "E"}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {capitalize(`${departmentHeadData.firstName} ${departmentHeadData.lastName}`)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {departmentHeadData.email}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-4">
                                                        <span className="font-mono text-gray-700 font-semibold">
                                                            {departmentHeadData.employeeId}
                                                        </span>
                                                    </td>

                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {departmentHeadData.position}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {departmentHeadData.department?.name}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${departmentHeadData.status === "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : departmentHeadData.status === "inactive"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                                }`}
                                                        >
                                                            {departmentHeadData.status
                                                                ? departmentHeadData.status.charAt(0).toUpperCase() +
                                                                departmentHeadData.status.slice(1)
                                                                : "N/A"}

                                                        </span>
                                                    </td>

                                                    <td className="p-4 pr-6">
                                                        <span className="text-gray-700">
                                                            {departmentHeadData.joiningDate
                                                                ? new Date(departmentHeadData.joiningDate).toLocaleDateString(
                                                                    "en-US",
                                                                    { month: "short", day: "numeric", year: "numeric" }
                                                                )
                                                                : "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openPromotionForm(departmentHeadData);
                                                            }}
                                                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                        >
                                                            Promote
                                                        </button>
                                                    </td>

                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="p-6 text-center text-gray-500 font-semibold">
                                                        No manager found
                                                    </td>
                                                </tr>
                                            )}

                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400">
                                            <tr className="text-left text-white text-sm font-semibold">
                                                <th className="p-4 pl-6">EMPLOYEE</th>
                                                <th className="p-4">ID</th>
                                                <th className="p-4">ROLE & DEPT</th>
                                                <th className="p-4">STATUS</th>
                                                <th className="p-4 pr-6">JOINED DATE</th>
                                                <th className="p-4 text-center">Promotion</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredEmployees.map((employee) => (
                                                <tr
                                                    key={employee.id}
                                                    className="hover:bg-blue-50/60 cursor-pointer transition-colors"
                                                    onClick={() => handleEmployeeClick(employee._id)}
                                                >
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            {employee?.profilePhoto?.url &&
                                                                employee.profilePhoto?.url !== "" ? (
                                                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                                                    <img
                                                                        src={employee?.profilePhoto?.url}
                                                                        alt={`${employee.firstName} ${employee.lastName}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-semibold shadow-sm">
                                                                    {capitalize(employee.firstName?.charAt(0)) ||
                                                                        "E"}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {capitalize(employee?.firstName)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {employee.personalEmail}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-mono text-gray-700 font-semibold">
                                                            {employee.employeeId}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {employee.position}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {employee.department?.name}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${employee.status === "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : employee.status === "inactive"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                                }`}
                                                        >
                                                            {employee.status.charAt(0).toUpperCase() +
                                                                employee.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 pr-6">
                                                        <span className="text-gray-700">
                                                            {employee.joiningDate
                                                                ? new Date(
                                                                    employee.joiningDate,
                                                                ).toLocaleDateString("en-US", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                })
                                                                : "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openPromotionForm(employee);
                                                            }}
                                                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg"
                                                        >
                                                            Promote
                                                        </button>
                                                    </td>


                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        onClick={() => handleEmployeeClick(employee._id)}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                                    >
                                        {/* Header with gradient */}
                                        <div className="h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400"></div>

                                        {/* Card Content */}
                                        <div className="p-5">
                                            {/* Employee Info */}
                                            <div className="flex items-center gap-3 mb-4">
                                                {employee?.profilePhoto?.url &&
                                                    employee.profilePhoto?.url !== "" ? (
                                                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-md">
                                                        <img
                                                            src={employee?.profilePhoto?.url}
                                                            alt={`${employee.firstName} ${employee.lastName}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                                                        {capitalize(employee.firstName?.charAt(0)) || "E"}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate text-sm">
                                                        {capitalize(employee?.firstName)} {capitalize(employee?.lastName || "")}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate mt-1">
                                                        {employee.personalEmail}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Employee Details Grid */}
                                            <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                                                {/* ID and Position */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ID</p>
                                                        <p className="font-mono font-bold text-gray-900 text-sm">
                                                            {employee.employeeId}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</p>
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            {employee.position}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Department and Date */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dept</p>
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            {employee.department?.name}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Joined</p>
                                                        <p className="text-gray-700 text-sm">
                                                            {employee.joiningDate
                                                                ? new Date(
                                                                    employee.joiningDate,
                                                                ).toLocaleDateString("en-US", {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    year: "numeric",
                                                                })
                                                                : "N/A"}
                                                        </p>

                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span
                                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm w-full justify-center ${employee.status === "active"
                                                    ? "bg-green-100 text-green-800"
                                                    : employee.status === "inactive"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                ● {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* CSS for responsive layout */}
            <style>{`
        @media (min-width: 1024px) {
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
        </div>
    );
}
