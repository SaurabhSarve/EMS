import { useEffect, useState } from "react";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [comment, setComment] = useState({});
  const [statusDraft, setStatusDraft] = useState(tickets.status || {});
  const [submitting, setSubmitting] = useState({});
  const [successMsg, setSuccessMsg] = useState({});
  const [ticketVersion, setTicketVersion] = useState({});

  //  Logged-in user
  const user = JSON.parse(localStorage.getItem("user"));

  console.log("Logged-in user:", user);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError("");
      const result = await employeeService.getTickets();
      setTickets(result?.tickets || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Role based filtering
  const roleBasedTickets = tickets.filter((ticket) => {
    if (user?.role === "Admin") {
      return ticket.forwardedToAdmin === true;
    }

    // Head → sirf apne department ke tickets
    if (user?.role === "Department Head") {
      return ticket.employee?.department === user.department;
    }

    return false;
  });

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

  const statusCounts = filteredTickets.reduce(
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

        // ✅ CLEAR INPUTS (FORCE RESET)
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

        // ✅ SHOW SUCCESS
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
                  Admin
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
                  {roleBasedTickets.length}
                </p>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Open", value: statusCounts.Open },
                { label: "In Progress", value: statusCounts["In Progress"] },
                { label: "Resolved", value: statusCounts.Resolved },
                { label: "Closed", value: statusCounts.Closed },
                { label: "Reopened", value: statusCounts.Reopened },
              ].map((stat) => (
                <button
                  key={stat.label}
                  onClick={() => setStatusFilter(stat.label)}
                  className={`rounded-2xl px-4 py-3 text-left transition-all border backdrop-blur ${
                    statusFilter === stat.label
                      ? "bg-white/35 border-white/70 shadow-lg"
                      : "bg-white/15 border-white/20 hover:bg-white/25"
                  }`}
                >
                  <p className="text-xs text-blue-100 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-extrabold text-white">
                    {stat.value}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 border-b border-slate-100 bg-white">
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
              <div className="w-full lg:w-80">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by subject, employee, category..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading tickets...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-sm text-slate-500">No tickets found.</div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-sky-400" />

                    <div className="flex items-center justify-between gap-4">
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
                              ? "bg-purple-200 text-purple-700 cursor-not-allowed"
                              : "bg-purple-600 text-white hover:bg-purple-700"
                          }
                          `}
                        >
                          {ticket.forwardedToAdmin ? "Forwarded" : "Forward"}
                        </button>
                      )}

                      {user?.role === "Admin" && ticket.forwardedToAdmin && (
                        <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700">
                          Forwarded
                        </span>
                      )}
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
                          onClick={() => handleStatusWithComment(ticket._id)}
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
          </div>
        </div>
      </main>
    </div>
  );
}
