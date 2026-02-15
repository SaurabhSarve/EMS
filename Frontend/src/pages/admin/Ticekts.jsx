import { useEffect, useState } from "react";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";
import { ticketService } from "../../services/ticketService";
import swal from "sweetalert2";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // comment and status draft for each ticket (for head/admin)
  const [comment, setComment] = useState({});
  const [statusDraft, setStatusDraft] = useState(tickets.status || {});
  const [submitting, setSubmitting] = useState({});
  const [successMsg, setSuccessMsg] = useState({});
  const [ticketVersion, setTicketVersion] = useState({});

  // department head query states
  const [subject, setSubject] = useState("");
  const [queryType, setQueryType] = useState("");
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("Medium");
  const [impact, setImpact] = useState("");
  const [description, setDescription] = useState("");

  // query view state (employee queries vs head queries)
  const [activeView, setActiveView] = useState("Employee_Queries");

  // sub-view for Department Head to toggle between list and form
  const [myQueriesSubView, setMyQueriesSubView] = useState("list"); // "list" or "form"

  // head can view replies
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [activeReply, setActiveReply] = useState([]);

  //  Logged-in user
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("Logged-in user:", user);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError("");

      // When Admin is viewing D-Query, use the dedicated endpoint
      if (user?.role === "Admin" && activeView === "My_Queries") {
        const result = await employeeService.getDepartmentHeadQueries();
        setTickets(result?.tickets || []);
      }
      // When Department Head is viewing My Queries, use the dedicated endpoint
      else if (
        user?.role === "Department Head" &&
        activeView === "My_Queries" &&
        myQueriesSubView === "list"
      ) {
        const result = await employeeService.getMyQueries();
        setTickets(result?.tickets || []);
      }
      // When Department Head is viewing Employee Queries, use the dedicated endpoint to get department employee tickets
      else if (
        user?.role === "Department Head" &&
        activeView === "Employee_Queries"
      ) {
        const result = await employeeService.getDepartmentEmployeesTickets();
        setTickets(result?.tickets || []);
      } else {
        const result = await employeeService.getTickets();
        setTickets(result?.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeView, myQueriesSubView]);

  // Role based filtering
  const roleBasedTickets = tickets.filter((ticket) => {
    // When Department Head is viewing their own queries, show all their raised queries
    if (user?.role === "Department Head" && activeView === "My_Queries") {
      return true; // Already filtered by API
    }

    // When Department Head is viewing Employee Queries, show all their department's tickets
    if (user?.role === "Department Head" && activeView === "Employee_Queries") {
      return true; // Already filtered by API
    }

    if (user?.role === "Admin") {
      // When Admin is viewing D-Query (My_Queries), show only tickets raised by Department Heads
      if (activeView === "My_Queries") {
        return ticket.raisedByRole === "Department Head";
      }
      // When Admin is viewing Employee Queries, show only tickets raised by Employees
      return ticket.raisedByRole === "Employee";
    }

    // Head → sirf apne department ke tickets
    if (user?.role === "Department Head") {
      return ticket.employee?.department === user.department;
    }

    return false;
  });
  console.log("Employee", tickets.comments);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Closed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Reopened":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-100";
      case "Urgent":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  // Search + Status filter
  const filteredTickets = roleBasedTickets.filter((ticket) => {
    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    const query = search.trim().toLowerCase();
    if (!query) return matchesStatus;

    const employeeName = `${ticket.employee?.firstName || ""} ${
      ticket.employee?.lastName || ""
    }`.toLowerCase();

    return (
      matchesStatus &&
      (ticket.subject?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query) ||
        employeeName.includes(query) ||
        ticket.description?.toLowerCase().includes(query))
    );
  });

  // filtered tickets based on role and active view

  const employeeQueryTickets = filteredTickets.filter((ticket) => {
    // Department Head → sab employee tickets
    if (user?.role === "Department Head") {
      return ticket.raisedByRole === "Employee";
    }

    // Admin → sirf forwarded employee tickets
    if (user?.role === "Admin") {
      return (
        ticket.raisedByRole === "Employee" && ticket.forwardedToAdmin === true
      );
    }

    return false;
  });

  // filtered tickets count
  const finalFilteredTickets = employeeQueryTickets.filter((ticket) => {
    // Department Head → sab employee tickets
    if (user?.role === "Department Head") {
      return ticket.raisedByRole === "Employee";
    }
    // Admin → sirf forwarded employee tickets
    if (user?.role === "Admin") {
      if (activeView === "Employee_Queries") {
        return (
          ticket.raisedByRole === "Employee" && ticket.forwardedToAdmin === true
        );
      }
    }
    return false;
  });

  // const statusCounts = filteredTickets.reduce(
  //   (acc, t) => {
  //     const key = t.status || "Open";
  //     acc[key] = (acc[key] || 0) + 1;
  //     return acc;
  //   },
  //   { Open: 0, "In Progress": 0, Resolved: 0, Closed: 0, Reopened: 0 },
  // );

  const statusCounts = employeeQueryTickets.reduce(
    (acc, t) => {
      const key = t.status || "Open";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { Open: 0, "In Progress": 0, Resolved: 0, Closed: 0, Reopened: 0 },
  );

  const handleStatusChange = async (ticketId, nextStatus) => {
    if (!ticketId || !nextStatus) return;
    try {
      const result = await employeeService.updateTicketStatus(
        ticketId,
        nextStatus,
      );
      if (result?.success && result?.ticket) {
        setTickets((prev) =>
          prev.map((t) =>
            t._id === ticketId ? { ...t, status: result.ticket.status } : t,
          ),
        );
      }
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  // handle status change with comment (for head)

  const handleStatusWithComment = async (ticketId) => {
    const status = statusDraft[ticketId] || "Open";
    const remark = comment[ticketId];

    if (!remark?.trim()) {
      alert("Comment is required");
      return;
    }

    try {
      setSubmitting((prev) => ({ ...prev, [ticketId]: true }));

      const res = await employeeService.updateTicketStatus(ticketId, {
        status,
        comment: remark,
      });

      if (res?.success) {
        // update ticket list
        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? res.ticket : t)),
        );

        // CLEAR INPUTS (FORCE RESET)
        setComment((prev) => {
          const copy = { ...prev };
          delete copy[ticketId];
          return copy;
        });

        setStatusDraft((prev) => {
          const copy = { ...prev };
          delete copy[ticketId];
          return copy;
        });

        // SHOW SUCCESS
        setSuccessMsg((prev) => ({
          ...prev,
          [ticketId]: "Update submitted successfully ✅",
        }));

        // auto hide
        setTimeout(() => {
          setSuccessMsg((prev) => {
            const copy = { ...prev };
            delete copy[ticketId];
            return copy;
          });
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmitting((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleForwardToAdmin = async (ticketId) => {
    try {
      const result = await employeeService.forwardTicketToAdmin(ticketId);
      if (result?.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t._id === ticketId ? { ...t, forwardedToAdmin: true } : t,
          ),
        );
      }
    } catch (err) {
      console.error("Error forwarding ticket:", err);
    }
  };

  const handleSubmit = async () => {
    if (!subject || !queryType || !description) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const ticketData = {
        subject,
        category: queryType,
        priority,
        impact,
        description,
      };

      const result = await ticketService.createTicket(ticketData);

      if (result?.success) {
        alert("Query sent to Admin successfully");
        // Reset form
        setSubject("");
        setQueryType("");
        setPriority("Medium");
        setImpact("");
        setDescription("");
        // Refresh tickets list
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert("Failed to send query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // delete Employee created Tickets
  const handleDeleteEmployeeTicket = async (ticketId) => {
    const result = await swal.fire({
      title: "Delete ticket?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      customClass: {
        popup: "rounded-2xl shadow-lg",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await employeeService.deleteEmployeeTickets(ticketId);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));

      swal.fire("Deleted!", "Ticket has been deleted.", "success");
    } catch {
      swal.fire("Error", "Failed to delete ticket", "error");
    }
  };

  // delete Department Head created Tickets (visible to Admin only)
  const handleDeleteDepartmentHeadTicket = async (ticketId) => {
    const result = await swal.fire({
      title: "Delete Department Head ticket?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "rounded-2xl p-6",
        confirmButton:
          "rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700",
        cancelButton:
          "rounded-lg bg-slate-300 px-4 py-2 text-slate-800 hover:bg-slate-400",
      },
    });

    if (!result.isConfirmed) return;

    try {
      await employeeService.deleteDepartmentHeadTicket(ticketId);

      // THIS updates UI instantly
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
    } catch (err) {
      swal.fire("Error", "Failed to delete ticket", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <AdminSidebar />
      <main className="lg:ml-64 p-6">
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-7 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-blue-100">
                  {user?.role}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black">
                  Support Tickets
                </h1>
                <p className="text-base text-blue-100">
                  Track, prioritize, and resolve employee issues
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Total Tickets</p>
                <p className="text-4xl sm:text-5xl font-black">
                  {finalFilteredTickets.length}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-7">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: "Open", value: statusCounts.Open },
                { label: "In Progress", value: statusCounts["In Progress"] },
                { label: "Resolved", value: statusCounts.Resolved },
                { label: "Closed", value: statusCounts.Closed },
                { label: "Reopened", value: statusCounts.Reopened },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm"
                >
                  {/* Top Accent Line */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400" />

                  {/* Content */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-900">
                      {stat.value}
                    </p>
                  </div>

                  {/* Soft Background Glow */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-sky-50/40" />
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  "All",
                  "Open",
                  "In Progress",
                  "Resolved",
                  "Closed",
                  "Reopened",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                      statusFilter === status
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="w-full lg:w-80 flex justify-center gap-2">
                {/* <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by subject, employee, category..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                /> */}

                {["Admin", "Department Head"].includes(user?.role) && (
                  <button
                    onClick={() => setActiveView("Employee_Queries")}
                    className={`
                    relative inline-flex items-center justify-center
                    px-6 py-2.5 rounded-xl
                    text-sm font-semibold tracking-wide
                    transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
                    ${
                      activeView === "Employee_Queries"
                        ? `
                   text-white
                   bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400
                   shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)]
                   border border-blue-500/60
                   `
                        : `
                     text-blue-700
                     bg-white
                     border border-slate-200
                     hover:border-blue-300
                     hover:text-blue-600
                     hover:bg-blue-50/50`
                    }
                   `}
                  >
                    {/* subtle shine layer (active only) */}
                    {activeView === "Employee_Queries" && (
                      <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-white/20 via-transparent to-transparent" />
                    )}

                    <span className="relative z-10">EMP Tickets</span>
                  </button>
                )}

                {user?.role === "Department Head" && (
                  <button
                    onClick={() => setActiveView("My_Queries")}
                    className={`relative inline-flex items-center justify-center
                  px-6 py-2.5 rounded-xl
                  text-sm font-semibold tracking-wide
                  transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
                    ${
                      activeView === "My_Queries"
                        ? `text-white
                    bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400
                    shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)]
                    border border-blue-500/60
                  `
                        : `
                    text-blue-700
                    bg-white
                    border border-slate-200
                    hover:border-blue-300
                    hover:text-blue-600
                    hover:bg-blue-50/50`
                    }
                  `}
                  >
                    My Tickets
                  </button>
                )}

                {user?.role === "Admin" && (
                  <button
                    onClick={() => setActiveView("My_Queries")}
                    className={`relative inline-flex items-center justify-center
                    px-6 py-2.5 rounded-xl
                    text-sm font-semibold tracking-wide
                    transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
                  ${
                    activeView === "My_Queries"
                      ? `text-white
                  bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400
                  shadow-[0_8px_24px_-6px_rgba(59,130,246,0.6)]
                  border border-blue-500/60
                  `
                      : `
                  text-blue-700
                  bg-white
                  border border-slate-200
                  hover:border-blue-300
                  hover:text-blue-600
                  hover:bg-blue-50/50`
                  }
                   `}
                  >
                    D-Tickets
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {activeView === "Employee_Queries" && (
              <>
                {isLoading ? (
                  <div className="text-sm text-slate-500">
                    Loading tickets...
                  </div>
                ) : error ? (
                  <div className="text-sm text-red-600">{error}</div>
                ) : employeeQueryTickets.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No tickets found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {employeeQueryTickets.map((ticket) => (
                      <div
                        key={ticket._id}
                        className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-sky-400" />

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                              {(ticket.employee?.firstName || "U").charAt(0)}
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-900">
                                {ticket.subject}
                              </p>
                              <p className="text-sm text-slate-500 mt-1">
                                {ticket.employee?.firstName}{" "}
                                {ticket.employee?.lastName} • {ticket.category}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyles(ticket.status)}`}
                          >
                            {ticket.status}
                          </span>

                          {user?.role === "Department Head" && (
                            <button
                              onClick={() => handleForwardToAdmin(ticket._id)}
                              disabled={ticket.forwardedToAdmin}
                              className={`text-xs flex items-center justify-center font-semibold px-3 py-1.5 rounded-lg rounded-md transition
                            ${
                              ticket.forwardedToAdmin
                                ? "bg-blue-200 text-blue-700 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }
                           `}
                            >
                              {ticket.forwardedToAdmin
                                ? "Forwarded"
                                : "Forward"}
                            </button>
                          )}

                          {user?.role === "Admin" &&
                            ticket.forwardedToAdmin && (
                              <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700">
                                Forwarded
                              </span>
                            )}

                          <button
                            onClick={() =>
                              handleDeleteEmployeeTicket(ticket._id)
                            }
                            className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg
                            bg-red-100 text-red-700 hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>

                        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                          {ticket.description}
                        </p>

                        {["Department Head", "Admin"].includes(user?.role) && (
                          <div className="mt-4 space-y-2">
                            <select
                              value={statusDraft[ticket._id] || ticket.status}
                              onChange={(e) =>
                                setStatusDraft((prev) => ({
                                  ...prev,
                                  [ticket._id]: e.target.value,
                                }))
                              }
                              className="w-full border rounded-lg px-3 py-2"
                            >
                              {[
                                "Open",
                                "In Progress",
                                "Resolved",
                                "Closed",
                                "Reopened",
                              ].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <textarea
                              value={comment[ticket._id] ?? ""}
                              onChange={(e) =>
                                setComment((prev) => ({
                                  ...prev,
                                  [ticket._id]: e.target.value,
                                }))
                              }
                              placeholder="Add remark for employee..."
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />

                            <button
                              onClick={() =>
                                handleStatusWithComment(ticket._id)
                              }
                              disabled={submitting[ticket._id]}
                              className={`px-4 py-2 rounded-lg text-sm text-white
                              ${
                                submitting[ticket._id]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }
                            `}
                            >
                              {submitting[ticket._id]
                                ? "Submitting..."
                                : "Submit Update"}
                            </button>
                            {successMsg[ticket._id] && (
                              <p className="text-green-600 text-sm mt-2">
                                {successMsg[ticket._id]}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityStyles(ticket.priority)}`}
                          >
                            {ticket.priority}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600">
                            #{ticket._id?.slice(-6)?.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Department head query - For Admin to view D-Queries */}

            {activeView === "My_Queries" && user?.role === "Admin" && (
              <>
                {isLoading ? (
                  <div className="text-sm text-slate-500">
                    Loading tickets...
                  </div>
                ) : error ? (
                  <div className="text-sm text-red-600">{error}</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No department head queries found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {filteredTickets.map((ticket) => (
                      <div
                        key={ticket._id}
                        className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-400" />

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                              {(ticket.employee?.firstName || "H").charAt(0)}
                            </div>
                            <div>
                              <p className="text-base font-bold text-slate-900">
                                {ticket.subject}
                              </p>
                              <p className="text-sm text-blue-600 mt-1 font-semibold">
                                {ticket.employee?.firstName}

                                {/* {ticket.employee?.department?.name && (
                                  <span className="text-slate-500 font-medium">
                                    {" "}
                                    • {ticket.employee.department.name}
                                  </span>
                                )} */}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyles(ticket.status)}`}
                          >
                            {ticket.status}
                          </span>

                          <button
                            onClick={() =>
                              handleDeleteDepartmentHeadTicket(ticket._id)
                            }
                            className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg
                            bg-red-100 text-red-700 hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>

                        <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                          {ticket.description}
                        </p>

                        {["Department Head", "Admin"].includes(user?.role) && (
                          <div className="mt-4 space-y-2">
                            <select
                              value={statusDraft[ticket._id] || ticket.status}
                              onChange={(e) =>
                                setStatusDraft((prev) => ({
                                  ...prev,
                                  [ticket._id]: e.target.value,
                                }))
                              }
                              className="w-full border rounded-lg px-3 py-2"
                            >
                              {[
                                "Open",
                                "In Progress",
                                "Resolved",
                                "Closed",
                                "Reopened",
                              ].map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>

                            <textarea
                              value={comment[ticket._id] ?? ""}
                              onChange={(e) =>
                                setComment((prev) => ({
                                  ...prev,
                                  [ticket._id]: e.target.value,
                                }))
                              }
                              placeholder="Add remark for Department Head..."
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />

                            <button
                              onClick={() =>
                                handleStatusWithComment(ticket._id)
                              }
                              disabled={submitting[ticket._id]}
                              className={`px-4 py-2 rounded-lg text-sm text-white
                              ${
                                submitting[ticket._id]
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }
                            `}
                            >
                              {submitting[ticket._id]
                                ? "Submitting..."
                                : "Submit Update"}
                            </button>
                            {successMsg[ticket._id] && (
                              <p className="text-green-600 text-sm mt-2">
                                {successMsg[ticket._id]}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityStyles(ticket.priority)}`}
                          >
                            {ticket.priority}
                          </span>
                          {ticket.impact && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 text-blue-600">
                              Impact: {ticket.impact}
                            </span>
                          )}
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600">
                            #{ticket._id?.slice(-6)?.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 ml-auto">
                            {formatDate(ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Department head query form - For Department Head to create queries */}

            {activeView === "My_Queries" &&
              user?.role === "Department Head" && (
                <div className="px-6 py-6">
                  {/* Toggle between List and Form */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {myQueriesSubView === "list"
                        ? "My Raised Queries"
                        : "Raise Department Query"}
                    </h2>
                    {myQueriesSubView === "list" ? (
                      <button
                        onClick={() => setMyQueriesSubView("form")}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        + Raise New Query
                      </button>
                    ) : (
                      <button
                        onClick={() => setMyQueriesSubView("list")}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        ← Back to My Queries
                      </button>
                    )}
                  </div>

                  {/* List View */}
                  {myQueriesSubView === "list" && (
                    <>
                      {isLoading ? (
                        <div className="text-sm text-slate-500">
                          Loading your queries...
                        </div>
                      ) : error ? (
                        <div className="text-sm text-red-600">{error}</div>
                      ) : filteredTickets.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl">
                          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                              className="w-8 h-8 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <p className="text-slate-600 font-medium">
                            No queries raised yet
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            Click "Raise New Query" to create one
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                          {filteredTickets.map((ticket) => (
                            <div
                              key={ticket._id}
                              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden"
                            >
                              <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-blue-400" />

                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                                    {(ticket.employee?.firstName || "H").charAt(
                                      0,
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-base font-bold text-slate-900">
                                      {ticket.subject}
                                    </p>
                                    <p className="text-sm text-blue-600 mt-1 font-semibold">
                                      {ticket.employee?.firstName}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusStyles(ticket.status)}`}
                                >
                                  {ticket.status}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-600  line-clamp-2">
                                  {ticket.description}
                                </p>
                                {ticket.comments && ticket.comments.length > 0 ? (
                                  <button
                                    onClick={() => {
                                      setActiveReply(ticket.comments || []);
                                      setShowReplyModal(true);
                                    }}
                                    className="px-2 py-1.5 text-xs font-semibold text-blue-600 border border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white"
                                  >
                                    View Remarks ({ticket.comments.length})
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">No remarks</span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-4">
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPriorityStyles(ticket.priority)}`}
                                >
                                  {ticket.priority}
                                </span>
                                {ticket.impact && (
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 text-blue-600">
                                    Impact: {ticket.impact}
                                  </span>
                                )}
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 text-slate-600">
                                  #{ticket._id?.slice(-6)?.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-500 ml-auto">
                                  {formatDate(ticket.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* comment section of by admin and view by head  */}

                  {showReplyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">
                          Ticket Remarks
                        </h3>

                        <div className="max-h-80 overflow-y-auto space-y-3">
                          {activeReply && activeReply.length > 0 ? (
                            activeReply.map((reply, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-blue-600">
                                    {reply.role}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {reply.message}
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                  Status: <span className="font-semibold">{reply.statusAtThatTime}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No remarks available</p>
                          )}
                        </div>

                        <button
                          onClick={() => setShowReplyModal(false)}
                          className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form View */}
                  {myQueriesSubView === "form" && (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                      {/* Subject */}
                      <div className="mt-5">
                        <label className="text-sm font-semibold text-slate-700">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. Delay in salary processing for Sales department"
                          className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      {/* Query Type & Priority */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700">
                            Query Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={queryType}
                            onChange={(e) => setQueryType(e.target.value)}
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                          >
                            <option value="">Select query type</option>
                            <option>Escalation</option>
                            <option>Department Request</option>
                            <option>Policy Exception</option>
                            <option>Resource Approval</option>
                            <option>Inter-Department Issue</option>
                            <option>Management Attention Required</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-700">
                            Priority
                          </label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                          >
                            <option>Medium</option>
                            <option>High</option>
                            <option>Critical</option>
                          </select>
                        </div>
                      </div>

                      {/* Impact */}
                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">
                          Department Impact
                        </label>
                        <select
                          value={impact}
                          onChange={(e) => setImpact(e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2"
                        >
                          <option value="">Select impact level</option>
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Critical</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="mt-4">
                        <label className="text-sm font-semibold text-slate-700">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={5}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={`• What is the issue?`}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {description.length}/2000 characters
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 mt-6">
                        <button
                          onClick={() => {
                            setSubject("");
                            setQueryType("");
                            setPriority("Medium");
                            setImpact("");
                            setDescription("");
                          }}
                          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          disabled={loading}
                        >
                          Clear
                        </button>

                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className={`px-5 py-2 rounded-lg text-white font-semibold
            ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
                        >
                          {loading ? "Sending..." : "Send to Admin"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
