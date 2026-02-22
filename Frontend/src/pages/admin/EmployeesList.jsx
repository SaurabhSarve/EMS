import { useState, useEffect } from "react";
import { SearchX, Building2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../Components/AdminSidebar.jsx";
import { employeeService } from "../../services/employeeServices.js";
import { capitalize } from "../../utils/helper.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function EmployeesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Assign department modal state
  const [showAssignDeptModal, setShowAssignDeptModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    // For Department Heads, fetch their department info
    if (!isAdmin) {
      fetchDepartmentHeadInfo();
    }
  }, [user]);

  const fetchDepartmentHeadInfo = async () => {
    try {
      // Fetch current user profile from backend to get department info
      const result = await employeeService.getProfile();
      console.log("DEBUG: User profile response:", result);
      
      if (result && result.data && result.data.department) {
        const userDept = result.data.department;
        console.log("DEBUG: Department from backend:", userDept);
        setDepartments([{ _id: userDept._id, name: userDept.name }]);
        
        // Update user in localStorage with the populated department
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          department: { _id: userDept._id, name: userDept.name }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update the user in AuthContext
        if (result.data) {
          const { user: authUser } = useAuth?.() || {};
          // Force re-render by updating a local state that triggers update
        }
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error fetching department head info:", error);
      setDepartments([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Use different API based on user role
      const result = isAdmin 
        ? await employeeService.getAllEmployees()
        : await employeeService.getDepartmentHeadEmployees();
      
      // Parse response based on API used
      const employeeData = isAdmin 
        ? (result?.data || [])
        : (result?.employees || []);
      
      setEmployees(employeeData);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const result = await employeeService.getDepartmentTasks();
      if (result && result.data && result.data.departmentDetails) {
        setDepartments(result.data.departmentDetails);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
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

    // Helper function to check if employee has no department
    const hasNoDepartment = (emp) => {
      return !emp.department || emp.department === null || emp.department === undefined || 
             (typeof emp.department === 'object' && Object.keys(emp.department).length === 0);
    };

    const matchesDept =
      isAdmin ? (departmentFilter === "all" || 
        (departmentFilter === "none" ? hasNoDepartment(employee) : 
          (employee.department?.name?.toLowerCase() || "") === departmentFilter.toLowerCase())) : true; // Department heads already get filtered employees from API

    const matchesStatus =
      statusFilter === "all" ||
      (employee.status?.toLowerCase() || "") ===
      statusFilter.toLowerCase().replace(" ", "_");

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddEmployee = () => {
    navigate("/admin/employees/add");
  };

  const handleEmployeeClick = (employeeId) => {
    setTimeout(() => {
      navigate(`/admin/employees/${employeeId}`);
    }, 500);
  };

  const openAssignDeptModal = (employee) => {
    setSelectedEmployee(employee);
    setSelectedDeptId(employee.department?._id || "");
    setShowAssignDeptModal(true);
  };

  const handleAssignDepartment = async () => {
    if (!selectedDeptId || !selectedEmployee) return;
    
    try {
      setIsAssigning(true);
      const result = await employeeService.assignDepartment(selectedEmployee._id, selectedDeptId);
      
      if (result && result.success) {
        // Update the employee in the list
        setEmployees(prev => prev.map(emp => 
          emp._id === selectedEmployee._id 
            ? { ...emp, department: result.data.department }
            : emp
        ));
        setShowAssignDeptModal(false);
        setSelectedEmployee(null);
        alert("Department assigned successfully!");
      }
    } catch (error) {
      console.error("Error assigning department:", error);
      alert("Failed to assign department");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="main-content w-full">
        {/* Top Navigation */}

        {/* Main Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-white/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 shadow-md">
                    <span className="text-white text-lg font-bold">👥</span>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      Employee Directory
                    </h1>
                    <p className="text-blue-100 mt-1 text-sm sm:text-base">
                      {loading
                        ? "Loading..."
                        : `${filteredEmployees.length} employees found`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAddEmployee}
                  className="w-full lg:w-auto bg-white text-blue-700 px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:bg-blue-50 justify-center"
                >
                  <span className="material-symbols-outlined"></span>
                  Add Employee
                </button>
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
                {/* Only show department dropdown for Admins */}
                {isAdmin ? (
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 bg-white shadow-sm"
                  >
                    <option value="all">All Departments</option>
                    <option value="none">No Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                ) : user?.role === "Department Head" ? (
                  // For Department Head, show their department as read-only
                  <div className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm flex-1 bg-gray-50">
                    <span className="font-semibold">Department: </span>
                    {departments.length > 0 ? departments[0].name : (user?.department?.name || user?.department || "Not Assigned")}
                  </div>
                ) : null}

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
                      setDepartmentFilter("all");
                      setStatusFilter("all");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={handleAddEmployee}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-700 hover:to-blue-600 transition shadow-md"
                  >
                    Add Employee
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEmployees.map((employee) => (
                        <tr
                          key={employee._id || employee.id}
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
                              {employee.department?.name ? (
                                <p className="text-xs text-gray-500 mt-1">
                                  {employee.department.name}
                                </p>
                              ) : isAdmin ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAssignDeptModal(employee);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 flex items-center gap-1"
                                >
                                  <Building2 size={12} />
                                  Assign Department
                                </button>
                              ) : (
                                <p className="text-xs text-gray-400 mt-1 italic">Unassigned</p>
                              )}
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
                    key={employee._id || employee.id}
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
                            {employee.department?.name ? (
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {employee.department.name}
                              </p>
                            ) : isAdmin ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAssignDeptModal(employee);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                              >
                                <Building2 size={14} />
                                Assign
                              </button>
                            ) : (
                              <p className="text-sm text-gray-400 italic">Unassigned</p>
                            )}
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

      {/* Assign Department Modal */}
      {showAssignDeptModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Assign Department</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowAssignDeptModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 text-sm mb-1">Employee</p>
                <p className="font-semibold text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </p>
                <p className="text-gray-500 text-sm">{selectedEmployee.employeeId}</p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Select Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignDeptModal(false);
                    setSelectedEmployee(null);
                  }}
                  disabled={isAssigning}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignDepartment}
                  disabled={!selectedDeptId || isAssigning}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAssigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    "Assign Department"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
