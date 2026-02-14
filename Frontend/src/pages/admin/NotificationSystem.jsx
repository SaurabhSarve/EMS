import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX } from 'react-icons/fi';
import { HiOutlineTicket } from 'react-icons/hi';
import { employeeService } from '../../services/employeeServices';
import { useAuth } from '../../context/AuthContext';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);
  const [taskUpdates, setTaskUpdates] = useState([]);
  const [headLeaveUpdates, setHeadLeaveUpdates] = useState([]);
  const [headLeaveStatusUpdates, setHeadLeaveStatusUpdates] = useState([]);
  const [headAssignedTaskUpdates, setHeadAssignedTaskUpdates] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isDepartmentHead = user?.role === 'Department Head';
  const headUserId = user?._id || user?.id;

  // Fetch notifications on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const loadHeadLeaves = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('headLeaveRequests') || '[]');
        const readIds = JSON.parse(localStorage.getItem('headLeaveNotificationsRead') || '[]');
        const normalized = Array.isArray(stored) ? stored : [];
        const readSet = new Set(Array.isArray(readIds) ? readIds : []);
        setHeadLeaveUpdates(
          normalized.map((leave) => ({
            ...leave,
            isReadByAdmin: readSet.has(leave.id),
          }))
        );
      } catch (error) {
        setHeadLeaveUpdates([]);
      }
    };

    loadHeadLeaves();
    window.addEventListener('storage', loadHeadLeaves);
    return () => window.removeEventListener('storage', loadHeadLeaves);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const loadTaskUpdates = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('headTaskNotifications') || '[]');
        const readIds = JSON.parse(localStorage.getItem('headTaskNotificationsRead') || '[]');
        const normalized = Array.isArray(stored) ? stored : [];
        const readSet = new Set(Array.isArray(readIds) ? readIds : []);
        setTaskUpdates(
          normalized.map((update) => ({
            ...update,
            isReadByAdmin: readSet.has(update.id),
          }))
        );
      } catch (error) {
        setTaskUpdates([]);
      }
    };

    loadTaskUpdates();
    window.addEventListener('storage', loadTaskUpdates);
    return () => window.removeEventListener('storage', loadTaskUpdates);
  }, [isAdmin]);

  useEffect(() => {
    if (!isDepartmentHead) {
      return undefined;
    }

    const loadHeadLeaveStatus = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('headLeaveStatusNotifications') || '[]');
        const readIds = JSON.parse(localStorage.getItem('headLeaveStatusRead') || '[]');
        const normalized = Array.isArray(stored) ? stored : [];
        const readSet = new Set(Array.isArray(readIds) ? readIds : []);
        setHeadLeaveStatusUpdates(
          normalized.map((update) => ({
            ...update,
            isReadByHead: readSet.has(update.id),
          }))
        );
      } catch (error) {
        setHeadLeaveStatusUpdates([]);
      }
    };

    loadHeadLeaveStatus();
    window.addEventListener('storage', loadHeadLeaveStatus);
    return () => window.removeEventListener('storage', loadHeadLeaveStatus);
  }, [isDepartmentHead]);

  useEffect(() => {
    if (!isDepartmentHead) {
      return undefined;
    }

    const loadHeadAssignedTasks = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('headAssignedTaskNotifications') || '[]');
        const readIds = JSON.parse(localStorage.getItem('headAssignedTaskNotificationsRead') || '[]');
        const normalized = Array.isArray(stored) ? stored : [];
        const readSet = new Set(Array.isArray(readIds) ? readIds : []);
        const filtered = headUserId
          ? normalized.filter((entry) => !entry.headId || entry.headId === headUserId)
          : normalized;
        setHeadAssignedTaskUpdates(
          filtered.map((entry) => ({
            ...entry,
            isReadByHead: readSet.has(entry.id),
          }))
        );
      } catch (error) {
        setHeadAssignedTaskUpdates([]);
      }
    };

    loadHeadAssignedTasks();
    window.addEventListener('storage', loadHeadAssignedTasks);
    return () => window.removeEventListener('storage', loadHeadAssignedTasks);
  }, [headUserId, isDepartmentHead]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
     
      const result = await employeeService.getTickets();
     
      
      if (result.success) {
        setNotifications(result.tickets || []);
        // Count unread notifications
        const unread = result.tickets.filter(ticket => !ticket.isReadByAdmin).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const unreadTickets = notifications.filter((ticket) => !ticket.isReadByAdmin).length;
      const unreadTasks = taskUpdates.filter((update) => !update.isReadByAdmin).length;
      const unreadLeaves = headLeaveUpdates.filter((leave) => !leave.isReadByAdmin).length;
      setUnreadCount(unreadTickets + unreadTasks + unreadLeaves);
      return;
    }

    if (isDepartmentHead) {
      const unreadLeaveStatus = headLeaveStatusUpdates.filter((update) => !update.isReadByHead).length;
      const unreadAssignedTasks = headAssignedTaskUpdates.filter((update) => !update.isReadByHead).length;
      setUnreadCount(unreadLeaveStatus + unreadAssignedTasks);
      return;
    }

    setUnreadCount(0);
  }, [headAssignedTaskUpdates, headLeaveStatusUpdates, headLeaveUpdates, isAdmin, isDepartmentHead, notifications, taskUpdates]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      const token = localStorage.getItem('token');
    const result = await employeeService.updateTicket(notification._id);

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notification._id ? { ...n, isReadByAdmin: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate to ticket details or handle as needed
      // navigate(`/admin/support-tickets/${notification._id}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleTaskUpdateClick = (update) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('headTaskNotificationsRead') || '[]');
      const nextReadIds = Array.from(new Set([...(Array.isArray(readIds) ? readIds : []), update.id]));
      localStorage.setItem('headTaskNotificationsRead', JSON.stringify(nextReadIds));
      setTaskUpdates((prev) =>
        prev.map((item) =>
          item.id === update.id ? { ...item, isReadByAdmin: true } : item
        )
      );
      navigate('/admin/task-center');
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking task update as read:', error);
    }
  };

  const handleLeaveUpdateClick = (leave) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('headLeaveNotificationsRead') || '[]');
      const nextReadIds = Array.from(new Set([...(Array.isArray(readIds) ? readIds : []), leave.id]));
      localStorage.setItem('headLeaveNotificationsRead', JSON.stringify(nextReadIds));
      setHeadLeaveUpdates((prev) =>
        prev.map((item) =>
          item.id === leave.id ? { ...item, isReadByAdmin: true } : item
        )
      );
      navigate('/admin/employees/leaves');
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking leave notification as read:', error);
    }
  };

  const handleHeadLeaveStatusClick = (update) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('headLeaveStatusRead') || '[]');
      const nextReadIds = Array.from(new Set([...(Array.isArray(readIds) ? readIds : []), update.id]));
      localStorage.setItem('headLeaveStatusRead', JSON.stringify(nextReadIds));
      setHeadLeaveStatusUpdates((prev) =>
        prev.map((item) =>
          item.id === update.id ? { ...item, isReadByHead: true } : item
        )
      );
      navigate('/admin/employees/leaves');
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking head leave status as read:', error);
    }
  };

  const handleHeadAssignedTaskClick = (update) => {
    try {
      const readIds = JSON.parse(localStorage.getItem('headAssignedTaskNotificationsRead') || '[]');
      const nextReadIds = Array.from(new Set([...(Array.isArray(readIds) ? readIds : []), update.id]));
      localStorage.setItem('headAssignedTaskNotificationsRead', JSON.stringify(nextReadIds));
      setHeadAssignedTaskUpdates((prev) =>
        prev.map((item) =>
          item.id === update.id ? { ...item, isReadByHead: true } : item
        )
      );
      navigate('/admin/employees/tasks');
      setIsOpen(false);
    } catch (error) {
      console.error('Error marking head task assignment as read:', error);
    }
  };

  const clearHeadAssignedTasks = () => {
    localStorage.removeItem('headAssignedTaskNotifications');
    localStorage.removeItem('headAssignedTaskNotificationsRead');
    setHeadAssignedTaskUpdates([]);
  };

  const clearLocalNotifications = async () => {
    if (isAdmin) {
      const unreadTickets = notifications.filter((ticket) => !ticket.isReadByAdmin);
      if (unreadTickets.length > 0) {
        await Promise.all(
          unreadTickets.map((ticket) =>
            employeeService.updateTicket(ticket._id).catch(() => null)
          )
        );
      }
      setNotifications([]);
      localStorage.removeItem('headTaskNotifications');
      localStorage.removeItem('headTaskNotificationsRead');
      localStorage.removeItem('headLeaveRequests');
      localStorage.removeItem('headLeaveNotificationsRead');
      setTaskUpdates([]);
      setHeadLeaveUpdates([]);
      setUnreadCount(0);
      return;
    }

    if (isDepartmentHead) {
      localStorage.removeItem('headLeaveStatusNotifications');
      localStorage.removeItem('headLeaveStatusRead');
      localStorage.removeItem('headAssignedTaskNotifications');
      localStorage.removeItem('headAssignedTaskNotificationsRead');
      setHeadLeaveStatusUpdates([]);
      setHeadAssignedTaskUpdates([]);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const unreadTaskCount = useMemo(
    () => taskUpdates.filter((update) => !update.isReadByAdmin).length,
    [taskUpdates]
  );

  const unreadLeaveCount = useMemo(
    () => headLeaveUpdates.filter((leave) => !leave.isReadByAdmin).length,
    [headLeaveUpdates]
  );

  const unreadLeaveStatusCount = useMemo(
    () => headLeaveStatusUpdates.filter((update) => !update.isReadByHead).length,
    [headLeaveStatusUpdates]
  );

  const unreadAssignedTaskCount = useMemo(
    () => headAssignedTaskUpdates.filter((update) => !update.isReadByHead).length,
    [headAssignedTaskUpdates]
  );

  const hasAdminNotifications =
    taskUpdates.length > 0 || headLeaveUpdates.length > 0 || notifications.length > 0;
  const hasHeadNotifications = headLeaveStatusUpdates.length > 0 || headAssignedTaskUpdates.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
      >
        <FiBell className="text-xl text-white" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-[520px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(hasAdminNotifications || hasHeadNotifications) && (
                <button
                  onClick={clearLocalNotifications}
                  className="text-[11px] uppercase text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <FiX className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[360px]">
            {isAdmin && taskUpdates.length > 0 && (
              <div className="border-b border-slate-100">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Task Updates {unreadTaskCount > 0 ? `(${unreadTaskCount} new)` : ''}
                </div>
                {taskUpdates.map((update) => (
                  <div
                    key={update.id}
                    onClick={() => handleTaskUpdateClick(update)}
                    className={`px-4 py-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !update.isReadByAdmin ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {update.taskTitle || 'Task Update'}
                      </p>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTimeAgo(update.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {update.headName} • {update.comment || 'Progress updated'}
                    </p>
                    {update.attachmentUrl && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-blue-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="truncate">{update.attachmentName || 'Attachment'}</span>
                      </div>
                    )}
                    {!update.isReadByAdmin && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium">New</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isAdmin && headLeaveUpdates.length > 0 && (
              <div className="border-b border-slate-100">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Leave Requests {unreadLeaveCount > 0 ? `(${unreadLeaveCount} new)` : ''}
                </div>
                {headLeaveUpdates.map((leave) => (
                  <div
                    key={leave.id}
                    onClick={() => handleLeaveUpdateClick(leave)}
                    className={`px-4 py-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !leave.isReadByAdmin ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {leave.headName || 'Department Head'}
                      </p>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTimeAgo(leave.submittedAt || leave.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {leave.leaveType ? leave.leaveType.replace('-', ' ') : 'Leave request'} • {leave.reason || 'No reason provided'}
                    </p>
                    {!leave.isReadByAdmin && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium">New</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isDepartmentHead && headLeaveStatusUpdates.length > 0 && (
              <div className="border-b border-slate-100">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Leave Updates {unreadLeaveStatusCount > 0 ? `(${unreadLeaveStatusCount} new)` : ''}
                </div>
                {headLeaveStatusUpdates.map((update) => (
                  <div
                    key={update.id}
                    onClick={() => handleHeadLeaveStatusClick(update)}
                    className={`px-4 py-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !update.isReadByHead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {update.leaveType ? update.leaveType.replace('-', ' ') : 'Leave Update'}
                      </p>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTimeAgo(update.updatedAt || update.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      Status: {update.status}
                    </p>
                    {!update.isReadByHead && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium">New</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isDepartmentHead && headAssignedTaskUpdates.length > 0 && (
              <div className="border-b border-slate-100">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>
                    Task Assignments {unreadAssignedTaskCount > 0 ? `(${unreadAssignedTaskCount} new)` : ''}
                  </span>
                  <button
                    onClick={clearHeadAssignedTasks}
                    className="text-[11px] uppercase text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                </div>
                {headAssignedTaskUpdates.map((update) => (
                  <div
                    key={update.id}
                    onClick={() => handleHeadAssignedTaskClick(update)}
                    className={`px-4 py-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !update.isReadByHead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {update.taskTitle || 'New Task'}
                      </p>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTimeAgo(update.assignedAt || update.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      Due {update.dueDate || 'TBD'} • {update.priority || 'normal'}
                    </p>
                    {!update.isReadByHead && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-blue-600 font-medium">New</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isAdmin && notifications.length > 0 ? (
              <div>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Support Tickets
                </div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !notification.isReadByAdmin ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar or Icon */}
                      <div className="flex-shrink-0">
                        {notification.employee?.profilePhoto?.url && 
                         notification.employee.profilePhoto.url !== 'default-avatar.png' ? (
                          <img
                            src={notification.employee.profilePhoto.url}
                            alt={notification.employee.firstName || "Employee"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {notification.employee?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {notification.employee?.firstName} {notification.employee?.lastName}
                          </p>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-1 truncate">
                          {notification.subject}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                          <span className="text-xs text-slate-500">
                            {notification.category}
                          </span>
                        </div>

                        {!notification.isReadByAdmin && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-blue-600 font-medium">New</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {isAdmin && !hasAdminNotifications && (
              <div className="px-4 py-12 text-center">
                <HiOutlineTicket className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            )}

            {isDepartmentHead && !hasHeadNotifications && (
              <div className="px-4 py-12 text-center">
                <HiOutlineTicket className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-sm text-slate-500">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {isAdmin && notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 sticky bottom-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/tickets');
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all tickets
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;

