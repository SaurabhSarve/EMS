import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import EmployeesSidebar from "../../Components/EmployeesSidebar";
import { useAuth } from "../../context/AuthContext";
import { salaryService } from "../../services/salaryServices";

const monthOptions = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const yearOptions = ["2024", "2025", "2026"];
const monthFilterOptions = ["All", ...monthOptions];
const yearFilterOptions = ["All", ...yearOptions];

const statusBadgeClass = (status) => {
  if (status === "Paid")
    return "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700";
  if (status === "Processing")
    return "inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700";
  return "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700";
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function DepartmentHeadPayroll() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const now = useMemo(() => new Date(), []);

  const [selectedMonth, setSelectedMonth] = useState(
    monthOptions[now.getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState(
    now.getFullYear().toString()
  );
  const [statusFilter, setStatusFilter] = useState("All");

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Debounce filters
  const [debouncedFilters, setDebouncedFilters] = useState({
    month: selectedMonth,
    year: selectedYear,
    status: statusFilter,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({
        month: selectedMonth,
        year: selectedYear,
        status: statusFilter,
      });
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedMonth, selectedYear, statusFilter]);

  const fetchEmployeePayRollHistory = async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const res = await salaryService.employeePayRollHistory({
        page: currentPage,
        limit,
        month: debouncedFilters.month === "All" ? "all" : debouncedFilters.month,
        year: debouncedFilters.year === "All" ? "all" : debouncedFilters.year,
        status:
          debouncedFilters.status === "All"
            ? "all"
            : debouncedFilters.status.toLowerCase(),
      });

      const records = res?.employeeData || [];

      const mapped = records.map((record) => {
        const baseSalary = Number(record.baseSalary || 0);
        const allowances = Number(record.allowances || 0);
        const deductions = Number(record.deductions || 0);
        const statusValue = (record.Status || "").toLowerCase();

        return {
          id: record._id,
          name: record.employeeName || "Employee",
          role: record.position || "Employee",
          month: record.month,
          year: record.year,
          gross: baseSalary + allowances,
          allowances,
          deductions,
          net: record.netSalary,
          status:
            statusValue === "paid"
              ? "Paid"
              : statusValue === "processing"
              ? "Processing"
              : "Due",
        };
      });

      setEmployees(mapped);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      setLoadError("Unable to load payroll history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeePayRollHistory();
  }, [debouncedFilters, currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages)
      setCurrentPage((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentPage > 1)
      setCurrentPage((prev) => prev - 1);
  };

  const departmentLabel =
    user?.department?.name || user?.department || "Your Department";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100 text-slate-900">
      <EmployeesSidebar />

      <main className="px-4 pb-16 pt-24 sm:px-6 lg:px-10 lg:pt-10 lg:ml-64">

        {/* HEADER */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400 px-6 py-6 text-white shadow-xl sm:px-8 sm:py-7">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={14} /> RBAC Enforced
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
                <UserRound size={14} /> {departmentLabel}
              </span>
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">My Payroll</h1>
          </div>
        </header>

        {/* FILTER + TABLE SECTION */}
        <section className="mt-8 rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-blue-100">

          {/* FILTERS */}
          <div className="grid gap-4 md:grid-cols-3">

            <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <label>Month</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthFilterOptions.map((month) => (
                  <option key={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <label>Year</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {yearFilterOptions.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <label>Status</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Due</option>
                <option>Processing</option>
                <option>Paid</option>
              </select>
            </div>

          </div>

          {/* TABLE */}
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Payroll Period</th>
                  <th className="px-4 py-3 text-left">Gross</th>
                  <th className="px-4 py-3 text-left">Allowances</th>
                  <th className="px-4 py-3 text-left">Deductions</th>
                  <th className="px-4 py-3 text-left">Net Salary</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6">
                      Loading payroll history...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6">
                      No payroll entries found.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="border-b text-sm">
                      <td className="px-4 py-4">{employee.name}</td>
                      <td className="px-4 py-4">
                        {employee.month} {employee.year}
                      </td>
                      <td className="px-4 py-4">{formatCurrency(employee.gross)}</td>
                      <td className="px-4 py-4">{formatCurrency(employee.allowances)}</td>
                      <td className="px-4 py-4">{formatCurrency(employee.deductions)}</td>
                      <td className="px-4 py-4 font-semibold">{formatCurrency(employee.net)}</td>
                      <td className="px-4 py-4">
                        <span className={statusBadgeClass(employee.status)}>
                          {employee.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-6">
            <button onClick={handlePrev} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={handleNext} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}
