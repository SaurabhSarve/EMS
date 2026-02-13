import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Activity,
  Flag,
  ArrowUpCircle,
  MinusCircle,
  ArrowDownCircle,
  Loader,
  FolderKanban,
  Zap,
  BarChart3,
  TrendingDown,
  PlayCircle,
  Users
} from 'lucide-react';

import EmployeesSidebar from '../../Components/EmployeesSidebar';
import { employeeService } from '../../services/employeeServices';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [activeTab, setActiveTab] = useState("daily");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const response = await employeeService.getTasks();
      console.log(response);
      if (response.success) {
        setTasks(response.data.taskDetails);
      }


      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      // Update UI optimistically
      setTasks(tasks.map(task =>
        task._id === taskId
          ? { ...task, status: 'Completed' }
          : task
      ));

      // Call API to update task status
      const response = await employeeService.updateTask(taskId);

      console.log(response);
      if (response.success) {

        console.log("updated task");
        fetchTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);

      fetchTasks();
    }
  };

  const handleAddComment = async (taskId, comment) => {
    if (!comment || !comment.trim()) return false;

    try {
      const response = await employeeService.addTaskComment(taskId, comment.trim());
      if (response?.success && response?.data?.task) {
        setTasks((prev) =>
          prev.map((task) => (task._id === taskId ? response.data.task : task))
        );
      }
      return true;
    } catch (error) {
      console.error("Error adding task comment:", error);
      return false;
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const normalizeStatus = (value) => (value || '').toLowerCase().replace(/[-_]/g, ' ').trim();

  const isDailyTask = (task) => {
    const assignmentType = (task?.assignmentType || "single").toLowerCase();
    return assignmentType !== "team";
  };

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (normalizeStatus(status)) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in progress':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (normalizeStatus(status)) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'in progress':
        return <Clock size={16} className="text-blue-600" />;
      case 'pending':
        return <Circle size={16} className="text-yellow-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
  };
  //   const gettaskStatusColor = (status) => {
  //   switch (status?.toLowerCase()) {
  //     case 'completed':
  //       return '#10b981'; // green
  //     case 'in progress':
  //       return '#3b82f6'; // blue
  //     case 'pending':
  //       return '#f59e0b'; // amber
  //     default:
  //       return '#6b7280'; // gray
  //   }
  // };

  // Filter tasks
  const dailyCount = tasks.filter(isDailyTask).length;
  const teamCount = tasks.length - dailyCount;

  const tasksByTab = tasks.filter(task =>
    activeTab === "daily" ? isDailyTask(task) : !isDailyTask(task)
  );

  const filteredTasks = tasksByTab.filter(task => {
    const statusNorm = normalizeStatus(task.status);
    const priorityNorm = (task.priority || '').toLowerCase();
    const filterStatusNorm = normalizeStatus(filterStatus);
    const filterPriorityNorm = filterPriority.toLowerCase();

    const matchesSearch =
      searchQuery === "" ||
      (task.taskName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All" ||
      statusNorm === filterStatusNorm;

    const matchesPriority =
      filterPriority === "All" ||
      priorityNorm === filterPriorityNorm;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalTasks = filteredTasks.length;
  const pendingCount = filteredTasks.filter(t => (t.status || '').toLowerCase() === 'pending').length;
  const inProgressCount = filteredTasks.filter(t => (t.status || '').toLowerCase() === 'in progress').length;
  const completedCount = filteredTasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Sidebar placeholder */}



      <EmployeesSidebar />


      {/* Main Content - Shifts right on desktop to accommodate sidebar */}
      <main className="min-h-screen p-4 sm:p-6 lg:p-10 min-[1112px]:ml-64 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Header Section with Gradient */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 rounded-3xl p-8 mb-6 shadow-2xl relative overflow-hidden transform transition-all">
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full transition-transform duration-1000"></div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-700/20 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                  <FolderKanban size={32} className="text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">My Tasks</h1>
                </div>
              </div>
              <p className="text-base sm:text-lg text-blue-50 drop-shadow-md flex items-center gap-2">
                <Zap size={20} className="text-yellow-300 animate-bounce" />
                Manage and track your assigned tasks with ease
              </p>
            </div>
          </div>
        </div>

        {/* Split View Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition border ${
              activeTab === "daily"
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-slate-700 border-blue-100 hover:bg-blue-50"
            }`}
          >
            <Calendar size={16} />
            Daily Tasks
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "daily"
                ? "bg-white/20 text-white"
                : "bg-blue-100 text-blue-700"
            }`}
            >
              {dailyCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition border ${
              activeTab === "team"
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-slate-700 border-blue-100 hover:bg-blue-50"
            }`}
          >
            <Users size={16} />
            Team Tasks
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "team"
                ? "bg-white/20 text-white"
                : "bg-blue-100 text-blue-700"
            }`}
            >
              {teamCount}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-6 mb-8 transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-2.5 rounded-xl transition-transform duration-500">
              <Filter size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Filter Tasks</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Search */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-600 to-blue-400 p-1.5 rounded-lg transition-all duration-300">
                <Search className="text-white" size={16} />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all duration-200 font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Activity size={18} className="text-blue-600" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all duration-200 font-medium text-gray-700 appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>

              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Flag size={18} className="text-blue-600" />
              </div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all duration-200 font-medium text-gray-700 appearance-none cursor-pointer"
              >
                <option value="All">All Priority</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>

              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FolderKanban size={24} className="text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-700 text-lg font-semibold">Loading your tasks...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-16 text-center">
            <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No tasks found</h3>
            <p className="text-gray-600 text-lg">Try adjusting your filters or check back later for new tasks</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onComplete={handleCompleteTask}
                onAddComment={handleAddComment}
                formatDate={formatDate}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && filteredTasks.length > 0 && (
          <div className="mt-10 bg-white rounded-3xl shadow-xl border border-blue-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-2.5 rounded-xl">
                <BarChart3 size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Task Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="group text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 cursor-pointer">
                <div className="bg-gradient-to-br from-blue-600 to-blue-400 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FolderKanban size={28} className="text-white" />
                </div>
                <p className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">{totalTasks}</p>
                <p className="text-sm text-gray-700 font-semibold">Total Tasks</p>
              </div>
              <div className="group text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-200 cursor-pointer">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <TrendingDown size={28} className="text-white" />
                </div>
                <p className="text-4xl font-bold text-yellow-600 mb-2">
                  {pendingCount}
                </p>
                <p className="text-sm text-gray-700 font-semibold">Pending</p>
              </div>
              <div className="group text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border-2 border-indigo-200 cursor-pointer">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <PlayCircle size={28} className="text-white" />
                </div>
                <p className="text-4xl font-bold text-indigo-600 mb-2">
                  {inProgressCount}
                </p>
                <p className="text-sm text-gray-700 font-semibold">In Progress</p>
              </div>
              <div className="group text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 cursor-pointer">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {completedCount}
                </p>
                <p className="text-sm text-gray-700 font-semibold">Completed</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Task Card Component
const TaskCard = ({
  task,
  onComplete,
  onAddComment,
  formatDate,
  getPriorityColor,
  getStatusColor,
  getStatusIcon
}) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const status = (task.status || "").toLowerCase();
  const priority = (task.priority || "").toLowerCase();
  const updates = Array.isArray(task.progressComments) ? task.progressComments : [];
  const latestUpdates = updates.slice(-2).reverse();

  const handleSubmitComment = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onAddComment(task._id, comment);
    if (success) {
      setComment("");
    }
    setIsSubmitting(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-6
      shadow-sm hover:shadow-lg hover:-translate-y-0.5
      transition-all duration-300"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
            <FolderKanban size={18} className="text-white" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {task?.taskName}
            </h3>
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
              {task?.description || "No description provided"}
            </p>
          </div>
        </div>

        {/* STATUS */}
        <span
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full
          text-xs font-semibold capitalize
          ${getStatusColor(status)}`}
        >
          {getStatusIcon(status)}
          {status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full border text-xs font-semibold
          ${getPriorityColor(priority)}`}
        >
          {priority} priority
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {task.assignmentType === "team" ? "Team task" : "Single task"}
        </span>
      </div>

      {/* DATES */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        {/* Start Date */}
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-blue-600" />
          <div>
            <p className="text-xs text-slate-500">Start Date</p>
            <p className="font-medium text-slate-800">
              {formatDate(task?.startDate)}
            </p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
          <Clock size={14} className="text-blue-600" />
          <div>
            <p className="text-xs text-slate-500">Due Date</p>
            <p className="font-medium text-slate-800">
              {formatDate(task?.dueDate)}
            </p>
          </div>
        </div>
      </div>

      {/* PROGRESS UPDATE */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
          <Activity size={16} className="text-blue-600" />
          Progress update
        </div>
        <textarea
          rows="2"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share a quick update or blocker..."
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-slate-500">{comment.length}/300</p>
          <button
            type="button"
            onClick={handleSubmitComment}
            disabled={!comment.trim() || isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update progress"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {latestUpdates.length === 0 ? (
            <p className="text-xs text-slate-500">No progress updates yet.</p>
          ) : (
            latestUpdates.map((update, index) => (
              <div
                key={`${update._id || index}-${update.createdAt}`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                <p className="font-medium text-slate-800">{update.comment}</p>
                {update.attachmentUrl && (
                  <a
                    href={update.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-[11px] font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {update.attachmentName || 'View attachment'}
                  </a>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  {formatDate(update.createdAt)} • {formatTime(update.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-5 flex items-center justify-between">
        {/* ACTION */}
        {status !== "completed" ? (
          <button
            onClick={() => onComplete(task._id)}
            className="bg-blue-600 hover:bg-blue-700
            text-white px-5 py-2 rounded-lg text-sm font-semibold
            transition-colors"
          >
            Mark as Completed
          </button>
        ) : (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-green-100 text-green-700 text-sm font-semibold"
          >
            <CheckCircle2 size={16} />
            Completed
          </div>
        )}
      </div>
    </div>
  );
};
