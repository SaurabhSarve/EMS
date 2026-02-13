import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  ListTodo, 
  Plus, 
  X,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Building2,
  UserCircle,
  Edit,
  Trash2,
  Save
} from "lucide-react";
import { employeeService } from "../../../services/employeeServices";
import { departmentService } from "../../../services/departmentService";
import AdminSidebar from "../../../Components/AdminSidebar";
import { useAuth } from "../../../context/AuthContext";

export default function Tasks() {
  const location = useLocation();
  const [departmentDetails, setDepartmentDetails] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [headTasks, setHeadTasks] = useState([]);
  const [headTab, setHeadTab] = useState("employees");
  const [selectedHeadTask, setSelectedHeadTask] = useState(null);
  const [isHeadTaskModalOpen, setIsHeadTaskModalOpen] = useState(false);
  const [headTaskUpdate, setHeadTaskUpdate] = useState({ status: "in-progress", comment: "", file: null });
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    taskName: "",
    description: "",
    priority: "medium",
    status: "pending",
    startDate: "",
    dueDate: ""
  });
  const { user } = useAuth();
  const [role, setRole] = useState();

  // Department CRUD States
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [showEditDepartmentModal, setShowEditDepartmentModal] = useState(false);
  const [showDeleteDepartmentModal, setShowDeleteDepartmentModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Department Form Data
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
    manager: ""
  });

  // New Task Form
  const [newTask, setNewTask] = useState({
    taskName: "",
    description: "",
    employeeId: "",
    employeeIds: [],
    assignMode: "single",
    status: "pending",
    priority: "medium",
    startDate: "",
    dueDate: ""
  });

  useEffect(() => {
    getDepartmentTasks();
  }, []);

  useEffect(() => {
    if (role !== "Department Head") return;

    const refreshHeadTasks = async () => {
      try {
        const headTaskResponse = await employeeService.getTasks();
        setHeadTasks(headTaskResponse?.data?.taskDetails || []);
      } catch (error) {
        console.error("Failed to refresh head tasks", error);
      }
    };

    refreshHeadTasks();
    const intervalId = setInterval(refreshHeadTasks, 30000);
    const handleFocus = () => refreshHeadTasks();
    const handleVisibility = () => {
      if (!document.hidden) {
        refreshHeadTasks();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [role]);

  useEffect(() => {
    const requestedTab = location.state?.headTab;
    if (requestedTab === "my" || requestedTab === "employees") {
      setHeadTab(requestedTab);
      if (requestedTab === "my") {
        setSelectedEmployee(null);
      }
    }
  }, [location.state]);

  const getDepartmentTasks = async () => {
    try {
      setIsLoading(true);
      const result = await employeeService.getDepartmentTasks();
      console.log(result);
      setRole(result.data.role);
      
      if (result.data.role === "Department Head") {
        if (result && result.data) {
          setDepartmentDetails(result.data.departmentDetails);
          setHeadTasks(result.data.taskDetails || result.data.headTasks || []);
          
          const employeesWithTasks = result.data.departmentEmployees.map(emp => {
            const employeeTasks = result.data.departmentTasks.filter(
              task => task.employee === emp._id
            );
            
            return {
              ...emp,
              tasks: employeeTasks.map(task => ({
                id: task._id,
                taskName: task.taskName,
                description: task.description,
                status: task.status,
                priority: task.priority,
                startDate: task.startDate,
                dueDate: task.dueDate,
                createdAt: task.createdAt
              }))
            };
          });
          
          setEmployees(employeesWithTasks);
        }

        try {
          const headTaskResponse = await employeeService.getTasks();
          setHeadTasks(headTaskResponse?.data?.taskDetails || []);
        } catch (error) {
          console.error("Failed to load head tasks", error);
        }
      } else if (result.data.role === "Admin") {
        console.log(result);
        if (result && result.data) {
          setDepartments(result.data.departmentDetails || []);
          setEmployees(result.data.departmentEmployees || []);
          setAllTasks(result.data.departmentTasks || []);
          
          // Filter only Department Heads
          const heads = result.data.departmentEmployees.filter(emp => 
            emp.role === "Department Head" || emp.position === "Department Head"
          );
          setDepartmentHeads(heads);
        }
      }
    } catch (err) {
      console.log("Get department Tasks", err);
      showToast("Failed to load department tasks", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    const isTeamAssignment = newTask.assignMode === "team";
    const hasAssignees = isTeamAssignment
      ? newTask.employeeIds.length > 0
      : Boolean(newTask.employeeId);
    
    if (!newTask.taskName || !newTask.description || !hasAssignees ||
        !newTask.startDate || !newTask.dueDate) {
      showToast("Please fill all required fields", "error");
      return;
    }
    
    try {
      const taskPayload = {
        taskName: newTask.taskName,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        startDate: newTask.startDate,
        dueDate: newTask.dueDate,
        assignmentType: isTeamAssignment ? "team" : "single"
      };

      if (isTeamAssignment) {
        await Promise.all(
          newTask.employeeIds.map((employeeId) =>
            employeeService.addTask(employeeId, taskPayload)
          )
        );
      } else {
        await employeeService.addTask(newTask.employeeId, taskPayload);
      }

      showToast("Task added successfully!", "success");
      setShowAddTaskModal(false);
      setNewTask({
        taskName: "",
        description: "",
        employeeId: "",
        employeeIds: [],
        assignMode: "single",
        status: "pending",
        priority: "medium",
        startDate: "",
        dueDate: ""
      });
      setSelectedEmployee(null);
      getDepartmentTasks();
    } catch (err) {
      console.log("Error adding task:", err);
      showToast("Failed to add task", "error");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;

    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      const result = await employeeService.deleteTask(taskId);

      if (result && result.success) {
        showToast("Task deleted successfully!", "success");

        setSelectedEmployee((prev) =>
          prev
            ? {
                ...prev,
                tasks: (prev.tasks || []).filter(
                  (task) => (task.id || task._id) !== taskId
                )
              }
            : prev
        );

        setEmployees((prev) =>
          prev.map((emp) => ({
            ...emp,
            tasks: emp.tasks ? emp.tasks.filter((task) => (task.id || task._id) !== taskId) : emp.tasks
          }))
        );

        setAllTasks((prev) =>
          prev.filter((task) => (task._id || task.id) !== taskId)
        );
      }
    } catch (err) {
      console.log("Error deleting task:", err);
      showToast("Failed to delete task", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditTaskModal = (task) => {
    setEditingTaskId(task.id || task._id);
    setEditTaskData({
      taskName: task.taskName || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      startDate: task.startDate ? task.startDate.split("T")[0] : "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : ""
    });
    setShowEditTaskModal(true);
  };

  const closeEditTaskModal = () => {
    setEditingTaskId(null);
    setShowEditTaskModal(false);
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId) return;

    try {
      setIsProcessing(true);
      const result = await employeeService.updateTaskByAdmin(editingTaskId, editTaskData);
      if (result && result.success) {
        showToast("Task updated successfully!", "success");
        setSelectedEmployee((prev) =>
          prev
            ? {
                ...prev,
                tasks: (prev.tasks || []).map((task) =>
                  (task.id || task._id) === editingTaskId
                    ? { ...task, ...editTaskData }
                    : task
                )
              }
            : prev
        );

        setEmployees((prev) =>
          prev.map((emp) => ({
            ...emp,
            tasks: emp.tasks
              ? emp.tasks.map((task) =>
                  (task.id || task._id) === editingTaskId
                    ? { ...task, ...editTaskData }
                    : task
                )
              : emp.tasks
          }))
        );

        setAllTasks((prev) =>
          prev.map((task) =>
            (task._id || task.id) === editingTaskId
              ? { ...task, ...editTaskData }
              : task
          )
        );
        closeEditTaskModal();
      }
    } catch (err) {
      console.log("Error updating task:", err);
      showToast("Failed to update task", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Department CRUD Operations
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    
    if (!departmentForm.name || !departmentForm.code || !departmentForm.description) {
      showToast("Please fill all required fields", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await departmentService.createDepartment(departmentForm);
      console.log(result);
      
      if (result && result.success) {
        showToast("Department created successfully!", "success");
        setShowAddDepartmentModal(false);
        setDepartmentForm({ name: "", code: "", description: "", manager: "" });
        getDepartmentTasks();
      }
    } catch (err) {
      console.log("Error creating department:", err);
      showToast(err?.response?.data?.message || "Failed to create department", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("hit edit");
    
    if (!departmentForm.name || !departmentForm.code || !departmentForm.description) {
      showToast("Please fill all required fields", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await departmentService.updateDepartment(
        selectedDepartment._id,
        departmentForm
      );
      console.log(result);
      if (result && result.success) {
        showToast("Department updated successfully!", "success");
        setShowEditDepartmentModal(false);
        setDepartmentForm({ name: "", code: "", description: "", manager: "" });
        setSelectedDepartment(null);
        getDepartmentTasks();
      }
    } catch (err) {
      console.log("Error updating department:", err);
      showToast(err.response?.data?.message || "Failed to update department", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      setIsProcessing(true);
      console.log("hit");
      const result = await departmentService.deleteDepartment(selectedDepartment._id);
      
      if (result && result.success) {
        showToast("Department deleted successfully!", "success");
        setShowDeleteDepartmentModal(false);
        setSelectedDepartment(null);
        getDepartmentTasks();
      }
    } catch (err) {
      console.log("Error deleting department:", err);
      showToast(err.response?.data?.message || "Failed to delete department", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (dept) => {
    setSelectedDepartment(dept);
    setDepartmentForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      manager: dept.manager?._id || ""
    });
    setShowEditDepartmentModal(true);
  };

  const openDeleteModal = (dept) => {
    setSelectedDepartment(dept);
    setShowDeleteDepartmentModal(true);
  };

  const getTaskStats = (employee) => {
    const tasks = employee.tasks || [];
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === "completed").length,
      pending: tasks.filter(t => t.status === "pending").length
    };
  };

  const getTotalStats = () => {
    let total = 0, completed = 0, pending = 0;
    
    employees.forEach(emp => {
      const stats = getTaskStats(emp);
      total += stats.total;
      completed += stats.completed;
      pending += stats.pending;
    });
    
    return { 
      total, 
      completed, 
      pending,
      totalEmployees: employees.length 
    };
  };

  const getDepartmentStats = (deptId) => {
    const deptEmployees = employees.filter(emp => emp.department === deptId);
    const deptTasks = allTasks.filter(task => 
      deptEmployees.some(emp => emp._id === task.employee)
    );
    
    return {
      totalEmployees: deptEmployees.length,
      totalTasks: deptTasks.length,
      completed: deptTasks.filter(t => t.status === "completed").length,
      pending: deptTasks.filter(t => t.status === "pending").length
    };
  };

  const getDepartmentHead = (dept) => {
    if (dept.manager) {
      return `${dept.manager.firstName} ${dept.manager.lastName}`;
    }
    return "Not Allocated";
  };

  const filteredTasks = selectedEmployee?.tasks?.filter(task => {
    if (filterStatus === "All") return true;
    return task.status === filterStatus.toLowerCase();
  }) || [];

  const headTaskItems = headTasks.map((task) => ({
    id: task._id || task.id,
    title: task.taskName || task.title,
    status: task.status || "pending",
    description: task.description || "",
    assignedDate: task.createdAt || task.assignedDate || task.startDate || "",
    dueDate: task.dueDate || "",
  }));

  const formatHeadDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatHeadStatus = (status) => {
    if (!status) return "Pending";
    return status
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const getHeadStatusClass = (status) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "in-progress") return "bg-blue-100 text-blue-700";
    return "bg-orange-100 text-orange-700";
  };

  const openHeadTaskDetails = (task) => {
    setSelectedHeadTask(task);
    setHeadTaskUpdate({
      status: task.status === "completed" ? "completed" : "in-progress",
      comment: "",
      file: null
    });
    setIsHeadTaskModalOpen(true);
  };

  const closeHeadTaskDetails = () => {
    setSelectedHeadTask(null);
    setHeadTaskUpdate({ status: "in-progress", comment: "", file: null });
    setIsHeadTaskModalOpen(false);
  };

  const readHeadTaskUpdates = () => {
    try {
      return JSON.parse(localStorage.getItem("headTaskUpdates") || "[]");
    } catch (error) {
      return [];
    }
  };

  const readHeadTaskNotifications = () => {
    try {
      return JSON.parse(localStorage.getItem("headTaskNotifications") || "[]");
    } catch (error) {
      return [];
    }
  };

  const writeHeadTaskUpdates = (updates) => {
    localStorage.setItem("headTaskUpdates", JSON.stringify(updates));
  };

  const writeHeadTaskNotifications = (notifications) => {
    localStorage.setItem("headTaskNotifications", JSON.stringify(notifications));
  };

  const submitHeadTaskUpdate = async () => {
    if (!selectedHeadTask) return;

    const comment = headTaskUpdate.comment.trim();
    let attachmentUrl = null;
    let attachmentName = null;

    // Handle file upload if present
    if (headTaskUpdate.file) {
      try {
        const formData = new FormData();
        formData.append('file', headTaskUpdate.file);
        const uploadResponse = await employeeService.uploadTaskFile(selectedHeadTask.id, formData);
        if (uploadResponse?.success && uploadResponse?.data?.url) {
          attachmentUrl = uploadResponse.data.url;
          attachmentName = headTaskUpdate.file.name;
        }
      } catch (err) {
        console.error('File upload failed:', err);
        showToast('Failed to upload file', 'error');
        return;
      }
    }

    const updateEntry = {
      id: `update-${Date.now()}`,
      taskId: selectedHeadTask.id,
      taskTitle: selectedHeadTask.title,
      status: headTaskUpdate.status,
      comment,
      attachmentUrl,
      attachmentName,
      headName: user?.firstName
        ? `${user.firstName} ${user?.lastName || ""}`.trim()
        : "Department Head",
      timestamp: new Date().toISOString(),
    };

    setHeadTasks((prev) =>
      prev.map((task) =>
        (task._id || task.id) === selectedHeadTask.id
          ? { ...task, status: headTaskUpdate.status }
          : task
      )
    );
    setSelectedHeadTask((prev) =>
      prev ? { ...prev, status: headTaskUpdate.status } : prev
    );

    const updates = readHeadTaskUpdates();
    writeHeadTaskUpdates([updateEntry, ...updates]);

    const notifications = readHeadTaskNotifications();
    const nextNotifications = [updateEntry, ...notifications].slice(0, 20);
    writeHeadTaskNotifications(nextNotifications);

    if (headTaskUpdate.status === "completed") {
      try {
        await employeeService.updateTask(selectedHeadTask.id);
      } catch (error) {
        showToast("Failed to sync task completion", "error");
      }
    }

    showToast("Task update sent to Admin.", "success");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <AdminSidebar />
        <div className="lg:ml-64 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Admin View - Department Cards with CRUD
  if (role === "Admin") {
    return (
      <>
        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          } text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 animate-slideIn max-w-[90%] sm:max-w-md`}>
            <span className="text-xs sm:text-sm">{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: "", type: "" })}>
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        )}

        {/* Add Department Modal */}
        {showAddDepartmentModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Add New Department</h3>
                  <button
                    onClick={() => {
                      setShowAddDepartmentModal(false);
                      setDepartmentForm({ name: "", code: "", description: "", manager: "" });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Engineering"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentForm.code}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="e.g., ENG"
                    maxLength="10"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter department description"
                    rows="3"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Manager (Optional)
                  </label>
                  <select
                    value={departmentForm.manager}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, manager: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  >
                    <option value="">Select Department Head</option>
                    {departmentHeads.map((head) => (
                      <option key={head._id} value={head._id}>
                        {head.firstName} {head.lastName} - {head.employeeId || head.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only employees with "Department Head" role are shown
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDepartmentModal(false);
                      setDepartmentForm({ name: "", code: "", description: "", manager: "" });
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Create Department
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditDepartmentModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Edit Department</h3>
                  <button
                    onClick={() => {
                      setShowEditDepartmentModal(false);
                      setSelectedDepartment(null);
                      setDepartmentForm({ name: "", code: "", description: "", manager: "" });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditDepartment} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Engineering"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentForm.code}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="e.g., ENG"
                    maxLength="10"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter department description"
                    rows="3"
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Manager (Optional)
                  </label>
                  <select
                    value={departmentForm.manager}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, manager: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  >
                    <option value="">Select Department Head</option>
                    {departmentHeads.map((head) => (
                      <option key={head._id} value={head._id}>
                        {head.firstName} {head.lastName} - {head.employeeId || head.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only employees with "Department Head" role are shown
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditDepartmentModal(false);
                      setSelectedDepartment(null);
                      setDepartmentForm({ name: "", code: "", description: "", manager: "" });
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Update Department
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Department Modal */}
        {showDeleteDepartmentModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Delete Department</h3>
                  <button
                    onClick={() => {
                      setShowDeleteDepartmentModal(false);
                      setSelectedDepartment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <AlertCircle className="text-red-600" size={32} />
                </div>
                
                <p className="text-center text-gray-700 mb-2">
                  Are you sure you want to delete department:
                </p>
                <p className="text-center text-lg font-bold text-gray-900 mb-4">
                  {selectedDepartment.name} ({selectedDepartment.code})?
                </p>
                <p className="text-center text-sm text-red-600 mb-6">
                  This action cannot be undone. All associated data will be removed.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteDepartmentModal(false);
                      setSelectedDepartment(null);
                    }}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDepartment}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Delete Department
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="min-h-screen bg-white">
          <AdminSidebar />
          
          <div className="lg:ml-64 p-3 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-white/20 mb-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Department Management</h1>
                    <p className="text-blue-100 text-sm sm:text-base mt-1">
                      Manage departments, heads, and performance at a glance
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddDepartmentModal(true)}
                  className="w-full lg:w-auto px-5 py-3 bg-white text-blue-700 rounded-xl hover:bg-blue-50 font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={20} />
                  Add Department
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/15 rounded-xl p-4 border border-white/20">
                  <p className="text-xs uppercase tracking-wider text-blue-100">Departments</p>
                  <p className="text-2xl font-bold mt-1">{departments.length}</p>
                </div>
                <div className="bg-white/15 rounded-xl p-4 border border-white/20">
                  <p className="text-xs uppercase tracking-wider text-blue-100">Employees</p>
                  <p className="text-2xl font-bold mt-1">{employees.length}</p>
                </div>
                <div className="bg-white/15 rounded-xl p-4 border border-white/20">
                  <p className="text-xs uppercase tracking-wider text-blue-100">Tasks</p>
                  <p className="text-2xl font-bold mt-1">{allTasks.length}</p>
                </div>
              </div>
            </div>

            {/* Department Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {departments.map((dept) => {
                const stats = getDepartmentStats(dept._id);
                
                return (
                  <div
                    key={dept._id}
                    className="group bg-white/95 backdrop-blur rounded-2xl shadow-lg hover:shadow-2xl transition-all p-5 sm:p-6 border border-blue-100 hover:border-blue-300"
                  >
                    <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 mb-4 opacity-80"></div>
                    {/* Department Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-semibold">{dept.code}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(dept)}
                          className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Department"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(dept)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Department Head */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <UserCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-600">Head:</span>
                        <span className={`font-semibold truncate ${dept.manager ? 'text-gray-900' : 'text-orange-600'}`}>
                          {getDepartmentHead(dept)}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                        <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{stats.totalEmployees}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">Employees</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
                        <ListTodo className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-gray-900">{stats.totalTasks}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">Total Tasks</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-3 text-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">Completed</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-3 text-center">
                        <Clock className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">Pending</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </>
    );
  }

  // Department Head View continues with the rest of the existing code...
  // (The rest remains the same as in your original file)


  const totalStats = getTotalStats();

  // Department Head View (unchanged)
  return (
    <>
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 ${
          toast.type === "error" ? "bg-red-500" : "bg-green-500"
        } text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 animate-slideIn max-w-[90%] sm:max-w-md`}>
          <span className="text-xs sm:text-sm">{toast.message}</span>
          <button onClick={() => setToast({ show: false, message: "", type: "" })}>
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Add New Task</h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.taskName}
                  onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Assign To <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={newTask.assignMode === "team"}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        assignMode: e.target.checked ? "team" : "single",
                        employeeId: e.target.checked ? "" : newTask.employeeId,
                        employeeIds: e.target.checked ? newTask.employeeIds : []
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Assign to team
                </label>

                {newTask.assignMode === "team" ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {employees.map((emp) => {
                      const isChecked = newTask.employeeIds.includes(emp._id);
                      return (
                        <label
                          key={emp._id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs sm:text-sm text-gray-700 hover:bg-blue-50"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const nextIds = e.target.checked
                                ? [...newTask.employeeIds, emp._id]
                                : newTask.employeeIds.filter((id) => id !== emp._id);
                              setNewTask({ ...newTask, employeeIds: nextIds });
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    value={newTask.employeeId}
                    onChange={(e) => setNewTask({ ...newTask, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "medium", "high"].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setNewTask({ ...newTask, priority })}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm capitalize transition-all ${
                        newTask.priority === priority
                          ? priority === "high"
                            ? "bg-red-600 text-white"
                            : priority === "medium"
                            ? "bg-orange-600 text-white"
                            : "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    min={newTask.startDate}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        
        <div className="lg:ml-64 p-3 sm:p-6 lg:p-8">
          {!selectedEmployee ? (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-white/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold">
                        {departmentDetails?.name || "Department"} Tasks
                      </h1>
                      <p className="text-blue-100 text-xs sm:text-sm mt-1">
                        Managed by {departmentDetails?.manager?.firstName} {departmentDetails?.manager?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-xl p-4 sm:p-6">
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />

                <div className="relative flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/90 p-2 shadow-sm w-full lg:max-w-md">
                      {[
                        { key: "employees", label: "Employees Tasks" },
                        { key: "my", label: "My Tasks" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setHeadTab(tab.key)}
                          className={`flex-1 min-w-[140px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                            headTab === tab.key
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    {headTab === "employees" ? (
                      <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-blue-100 p-3 sm:p-4 text-center hover:shadow-xl transition-all">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {totalStats.totalEmployees}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Employees</p>
                    </div>

                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-purple-100 p-3 sm:p-4 text-center hover:shadow-xl transition-all">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                        <ListTodo className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                        {totalStats.total}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Total Tasks</p>
                    </div>

                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-green-100 p-3 sm:p-4 text-center hover:shadow-xl transition-all">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                        {totalStats.completed}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Completed</p>
                    </div>

                    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-orange-100 p-3 sm:p-4 text-center hover:shadow-xl transition-all">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1">
                        {totalStats.pending}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Pending</p>
                    </div>
                  </div>

                  {/* Employee Table */}
                  <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                    <div className="p-3 sm:p-4 border-b border-blue-100 flex items-center justify-between gap-3">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        Department Employees
                      </h2>
                      <button
                        onClick={() => {
                          setNewTask({
                            taskName: "",
                            description: "",
                            employeeId: "",
                            employeeIds: [],
                            assignMode: "single",
                            status: "pending",
                            priority: "medium",
                            startDate: "",
                            dueDate: ""
                          });
                          setShowAddTaskModal(true);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
                      >
                        Assign Task
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                              Employee
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                              Total Tasks
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                              Completed
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                              Pending
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {employees
      .filter((employee) => employee.role === "employee")
      .map((employee) => {
        const stats = getTaskStats(employee);

        return (
          <tr key={employee._id} className="hover:bg-blue-50/60 transition-colors">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {employee.firstName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {employee.employeeId} • {employee.position}
                  </p>
                </div>
              </div>
            </td>

            <td className="px-4 py-3 text-center">
              <span className="text-base font-bold text-gray-900">
                {stats.total}
              </span>
            </td>

            <td className="px-4 py-3 text-center">
              <span className="text-base font-bold text-green-600">
                {stats.completed}
              </span>
            </td>

            <td className="px-4 py-3 text-center">
              <span className="text-base font-bold text-orange-600">
                {stats.pending}
              </span>
            </td>

            <td className="px-4 py-3 text-center">
              <button
                onClick={() => setSelectedEmployee(employee)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
              >
                View Tasks
              </button>
            </td>
          </tr>
        );
      })}

                        </tbody>
                      </table>
                    </div>
                  </div>
                      </>
                    ) : (
                      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">My Tasks</h2>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              Tasks assigned by Admin to you.
                            </p>
                          </div>
                        </div>

                        {headTaskItems.length === 0 ? (
                          <div className="text-center py-10 text-gray-500 text-sm">
                            No tasks assigned yet.
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {headTaskItems.map((task) => (
                              <div
                                key={task.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-blue-200 transition-all"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{task.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {task.description || "No description provided."}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getHeadStatusClass(
                                      task.status,
                                    )}`}
                                  >
                                    {formatHeadStatus(task.status)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end mt-4">
                                  <button
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    onClick={() => openHeadTaskDetails(task)}
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isHeadTaskModalOpen && selectedHeadTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                  <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Task Details
                        </p>
                        <h3 className="text-xl font-bold text-slate-900">
                          {selectedHeadTask.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {selectedHeadTask.description || "No description provided."}
                        </p>
                      </div>
                      <button
                        className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                        onClick={closeHeadTaskDetails}
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase text-slate-500">Assigned</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatHeadDate(selectedHeadTask.assignedDate)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase text-slate-500">Due</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatHeadDate(selectedHeadTask.dueDate)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs uppercase text-slate-500">Status</p>
                        <span
                          className={`mt-1 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getHeadStatusClass(
                            selectedHeadTask.status,
                          )}`}
                        >
                          {formatHeadStatus(selectedHeadTask.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                      <p className="text-xs uppercase text-blue-600 font-semibold tracking-wider">Update Progress</p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
                          <select
                            value={headTaskUpdate.status}
                            onChange={(event) =>
                              setHeadTaskUpdate((prev) => ({
                                ...prev,
                                status: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Comment</label>
                          <textarea
                            rows={3}
                            value={headTaskUpdate.comment}
                            onChange={(event) =>
                              setHeadTaskUpdate((prev) => ({
                                ...prev,
                                comment: event.target.value,
                              }))
                            }
                            placeholder="Share a quick update for Admin."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-2">Attach File (Optional)</label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="text-xs text-slate-600">
                                {headTaskUpdate.file ? headTaskUpdate.file.name : 'Choose file...'}
                              </span>
                            </div>
                            <input
                              type="file"
                              onChange={(event) =>
                                setHeadTaskUpdate((prev) => ({
                                  ...prev,
                                  file: event.target.files?.[0] || null,
                                }))
                              }
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                            />
                          </label>
                          {headTaskUpdate.file && (
                            <button
                              type="button"
                              onClick={() =>
                                setHeadTaskUpdate((prev) => ({ ...prev, file: null }))
                              }
                              className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end">
                        <button
                          onClick={submitHeadTaskUpdate}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-600"
                        >
                          Send Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-5 lg:p-6">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-5 font-semibold text-sm sm:text-base hover:gap-3 transition-all"
              >
                <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                Back to Employees
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-blue-100">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl lg:text-2xl shadow-md">
                    {selectedEmployee.firstName.charAt(0)}
                  </div>
                  
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                      {selectedEmployee.employeeId} • {selectedEmployee.position}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewTask({
                      ...newTask,
                      employeeId: selectedEmployee._id,
                      employeeIds: [],
                      assignMode: "single"
                    });
                    setShowAddTaskModal(true);
                  }}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base shadow-md hover:shadow-lg transition-all"
                >
                  <Plus size={18} className="sm:w-5 sm:h-5" />
                  Add Task
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div className="bg-white/90 backdrop-blur rounded-2xl p-3 sm:p-4 text-center border border-blue-100 shadow-lg hover:shadow-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <ListTodo className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{getTaskStats(selectedEmployee).total}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Total</p>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl p-3 sm:p-4 text-center border border-green-100 shadow-lg hover:shadow-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{getTaskStats(selectedEmployee).completed}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Done</p>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl p-3 sm:p-4 text-center border border-orange-100 shadow-lg hover:shadow-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">{getTaskStats(selectedEmployee).pending}</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">Pending</p>
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 mb-5 sm:mb-6">
                {["All", "Pending", "Completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                      filterStatus === status
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="space-y-3 sm:space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-10 sm:py-12 text-gray-500">
                    <AlertCircle size={40} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                    <p className="text-sm sm:text-base">No {filterStatus.toLowerCase()} tasks</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base flex-1 leading-tight">{task.taskName}</h4>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                          {(role === "Admin" || role === "Department Head") && (
                            <button
                              onClick={() => openEditTaskModal(task)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-60"
                              title="Edit task"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {(role === "Admin" || role === "Department Head") && (
                            <button
                              onClick={() => handleDeleteTask(task.id || task._id)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                              title="Delete task"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "medium"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </span>
                      
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 leading-relaxed">{task.description}</p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="flex-shrink-0" />
                          <span className="font-medium">Start: {new Date(task.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="flex-shrink-0" />
                          <span className="font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Task</h3>
                <p className="text-xs text-slate-500 mt-1">Update task details for this employee.</p>
              </div>
              <button
                onClick={closeEditTaskModal}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Task name</label>
                <input
                  type="text"
                  value={editTaskData.taskName}
                  onChange={(event) =>
                    setEditTaskData((prev) => ({ ...prev, taskName: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={editTaskData.description}
                  onChange={(event) =>
                    setEditTaskData((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Priority</label>
                  <select
                    value={editTaskData.priority}
                    onChange={(event) =>
                      setEditTaskData((prev) => ({ ...prev, priority: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
                  <select
                    value={editTaskData.status}
                    onChange={(event) =>
                      setEditTaskData((prev) => ({ ...prev, status: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Start date</label>
                  <input
                    type="date"
                    value={editTaskData.startDate}
                    onChange={(event) =>
                      setEditTaskData((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Due date</label>
                  <input
                    type="date"
                    value={editTaskData.dueDate}
                    min={editTaskData.startDate || undefined}
                    onChange={(event) =>
                      setEditTaskData((prev) => ({ ...prev, dueDate: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={closeEditTaskModal}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm hover:from-blue-700 hover:to-blue-600 disabled:opacity-70"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
}