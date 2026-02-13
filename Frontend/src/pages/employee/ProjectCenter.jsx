import { useState, useEffect, useMemo } from "react";
import { Search, Users, CalendarClock, Clock, Flag, TrendingUp } from "lucide-react";
import { MdWork } from "react-icons/md";
import EmployeesSidebar from "../../Components/EmployeesSidebar";
import { projectService } from "../../services/projectService";
import {
  EmptyState,
  Modal,
  Pagination,
  PriorityBadge,
  StatusBadge,
} from "../../Components/ProjectUI";

const initialProjects = [
  {
    id: "emp-proj-01",
    name: "Client Portal Refresh",
    description: "Rebuild client portal with streamlined onboarding and reporting.",
    team: ["Kia", "Liam", "Noah"],
    dueDate: "2026-02-28",
    progress: 64,
    status: "Ongoing",
    priority: "High",
  },
  {
    id: "emp-proj-02",
    name: "HR Knowledge Base",
    description: "Structure HR content into a searchable self-service hub.",
    team: ["Sasha", "Priya"],
    dueDate: "2026-02-20",
    progress: 100,
    status: "Completed",
    priority: "Medium",
  },
  {
    id: "emp-proj-03",
    name: "Vendor Risk Audit",
    description: "Validate compliance checklist and update risk matrix.",
    team: ["Andre", "Mira", "Ken"],
    dueDate: "2026-02-14",
    progress: 48,
    status: "Ongoing",
    priority: "High",
  },
  {
    id: "emp-proj-04",
    name: "Support Playbooks",
    description: "Create escalations playbook and response templates.",
    team: ["Riya", "Zoe"],
    dueDate: "2026-03-10",
    progress: 35,
    status: "Pending",
    priority: "Low",
  },
  {
    id: "emp-proj-05",
    name: "Sales Enablement",
    description: "Launch new sales decks and demo narratives.",
    team: ["Omar", "Tess", "Marc"],
    dueDate: "2026-03-02",
    progress: 78,
    status: "Ongoing",
    priority: "Medium",
  },
];

const formatDueDate = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const countdownLabel = (value) => {
  const now = new Date();
  const due = new Date(value);
  const diffMs = due.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays} days left`;
  if (diffDays === 0) return "Due today";
  return `Overdue by ${Math.abs(diffDays)} days`;
};

const resolveStatus = (progress, dueDate) => {
  const progressValue = Number(progress || 0);
  const now = new Date();
  const due = new Date(dueDate);
  if (progressValue >= 100) return "Completed";
  if (due.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) return "Overdue";
  if (progressValue > 0) return "Ongoing";
  return "Pending";
};

export default function ProjectCenter() {
  const [projects, setProjects] = useState(() =>
    initialProjects.map((project) => ({
      ...project,
      status: resolveStatus(project.progress, project.dueDate),
    }))
  );
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Due Soonest");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentErrors, setCommentErrors] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [projectUpdates, setProjectUpdates] = useState({});
  const [loadingUpdates, setLoadingUpdates] = useState({});
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Update status whenever date changes or progress changes
  useEffect(() => {
    setProjects((prev) =>
      prev.map((project) => ({
        ...project,
        status: resolveStatus(project.progress, project.dueDate),
      }))
    );
  }, []); // Runs once on component mount to ensure correct status

  // Recalculate status every minute to catch overdue changes
  useEffect(() => {
    const statusCheckInterval = setInterval(() => {
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          status: resolveStatus(project.progress, project.dueDate),
        }))
      );
    }, 60000); // Check every minute

    return () => clearInterval(statusCheckInterval);
  }, []);

  const filteredProjects = useMemo(() => {
    const now = new Date();
    const items = projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || project.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || project.priority === priorityFilter;

      const dueDate = new Date(project.dueDate);
      const dueDiff = dueDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(dueDiff / (1000 * 60 * 60 * 24));

      const matchesDue =
        dueFilter === "All" ||
        (dueFilter === "This Week" && diffDays >= 0 && diffDays <= 7) ||
        (dueFilter === "This Month" && dueDate.getMonth() === now.getMonth()) ||
        (dueFilter === "Overdue" && diffDays < 0);

      return matchesSearch && matchesStatus && matchesPriority && matchesDue;
    });

    const sorted = [...items].sort((a, b) => {
      const aDate = new Date(a.dueDate).getTime();
      const bDate = new Date(b.dueDate).getTime();
      if (sortOrder === "Due Latest") return bDate - aDate;
      if (sortOrder === "Progress High") return b.progress - a.progress;
      if (sortOrder === "Progress Low") return a.progress - b.progress;
      if (sortOrder === "Name A-Z") return a.name.localeCompare(b.name);
      return aDate - bDate;
    });

    return sorted;
  }, [projects, searchQuery, statusFilter, priorityFilter, dueFilter, sortOrder]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      setProjectsError("");
      try {
        const response = await projectService.getProjectsByEmployee();
        const projectList = Array.isArray(response?.data) ? response.data : response?.data?.projects || [];
        
        // Transform backend data to frontend format
        const transformedProjects = projectList.map(proj => ({
          id: proj._id,
          name: proj.name,
          description: proj.description,
          team: proj.assignees?.map(a => `${a.firstName} ${a.lastName}`.trim()).filter(Boolean) || [],
          dueDate: proj.dueDate?.split('T')[0] || proj.dueDate,
          progress: proj.progress || 0,
          status: proj.status,
          priority: proj.priority,
          ...proj
        }));
        
        setProjects(transformedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjectsError("Unable to load projects from server. Using default projects.");
        // Keep initialProjects as fallback
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();

    // Set up polling to refresh projects every 30 seconds
    const pollInterval = setInterval(fetchProjects, 30000);
    
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, priorityFilter, dueFilter, sortOrder]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const setNoticeMessage = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  };

  const handleCommentChange = (id, value) => {
    setCommentDrafts((prev) => ({ ...prev, [id]: value }));
    setCommentErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleCommentSubmit = async (project) => {
    const comment = commentDrafts[project.id]?.trim();
    if (!comment) {
      setCommentErrors((prev) => ({ ...prev, [project.id]: "Please enter a comment." }));
      return;
    }

    setSubmittingComment((prev) => ({ ...prev, [project.id]: true }));
    try {
      // Use the project's backend ID (_id) if available, otherwise use id
      const projectId = project._id || project.id;
      await projectService.addProjectComment(projectId, comment);
      
      setProjects((prev) =>
        prev.map((item) =>
          (item._id === project._id || item.id === project.id)
            ? { ...item, lastComment: comment, lastUpdated: new Date().toISOString() }
            : item
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [project.id]: "" }));
      setNoticeMessage("Comment sent to Head successfully.");
    } catch (error) {
      console.error("Error submitting comment:", error);
      setCommentErrors((prev) => ({ 
        ...prev, 
        [project.id]: error.message || "Failed to submit comment. Please try again." 
      }));
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [project.id]: false }));
    }
  };


  const openDetails = async (project) => {
    setSelectedProject(project);
    setDetailOpen(true);
    
    // Fetch updates for this project
    if (!projectUpdates[project.id]) {
      setLoadingUpdates((prev) => ({ ...prev, [project.id]: true }));
      try {
        const response = await projectService.getProjectUpdates(project.id);
        const updates = response?.data || [];
        setProjectUpdates((prev) => ({ ...prev, [project.id]: updates }));
      } catch (error) {
        console.error("Error fetching project updates:", error);
      } finally {
        setLoadingUpdates((prev) => ({ ...prev, [project.id]: false }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white text-slate-900">
      <EmployeesSidebar />

      {notice && (
        <div className="fixed top-6 right-6 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}

      <main className="px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pt-10 min-[1120px]:ml-64">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 px-8 py-12 text-white mb-8">
          <div className="absolute -right-16 -top-16 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <MdWork className="text-2xl" />
              <h1 className="text-3xl font-bold">My Projects</h1>
            </div>
            <p className="text-blue-100 mb-6">Track and manage your assigned projects</p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-blue-100 text-sm">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-blue-100 text-sm">Active</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === "Ongoing").length}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-blue-100 text-sm">Completed</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === "Completed").length}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-blue-100 text-sm">Overdue</p>
                <p className="text-2xl font-bold text-red-300">{projects.filter(p => p.status === "Overdue").length}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-blue-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-9 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                type="text"
                placeholder="Search projects"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {["All", "Ongoing", "Completed", "Pending", "Overdue"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                {["All", "High", "Medium", "Low"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={dueFilter}
                onChange={(event) => setDueFilter(event.target.value)}
              >
                {["All", "This Week", "This Month", "Overdue"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                {["Due Soonest", "Due Latest", "Progress High", "Progress Low", "Name A-Z"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {filteredProjects.length === 0 ? (
            <EmptyState
              title="No projects assigned"
              description="You will see your assigned projects here once they are created."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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

                const getPriorityColor = () => {
                  switch (project.priority) {
                    case "High":
                      return "from-rose-100 to-pink-100";
                    case "Medium":
                      return "from-amber-100 to-orange-100";
                    default:
                      return "from-emerald-100 to-teal-100";
                  }
                };

                return (
                  <article
                    key={project.id}
                    className="group relative h-full rounded-2xl bg-white overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 border border-slate-100 hover:border-slate-200 flex flex-col"
                  >
                    {/* Animated background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 opacity-0 group-hover:opacity-50 transition duration-300" />

                    {/* Top colored accent bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${getStatusColor()}`} />

                    {/* Priority Icon - Top Right */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`bg-gradient-to-br ${getPriorityColor()} rounded-xl p-2.5 shadow-md`}>
                        <Flag className="w-4 h-4 text-slate-700" />
                      </div>
                    </div>

                    {/* Header Section */}
                    <div className="relative z-10 pt-6 px-6 pb-3">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 font-medium mb-3">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge value={project.status} />
                        <PriorityBadge value={project.priority} />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="relative z-10 px-6 py-4 border-b border-slate-100">
                      <div className="space-y-2.5">
                        {/* Team Members */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200/50">
                          <div className="h-8 w-8 rounded-lg bg-purple-200 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-purple-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Team</p>
                            <p className="text-sm font-bold text-purple-900">{project.team.length} members</p>
                          </div>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200/50">
                          <div className="h-8 w-8 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                            <CalendarClock className="w-4 h-4 text-amber-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Due</p>
                            <p className="text-sm font-bold text-amber-900">{formatDueDate(project.dueDate)}</p>
                          </div>
                        </div>

                        {/* Countdown */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200/50">
                          <div className="h-8 w-8 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Timeline</p>
                            <p className="text-sm font-bold text-blue-900">{countdownLabel(project.dueDate)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comment Section */}
                    <div className="relative z-10 px-6 py-4 border-b border-slate-100">
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-2 tracking-wider">Message to Head</label>
                      <textarea
                        rows={2}
                        placeholder="Share updates or blockers..."
                        value={commentDrafts[project.id] || ""}
                        onChange={(event) => handleCommentChange(project.id, event.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
                      />
                      {commentErrors[project.id] && (
                        <p className="mt-2 text-xs text-rose-600 font-semibold">{commentErrors[project.id]}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="relative z-10 px-6 py-3 bg-white border-t border-slate-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(project)}
                        disabled={submittingComment[project.id]}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md transition duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        <Flag className="w-4 h-4" />
                        <span className="hidden sm:inline">{submittingComment[project.id] ? "Sending..." : "Send"}</span>
                        <span className="sm:hidden">{submittingComment[project.id] ? "..." : "Send"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDetails(project)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition duration-200 hover:border-blue-300"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Details</span>
                        <span className="sm:hidden">View</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </section>
      </main>

      <Modal
        open={detailOpen}
        title="Project Details"
        subtitle="Review key milestones and assigned team."
        onClose={() => setDetailOpen(false)}
      >
        {selectedProject && (
          <div className="grid gap-4 text-sm text-slate-600">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedProject.name}</h3>
              <p className="mt-2 text-slate-500">{selectedProject.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge value={selectedProject.priority} />
              <StatusBadge value={selectedProject.status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Due date</p>
                <p className="mt-1 font-semibold text-slate-700">{formatDueDate(selectedProject.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Team members</p>
                <p className="mt-1 font-semibold text-slate-700">{selectedProject.team.join(", ")}</p>
              </div>
            </div>
            {/* Project Updates Section */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Recent Updates</h4>
              {loadingUpdates[selectedProject.id] ? (
                <p className="text-xs text-slate-500 text-center py-4">Loading updates...</p>
              ) : projectUpdates[selectedProject.id]?.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {projectUpdates[selectedProject.id].map((update) => (
                    <div key={update._id} className="rounded-lg bg-slate-50 p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700">
                            {update.user?.firstName} {update.user?.lastName}
                          </p>
                          {update.type === 'progress' && (
                            <p className="text-slate-600 mt-1">
                              Updated progress to <span className="font-semibold">{update.progress}%</span>
                            </p>
                          )}
                          {update.content && (
                            <p className="text-slate-600 mt-1">{update.content}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(update.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No updates yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
