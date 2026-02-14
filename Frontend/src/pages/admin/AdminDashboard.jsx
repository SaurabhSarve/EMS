import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";
import NotificationSystem from "./NotificationSystem";
import { capitalize } from "../../utils/helper";

// Icons
import { FaUsers, FaUserPlus, FaUserMinus, FaEdit } from "react-icons/fa";
import {
  MdOutlineVerified,
  MdOutlineApproval,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import {
  HiOutlineClock,
  HiCurrencyDollar,
  HiUser,
  HiUserAdd,
  HiExclamation,
  HiDocumentText,
} from "react-icons/hi";
import { BsBuilding, BsChatDots } from "react-icons/bs";
import { FiPlus } from "react-icons/fi";
import { IoMdPersonAdd } from "react-icons/io";
import { AiOutlineFileText, AiOutlineAlert } from "react-icons/ai";
import { BiDollarCircle } from "react-icons/bi";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE: General Stats ---
  const [stats, setStats] = useState();
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [departments, setDepartments] = useState([]);

  // --- STATE: Chat Notifications (From HEAD) ---
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // --- STATE: Task Management (From Main) ---
  const [headTasks, setHeadTasks] = useState([]);
  const [loadingHeadTasks, setLoadingHeadTasks] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskUpdate, setTaskUpdate] = useState({
    status: "in-progress",
    comment: "",
  });
  const [headTaskNotifications, setHeadTaskNotifications] = useState([]);

  const isDepartmentHead = user?.role === "Department Head";

  // ==========================================
  // 1. CHAT & WEBSOCKET LOGIC (From HEAD)
  // ==========================================
  const fetchUnreadCount = async () => {
    if (!user?._id && !user?.id) return;
    try {
      const id = user._id || user.id;
      const res = await axios.get(
        `http://127.0.0.1:8000/api/chat/unread/total/${id}`,
      );
      setUnreadCount(res.data.count);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/?token=${token}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // New Message Received
        if ((data.sender_id && !data.type) || data.type === "chat_message") {
          const myId = user._id || user.id;
          if (data.sender_id !== myId) {
            setUnreadCount((prev) => prev + 1);
          }
        }

        // Chat Activity (Delete/Clear) -> Re-fetch
        if (data.type === "activity") {
          fetchUnreadCount();
        }
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  // ==========================================
  // 2. DASHBOARD DATA FETCHING
  // ==========================================
  useEffect(() => {
    fetchEmployees();
    if (isDepartmentHead) {
      fetchHeadTasks();
    }
  }, [isDepartmentHead]);

  // Local Storage Sync for Tasks (From Main)
  useEffect(() => {
    const syncNotifications = () => {
      setHeadTaskNotifications(readStoredNotifications());
    };
    syncNotifications();
    window.addEventListener("storage", syncNotifications);
    return () => window.removeEventListener("storage", syncNotifications);
  }, []);

  const fetchEmployees = async () => {
    try {
      const result = await employeeService.getAdminDashboardStats();
      const activityResult = await employeeService.getRecentActivities();

      if (result && result.data) {
        setStats(result.data.stats);
        if (result.data.stats.departmentsManager)
          setDepartments(result.data.stats.departmentsManager);
      }
      if (activityResult && activityResult.activities)
        setActivities(activityResult.activities);
      setLoadingActivities(false);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      setLoadingActivities(false);
    }
  };

  const fetchHeadTasks = async () => {
    try {
      setLoadingHeadTasks(true);
      const response = await employeeService.getTasks();
      setHeadTasks(response?.data?.taskDetails || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setHeadTasks([]);
    } finally {
      setLoadingHeadTasks(false);
    }
  };

  // ==========================================
  // 3. TASK MANAGEMENT HELPERS (From Main)
  // ==========================================
  const sortedHeadTasks = useMemo(() => {
    return [...headTasks]
      .map((task) => ({
        id: task._id || task.id,
        title: task.taskName || task.title,
        description: task.description,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "—",
        assignedDate:
          task.createdAt || task.assignedDate || task.startDate || "",
        priority: task.priority || "low",
        status: task.status || "pending",
      }))
      .sort((a, b) => (new Date(a.dueDate) > new Date(b.dueDate) ? 1 : -1));
  }, [headTasks]);

  const updateTaskStatus = (taskId, nextStatus) => {
    setHeadTasks((prev) =>
      prev.map((task) => {
        const matchId = task._id || task.id;
        return matchId === taskId ? { ...task, status: nextStatus } : task;
      }),
    );
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskUpdate({
      status: task.status === "completed" ? "completed" : "in-progress",
      comment: "",
    });
    setIsTaskModalOpen(true);
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
    setTaskUpdate({ status: "in-progress", comment: "" });
    setIsTaskModalOpen(false);
  };

  const submitTaskUpdate = () => {
    if (!selectedTask) return;
    const comment = taskUpdate.comment.trim();
    const updateEntry = {
      id: `update-${Date.now()}`,
      taskId: selectedTask.id,
      taskTitle: selectedTask.title,
      status: taskUpdate.status,
      comment,
      headName: user?.firstName || "Department Head",
      timestamp: new Date().toISOString(),
    };

    updateTaskStatus(selectedTask.id, taskUpdate.status);

    // Update Local Storage
    const updates = readStoredUpdates();
    writeStoredUpdates([updateEntry, ...updates]);
    const notifications = readStoredNotifications();
    const nextNotifications = [updateEntry, ...notifications].slice(0, 20);
    writeStoredNotifications(nextNotifications);
    setHeadTaskNotifications(nextNotifications);

    closeTaskDetails();
  };

  // Local Storage Helpers
  const readStoredUpdates = () =>
    JSON.parse(localStorage.getItem("headTaskUpdates") || "[]");
  const readStoredNotifications = () =>
    JSON.parse(localStorage.getItem("headTaskNotifications") || "[]");
  const writeStoredUpdates = (updates) =>
    localStorage.setItem("headTaskUpdates", JSON.stringify(updates));
  const writeStoredNotifications = (nots) =>
    localStorage.setItem("headTaskNotifications", JSON.stringify(nots));

  // ==========================================
  // 4. UI HELPERS (Merged)
  // ==========================================
  const getTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60));
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityIcon = (iconName) => {
    const iconMap = {
      user: <HiUser />,
      "user-plus": <HiUserAdd />,
      "user-minus": <FaUserMinus />,
      "dollar-sign": <HiCurrencyDollar />,
      edit: <FaEdit />,
      "alert-triangle": <HiExclamation />,
      "file-text": <HiDocumentText />,
      "check-circle": <MdCheckCircle />,
      "x-circle": <MdCancel />,
      "message-square": <AiOutlineFileText />,
    };
    return iconMap[iconName] || <HiUser />;
  };

  const getIconBgColor = (color) => {
    const colorMap = {
      slate: "bg-slate-100 text-slate-600",
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      red: "bg-red-100 text-red-600",
      yellow: "bg-yellow-100 text-yellow-600",
      orange: "bg-orange-100 text-orange-600",
    };
    return colorMap[color] || `bg-${color}-100 text-${color}-600`;
  };

  const getPriorityClass = (priority) => {
    if (priority === "high") return "bg-red-100 text-red-700";
    if (priority === "medium") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const getStatusClass = (status) => {
    if (status === "completed") return "bg-emerald-100 text-emerald-700";
    if (status === "in-progress") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };

  const formatLabel = (value) =>
    value
      ? value
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" ")
      : "";
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  return (
    <>
      <AdminSidebar />
      <div className="dashboard-wrapper bg-white min-h-screen relative">
        <div className="header-wrapper w-full bg-transparent px-4 sm:px-6 lg:px-10 py-8 border-b border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl shadow-lg border border-white/20 px-5 sm:px-6 py-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
              {/* WELCOME SECTION */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-md border border-white/30">
                  <FaUsers className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    Welcome back, {capitalize(stats?.Admin?.firstName)} 👋
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Here's what's happening with your company
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      Total: {stats?.totalEmployees ?? 0}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      Present: {stats?.totalEmployees ?? 0}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      Pending: {stats?.pendingLeaves ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Chat & Add) */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* --- REAL-TIME CHAT BADGE --- */}
                <div className="relative">
                  <button
                    onClick={() => navigate("/chat")}
                    className="flex items-center gap-2 bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-white/20 transition-all shadow-lg border border-white/20 backdrop-blur-sm"
                  >
                    <BsChatDots className="text-lg" />
                    <span className="hidden sm:inline">Chat</span>
                  </button>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-500 shadow-md animate-pulse">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>

                <NotificationSystem />

                <button
                  onClick={() => navigate("/admin/employees/add")}
                  className="hidden sm:flex items-center gap-2 bg-white text-blue-700 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                >
                  <FiPlus className="text-lg" /> New Employee
                </button>
                <button
                  onClick={() => navigate("/admin/employees/add")}
                  className="sm:hidden flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-lg"
                >
                  <IoMdPersonAdd className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="content-wrapper px-4 sm:px-6 lg:px-10 pt-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={<FaUsers className="text-blue-600" />}
              title="Total Employees"
              value={stats?.totalEmployees}
              subText="vs 1,180 last month"
              badgeText="+5.2%"
              badgeColor="bg-green-100 text-green-700"
              gradient="from-blue-50 to-blue-100"
            />
            <StatsCard
              icon={<MdOutlineVerified className="text-green-600" />}
              title="Present Today"
              value={stats?.totalEmployees}
              subText="60 absent (excused)"
              badgeText="95% Rate"
              badgeColor="bg-green-100 text-green-700"
              gradient="from-green-50 to-green-100"
            />
            <StatsCard
              icon={<HiOutlineClock className="text-orange-600" />}
              title="Pending leaves"
              value={stats?.pendingLeaves}
              subText="3 urgent requests"
              badgeText="Action Required"
              badgeColor="bg-orange-100 text-orange-700"
              gradient="from-orange-50 to-orange-100"
            />
            <StatsCard
              icon={<BsBuilding className="text-purple-600" />}
              title="Departments"
              value={stats?.totalDepartments}
              subText="Across 3 locations"
              badgeText="No Change"
              badgeColor="bg-purple-100 text-purple-600"
              gradient="from-purple-50 to-purple-100"
            />
          </div>

          {/* MAIN CONTENT GRID (Activities & Tasks/Departments) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-10">
            {/* RECENT ACTIVITY */}
            <div className="xl:col-span-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-lg border border-blue-100 h-full min-h-[600px] flex flex-col hover:shadow-xl transition-all hover:border-blue-200">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                      <FaUserPlus className="text-white text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Recent Activity
                    </h3>
                  </div>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {loadingActivities ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-400 text-sm">
                        Loading activities...
                      </p>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-400 text-sm">
                        No recent activities
                      </p>
                    </div>
                  ) : (
                    activities
                      .slice(0, 5)
                      .map((activity) => (
                        <ActivityItem
                          key={activity._id}
                          icon={getActivityIcon(activity.icon)}
                          iconBg={getIconBgColor(activity.iconColor)}
                          title={activity.title}
                          desc={activity.description}
                          time={getTimeAgo(activity.createdAt)}
                        />
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* CONDITIONAL COLUMN: Tasks (for Head) OR Departments (for Admin) */}
            <div className="xl:col-span-1">
              {isDepartmentHead ? (
                // --- DEPARTMENT HEAD VIEW (Tasks) ---
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-lg border border-blue-100 h-full min-h-[600px] flex flex-col hover:shadow-xl transition-all hover:border-blue-200">
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                        <MdOutlineApproval className="text-white text-lg" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        My Tasks
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate("/admin/employees/tasks")}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                    {loadingHeadTasks ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400 text-sm">
                          Loading tasks...
                        </p>
                      </div>
                    ) : sortedHeadTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400 text-sm">
                          No assigned tasks
                        </p>
                      </div>
                    ) : (
                      sortedHeadTasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {task.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {task.description || "No description provided."}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityClass(task.priority)}`}
                            >
                              {formatLabel(task.priority)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-4 gap-3">
                            <div className="text-xs text-slate-500 font-semibold">
                              Due {task.dueDate}
                            </div>
                            <button
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                              onClick={() => openTaskDetails(task)}
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // --- ADMIN VIEW (Departments) ---
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-6 shadow-lg border border-blue-100 h-full min-h-[600px] flex flex-col hover:shadow-xl transition-all hover:border-blue-200">
                  <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                        <BsBuilding className="text-white text-lg" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Departments
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate("/admin/employees/tasks")}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {departments.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-400 text-sm">
                          No departments found
                        </p>
                      </div>
                    ) : (
                      departments.map((dept) => (
                        <DepartmentCard
                          key={dept._id}
                          departmentName={dept.name}
                          managerName={
                            dept.manager
                              ? dept.manager.firstName
                              : "Not Allotted"
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickActionCard
                icon={<FaUserPlus />}
                label="Add Employee"
                iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
                iconColor="text-white"
                link="/admin/employees/add"
              />
              <QuickActionCard
                icon={<MdOutlineApproval />}
                label="Approve Leave"
                iconBg="bg-gradient-to-br from-orange-500 to-orange-600"
                iconColor="text-white"
                link="/admin/employees/leaves"
              />
              <QuickActionCard
                icon={<HiCurrencyDollar />}
                label="Run Payroll"
                iconBg="bg-gradient-to-br from-green-500 to-green-600"
                iconColor="text-white"
                link="/admin/employees/salary"
              />
            </div>
          </div>

          {/* SALARY DISTRIBUTION */}
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-6 mt-10 pb-8">
            <div className="xl:col-span-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 sm:px-8 py-7 shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:border-blue-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                    <BiDollarCircle className="text-white text-lg" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Salary Distribution
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-4 gap-4 sm:gap-8 items-end h-[200px] min-w-[280px]">
                    <SalaryBar label="<30k" fill="35%" />
                    <SalaryBar label="30-50k" fill="55%" />
                    <SalaryBar label="50-80k" fill="85%" active />
                    <SalaryBar label="80k+" fill="45%" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TASK MODAL (From Main) */}
      {isTaskModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Task Details
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedTask.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>
              <button
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                onClick={closeTaskDetails}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Assigned</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(selectedTask.assignedDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Due</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedTask.dueDate}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Status</p>
                <span
                  className={`mt-1 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(selectedTask.status)}`}
                >
                  {formatLabel(selectedTask.status)}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">
                Task Progress Update
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Progress status
                  </label>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={taskUpdate.status}
                    onChange={(event) =>
                      setTaskUpdate((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Comment
                  </label>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    rows="3"
                    value={taskUpdate.comment}
                    onChange={(event) =>
                      setTaskUpdate((prev) => ({
                        ...prev,
                        comment: event.target.value,
                      }))
                    }
                    placeholder="Add remarks or progress notes"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={closeTaskDetails}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={submitTaskUpdate}
                >
                  Submit Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`.dashboard-wrapper { margin-left: 0; transition: margin-left 0.3s ease-in-out; overflow-x: hidden; max-width: 100vw; } .header-wrapper { margin-left: 0; transition: margin-left 0.3s ease-in-out; } .content-wrapper { margin-left: 0; transition: margin-left 0.3s ease-in-out; } @media (min-width: 1024px) { .dashboard-wrapper { margin-left: 0; } .header-wrapper { margin-left: 256px; width: calc(100% - 256px); } .content-wrapper { margin-left: 256px; width: calc(100% - 256px); } } @media (max-width: 1023px) { .header-wrapper { padding-top: 3.5rem; } }`}</style>
    </>
  );
};

// =======================
// SUB COMPONENTS
// =======================

const StatsCard = ({
  icon,
  title,
  value,
  subText,
  badgeText,
  badgeColor,
  gradient,
}) => (
  <div
    className={`bg-gradient-to-br ${gradient} rounded-2xl px-6 py-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all hover:-translate-y-2 group backdrop-blur-sm`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-xl shadow-lg group-hover:shadow-xl transition-shadow backdrop-blur">
        {icon}
      </div>
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-bold ${badgeColor} shadow-md`}
      >
        {badgeText}
      </span>
    </div>
    <h3 className="text-slate-700 text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
      {title}
    </h3>
    <p className="text-slate-900 text-3xl font-black mb-2">{value}</p>
  </div>
);

const ActivityItem = ({ icon, iconBg, title, desc, time }) => (
  <div className="flex items-start justify-between gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all group border border-blue-100 hover:border-blue-200">
    <div className="flex items-start gap-4 flex-1">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${iconBg} group-hover:shadow-md transition-all`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{desc}</p>
      </div>
    </div>
    <span className="text-xs text-slate-400 whitespace-nowrap font-semibold flex-shrink-0">
      {time}
    </span>
  </div>
);

const DepartmentCard = ({ departmentName, managerName }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:shadow-md transition-shadow">
        <BsBuilding className="text-white text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {departmentName}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">
          Manager:{" "}
          <span
            className={
              managerName === "Not Allotted"
                ? "text-orange-600 font-semibold"
                : "text-slate-700 font-semibold"
            }
          >
            {managerName}
          </span>
        </p>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ icon, label, iconBg, iconColor, link }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => link && navigate(link)}
      className="flex items-center gap-4 sm:gap-5 bg-white/90 backdrop-blur-sm px-5 sm:px-6 py-5 rounded-2xl border border-blue-100 shadow-md cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group hover:bg-white hover:border-blue-200"
    >
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-xl ${iconBg} ${iconColor} text-lg flex-shrink-0 group-hover:shadow-md transition-shadow shadow-sm`}
      >
        {icon}
      </div>
      <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
        {label}
      </span>
    </div>
  );
};

const SalaryBar = ({ label, fill, active }) => (
  <div className="flex flex-col items-center justify-end h-full">
    <div className="w-full h-full bg-blue-100 rounded-t-2xl flex items-end overflow-hidden group hover:shadow-md transition-shadow border border-blue-200">
      <div
        className={`w-full rounded-t-2xl transition-all group-hover:brightness-100 ${active ? "bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 shadow-md" : "bg-gradient-to-t from-blue-500 to-blue-400"}`}
        style={{ height: fill }}
      />
    </div>
    <span className="mt-4 text-sm font-bold text-slate-700">{label}</span>
  </div>
);

export default AdminDashboard;
