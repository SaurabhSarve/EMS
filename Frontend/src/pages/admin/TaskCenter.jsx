import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ClipboardCheck,
  FileText,
  Plus,
  Send,
  Eye,
  Pencil,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";

export default function TaskCenter() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [taskUpdates, setTaskUpdates] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "low",
    status: "pending",
  });
  const [editError, setEditError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    headId: "",
    priority: "High",
    dueDate: "",
    notes: "",
  });

  const loadTaskCenterData = async () => {
    try {
      setIsLoading(true);
      const result = await employeeService.getDepartmentTasks();
        const payload = result?.data || {};

        const nextDepartments = Array.isArray(payload.departmentDetails)
          ? payload.departmentDetails
          : payload.departmentDetails
            ? [payload.departmentDetails]
            : [];
        const nextEmployees = Array.isArray(payload.departmentEmployees)
          ? payload.departmentEmployees
          : [];
        const nextTasks = Array.isArray(payload.departmentTasks)
          ? payload.departmentTasks
          : [];

        const headsFromDepartments = nextDepartments
          .filter((dept) => dept.manager && dept.manager._id)
          .map((dept) => ({
            id: String(dept.manager._id),
            name: `${dept.manager.firstName || ""} ${dept.manager.lastName || ""}`.trim(),
            departmentId: String(dept._id),
            departmentName: dept.name,
          }));

        const departmentMap = new Map(
          nextDepartments.map((dept) => [String(dept._id), dept]),
        );
        const headsFromEmployees = nextEmployees
          .filter(
            (emp) => emp.role === "Department Head" || emp.position === "Department Head",
          )
          .map((emp) => {
            const departmentId = String(emp.department?._id || emp.department || "");
            const dept = departmentMap.get(departmentId);
            return {
              id: String(emp._id),
              name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
              departmentId,
              departmentName: dept?.name || "",
            };
          });

        const headsById = new Map(
          [...headsFromDepartments, ...headsFromEmployees]
            .filter((head) => head.id)
            .map((head) => [head.id, head]),
        );

      setDepartments(nextDepartments);
      setEmployees(nextEmployees);
      setTasks(nextTasks);
      setDepartmentHeads(Array.from(headsById.values()));
    } catch (error) {
      console.error("Failed to load task center data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaskCenterData();
  }, []);

  useEffect(() => {
    const loadUpdates = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("headTaskUpdates") || "[]");
        setTaskUpdates(Array.isArray(stored) ? stored : []);
      } catch (error) {
        setTaskUpdates([]);
      }
    };

    loadUpdates();
    window.addEventListener("storage", loadUpdates);
    return () => window.removeEventListener("storage", loadUpdates);
  }, []);

  const availableHeads = useMemo(() => {
    if (!formData.department) return departmentHeads;
    return departmentHeads.filter((head) => head.departmentId === formData.department);
  }, [departmentHeads, formData.department]);

  const selectedDepartment = useMemo(() => {
    if (!formData.department) return null;
    return departments.find((dept) => String(dept._id) === formData.department) || null;
  }, [departments, formData.department]);

  const selectedHead = useMemo(() => {
    if (selectedDepartment?.manager?._id) {
      return {
        id: String(selectedDepartment.manager._id),
        name: `${selectedDepartment.manager.firstName || ""} ${
          selectedDepartment.manager.lastName || ""
        }`.trim(),
      };
    }
    if (!formData.headId) return null;
    return departmentHeads.find((head) => head.id === formData.headId) || null;
  }, [departmentHeads, formData.headId, selectedDepartment]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;
    return { total, pending, inProgress };
  }, [tasks]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (value) => {
    const department = departments.find((dept) => String(dept._id) === value);
    const managerId = department?.manager?._id ? String(department.manager._id) : "";
    const fallbackHead = departmentHeads.find((head) => head.departmentId === value)?.id || "";
    const nextHead = managerId || fallbackHead;
    setFormData((prev) => ({
      ...prev,
      department: value,
      headId: nextHead,
    }));
  };

  const pushHeadAssignedTaskNotification = (taskPayload, head) => {
    try {
      const stored = JSON.parse(localStorage.getItem('headAssignedTaskNotifications') || '[]');
      const entry = {
        id: `head-task-${Date.now()}`,
        headId: head?.id || taskPayload?.headId || '',
        headName: head?.name || 'Department Head',
        taskTitle: taskPayload?.title || 'New Task',
        dueDate: taskPayload?.dueDate || '',
        priority: taskPayload?.priority || 'normal',
        assignedAt: new Date().toISOString(),
      };
      const normalized = Array.isArray(stored) ? stored : [];
      const next = [entry, ...normalized].slice(0, 20);
      localStorage.setItem('headAssignedTaskNotifications', JSON.stringify(next));
    } catch (error) {
      console.error('Failed to store task assignment notification', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!formData.title || !formData.department || !formData.headId || !formData.dueDate || !formData.notes) {
      setFormError("Please fill all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await employeeService.addTask(formData.headId, {
        taskName: formData.title,
        description: formData.notes,
        dueDate: formData.dueDate,
        priority: formData.priority.toLowerCase(),
      });

      pushHeadAssignedTaskNotification(
        {
          title: formData.title,
          dueDate: formData.dueDate,
          priority: formData.priority,
          headId: formData.headId,
        },
        selectedHead
      );

      const refreshed = await employeeService.getDepartmentTasks();
      const payload = refreshed?.data || {};
      setTasks(Array.isArray(payload.departmentTasks) ? payload.departmentTasks : []);
      setFormData({
        title: "",
        department: "",
        headId: "",
        priority: "High",
        dueDate: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to assign task", error);
      setFormError("Unable to assign the task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityStyles = (priority) => {
    if (priority === "high") return "bg-rose-50 text-rose-700 border-rose-200";
    if (priority === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const getStatusStyles = (status) => {
    if (status === "in-progress") return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const employeeMap = useMemo(
    () => new Map(employees.map((emp) => [String(emp._id), emp])),
    [employees],
  );

  const departmentMap = useMemo(
    () => new Map(departments.map((dept) => [String(dept._id), dept])),
    [departments],
  );

  const displayTasks = useMemo(() => {
    return tasks.map((task) => {
      const employeeId = task.employee?._id || task.employee;
      const employee = employeeMap.get(String(employeeId));
      const departmentId = employee?.department?._id || employee?.department || "";
      const department = departmentMap.get(String(departmentId));
      const headName = employee
        ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim()
        : "Unassigned";

      const titleCase = (value) =>
        (value || "")
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      return {
        id: task._id,
        title: task.taskName,
        department: department?.name || "",
        head: headName || "Unassigned",
        priority: task.priority || "low",
        status: task.status || "pending",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        statusLabel: titleCase(task.status),
        priorityLabel: titleCase(task.priority),
        description: task.description || "",
      };
    });
  }, [tasks, employeeMap, departmentMap]);

  const selectedTaskUpdates = useMemo(() => {
    if (!selectedTask) return [];
    return taskUpdates.filter((update) => String(update.taskId) === String(selectedTask.id));
  }, [selectedTask, taskUpdates]);

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
    setIsEditingTask(false);
    setEditError("");
    setEditTaskData({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority || "low",
      status: task.status || "pending",
    });
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
    setIsDetailOpen(false);
    setIsEditingTask(false);
    setEditError("");
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm("Delete this task? This will remove it for the head as well.");
    if (!confirmed) return;

    try {
      const result = await employeeService.deleteTask(taskId);
      if (result?.success) {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
        if (selectedTask?.id === taskId) {
          closeTaskDetails();
        }
      }
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const handleEditField = (field, value) => {
    setEditTaskData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveTask = async () => {
    if (!selectedTask) return;
    if (!editTaskData.title || !editTaskData.description || !editTaskData.dueDate) {
      setEditError("Please fill all required fields.");
      return;
    }

    try {
      setEditError("");
      const result = await employeeService.updateTaskByAdmin(selectedTask.id, {
        taskName: editTaskData.title,
        description: editTaskData.description,
        dueDate: editTaskData.dueDate,
        priority: editTaskData.priority,
        status: editTaskData.status,
      });

      if (result?.success) {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === selectedTask.id
              ? {
                  ...task,
                  taskName: editTaskData.title,
                  description: editTaskData.description,
                  dueDate: editTaskData.dueDate,
                  priority: editTaskData.priority,
                  status: editTaskData.status,
                }
              : task
          )
        );

        setSelectedTask((prev) =>
          prev
            ? {
                ...prev,
                title: editTaskData.title,
                description: editTaskData.description,
                dueDate: editTaskData.dueDate,
                priority: editTaskData.priority,
                status: editTaskData.status,
                priorityLabel: editTaskData.priority
                  .split("-")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" "),
                statusLabel: editTaskData.status
                  .split("-")
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join(" "),
              }
            : prev
        );

        setIsEditingTask(false);
      }
    } catch (error) {
      console.error("Failed to update task", error);
      setEditError("Unable to update task. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
      <AdminSidebar />

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-3xl shadow-xl border border-white/20 px-6 sm:px-8 py-7 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/15 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-10 w-44 h-44 bg-white/15 rounded-full blur-2xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 shadow-md">
                <ClipboardCheck className="text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest text-blue-100">Admin</p>
                <h1 className="text-3xl sm:text-4xl font-black">Task Center</h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Assign, track, and organize tasks for department heads.
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-3 min-w-[120px]">
                <p className="text-xs uppercase tracking-widest text-blue-100">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-3 min-w-[120px]">
                <p className="text-xs uppercase tracking-widest text-blue-100">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-3 min-w-[120px]">
                <p className="text-xs uppercase tracking-widest text-blue-100">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-6">
          <section className="bg-white/95 backdrop-blur rounded-3xl shadow-lg border border-blue-100 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                  <Plus className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Assign New Task</h2>
                  <p className="text-sm text-slate-500">Send a task brief to a department head.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">Task title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => updateFormField("title", event.target.value)}
                  placeholder="Enter a clear task title"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Department</label>
                  <select
                    value={formData.department}
                    onChange={(event) => handleDepartmentChange(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Department head</label>
                  <input
                    type="text"
                    value={selectedHead?.name || ""}
                    placeholder={
                      formData.department
                        ? "No department head assigned"
                        : "Select a department first"
                    }
                    readOnly
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none"
                  />
                  {formData.department && !selectedHead && availableHeads.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      This department does not have a head assigned yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(event) => updateFormField("priority", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {["High", "Medium", "Low"].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Due date</label>
                  <div className="mt-2 relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(event) => updateFormField("dueDate", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Task details</label>
                <div className="mt-2 relative">
                  <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                  <textarea
                    rows="4"
                    value={formData.notes}
                    onChange={(event) => updateFormField("notes", event.target.value)}
                    placeholder="Add milestones, references, or any constraints"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white px-5 py-3 text-sm font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-600 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send size={18} />
                {isSubmitting ? "Assigning..." : "Assign Task"}
              </button>
            </form>
          </section>

          <section className="bg-white/95 backdrop-blur rounded-3xl shadow-lg border border-blue-100 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                  <UserCircle className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Assigned tasks</h2>
                  <p className="text-sm text-slate-500">Latest tasks sent to department heads.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {isLoading ? "Loading..." : `${displayTasks.length} total`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 pr-4">Task</th>
                    <th className="py-3 pr-4">Department</th>
                    <th className="py-3 pr-4">Head</th>
                    <th className="py-3 pr-4">Priority</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Due</th>
                    <th className="py-3">Details</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td className="py-6 text-center text-slate-500" colSpan="8">
                        Loading tasks...
                      </td>
                    </tr>
                  ) : displayTasks.length === 0 ? (
                    <tr>
                      <td className="py-6 text-center text-slate-500" colSpan="8">
                        No tasks assigned yet.
                      </td>
                    </tr>
                  ) : (
                    displayTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-slate-900">{task.title}</div>
                          <div className="text-xs text-slate-500">{task.id}</div>
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{task.department}</td>
                        <td className="py-4 pr-4 text-slate-600">{task.head}</td>
                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getPriorityStyles(
                              task.priority,
                            )}`}
                          >
                            {task.priorityLabel}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyles(
                              task.status,
                            )}`}
                          >
                            {task.statusLabel}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600">{task.dueDate}</td>
                        <td className="py-4">
                          <button
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            onClick={() => openTaskDetails(task)}
                          >
                            <Eye size={14} /> View Details
                          </button>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => openTaskDetails(task)}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        {isDetailOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Task Details
                  </p>
                  <h3 className="text-xl font-bold text-slate-900">{selectedTask.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedTask.description || "No description provided."}
                  </p>
                </div>
                <button
                  className="rounded-full p-1 text-slate-500 hover:text-slate-700"
                  onClick={closeTaskDetails}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Department</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedTask.department || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Head</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTask.head}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase text-slate-500">Due</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedTask.dueDate}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getPriorityStyles(
                    selectedTask.priority,
                  )}`}
                >
                  {selectedTask.priorityLabel}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyles(
                    selectedTask.status,
                  )}`}
                >
                  {selectedTask.statusLabel}
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Edit Task</h4>
                  <button
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    onClick={() => setIsEditingTask((prev) => !prev)}
                  >
                    {isEditingTask ? "Cancel" : "Edit"}
                  </button>
                </div>

                {isEditingTask && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Title</label>
                      <input
                        value={editTaskData.title}
                        onChange={(event) => handleEditField("title", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Description</label>
                      <textarea
                        rows={3}
                        value={editTaskData.description}
                        onChange={(event) => handleEditField("description", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Priority</label>
                        <select
                          value={editTaskData.priority}
                          onChange={(event) => handleEditField("priority", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Status</label>
                        <select
                          value={editTaskData.status}
                          onChange={(event) => handleEditField("status", event.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Due date</label>
                      <input
                        type="date"
                        value={editTaskData.dueDate}
                        onChange={(event) => handleEditField("dueDate", event.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    {editError && (
                      <p className="text-xs text-rose-500">{editError}</p>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        onClick={() => setIsEditingTask(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        onClick={handleSaveTask}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-slate-900">Progress Updates</h4>
                {selectedTaskUpdates.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No updates from the department head yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selectedTaskUpdates.map((update) => (
                      <div key={update.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {update.headName}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(update.timestamp)}</p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyles(
                              update.status,
                            )}`}
                          >
                            {update.status
                              ? update.status
                                  .split("-")
                                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                                  .join(" ")
                              : "Pending"}
                          </span>
                        </div>
                        {update.comment && (
                          <p className="mt-2 text-sm text-slate-600">{update.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
