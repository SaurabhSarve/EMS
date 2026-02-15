import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Building2,
  CheckCircle2,
  Eye,
  Layers,
  AlertTriangle,
  Pencil,
  Plus,
  Search,
  Trash2,
  FileText,
  Users,
  Target,
  Calendar,
  Flag,
  Briefcase,
  BarChart3,
} from "lucide-react";
import AdminSidebar from "../../Components/AdminSidebar";
import { useAuth } from "../../context/AuthContext";
import { employeeService } from "../../services/employeeServices";
import { projectService } from "../../services/projectService";
import {
  EmptyState,
  Modal,
  Pagination,
  PriorityBadge,
  StatusBadge,
  ViewToggle,
} from "../../Components/ProjectUI";

const defaultFormState = {
  name: "",
  description: "",
  department: "",
  teamSize: "",
  leader: "",
  dueDate: "",
  priority: "Medium",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const resolveStatus = (currentStatus, dueDate, archived) => {
  if (archived) return "Archived";
  const today = new Date();
  const due = new Date(dueDate);
  if (due.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0) && currentStatus !== "Completed") return "Overdue";
  return currentStatus || "Pending";
};

const getEmployeeLabel = (employee) => {
  const name = `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim();
  return name || employee?.name || employee?.email || "Employee";
};

export default function AdminProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewMode, setViewMode] = useState("cards");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const getDepartmentName = (department) => {
    if (!department) return "";
    if (typeof department === "string") return department;
    return department.name || "";
  };

  const getLeaderName = (leader) => {
    if (!leader) return "";
    if (typeof leader === "string") return leader;
    const first = leader.firstName || "";
    const last = leader.lastName || "";
    const full = `${first} ${last}`.trim();
    return full || leader.name || leader.email || "";
  };

  const departmentOptions = useMemo(() => {
    const base = projects
      .map((row) => getDepartmentName(row.department))
      .filter(Boolean);
    return ["All", ...new Set(base)];
  }, [projects]);

  const statusOptions = useMemo(() => {
    const base = projects.map((row) => row.status);
    return ["All", ...new Set(base)];
  }, [projects]);

  const priorityOptions = ["All", "High", "Medium", "Low"];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const leaderName = getLeaderName(project.leader);
      const departmentName = getDepartmentName(project.department);
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leaderName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment =
        departmentFilter === "All" || departmentName === departmentFilter;
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || project.priority === priorityFilter;

      return matchesSearch && matchesDepartment && matchesStatus && matchesPriority;
    });
  }, [projects, searchQuery, departmentFilter, statusFilter, priorityFilter]);

  const analytics = useMemo(() => {
    const active = projects.filter((row) => row.status !== "Archived");
    const total = active.length;
    const ongoing = active.filter((row) => row.status === "Ongoing").length;
    const completed = active.filter((row) => row.status === "Completed").length;
    const overdue = active.filter((row) => row.status === "Overdue").length;

    return [
      { label: "Total Projects", value: total, tone: "from-blue-600 to-blue-800", icon: Layers },
      { label: "Ongoing Projects", value: ongoing, tone: "from-blue-500 to-blue-700", icon: Activity },
      { label: "Completed Projects", value: completed, tone: "from-sky-500 to-blue-600", icon: CheckCircle2 },
      { label: "Overdue Projects", value: overdue, tone: "from-indigo-500 to-blue-700", icon: AlertTriangle },
    ];
  }, [projects]);

  const pageSize = viewMode === "table" ? 10 : 9;
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        setProjectsError("");
        const response = await projectService.getProjectsByDepartmentHead();
        const projectsData = Array.isArray(response?.data?.projects)
          ? response.data.projects
          : Array.isArray(response?.data)
            ? response.data
            : response?.projects || [];
        const withStatus = projectsData.map((p) =>
          typeof p === "object"
            ? {
                ...p,
                status: resolveStatus(p.status, p.dueDate, p.archived),
              }
            : p
        );
        setProjects(withStatus);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setProjectsError(err.message || "Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const setNoticeMessage = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  };

  const handleDelete = async (project) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      await projectService.deleteProject(project._id || project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id && item._id !== project._id));
      setNoticeMessage("Project deleted successfully.");
    } catch (error) {
      console.error("Error deleting project:", error);
      setNoticeMessage(error?.message || "Error deleting project.");
    }
  };

  const handleArchive = (project) => {
    setProjects((prev) =>
      prev.map((item) =>
        item.id === project.id || item._id === project._id
          ? { ...item, status: "Archived", archived: true }
          : item
      )
    );
    setNoticeMessage("Project archived successfully.");
  };

  const openView = (project) => {
    setSelectedProject(project);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar />

      {notice && (
        <div className="fixed top-6 right-6 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}

      <main className="lg:ml-64 p-6">
        {/* Page Header */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-8">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 text-white relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">Admin Portfolio</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="p-3 bg-white/15 rounded-xl">
                  <Layers className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-black">Enterprise Projects</h1>
              </div>
              <p className="mt-2 text-blue-100 text-sm max-w-2xl">
                Centralize initiatives across departments and keep delivery aligned with strategic goals.
              </p>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`bg-gradient-to-br ${item.tone} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-white/20 rounded-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-bold">{item.value}</span>
                  </div>
                  <p className="text-sm text-white/80 font-semibold">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filters & Views</h2>
              <p className="text-sm text-slate-500">Slice the portfolio by department, status, or priority.</p>
            </div>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Project or leader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {departmentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {priorityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Cards/Table */}
        <section>
          {loadingProjects ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-slate-600 font-semibold">Loading projects...</p>
            </div>
          ) : projectsError ? (
            <div className="text-center py-12 bg-rose-50 rounded-2xl border border-rose-200">
              <p className="text-rose-700 font-semibold">{projectsError}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              title="No Projects Found"
              description="No projects match your current filters. Try adjusting your search criteria."
            />
          ) : viewMode === "table" ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Project</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Leader</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase">Due</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProjects.map((project) => (
                      <tr key={project._id || project.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                              {project.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{project.name}</p>
                              <p className="text-xs text-slate-500">{project.description.substring(0, 30)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{getDepartmentName(project.department)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{getLeaderName(project.leader)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge value={project.status} />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatDate(project.dueDate)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openView(project)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition font-semibold text-xs"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pagedProjects.map((project) => {
                const getStatusColor = () => {
                  switch (project.status) {
                    case "Completed":
                      return "from-emerald-600 to-teal-600";
                    case "Overdue":
                      return "from-rose-600 to-pink-600";
                    case "Ongoing":
                      return "from-blue-600 to-cyan-600";
                    default:
                      return "from-amber-600 to-orange-600";
                  }
                };

                return (
                  <div
                    key={project._id || project.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden group"
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${getStatusColor()}`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{project.name}</h3>
                          <p className="text-sm text-slate-500 line-clamp-1 mt-1">{project.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                            {project.name.charAt(0)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200/50">
                          <p className="text-xs font-bold text-blue-700 uppercase">Dept</p>
                          <p className="text-sm font-bold text-blue-900 mt-1">{getDepartmentName(project.department)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-lg p-3 border border-sky-200/50">
                          <p className="text-xs font-bold text-sky-700 uppercase">Team</p>
                          <p className="text-sm font-bold text-sky-900 mt-1">{project.teamSize} members</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <StatusBadge value={project.status} />
                        <PriorityBadge value={project.priority} />
                      </div>

                      <div className="border-t border-slate-100 pt-4 mb-4">
                      </div>

                      <button
                        onClick={() => openView(project)}
                        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm transition duration-200 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>
      </main>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        title="Project Details"
        onClose={() => setDetailOpen(false)}
      >
        {selectedProject && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Coordinator</p>
                <p className="text-lg font-bold text-slate-900 mt-2">{getLeaderName(selectedProject.leader)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Department</p>
                <p className="text-lg font-bold text-slate-900 mt-2">{getDepartmentName(selectedProject.department)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Priority</p>
                <div className="mt-2">
                  <PriorityBadge value={selectedProject.priority} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase">Status</p>
                <div className="mt-2">
                  <StatusBadge value={selectedProject.status} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-600 uppercase mb-2">Description</p>
              <p className="text-slate-700">{selectedProject.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase">Team Size</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{selectedProject.teamSize}</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase">Due Date</p>
                <p className="text-sm font-bold text-slate-900 mt-2">{formatDate(selectedProject.dueDate)}</p>
              </div>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <p className="text-xs font-bold text-slate-600 uppercase">Members</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{selectedProject.teamSize}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
