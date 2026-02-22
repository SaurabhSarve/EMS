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
  departmentName: "",
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

export default function DepartmentHeadProjects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [formState, setFormState] = useState(defaultFormState);
  const [formErrors, setFormErrors] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [notice, setNotice] = useState("");
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  // const [employeeMenuOpen, setEmployeeMenuOpen] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [leaderId, setLeaderId] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState("");
  const [departmentOverride, setDepartmentOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [currentDepartmentId, setCurrentDepartmentId] = useState(null);
  const [requiresDepartmentSelection, setRequiresDepartmentSelection] = useState(false);
  const [assigningDepartment, setAssigningDepartment] = useState(false);
  const [selectedDepartmentForAssignment, setSelectedDepartmentForAssignment] = useState("");
  const [projectUpdates, setProjectUpdates] = useState({});
  const [loadingUpdates, setLoadingUpdates] = useState({});

  const departmentOptions = useMemo(() => {
    const base = projects.map((row) => row.department).filter(Boolean);
    return ["All", ...new Set(base)];
  }, [projects]);

  const statusOptions = useMemo(() => {
    const base = projects.map((row) => row.status);
    return ["All", ...new Set(base)];
  }, [projects]);

  const priorityOptions = ["All", "High", "Medium", "Low"];
  const departmentName = user?.department?.name || user?.department || "";
  const departmentId = user?.department?._id || user?.departmentId || "";
  const departmentLabel = departmentOverride || departmentName || "Department";

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.leader.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment =
        departmentFilter === "All" || project.department === departmentFilter;
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

  const engagedEmployeeIds = useMemo(() => {
    const engagementSet = new Set();
    const activeProjects = projects.filter(p => p.status !== "Archived" && p.status !== "Completed");

    activeProjects.forEach((project) => {
      if (Array.isArray(project.assignees)) {
        project.assignees.forEach((assignee) => {
          engagementSet.add(assignee._id || assignee);
        });
      } else if (project.assignees?._id) {
        engagementSet.add(project.assignees._id);
      }
    });

    return engagementSet;
  }, [projects]);

  // Filter employees based on department and search query
  const searchFilteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) {
      return filteredEmployees;
    }
    
    const searchLower = employeeSearch.toLowerCase();
    return filteredEmployees.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const employeeId = (emp.employeeId || "").toLowerCase();
      
      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        employeeId.includes(searchLower)
      );
    });
  }, [filteredEmployees, employeeSearch]);

  const [animatedCounts, setAnimatedCounts] = useState(analytics.map(() => 0));

  useEffect(() => {
    let frame = 0;
    const totalFrames = 18;
    const timer = setInterval(() => {
      frame += 1;
      setAnimatedCounts(
        analytics.map((item) => Math.round((item.value * frame) / totalFrames))
      );
      if (frame >= totalFrames) {
        clearInterval(timer);
        setAnimatedCounts(analytics.map((item) => item.value));
      }
    }, 32);

    return () => clearInterval(timer);
  }, [analytics]);

  const pageSize = viewMode === "table" ? 6 : 8;
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const fetchEmployees = async () => {
      // if (requiresDepartmentSelection) {
      //   setEmployees([]);
      //   return;
      // }

      setLoadingEmployees(true);
      setEmployeeError("");

      try {
        const response = isAdmin
          ? await employeeService.getAllEmployees()
          : await employeeService.getDepartmentHeadEmployees();

        console.log("EMPLOYEE RESPONSE:", response);

        // ✅ Universal parsing (handles both cases)
        const list =
          Array.isArray(response?.employees)
            ? response.employees
            : Array.isArray(response?.data?.employees)
              ? response.data.employees
              : Array.isArray(response?.data)
                ? response.data
                : [];

        console.log("FINAL EMPLOYEE LIST:", list);

        setEmployees(list);
        
        // For Admin: do not show employees until a department is selected
        // For Department Head: show all employees from their department
        if (isAdmin) {
          setFilteredEmployees([]); // No employees shown until department is selected
        } else {
          setFilteredEmployees(list); // Department Head sees their department's employees
        }

      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployeeError("Unable to load employees.");
        setEmployees([]);
        setFilteredEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [ isAdmin]);



  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      setProjectsError("");
      setRequiresDepartmentSelection(false);

      try {
        const response = await projectService.getProjectsByDepartmentHead();

        if (response?.requiresDepartmentSelection) {
          setRequiresDepartmentSelection(true);
          setAvailableDepartments(response?.data?.availableDepartments || []);
          setProjects([]);
          return;
        }

        const projectList =
          response?.data?.projects ||
          (Array.isArray(response?.data) ? response.data : []);

        const deptDetails = response?.data?.departmentDetails;
        
        console.log("API Response - deptDetails:", deptDetails);
        console.log("Available Departments from response:", response?.data?.availableDepartments);

        const transformedProjects = projectList.map((proj) => ({
          ...proj,
          id: proj._id,
          leader:
            proj.leaderName ||
            `${proj.leader?.firstName || ""} ${proj.leader?.lastName || ""}`.trim(),
          leaderId: proj.leader?._id || proj.leader,
          departmentId: proj.department || deptDetails?._id,
          department: proj.departmentName || deptDetails?.name,
          assignees: proj.assignees || [],
          dueDate: proj.dueDate?.split("T")[0] || proj.dueDate,
        }));

        setProjects(transformedProjects);

        // Store department details for Department Head and Admin
        if (deptDetails?._id) {
          setCurrentDepartmentId(deptDetails._id);
          console.log("Setting currentDepartmentId to:", deptDetails._id, "with name:", deptDetails.name);
          // For Department Head, add their department to availableDepartments if not already there
          if (!isAdmin && deptDetails) {
            const deptToSet = [{
              _id: deptDetails._id,
              name: deptDetails.name,
              ...deptDetails
            }];
            console.log("Setting availableDepartments for Department Head:", deptToSet);
            setAvailableDepartments(deptToSet);
          }
        }
        
        if (response?.data?.availableDepartments) {
          console.log("Setting availableDepartments from response:", response.data.availableDepartments);
          setAvailableDepartments(response.data.availableDepartments);
        }

        if (deptDetails?.name && !departmentOverride) {
          setDepartmentOverride(deptDetails.name);
        }

      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjectsError(
          error?.message ||
          "Unable to load projects from server. Please try again."
        );
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();

    const interval = setInterval(fetchProjects, 30000);
    return () => clearInterval(interval);

  }, [user]);


  useEffect(() => {
    setPage(1);
  }, [searchQuery, departmentFilter, statusFilter, priorityFilter, viewMode]);

  // Recalculate status every minute to catch overdue changes
  useEffect(() => {
    const statusCheckInterval = setInterval(() => {
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          status: resolveStatus(project.status, project.dueDate, project.archived),
        }))
      );
    }, 60000); // Check every minute

    return () => clearInterval(statusCheckInterval);
  }, []);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const openCreate = () => {
    setModalMode("create");
    let autoDepartmentId = "";
    let autoDepartmentName = "";
    
    console.log("openCreate - isAdmin:", isAdmin, "currentDepartmentId:", currentDepartmentId, "availableDepartments:", availableDepartments);
    
    if (isAdmin) {
      // Admin can select any department - no employees shown until department is selected
      autoDepartmentId = "";
      autoDepartmentName = "";
      setFilteredEmployees([]); // Clear employees list until department is selected
    } else {
      // Department Head - auto-fill with their assigned department
      // Their employees are already fetched and filtered by the API
      autoDepartmentId = currentDepartmentId || availableDepartments[0]?._id || "";
      if (autoDepartmentId && availableDepartments.length > 0) {
        const foundDept = availableDepartments.find(d => d._id === autoDepartmentId);
        autoDepartmentName = foundDept?.name || "";
        console.log("Found department:", foundDept, "Name:", autoDepartmentName);
        console.log("Setting department members, total employees:", employees.length);
      }
      // Show all fetched employees (already filtered by API for their department)
      setFilteredEmployees(employees);
    }
    
    setFormState({ 
      ...defaultFormState, 
      department: autoDepartmentId,
      departmentName: autoDepartmentName
    });
    setFormErrors({});
    setSelectedProject(null);
    setSelectedEmployees([]);
    setLeaderId("");
    setModalOpen(true);
  };


  const openEdit = (project) => {
    setModalMode("edit");
    setSelectedProject(project);

    setFormState({
      name: project.name,
      description: project.description,
      department: project.departmentId || "",
      departmentName: project.department || "",
      teamSize: String(project.teamSize),
      leader: project.leader,
      dueDate: project.dueDate,
      priority: project.priority,
    });

    // Show employees for the form
    if (isAdmin && project.departmentId) {
      // Admin: Filter employees by the project's department
      const selectedDept = availableDepartments.find(d => d._id === project.departmentId);
      if (selectedDept) {
        const deptEmployees = employees.filter(emp => 
          emp.department === selectedDept.name || emp.department?._id === project.departmentId
        );
        setFilteredEmployees(deptEmployees);
      }
    } else {
      // Department Head: Show all their department's employees (already filtered by API)
      setFilteredEmployees(employees);
    }

    setSelectedEmployees(project?.assignees || []);
    setLeaderId(project?.leaderId || "");
    setFormErrors({});

    setModalOpen(true);
  };


  const openView = async (project) => {
    setModalMode("view");
    setSelectedProject(project);
    setModalOpen(true);

    // Fetch updates for this project
    if (!projectUpdates[project.id]) {
      setLoadingUpdates((prev) => ({ ...prev, [project.id]: true }));
      try {
        const response = await projectService.getProjectUpdates(project.id);
        const updates = response?.data?.updates || response?.data || [];
        setProjectUpdates((prev) => ({ ...prev, [project.id]: updates }));
      } catch (error) {
        console.error("Error fetching project updates:", error);
      } finally {
        setLoadingUpdates((prev) => ({ ...prev, [project.id]: false }));
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedProject(null);
    // setEmployeeMenuOpen(false);
  };

  const handleAssignDepartment = async () => {
    if (!selectedDepartmentForAssignment) {
      setProjectsError("Please select a department");
      return;
    }

    setAssigningDepartment(true);
    try {
      await projectService.assignDepartmentToHead(selectedDepartmentForAssignment);
      setNoticeMessage("Department assigned successfully! Reloading page...");

      // Reload page after 1.5 seconds to refresh JWT token and all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setProjectsError(error.message || "Failed to assign department. Please try again.");
      setAssigningDepartment(false);
    }
  };

  const setNoticeMessage = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2800);
  };

  const handleFormChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    
    // If Admin is selecting a department, filter employees by that department
    if (field === "department" && isAdmin && value) {
      const selectedDept = availableDepartments.find(d => d._id === value);
      if (selectedDept) {
        const deptEmployees = employees.filter(emp => 
          emp.department === selectedDept.name || emp.department?._id === value
        );
        console.log("Filtering employees for department:", selectedDept.name, "Found:", deptEmployees);
        setFilteredEmployees(deptEmployees);
      }
    } else if (field === "department" && !value) {
      // If department is cleared, show all employees
      setFilteredEmployees(employees);
    }
  };

  useEffect(() => {
    const leader = selectedEmployees.find((item) => item._id === leaderId);
    setFormState((prev) => ({
      ...prev,
      leader: leader ? getEmployeeLabel(leader) : "",
    }));
  }, [leaderId, selectedEmployees]);





  const toggleEmployee = (employee) => {
    const exists = selectedEmployees.some((item) => item._id === employee._id);
    if (exists) {
      const next = selectedEmployees.filter((item) => item._id !== employee._id);
      setSelectedEmployees(next);
      if (leaderId === employee._id) {
        setLeaderId("");
      }
    } else {
      setSelectedEmployees((prev) => [...prev, employee]);
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formState.name.trim()) nextErrors.name = "Project name is required.";
    if (!formState.department) nextErrors.department = "Department is required.";
    if (!formState.dueDate) nextErrors.dueDate = "Due date is required.";
    const teamSize = selectedEmployees.length;
    if (!teamSize || teamSize < 1) nextErrors.teamSize = "Team size must be at least 1.";
    if (selectedEmployees.length === 0) nextErrors.assignees = "Select at least one team member.";
    if (!leaderId) nextErrors.leaderId = "Select a team leader.";
    if (leaderId && !selectedEmployees.some((item) => item._id === leaderId)) {
      nextErrors.leaderId = "Leader must be one of the selected team members.";
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const selectedLeader = selectedEmployees.find((item) => item._id === leaderId);
    const leaderName = selectedLeader ? getEmployeeLabel(selectedLeader) : formState.leader.trim();

    // Get department ID and name from form state
    const deptId = formState.department;
    if (!deptId) {
      setFormErrors({ department: "Department is required." });
      return;
    }

    const projectData = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      department: deptId,
      departmentName: formState.departmentName || "",
      teamSize: selectedEmployees.length,
      leader: leaderId,
      leaderName: leaderName,
      assignees: selectedEmployees.map(emp => emp._id),
      dueDate: formState.dueDate,
      priority: formState.priority,
    };

    setSubmitting(true);
    try {
      if (modalMode === "edit") {
        const response = await projectService.updateProject(selectedProject._id, projectData);
        const updatedProject = response?.data;

        setProjects((prev) => prev.map((item) =>
          item.id === selectedProject.id
            ? {
              ...item,
              ...updatedProject,
              id: updatedProject._id,
              leader: updatedProject.leaderName,
              leaderId: updatedProject.leader,
              departmentId: updatedProject.department,
              department: updatedProject.departmentName
            }
            : item
        ));
        setNoticeMessage("Project updated successfully.");
      } else {
        const response = await projectService.createProject(projectData);
        const newProject = response?.data;

        const formattedProject = {
          ...newProject,
          id: newProject._id,
          leader: newProject.leaderName,
          leaderId: newProject.leader,
          departmentId: newProject.department,
          department: newProject.departmentName,
          dueDate: newProject.dueDate?.split('T')[0] || newProject.dueDate
        };

        setProjects((prev) => [formattedProject, ...prev]);
        setNoticeMessage("Project created successfully.");
      }
      closeModal();
    } catch (error) {
      console.error("Error saving project:", error);
      setNoticeMessage(error?.message || "Error saving project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (project) => {
    try {
      await projectService.archiveProject(project._id || project.id);
      setProjects((prev) =>
        prev.map((item) =>
          (item.id === project.id || item._id === project._id) ? { ...item, status: "Archived", archived: true } : item
        )
      );
      setNoticeMessage("Project archived.");
    } catch (error) {
      console.error("Error archiving project:", error);
      setNoticeMessage("Error archiving project.");
    }
  };

  const handleUnarchive = async (project) => {
    try {
      await projectService.unarchiveProject(project._id || project.id);
      setProjects((prev) =>
        prev.map((item) =>
          (item.id === project.id || item._id === project._id) ? { ...item, status: "Pending", archived: false } : item
        )
      );
      setNoticeMessage("Project unarchived.");
    } catch (error) {
      console.error("Error unarchiving project:", error);
      setNoticeMessage("Error unarchiving project.");
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm("Delete this project? This action cannot be undone.")) return;
    try {
      await projectService.deleteProject(project._id || project.id);
      setProjects((prev) => prev.filter((item) => item.id !== project.id && item._id !== project._id));
      setNoticeMessage("Project deleted.");
    } catch (error) {
      console.error("Error deleting project:", error);
      setNoticeMessage("Error deleting project.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <AdminSidebar />

      {notice && (
        <div className="fixed top-6 right-6 z-40 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {notice}
        </div>
      )}

      <main className="px-4 pb-16 pt-24 sm:px-6 lg:px-10 lg:pt-10 lg:ml-64">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-400 px-6 py-8 text-white shadow-2xl sm:px-8">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">
                {isAdmin ? "Admin" : "Department Head"} Workspace
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">Project Command Center</h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Oversee milestones, align teams, and keep delivery on track with real-time visibility.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Portfolio View</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Live Performance</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Priority Focus</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-100">Active Now</p>
                <p className="text-2xl font-bold">{analytics[1]?.value ?? 0}</p>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                onClick={openCreate}
                type="button"
              >
                <Plus size={16} /> Create Project
              </button>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analytics.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl bg-white/95 p-5 shadow-lg ring-1 ring-blue-100 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </div>
                  <span className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-r ${item.tone} p-2 text-white shadow-md`}>
                    <Icon size={16} />
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="text-3xl font-semibold text-slate-900">
                    {animatedCounts[index]}
                  </div>
                  <div className="text-xs font-semibold text-slate-400">This month</div>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${item.tone} transition-all duration-700`}
                    style={{ width: `${Math.min(100, (animatedCounts[index] / Math.max(1, item.value)) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-8 rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-blue-100">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filters & Views</h2>
              <p className="text-sm text-slate-500">Refine the portfolio by team, status, or priority.</p>
            </div>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-9 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                type="text"
                placeholder="Search by project or leader"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl">
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
            Showing {filteredProjects.length} projects
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-blue-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
              <p className="text-sm text-slate-500">Track timelines, owners, and status at a glance.</p>
            </div>
          </div>

          {loadingProjects ? (
            <div className="mt-6 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                <p className="mt-4 text-sm font-semibold text-slate-600">Loading projects...</p>
              </div>
            </div>
          ) : requiresDepartmentSelection ? (
            <div className="mt-6">
              <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900">Select Your Department</h3>
                    <p className="mt-2 text-sm text-blue-700">Your account needs to be associated with a department. Select one from the dropdown below.</p>

                    <div className="mt-4">
                      <label className="text-xs font-semibold uppercase tracking-wide text-blue-600">Department</label>
                      <select
                        value={selectedDepartmentForAssignment}
                        onChange={(e) => setSelectedDepartmentForAssignment(e.target.value)}
                        className="mt-2 h-10 w-full rounded-lg border border-blue-300 bg-white px-3 text-sm"
                        disabled={assigningDepartment}
                      >
                        <option value="">-- Select a department --</option>
                        {availableDepartments.map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleAssignDepartment}
                        disabled={!selectedDepartmentForAssignment || assigningDepartment}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {assigningDepartment ? "Assigning..." : "Assign Department"}
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-blue-600">
                      <strong>Note:</strong> The page will automatically reload to refresh your account data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : projectsError ? (
            <div className="mt-6">
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-10V7m0 2h-2m0 0H8m2 0h2m0 0h2m0 0v2m0-2V7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-rose-900">Unable to Load Projects</h3>
                    <p className="mt-2 text-sm text-rose-700">{projectsError}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLoadingProjects(true);
                          setProjectsError("");
                          projectService.getProjectsByDepartmentHead().then(
                            (response) => {
                              const projectList = response?.data?.projects || (Array.isArray(response?.data) ? response.data : []);
                              const deptDetails = response?.data?.departmentDetails;
                              const transformedProjects = projectList.map(proj => ({
                                ...proj,
                                id: proj._id,
                                leader: proj.leaderName || proj.leader?.firstName + ' ' + proj.leader?.lastName || '',
                                leaderId: proj.leader?._id || proj.leader,
                                departmentId: proj.department || deptDetails?._id,
                                department: proj.departmentName || deptDetails?.name,
                                assignees: proj.assignees || [],
                                dueDate: proj.dueDate?.split('T')[0] || proj.dueDate
                              }));
                              setProjects(transformedProjects);
                              if (deptDetails?.name && !departmentOverride) {
                                setDepartmentOverride(deptDetails.name);
                              }
                              setLoadingProjects(false);
                            }
                          ).catch((error) => {
                            console.error("Error fetching projects:", error);
                            setProjectsError(error.message || "Unable to load projects from server. Please try again later.");
                            setLoadingProjects(false);
                          });
                        }}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => window.location.href = '/admin/dashboard'}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-rose-600">
                      <strong>Action Required:</strong> Please contact your administrator with the error message above.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No projects found"
                description="Try adjusting your search or filters to see results."
                action={
                  <button
                    type="button"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Plus size={16} /> Create Project
                  </button>
                }
              />
            </div>
          ) : viewMode === "table" ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-lg bg-white">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Project Name</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Team Lead</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Team Size</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Due Date</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Status</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Priority</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedProjects.map((project, idx) => (
                    <tr key={project.id} className={`transition hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-slate-50/80 ${idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}`}>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-slate-900 max-w-xs truncate">{project.name}</p>
                          <p className="text-xs text-slate-500 max-w-xs truncate mt-0.5">{project.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white">
                            {project.leader?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-slate-900">{project.leader}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 font-semibold text-blue-700">
                          <Users className="w-3.5 h-3.5" />
                          {project.teamSize}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100/60 px-3 py-1.5 text-sm font-semibold text-blue-900">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(project.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={project.status} />
                      </td>
                      <td className="px-4 py-4">
                        <PriorityBadge value={project.priority} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openView(project)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 transition hover:bg-blue-100 hover:border-blue-300"
                            title="View project"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {project.status !== "Archived" && (
                            <button
                              type="button"
                              onClick={() => openEdit(project)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 transition hover:bg-blue-100 hover:border-blue-300"
                              title="Edit project"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {project.status !== "Archived" ? (
                            <button
                              type="button"
                              onClick={() => handleArchive(project)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 transition hover:bg-amber-100 hover:border-amber-300"
                              title="Archive project"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnarchive(project)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 transition hover:bg-emerald-100 hover:border-emerald-300"
                              title="Unarchive project"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(project)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 transition hover:bg-rose-100 hover:border-rose-300"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

                const getIconBg = () => {
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
                    {/* Animated background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50 opacity-0 group-hover:opacity-50 transition duration-300" />

                    {/* Top colored accent bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${getStatusColor()}`} />

                    {/* Priority Icon - Top Right */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`bg-gradient-to-br ${getIconBg()} rounded-xl p-2.5 shadow-md`}>
                        <Flag className="w-4 h-4 text-slate-700" />
                      </div>
                    </div>

                    {/* Header Section */}
                    <div className="relative z-10 pt-6 px-6 pb-4">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition">
                            {project.name}
                          </h3>
                          <p className="mt-1.5 text-sm text-slate-500 line-clamp-1 font-medium">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Status and Priority Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge value={project.status} />
                        <PriorityBadge value={project.priority} />
                      </div>
                    </div>

                    {/* Department info */}
                    <div className="relative z-10 px-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-slate-700 font-semibold">{project.department}</span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="relative z-10 flex-1 px-6 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Team Members */}
                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 p-3.5 transition hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-200 flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-700" />
                            </div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Team</p>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">{project.teamSize}</p>
                          <p className="text-xs text-blue-600 mt-0.5 font-medium">members</p>
                        </div>

                        {/* Lead Person */}
                        <div className="rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200/50 p-3.5 transition hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-sky-200 flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-sky-700" />
                            </div>
                            <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Lead</p>
                          </div>
                          <p className="text-sm font-bold text-sky-900 truncate">{project.leader.split(" ")[0]}</p>
                          <p className="text-xs text-sky-600 mt-0.5 font-medium">assigned</p>
                        </div>

                        {/* Due Date */}
                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200/50 p-3.5 transition hover:shadow-md col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-8 w-8 rounded-lg bg-blue-200 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-blue-700" />
                            </div>
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Due Date</p>
                          </div>
                          <p className="text-sm font-bold text-blue-900">{formatDate(project.dueDate)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="relative z-10 px-6 py-3 bg-white border-t border-slate-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openView(project)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold shadow-md transition duration-200 hover:shadow-lg active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      {project.status !== "Archived" && (
                        <button
                          type="button"
                          onClick={() => openEdit(project)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition duration-200 hover:border-blue-300"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                      {project.status !== "Archived" ? (
                        <button
                          type="button"
                          onClick={() => handleArchive(project)}
                          className="inline-flex items-center justify-center p-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-600 transition duration-200 hover:border-amber-300 group/btn"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUnarchive(project)}
                          className="inline-flex items-center justify-center p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition duration-200 hover:border-emerald-300 group/btn"
                          title="Unarchive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(project)}
                        className="inline-flex items-center justify-center p-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition duration-200 hover:border-rose-300 group/btn"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
        open={modalOpen}
        title={
          modalMode === "view"
            ? "Project Details"
            : modalMode === "edit"
              ? "Edit Project"
              : "Create Project"
        }
        subtitle={
          modalMode === "view"
            ? "Review project summary and timeline."
            : "Fill in all fields to keep records accurate."
        }
        onClose={closeModal}
        footer={
          modalMode === "view" ? null : (
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg sm:rounded-xl border border-slate-200 px-4 py-2.5 sm:py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="project-form"
                className="rounded-lg sm:rounded-xl bg-blue-600 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition w-full sm:w-auto"
              >
                {modalMode === "edit" ? "Save Changes" : "Create Project"}
              </button>
            </div>
          )
        }
      >
        {modalMode === "view" && selectedProject ? (
          <div className="grid gap-4 text-sm text-slate-600">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Description</p>
              <p className="mt-1 text-slate-700">{selectedProject.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Department</p>
                <p className="mt-1 font-semibold text-slate-700">{selectedProject.department}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Leader</p>
                <p className="mt-1 font-semibold text-slate-700">{selectedProject.leader}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Team Size</p>
                <p className="mt-1 font-semibold text-slate-700">{selectedProject.teamSize}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">Due Date</p>
                <p className="mt-1 font-semibold text-slate-700">{formatDate(selectedProject.dueDate)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge value={selectedProject.priority} />
              <StatusBadge value={selectedProject.status} />
            </div>

            {/* Team Updates Section */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity size={16} className="text-blue-600" />
                Team Updates
              </h4>
              {loadingUpdates[selectedProject.id] ? (
                <p className="text-xs text-slate-500 text-center py-4">Loading updates...</p>
              ) : projectUpdates[selectedProject.id]?.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {projectUpdates[selectedProject.id].map((update) => (
                    <div key={update._id} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900">
                              {update.user?.firstName} {update.user?.lastName}
                            </span>
                            {update.type === 'comment' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                                Comment
                              </span>
                            )}
                          </div>
                          {update.content && (
                            <p className="text-slate-600 mt-2 leading-relaxed">{update.content}</p>
                          )}
                          {update.files?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {update.files.map((file, idx) => (
                                <a
                                  key={idx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600"
                                >
                                  📎 {file.name}
                                </a>
                              ))}
                            </div>
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
                <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No updates yet from team members</p>
              )}
            </div>
          </div>
        ) : (
          <form id="project-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Project Details</h3>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={formState.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  placeholder="Enter project name..."
                />
                {formErrors.name && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className="w-full min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                  value={formState.description}
                  onChange={(event) => handleFormChange("description", event.target.value)}
                  placeholder="Describe the project goals and objectives..."
                />
                {formErrors.description && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.description}</p>}
              </div>
            </div>

            {/* Organization Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Organization</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  {isAdmin && availableDepartments.length > 0 ? (
                    // Dropdown for Admin
                    <select
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      value={formState.department}
                      onChange={(event) => {
                        const deptId = event.target.value;
                        const deptName = availableDepartments.find(d => d._id === deptId)?.name || "";
                        handleFormChange("department", deptId);
                        handleFormChange("departmentName", deptName);
                        
                        // Filter employees by selected department
                        if (deptId) {
                          const selectedDept = availableDepartments.find(d => d._id === deptId);
                          if (selectedDept) {
                            const deptEmployees = employees.filter(emp => 
                              emp.department === selectedDept.name || emp.department?._id === deptId
                            );
                            setFilteredEmployees(deptEmployees);
                            setSelectedEmployees([]); // Clear selected employees when department changes
                            setLeaderId(""); // Clear leader selection
                            console.log("Department changed to:", selectedDept.name, "Filtered employees:", deptEmployees.length);
                          }
                        } else {
                          setFilteredEmployees(employees);
                          setSelectedEmployees([]);
                          setLeaderId("");
                        }
                      }}
                    >
                      <option value="">Select a department</option>
                      {availableDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Readonly input for Department Head
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 font-medium"
                        value={
                          formState.departmentName || 
                          availableDepartments.find(d => d._id === formState.department)?.name || 
                          departmentOverride ||
                          "Loading..."
                        }
                        disabled
                        readOnly
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Briefcase className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                  {formErrors.department && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.department}</p>}
                </div>

                {/* Team Leader */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                    Team Leader
                    <span className="ml-1 text-xs font-normal text-slate-400 normal-case">
                      {selectedEmployees.length === 0 ? '(Select members first)' : `(${selectedEmployees.length} available)`}
                    </span>
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm transition hover:border-blue-300 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={leaderId}
                    onChange={(event) => setLeaderId(event.target.value)}
                    disabled={selectedEmployees.length === 0}
                  >
                    <option value="">
                      {selectedEmployees.length === 0 ? 'Select team members first' : 'Choose a team leader'}
                    </option>
                    {selectedEmployees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {getEmployeeLabel(employee)}
                      </option>
                    ))}
                  </select>
                  {formErrors.leaderId && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.leaderId}</p>}
                </div>
              </div>
            </div>

            {/* Team Composition Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">Team Composition</h3>
              </div>

              {/* Team Size */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                  Team Size
                  <span className="ml-1 text-xs font-normal text-slate-400 normal-case">(Auto-calculated)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-purple-50 px-4 text-sm text-slate-700 font-semibold"
                    value={selectedEmployees.length}
                    disabled
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 font-bold">
                    {selectedEmployees.length}
                  </div>
                </div>
                {formErrors.teamSize && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.teamSize}</p>}
              </div>

              {/* Team Members Selector */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <label className="text-sm font-semibold text-slate-900">Select Team Members</label>
                      {selectedEmployees.length > 0 && (
                        <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                          {selectedEmployees.length}
                        </span>
                      )}
                    </div>
                    {selectedEmployees.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployees([]);
                          setLeaderId("");
                        }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-3 p-4 border-b border-slate-100 bg-white">
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or employee ID..."
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    // onFocus={() => setEmployeeMenuOpen(true)}
                    className="flex-1 bg-transparent text-sm placeholder-slate-400 focus:outline-none"
                  />
                  {/* {employeeMenuOpen && (
                    <button
                      type="button"
                      onClick={() => setEmployeeMenuOpen(false)}
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Close
                    </button>
                  )} */}
                </div>

                {/* Loading State */}
                {/* Loading */}
                {/* Loading State */}
                {loadingEmployees && (
                  <div className="px-4 py-6 text-center">
                    <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-purple-600 mb-2"></div>
                    <p className="text-xs text-slate-500">Loading employees...</p>
                  </div>
                )}

                {/* Error State */}
                {!loadingEmployees && employeeError && (
                  <div className="px-4 py-3 bg-rose-50 border-t border-rose-200">
                    <p className="text-xs text-rose-700 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {employeeError}
                    </p>
                  </div>
                )}

                {/* Employee List */}
                {!loadingEmployees && !employeeError && (
                  <div className="max-h-72 overflow-y-auto">
                    {loadingEmployees ? (
                      <div className="px-4 py-6 text-center">
                        <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-purple-600 mb-2"></div>
                        <p className="text-xs text-slate-500">Loading employees...</p>
                      </div>
                    ) : employees.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 font-medium">
                          No employees found
                        </p>
                      </div>
                    ) : filteredEmployees.length === 0 && formState.department && isAdmin ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-slate-500">
                          No employees in this department
                        </p>
                      </div>
                    ) : searchFilteredEmployees.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-slate-500">
                          No employees match "{employeeSearch}"
                        </p>
                        <button
                          type="button"
                          onClick={() => setEmployeeSearch("")}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      searchFilteredEmployees.map((employee, index) => {
                        const isSelected = selectedEmployees.some(
                          (item) => item._id === employee._id
                        );
                        const isEngaged = engagedEmployeeIds.has(employee._id);

                        return (
                          <label
                            key={employee._id}
                            className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm transition ${isSelected
                              ? "bg-purple-50 border-l-2 border-purple-600"
                              : index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50"
                              } ${index > 0 ? "border-t border-slate-100" : ""} hover:bg-purple-50/50`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEmployee(employee)}
                              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="text-slate-900 font-medium truncate flex items-center gap-2">
                                {getEmployeeLabel(employee)}
                                {isEngaged && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex-shrink-0">
                                    Engaged
                                  </span>
                                )}
                              </div>

                              {employee?.employeeId && (
                                <div className="text-xs text-slate-500">
                                  ID: {employee.employeeId}
                                </div>
                              )}
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            )}
                          </label>
                        );
                      })
                    )}

                  </div>
                )}




                {/* Selected Members Display */}
                {selectedEmployees.length > 0 && (
                  <div className="p-4 bg-purple-50 border-t border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Selected Members ({selectedEmployees.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.map((employee) => {
                        const isEngaged = engagedEmployeeIds.has(employee._id);
                        return (
                          <span
                            key={employee._id}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:shadow-md border-2 ${
                              isEngaged
                                ? "bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400"
                                : "bg-white text-purple-700 border-purple-200 hover:border-purple-400"
                            }`}
                          >
                            {getEmployeeLabel(employee)}
                            {isEngaged && <span className="text-xs font-bold">⚠</span>}
                            <button
                              type="button"
                              className={`font-bold transition rounded-full w-4 h-4 flex items-center justify-center ${
                                isEngaged
                                  ? "text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                                  : "text-purple-500 hover:text-purple-700 hover:bg-purple-100"
                              }`}
                              onClick={() => toggleEmployee(employee)}
                              title="Remove member"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
              {formErrors.assignees && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.assignees}</p>}
            </div>

            {/* Timeline & Tracking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">Timeline & Tracking</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={formState.dueDate}
                    onChange={(event) => handleFormChange("dueDate", event.target.value)}
                  />
                  {formErrors.dueDate && <p className="mt-2 text-xs text-rose-500 font-medium">{formErrors.dueDate}</p>}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm transition hover:border-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={formState.priority}
                    onChange={(event) => handleFormChange("priority", event.target.value)}
                  >
                    {priorityOptions.filter((option) => option !== "All").map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
