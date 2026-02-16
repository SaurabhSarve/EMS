import React, { useState } from "react";
import "../../assets/styles/SupportStyles/Support.css";
import AdminSidebar from "../../Components/AdminSidebar";
import EmployeesSidebar from "../../Components/EmployeesSidebar";
import { ticketService } from "../../services/ticketService";
import { useEffect } from "react";
import { employeeService } from "../../services/employeeServices";

const Support = () => {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [showTicketsModal, setShowTicketsModal] = useState(false);

  const [showRemarks, setShowRemarks] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  useEffect(() => {
    fetchMytickets();
  }, []);

  const fetchMytickets = async () => {
    try {
      setLoading(true);
      const result = await ticketService.getMyTickets();
      console.log(result);

      if (result.success && result.data) {
        setMyTickets(result.data);
      }
    } catch (err) {
      console.log("get my tickets error", err);
      showToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "#3b82f6";
      case "In Progress":
        return "#f59e0b";
      case "Resolved":
        return "#10b981";
      case "Closed":
        return "#6b7280";
      case "Reopened":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "#10b981";
      case "Medium":
        return "#f59e0b";
      case "High":
        return "#ef4444";
      case "Urgent":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const contacts = [
    {
      name: "Sarah Jenkins",
      role: "System Administrator",
      avatar: "SJ",
      online: true,
    },
    {
      name: "Michael Chen",
      role: "HR Support Lead",
      avatar: "MC",
      online: true,
    },
  ];

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      showToast("Please enter a subject", "error");
      return;
    }

    if (!category) {
      showToast("Please select a category", "error");
      return;
    }

    if (!description.trim()) {
      showToast("Please enter a description", "error");
      return;
    }

    if (description.length > 2000) {
      showToast("Description cannot exceed 2000 characters", "error");
      return;
    }

    setLoading(true);

    try {
      const ticketData = {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      };

      const response = await ticketService.createTicket(ticketData);

      if (response.success) {
        showToast("Your query submitted successfully!", "success");
        setSubject("");
        setCategory("");
        setPriority("Medium");
        setDescription("");

        fetchMytickets();
      }
    } catch (err) {
      console.error("Error submitting ticket:", err);
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit ticket. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSubject("");
    setCategory("");
    setPriority("Medium");
    setDescription("");
  };

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 animate-slideIn ${toast.type === "error" ? "bg-red-500" : "bg-green-500"} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-md`}
        >
          <div
            className={`w-2 h-2 rounded-full ${toast.type === "error" ? "bg-red-300" : "bg-green-300"}`}
          ></div>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="ml-auto text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tickets Modal */}
      {showTicketsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowTicketsModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              maxWidth: "1200px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: "0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                backgroundColor: "#fff",
                zIndex: 1,
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
                My Support Tickets ({myTickets.length})
              </h2>
              <button
                onClick={() => setShowTicketsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "24px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p>Loading tickets...</p>
                </div>
              ) : myTickets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="2"
                    style={{ margin: "0 auto 16px" }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <h3 style={{ color: "#6b7280", fontSize: "18px" }}>
                    No tickets found
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                    You haven't created any support tickets yet.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Ticket ID
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Subject
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Category
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Priority
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Status
                        </th>
                        {/* <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Read by Admin
                        </th> */}
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Created Date
                        </th>
                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Assigned To
                        </th>

                        <th
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontWeight: "600",
                            color: "#374151",
                            borderBottom: "2px solid #e5e7eb",
                          }}
                        >
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTickets.map((ticket, index) => (
                        <tr
                          key={ticket._id}
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? "#fff" : "#f9fafb",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f3f4f6")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              index % 2 === 0 ? "#fff" : "#f9fafb")
                          }
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                              color: "#6b7280",
                              fontSize: "12px",
                              fontFamily: "monospace",
                            }}
                          >
                            #{ticket._id.slice(-6).toUpperCase()}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                              color: "#111827",
                              fontWeight: "500",
                              maxWidth: "200px",
                            }}
                          >
                            {ticket.subject}
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginTop: "4px",
                              }}
                            >
                              {ticket.description.length > 50
                                ? ticket.description.substring(0, 50) + "..."
                                : ticket.description}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                              color: "#374151",
                            }}
                          >
                            {ticket.category}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor:
                                  getPriorityColor(ticket.priority) + "20",
                                color: getPriorityColor(ticket.priority),
                                display: "inline-block",
                              }}
                            >
                              {ticket.priority}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor:
                                  getStatusColor(ticket.status) + "20",
                                color: getStatusColor(ticket.status),
                                display: "inline-block",
                              }}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          {/* <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                              textAlign: "center",
                            }}
                          >
                            {ticket.isReadByAdmin ? (
                              <span
                                style={{
                                  color: "#10b981",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Read
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "#ef4444",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="8" x2="12" y2="12"></line>
                                  <line
                                    x1="12"
                                    y1="16"
                                    x2="12.01"
                                    y2="16"
                                  ></line>
                                </svg>
                                Unread
                              </span>
                            )}
                          </td> */}
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                              color: "#6b7280",
                              fontSize: "13px",
                            }}
                          >
                            {formatDate(ticket.createdAt)}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                              color: "#374151",
                            }}
                          >
                            {ticket.assignedTo ? (
                              <div>
                                <div style={{ fontWeight: "500" }}>
                                  {ticket.assignedTo.role}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#6b7280",
                                    marginTop: "2px",
                                  }}
                                >
                                  {ticket.assignedTo.email}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#9ca3af" }}>
                                Not assigned
                              </span>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "12px 16px",
                              borderBottom: "1px solid #e5e7eb",
                            }}
                          >
                            {ticket.comments && ticket.comments.length > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setShowRemarks(true);
                                }}
                                style={{
                                  fontSize: "12px",
                                  padding: "6px 10px",
                                  backgroundColor: "#2563eb",
                                  color: "#fff",
                                  borderRadius: "6px",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                View ({ticket.comments.length})
                              </button>
                            ) : (
                              <span
                                style={{ fontSize: "12px", color: "#9ca3af" }}
                              >
                                No remarks
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {showRemarks && selectedTicket && (
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 50,
                      }}
                    >
                      <div
                        style={{
                          background: "#fff",
                          width: "500px",
                          maxHeight: "80vh",
                          overflowY: "auto",
                          borderRadius: "10px",
                          padding: "20px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <h3 style={{ fontSize: "16px", fontWeight: "600" }}>
                            Ticket Remarks
                          </h3>
                          <button
                            onClick={() => setShowRemarks(false)}
                            style={{ fontSize: "14px", cursor: "pointer" }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                          {selectedTicket.comments.map((c, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "#f9fafb",
                                padding: "12px",
                                borderRadius: "8px",
                                marginBottom: "10px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#2563eb",
                                  fontWeight: "600",
                                }}
                              >
                                {c.role}
                              </div>

                              <div
                                style={{ fontSize: "14px", marginTop: "4px" }}
                              >
                                {c.message}
                              </div>

                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#6b7280",
                                  marginTop: "6px",
                                }}
                              >
                                Status: <b>{c.statusAtThatTime}</b> •{" "}
                                {new Date(c.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <EmployeesSidebar />
      <div className="support-center">
        <div className="support-header bg-white rounded-2xl shadow-lg p-6">
          <div className="support-header-child1">
            <h1>Support Center</h1>
            <p className="support-subtitle">How can we help you today?</p>
          </div>
          <div className="support-header-child2">
            <div className="support-header-buttons">
              <button
                className="support-btn-secondary"
                onClick={() => setShowTicketsModal(true)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                My Tickets ({myTickets.length})
              </button>
            </div>
          </div>
        </div>

        <div className="support-content-grid">
          <div className="support-main-content">
            <div className="support-ticket-form bg-white rounded-2xl shadow-lg">
              <h2>New Support Ticket</h2>
              <p className="support-form-subtitle">
                Please provide detailed information to help us resolve your
                issue quickly.
              </p>

              <div className="support-form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Briefly describe the issue (e.g., Unable to access Payroll module)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="support-form-row">
                <div className="support-form-group">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select a category...</option>
                    <option value="Technical issue">Technical issue</option>
                    <option value="Payroll & Compensation">
                      Payroll & Compensation
                    </option>
                    <option value="Benefits">Benefits</option>
                    <option value="Access Control">Access Control</option>
                    <option value="HR Policy Inquiry">HR Policy Inquiry</option>
                    <option value="Equipment/Resources">
                      Equipment/Resources
                    </option>
                    <option value="Training">Training</option>
                    <option value="Policy Clarification">
                      Policy Clarification
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="support-form-group">
                  <label>Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low - Minor Issue</option>
                    <option value="Medium">Medium - Affects Work</option>
                    <option value="High">High - Critical Issue</option>
                    <option value="Urgent">Urgent - Blocking Work</option>
                  </select>
                </div>
              </div>

              <div className="support-form-group">
                <label>Description</label>
                <textarea
                  placeholder="Please describe the issue in detail, including any error messages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="6"
                ></textarea>
                <div className="support-char-count">
                  {description.length}/2000 characters
                </div>
              </div>

              <div className="support-form-actions">
                <button
                  className="support-btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="support-btn-submit"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Ticket"}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* <div className="support-sidebar">
            <div className="support-sidebar-section">
              <h3>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Direct Contacts
              </h3>

              {contacts.map((contact, index) => (
                <div key={index} className="support-contact-card">
                  <div className="support-contact-info">
                    <div className="support-avatar">
                      {contact.avatar}
                      {contact.online && (
                        <span className="support-status-dot"></span>
                      )}
                    </div>
                    <div>
                      <div className="support-contact-name">{contact.name}</div>
                      <div className="support-contact-role">{contact.role}</div>
                    </div>
                  </div>
                  <div className="support-contact-actions">
                    <button className="support-icon-btn">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </button>
                    <button className="support-icon-btn">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              <div className="support-emergency-box">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <div>
                  <div className="support-emergency-label">IT EMERGENCY</div>
                  <div className="support-emergency-number">
                    Ext. 4004 (24/7)
                  </div>
                </div>
              </div>
            </div> 
            </div> */}
        </div>
      </div>
    </>
  );
};

export default Support;
