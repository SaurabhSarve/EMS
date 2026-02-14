import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  X,
  Lock,
  Unlock,
  Building2,
  CreditCard,
  UserCheck,
  AlertCircle,
  Edit,
  Save,
  ArrowLeft,
  DollarSign,
  IndianRupee,
  Users,
  Wallet,
  TrendingUp,
  ChevronDown,
  CheckCircle,
  History
} from "lucide-react";
import jsPDF from "jspdf";

import { salaryService } from "../../services/salaryServices";
import AdminSidebar from "../../Components/AdminSidebar";
import { paymentService } from "../../services/paymentService";
import { useNavigate } from "react-router-dom";

export default function SecureSalaryManagement() {

  const navigate = useNavigate();

  const [selectedEmployee, setSelectedEmployee] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [activeSection, setActiveSection] = useState("bank");

  const [selectedIntialBaseSalary, setSelectedIntialSalary] = useState()


  // Payment Mode States
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Bank Details States
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [bankDetailsForm, setBankDetailsForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
  });

  // Individual Payment States
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [paymentEmployee, setPaymentEmployee] = useState(null);
  const [isProcessingIndividualPayment, setIsProcessingIndividualPayment] = useState(false);

  // Organization Balance
  const [organizationBalance, setOrganizationBalance] = useState(5250000);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState([])
  const [duePayment, setDuePayment] = useState([]);

  const [updateFormData, setUpdateFormData] = useState({
    baseSalary: "",
    allowances: "",
    taxApply: "",
    deductions: "",
  });

  useEffect(() => {
    fetchEmployeesSalary();
    loadDefaultHistory();
    fetchEmployeeDuePayment();
  }, []);

  const loadDefaultHistory = async () => {
    try {
      const response = await paymentService.PaymentHistory();
      setPaymentHistory(response.data);
      console.log(response.data)
    } catch (error) {
      console.error(error);
      showToast("Failed to load payment history", "error");
    }
  };

  const fetchEmployeesSalary = async () => {
    try {
      const result = await salaryService.getEmployeesSalary();
      console.log(result);
      if (result && result.data && result.success) {
        setEmployees(result.data);
        if (result.data.length > 0) {
          setSelectedEmployee(result.data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("Failed to fetch employee data", "error");
    }
  };

  const fetchEmployeeDuePayment = async () => {
    try {
      const apiResponse = await salaryService.getAllEmployeeDuePayment();
      console.log(apiResponse);
      if (apiResponse && apiResponse.data && apiResponse.success) {
        setDuePayment(apiResponse.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("Failed to fetch employee data", "error");
    }
  }

  const updatePermantentSalary = async () => {
    try {

      let baseSalary = parseFloat(updateFormData.baseSalary);
      let allowances = parseFloat(updateFormData.allowances);
      let taxApply = parseFloat(updateFormData.taxApply);

      let taxPrice = (baseSalary * taxApply) / 100;
      let netSalary = baseSalary + allowances - taxPrice;
      const formData = {
        employeeId: updateFormData.employeeId,
        baseSalary,
        allowances,
        taxApply,
        netSalary,
      }

      const apiResponse = await salaryService.permantentSalary(formData);
      if (apiResponse && apiResponse.data && apiResponse.success) {
        console.log(apiResponse.message)
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      showToast("Failed to fetch employee data", "error");
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleActivatePaymentMode = () => {
    setShowSecretKeyModal(true);
  };

  const handleSecretKeySubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const response = await paymentService.ActivatePaymentMode(secretKey);

      if (response && response.success) {
        setIsPaymentMode(true);
        setShowSecretKeyModal(false);
        setSecretKey("");
        showToast("Payment mode activated successfully!", "success");
      } else {
        showToast("Invalid secret key! Access denied.", "error");
      }
    } catch (err) {
      console.log("Payment mode authentication error", err);
      showToast(
        err.response?.data?.message || "Authentication failed. Please try again.",
        "error"
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePaymentHistory = () => {
    navigate("/admin/PaymentHistory")
  }

  const handleAddBankDetails = (employeeId) => {
    setEditingEmployeeId(employeeId);
    const employee = employees.find((e) => e.employee._id === employeeId);

    if (employee?.employee?.bankDetails?.accountNumber) {
      setBankDetailsForm({
        accountHolderName: employee.employee.bankDetails.accountHolderName || "",
        accountNumber: employee.employee.bankDetails.accountNumber || "",
        confirmAccountNumber: employee.employee.bankDetails.accountNumber || "",
        ifscCode: employee.employee.bankDetails.ifscCode || "",
        bankName: employee.employee.bankDetails.bankName || "",
        branchName: employee.employee.bankDetails.branchName || "",
      });
    } else {
      setBankDetailsForm({
        accountHolderName: `${employee.employee.firstName} ${employee.employee.lastName}`,
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        bankName: "",
        branchName: "",
      });
    }
    setShowBankDetailsModal(true);
  };

  const handleBankDetailsSubmit = async (e) => {
    e.preventDefault();

    try {
      if (bankDetailsForm.accountNumber !== bankDetailsForm.confirmAccountNumber) {
        showToast("Account numbers don't match!", "error");
        return;
      }

      const bankDetails = {
        accountHolderName: bankDetailsForm.accountHolderName,
        accountNumber: bankDetailsForm.accountNumber,
        ifscCode: bankDetailsForm.ifscCode,
        bankName: bankDetailsForm.bankName,
        branchName: bankDetailsForm.branchName,
      };

      const response = await paymentService.UpdateBankDetails(editingEmployeeId, bankDetails);

      if (response && response.success) {
        await fetchEmployeesSalary();
        setShowBankDetailsModal(false);
        showToast("Bank details saved successfully!", "success");
      }
    } catch (err) {
      console.log("Error updating bank details", err);
      showToast(
        err.response?.data?.message || "Failed to update bank details",
        "error"
      );
    }
  };

  const handleIndividualPay = (employee) => {
    if (!employee.employee.bankDetails?.accountNumber) {
      showToast("Please add bank details first!", "error");
      return;
    }
    if (employee.Status.toLowerCase() === "paid") {
      showToast("Payment already processed for this employee!", "error");
      return;
    }
    setPaymentEmployee(employee);
    setShowPaymentConfirmModal(true);
  };

  const handleConfirmIndividualPayment = async () => {
    try {
      setIsProcessingIndividualPayment(true);

      const paymentAmount = parseFloat(paymentEmployee.netSalary);

      if (paymentAmount > organizationBalance) {
        showToast("Insufficient organization balance!", "error");
        setIsProcessingIndividualPayment(false);
        return;
      }

      const response = await paymentService.payIndividual(paymentEmployee._id);

      if (response && response.success) {

        // ✅ Remove from duePayment
        const updatedDue = duePayment.filter(
          (emp) => emp._id !== paymentEmployee._id
        );
        setDuePayment(updatedDue);

        // ✅ Add to paymentHistory
        const newHistoryEntry = {
          ...paymentEmployee,
          Status: "Paid",
          createdAt: new Date().toISOString(),
        };

        setPaymentHistory((prev) => [newHistoryEntry, ...prev]);

        // ✅ Update main employee list
        const updatedEmployees = employees.map((emp) =>
          emp._id === paymentEmployee._id
            ? { ...emp, Status: "Paid" }
            : emp
        );
        setEmployees(updatedEmployees);

        setOrganizationBalance((prev) => prev - paymentAmount);

        setShowPaymentConfirmModal(false);
        setPaymentEmployee(null);

        showToast(
          `Payment of ₹${paymentAmount.toLocaleString()} processed successfully!`,
          "success"
        );
      }

    } catch (err) {
      console.log("Error processing individual payment", err);
      showToast(
        err.response?.data?.message || "Failed to process payment",
        "error"
      );
    } finally {
      setIsProcessingIndividualPayment(false);
    }
  };

  const handleProcessPayment = async () => {
    try {
      setIsProcessingPayment(true);

      const dueEmployees = employees.filter(
        (emp) => emp.Status.toLowerCase() === "due" && emp.employee.bankDetails
      );

      const totalAmount = dueEmployees.reduce(
        (sum, emp) => sum + parseFloat(emp.netSalary),
        0
      );

      if (totalAmount > organizationBalance) {
        showToast("Insufficient organization balance!", "error");
        setIsProcessingPayment(false);
        return;
      }

      if (dueEmployees.length === 0) {
        showToast("No employees to process payment for", "error");
        setIsProcessingPayment(false);
        return;
      }

      const response = await salaryService.runEmployeePayroll(dueEmployees);

      if (response && response.success) {

        const updatedEmployees = employees.map((emp) =>
          emp.Status.toLowerCase() === "due" && emp.employee.bankDetails
            ? { ...emp, Status: "Paid" }
            : emp
        );

        setEmployees(updatedEmployees);
        setOrganizationBalance(organizationBalance - totalAmount);

        showToast(
          `Payment processed for ${dueEmployees.length} employees! Confirmation emails sent.`,
          "success"
        );
      }
    } catch (err) {
      console.log("Error processing payment", err);
      showToast(
        err.response?.data?.message || "Failed to process payment",
        "error"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadPayslip = () => {
    if (!selectedEmployee || !selectedEmployee.employee) {
      showToast("No employee selected", "error");
      return;
    }

    try {
      const doc = new jsPDF();

      // Header
      doc.setFont("helvetica");
      doc.setFillColor(15, 23, 41);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("GRAPHURA HR", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("PAYSLIP RECEIPT", 105, 30, { align: "center" });

      // Employee Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Details", 20, 55);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const employeeName = `${capitalize(
        selectedEmployee?.employee?.firstName || ""
      )} ${capitalize(selectedEmployee?.employee?.lastName || "")}`;

      doc.text(`Name: ${employeeName}`, 20, 65);
      doc.text(`Employee ID: ${selectedEmployee?.employeeId || "N/A"}`, 20, 72);
      doc.text(
        `Position: ${capitalize(selectedEmployee?.employee?.position || "N/A")}`,
        20,
        79
      );
      doc.text(
        `Payment Period: ${selectedEmployee?.month || "N/A"} 2026`,
        120,
        65
      );

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 95, 190, 95);

      // Earnings
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Earnings", 20, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const baseSalary = parseFloat(selectedEmployee?.baseSalary) || 0;
      const allowances = parseFloat(selectedEmployee?.allowances) || 0;

      doc.text("Base Salary", 20, 115);
      doc.text(
        `&#8377;${baseSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        190,
        115,
        { align: "right" }
      );
      doc.text("Allowances & Bonuses", 20, 122);
      doc.text(
        `&#8377;${allowances.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        190,
        122,
        { align: "right" }
      );

      doc.line(20, 130, 190, 130);

      // Deductions
      doc.setFont("helvetica", "bold");
      doc.text("Deductions", 20, 140);
      doc.setFont("helvetica", "normal");

      const taxApply = parseFloat(selectedEmployee?.taxApply) || 0;
      const taxAmount = (baseSalary * taxApply) / 100;
      const deductions = parseFloat(selectedEmployee?.deductions) || 0;

      doc.text(`Tax (${taxApply}%)`, 20, 150);
      doc.text(
        `$${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        190,
        150,
        { align: "right" }
      );
      doc.text("Other Deductions", 20, 157);
      doc.text(
        `$${deductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        190,
        157,
        { align: "right" }
      );

      doc.line(20, 165, 190, 165);

      // Net Pay
      const netSalary = parseFloat(selectedEmployee?.netSalary) || 0;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 172, 170, 15, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("NET PAY", 25, 182);
      doc.setFontSize(14);
      doc.text(
        `$${netSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        185,
        182,
        { align: "right" }
      );

      const fileName = `Payslip_${employeeName.replace(/\s+/g, "_")}_${selectedEmployee?.month || "Unknown"
        }_2026.pdf`;
      doc.save(fileName);

      showToast("Payslip downloaded successfully!", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast("Failed to download payslip", "error");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp?.employee?.firstName || ""} ${emp?.employee?.lastName || ""}`
      .trim()
      .toLowerCase();
    const employeeId = (emp?.employeeId || "").toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      fullName.includes(searchQuery.toLowerCase()) ||
      employeeId.includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === "All" ||
      (emp?.Status || "").toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const dueCount = employees.filter((emp) => (emp?.Status || "").toLowerCase() === "due").length;
  const employeesWithoutBank = employees.filter(
    (emp) => !emp?.employee?.bankDetails?.accountNumber
  ).length;
  const totalPayableSalary = employees
    .filter(
      (emp) =>
        (emp?.Status || "").toLowerCase() === "due" &&
        emp?.employee?.bankDetails
    )
    .reduce((sum, emp) => sum + parseFloat(emp.netSalary), 0);


  if (isPaymentMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Toast */}
        {toast.show && (
          <div
            className={`fixed top-4 right-4 z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"
              } text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm`}
          >
            <span className="text-sm sm:text-base">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: "", type: "" })}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Bank Details Modal */}
        {showBankDetailsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="text-blue-600" size={20} />
                  {employees.find((e) => e.employee._id === editingEmployeeId)?.employee?.bankDetails
                    ?.accountNumber
                    ? "Edit"
                    : "Add"}{" "}
                  Bank Details
                </h3>
                <button
                  onClick={() => setShowBankDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={bankDetailsForm.accountHolderName}
                      onChange={(e) =>
                        setBankDetailsForm({
                          ...bankDetailsForm,
                          accountHolderName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankDetailsForm.accountNumber}
                      onChange={(e) =>
                        setBankDetailsForm({
                          ...bankDetailsForm,
                          accountNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      maxLength="16"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      value={bankDetailsForm.confirmAccountNumber}
                      onChange={(e) =>
                        setBankDetailsForm({
                          ...bankDetailsForm,
                          confirmAccountNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      maxLength="16"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={bankDetailsForm.ifscCode}
                      onChange={(e) =>
                        setBankDetailsForm({
                          ...bankDetailsForm,
                          ifscCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      maxLength="11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankDetailsForm.bankName}
                      onChange={(e) =>
                        setBankDetailsForm({
                          ...bankDetailsForm,
                          bankName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={bankDetailsForm.branchName}
                      onChange={(e) =>
                        setBankDetailsForm({
                          ...bankDetailsForm,
                          branchName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBankDetailsModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Individual Payment Confirmation Modal */}
        {showPaymentConfirmModal && paymentEmployee && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={24} />
                  Confirm Payment
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentConfirmModal(false);
                    setPaymentEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isProcessingIndividualPayment}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Employee Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {capitalize(paymentEmployee.employee.firstName)} {capitalize(paymentEmployee.employee.lastName)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-medium">{paymentEmployee.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium">{capitalize(paymentEmployee.employee.position)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="font-bold text-green-600 text-lg">
                      &#8377;{parseFloat(paymentEmployee.netSalary).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="text-blue-600" size={18} />
                  Bank Details (Read-only)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Holder:</span>
                    <span className="font-medium">
                      {paymentEmployee.employee.bankDetails.accountHolderName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-medium font-mono">
                      •••• •••• •••• {paymentEmployee.employee.bankDetails.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IFSC Code:</span>
                    <span className="font-medium font-mono">
                      {paymentEmployee.employee.bankDetails.ifscCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-medium">
                      {paymentEmployee.employee.bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium">
                      {paymentEmployee.employee.bankDetails.branchName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentConfirmModal(false);
                    setPaymentEmployee(null);
                  }}
                  disabled={isProcessingIndividualPayment}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIndividualPayment}
                  disabled={isProcessingIndividualPayment}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isProcessingIndividualPayment ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign size={20} />
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Dashboard Content - Keep existing Payment Mode UI */}
        {/* (Rest of your Payment Mode UI code stays the same) */}
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setIsPaymentMode(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <Lock className="text-green-600" size={24} />
                    Secure Payment Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Payment mode is active - Process salary transfers securely
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm self-start sm:self-auto">
                <Unlock size={18} />
                <span>Authenticated</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Organization Balance
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    ${organizationBalance.toLocaleString()}
                  </p>
                </div>
                <Wallet className="text-blue-500 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Total Payable</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                    &#8377;{totalPayableSalary.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="text-orange-500 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Pending Employees
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                    {dueCount}
                  </p>
                </div>
                <Users className="text-purple-500 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Missing Bank Details
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {employeesWithoutBank}
                  </p>
                </div>
                <AlertCircle className="text-red-500 flex-shrink-0" size={32} />
              </div>
            </div>
          </div>

          {/* Employee Bank Details List */}
          {/* SECTION SWITCH BUTTONS */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setActiveSection("bank")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeSection === "bank"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Employee Bank Details
            </button>

            <button
              onClick={() => setActiveSection("history")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeSection === "history"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Payment History
            </button>
          </div>


          {activeSection === "bank" && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" />
                Employee Bank Details
              </h2>

              <div className="space-y-3">
                {duePayment.map((emp) => (
                  <div
                    key={emp._id}
                    className={`border rounded-lg p-3 sm:p-4 ${!emp.employee?.bankDetails?.accountNumber
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {emp.employee?.firstName.charAt(0) || ""}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {capitalize(emp.employee?.firstName || "")}{" "}
                            {capitalize(emp.employee?.lastName || "")}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {emp.employeeId} • {capitalize(emp.employee?.position || "")}
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-blue-600 mt-1">
                            Net Salary: ₹{emp.netSalary?.toLocaleString() || ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

                        {/* ================= BANK DETAILS ================= */}
                        {emp?.employee?.bankDetails?.accountHolderName ? (
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-gray-600">
                              A/C: •••• {emp.employee.bankDetails.accountNumber}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              IFSC: {emp.employee?.bankDetails.ifscCode || ""}
                            </p>
                            <p className="text-xs text-gray-500">
                              {emp.employee?.bankDetails.bankName || ""}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm font-semibold text-red-600 flex items-center gap-1">
                            <AlertCircle size={14} />
                            No Bank Details
                          </p>
                        )}

                        {/* Update Salary Modal */}
                        {showUpdateModal && (
                          <div className="fixed inset-0 backdrop-blur-lg bg-white/20 z-50 flex items-center justify-center p-4">
                            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/40">
                              <div className="flex justify-between items-center mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                  Update Salary Details
                                </h3>
                                <button
                                  onClick={() => setShowUpdateModal(false)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X size={24} />
                                </button>
                              </div>

                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();

                                  try {
                                    const baseSalary = parseFloat(updateFormData.baseSalary) || 0;
                                    const allowances = parseFloat(updateFormData.allowances) || 0;
                                    const deductions = parseFloat(updateFormData.deductions) || 0;
                                    const taxApply = parseFloat(updateFormData.taxApply) || 0;
                                    const taxAmount = (baseSalary * taxApply) / 100;
                                    const netSalary = baseSalary + allowances - deductions - taxAmount;

                                    const updateData = {
                                      ...updateFormData,
                                      netSalary: netSalary.toFixed(2)
                                    };

                                    const response = await salaryService.updateEmployeeSalary(updateData);



                                    if (response.success) {
                                      const updatedEmployees = duePayment.map((emp) =>
                                        emp._id === selectedEmployee._id
                                          ? {
                                            ...emp,
                                            baseSalary: parseFloat(updateFormData.baseSalary),
                                            allowances: parseFloat(updateFormData.allowances),
                                            taxApply: parseFloat(updateFormData.taxApply),
                                            deductions: parseFloat(updateFormData.deductions),
                                            netSalary: netSalary.toFixed(2),
                                          }
                                          : emp
                                      );

                                      setDuePayment(updatedEmployees);
                                      setSelectedEmployee({
                                        ...selectedEmployee,
                                        baseSalary: parseFloat(updateFormData.baseSalary),
                                        allowances: parseFloat(updateFormData.allowances),
                                        taxApply: parseFloat(updateFormData.taxApply),
                                        deductions: parseFloat(updateFormData.deductions),
                                        netSalary: netSalary.toFixed(2),
                                      });

                                      showToast("Salary updated successfully!", "success");
                                      setShowUpdateModal(false);
                                    }
                                  } catch (err) {
                                    console.error("Error updating salary:", err);
                                    showToast(
                                      err.response?.data?.message || "Failed to update salary",
                                      "error"
                                    );
                                  }
                                }}
                                className="space-y-4"
                              >
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Base Salary (&#8377;)
                                  </label>
                                  <input
                                    type="number"
                                    name="baseSalary"
                                    value={updateFormData.baseSalary}
                                    onChange={(e) =>
                                      setUpdateFormData({
                                        ...updateFormData,
                                        baseSalary: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Allowances (&#8377;)
                                  </label>
                                  <input
                                    type="number"
                                    name="allowances"
                                    value={updateFormData.allowances}
                                    onChange={(e) =>
                                      setUpdateFormData({
                                        ...updateFormData,
                                        allowances: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tax (%)
                                  </label>
                                  <input
                                    type="number"
                                    name="taxApply"
                                    value={updateFormData.taxApply}
                                    onChange={(e) =>
                                      setUpdateFormData({
                                        ...updateFormData,
                                        taxApply: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Deductions (&#8377;)
                                  </label>
                                  <input
                                    type="number"
                                    name="deductions"
                                    value={updateFormData.deductions}
                                    onChange={(e) =>
                                      setUpdateFormData({
                                        ...updateFormData,
                                        deductions: e.target.value,
                                      })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <p className="text-sm text-gray-600 mb-1">
                                    Calculated Net Salary:
                                  </p>
                                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                    &#8377;
                                    {(
                                      (parseFloat(updateFormData.baseSalary) || 0) +
                                      (parseFloat(updateFormData.allowances) || 0) -
                                      (parseFloat(updateFormData.deductions) || 0) -
                                      ((parseFloat(updateFormData.baseSalary) || 0) *
                                        (parseFloat(updateFormData.taxApply) || 0)) /
                                      100
                                    ).toFixed(2)}
                                  </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                  <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    onClick={() => {
                                      if (selectedIntialBaseSalary !== updateFormData.baseSalary) {
                                        updatePermantentSalary()
                                      }
                                    }}
                                  >
                                    Update Salary
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        )}

                        {/* ================= ACTION BUTTONS ================= */}
                        <div className="flex items-center gap-2 flex-wrap">

                          {/* Add/Edit Bank */}
                          <button
                            onClick={() => handleAddBankDetails(emp.employee._id)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm ${emp.employee?.bankDetails?.accountNumber
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                          >
                            <Edit size={14} />
                            {emp.employee?.bankDetails?.accountNumber ? "Edit" : "Add"}
                          </button>

                          {/* Pay Button */}
                          {emp.Status.toLowerCase() === "due" && (
                            <button
                              onClick={() => handleIndividualPay(emp)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                            >
                              <DollarSign size={14} />
                              Pay
                            </button>
                          )}


                          <button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setUpdateFormData({
                                id: emp._id,
                                employeeId: emp.employee._id,
                                baseSalary: emp.baseSalary?.toString() || "",
                                allowances: emp.allowances?.toString() || "",
                                taxApply: emp.taxApply?.toString() || "",
                                deductions: emp.deductions?.toString() || "",
                              });
                              setShowUpdateModal(true);
                              setSelectedIntialSalary(emp.baseSalary?.toString())
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                          >
                            Update Salary
                          </button>

                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${emp?.Status.toLowerCase() === "paid"
                              ? "bg-green-100 text-green-700"
                              : emp?.Status.toLowerCase() === "processing"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-orange-100 text-orange-700"
                              }`}
                          >
                            {capitalize(emp?.Status)}
                          </span>

                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {activeSection === "history" && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History size={20} className="text-purple-600" />
                Payment History
              </h2>

              {paymentHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No payment history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left">Employee</th>
                        <th className="px-6 py-4 text-left">Employee ID</th>
                        <th className="px-6 py-4 text-left">Position</th>
                        <th className="px-6 py-4 text-left">Month</th>
                        <th className="px-6 py-4 text-left">Paid On</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paymentHistory.map((pay) => (
                        <tr key={pay._id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {`${pay.employee.firstName} ${pay.employee.lastName}`}
                          </td>

                          <td className="px-6 py-4">
                            {pay.employeeId}
                          </td>

                          <td className="px-6 py-4">
                            {pay.employee.position}
                          </td>

                          <td className="px-6 py-4">
                            {pay.month}
                          </td>

                          <td className="px-6 py-4">
                            {new Date(pay.createdAt).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            ₹{Number(pay.netSalary).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {/* Payment Action */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 sm:p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  Ready to Process Payment?
                </h2>
                <p className="text-blue-100 mb-2 sm:mb-4 text-sm sm:text-base">
                  {dueCount - employeesWithoutBank} employees ready for payment •
                  Total: &#8377;{totalPayableSalary.toLocaleString()}
                </p>
                {employeesWithoutBank > 0 && (
                  <p className="text-yellow-300 text-xs sm:text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {employeesWithoutBank} employee(s) missing bank details
                  </p>
                )}
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={
                  isProcessingPayment || employeesWithoutBank > 0 || dueCount === 0
                }
                className="w-full lg:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-base sm:text-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign size={24} />
                    Process Payment
                  </>
                )}
              </button>
            </div>

            {isProcessingPayment && (
              <div className="mt-6 bg-white/10 rounded-lg p-4">
                <p className="text-sm text-blue-100 mb-2">
                  Processing transactions...
                </p>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full animate-pulse"
                    style={{ width: "70%" }}
                  ></div>
                </div>
                <p className="text-xs text-blue-100 mt-2">
                  Sending confirmation emails to employees...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular Salary Management View (With AdminSidebar)
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      <AdminSidebar />

      {/* Main Content - Responsive with sidebar offset */}
      <div className="lg:ml-64">
        {/* Toast */}
        {toast.show && (
          <div
            className={`fixed top-4 right-4 z-50 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"
              } text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm`}
          >
            <span className="text-sm sm:text-base">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: "", type: "" })}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Secret Key Modal */}
        {showSecretKeyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lock className="text-red-600" size={20} />
                  Enter Secret Key
                </h3>
                <button
                  onClick={() => {
                    setShowSecretKeyModal(false);
                    setSecretKey("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <AlertCircle className="text-red-600" size={32} />
                </div>
                <p className="text-center text-gray-600 mb-4 text-sm sm:text-base">
                  This action requires authentication. Enter the secure payment
                  key to activate payment mode.
                </p>
              </div>

              <form onSubmit={handleSecretKeySubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Secret Payment Key
                  </label>
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter secret key..."
                    disabled={isAuthenticating}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecretKeyModal(false);
                      setSecretKey("");
                    }}
                    disabled={isAuthenticating}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating || !secretKey}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Unlock size={18} />
                        Authenticate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Individual Payment Confirmation Modal */}
        {showPaymentConfirmModal && paymentEmployee && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={24} />
                  Confirm Payment
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentConfirmModal(false);
                    setPaymentEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isProcessingIndividualPayment}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Employee Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {capitalize(paymentEmployee.employee.firstName)} {capitalize(paymentEmployee.employee.lastName)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-medium">{paymentEmployee.employeeId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium">{capitalize(paymentEmployee.employee.position)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Payment Amount:</span>
                    <span className="font-bold text-green-600 text-lg">
                      &#8377;{parseFloat(paymentEmployee.netSalary).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="text-blue-600" size={18} />
                  Bank Details (Read-only)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Holder:</span>
                    <span className="font-medium">
                      {paymentEmployee.employee.bankDetails.accountHolderName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-medium font-mono">
                      •••• •••• •••• {paymentEmployee.employee.bankDetails.accountNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IFSC Code:</span>
                    <span className="font-medium font-mono">
                      {paymentEmployee.employee.bankDetails.ifscCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank Name:</span>
                    <span className="font-medium">
                      {paymentEmployee.employee.bankDetails.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch:</span>
                    <span className="font-medium">
                      {paymentEmployee.employee.bankDetails.branchName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentConfirmModal(false);
                    setPaymentEmployee(null);
                  }}
                  disabled={isProcessingIndividualPayment}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIndividualPayment}
                  disabled={isProcessingIndividualPayment}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isProcessingIndividualPayment ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign size={20} />
                      Pay Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl shadow-2xl p-5 sm:p-6 mb-4 sm:mb-6 border border-white/20 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-3xl" />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/30 shadow-lg">
                  <Building2 className="text-white" size={26} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Salary Management
                  </h1>
                  <p className="text-sm sm:text-base text-blue-100 mt-1">
                    Manage employee salaries and process payroll
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20">
                      Employees: {employees.length}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/20">
                      Pending: {dueCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex">
                <button
                  onClick={handlePaymentHistory}
                  className="w-full lg:w-auto px-4 sm:px-6 py-3 
             bg-gradient-to-r from-indigo-600 to-purple-600
             text-white rounded-xl font-semibold 
             flex items-center justify-center gap-2 
             hover:from-indigo-700 hover:to-purple-700
             shadow-lg text-sm sm:text-base
             transition-all duration-300 mr-4"
                >
                  <History size={18} />
                  Payment History
                </button>


                <button
                  onClick={handleActivatePaymentMode}
                  className="w-full lg:w-auto px-4 sm:px-6 py-3 bg-white text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-50 shadow-lg text-sm sm:text-base border border-white/60"
                >
                  <Lock size={18} />
                  Activate Payment Mode
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-100 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Total Employees
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {employees.length}
                  </p>
                </div>
                <Users className="text-blue-600 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-amber-50/90 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border border-amber-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Pending Payments
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                    {dueCount}
                  </p>
                </div>
                <AlertCircle className="text-orange-500 flex-shrink-0" size={32} />
              </div>
            </div>

            <div className="bg-emerald-50/90 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border border-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Total Payable
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    &#8377;{totalPayableSalary.toLocaleString()}
                  </p>
                </div>
                <IndianRupee className="text-green-500 flex-shrink-0" size={32} />
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Employee List */}
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
                  Employee Salary List
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white flex items-center justify-between gap-2 text-sm"
                    >
                      <span>Status: {selectedStatus}</span>
                      <ChevronDown size={16} />
                    </button>
                    {showStatusDropdown && (
                      <div className="absolute top-full mt-2 right-0 left-0 sm:left-auto sm:right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[150px]">
                        {["All", "Paid", "Due", "Processing"].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setSelectedStatus(status);
                              setShowStatusDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`border rounded-xl p-3 sm:p-4 cursor-pointer transition shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${selectedEmployee._id === emp._id
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-gray-200 hover:border-blue-300"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                          {(emp?.employee?.firstName || "?").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm truncate">
                            {capitalize(emp?.employee?.firstName || "")}{" "}
                            {capitalize(emp?.employee?.lastName || "")}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">
                            {emp?.employeeId || ""} •{" "}
                            {capitalize(emp?.employee?.position || "")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-800 text-sm">
                          &#8377;{emp.netSalary.toLocaleString()}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${emp.Status.toLowerCase() === "paid"
                            ? "bg-green-100 text-green-700"
                            : emp.Status.toLowerCase() === "processing"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-orange-100 text-orange-700"
                            }`}
                        >
                          {capitalize(emp.Status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Employee Details */}
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
              {selectedEmployee?._id ? (
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                        {(selectedEmployee?.employee?.firstName || "?").charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          {capitalize(selectedEmployee?.employee?.firstName || "")}{" "}
                          {capitalize(selectedEmployee?.employee?.lastName || "")}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {capitalize(selectedEmployee?.employee?.position || "")}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-medium">
                      {capitalize(selectedEmployee?.employee?.status || "")}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-800">
                      Salary Breakdown ({selectedEmployee.month} 2026)
                    </h4>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Base Salary
                        </p>
                        <p className="text-base sm:text-lg font-bold text-gray-800">
                          &#8377;{selectedEmployee.baseSalary.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Allowances
                        </p>
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          +&#8377;{selectedEmployee.allowances.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Tax ({selectedEmployee.taxApply}%)
                        </p>
                        <p className="text-base sm:text-lg font-bold text-red-600">
                          -&#8377;
                          {(
                            (selectedEmployee.baseSalary *
                              selectedEmployee.taxApply) /
                            100
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Deductions
                        </p>
                        <p className="text-base sm:text-lg font-bold text-red-600">
                          -&#8377;{selectedEmployee.deductions?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600">
                        Net Salary
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                        &#8377;{selectedEmployee.netSalary.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">


                    {/* {selectedEmployee.Status.toLowerCase() === "due" && selectedEmployee.employee.bankDetails?.accountNumber && (
                      <button
                        onClick={() => handleIndividualPay(selectedEmployee)}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                      >
                        <DollarSign size={18} />
                        Pay Employee
                      </button>
                    )} */}

                    {selectedEmployee?.Status?.toLowerCase() === "paid" && (
                      <button
                        onClick={handleDownloadPayslip}
                        className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Download size={18} />
                        Download Payslip PDF
                      </button>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <UserCheck size={64} className="mb-4 opacity-30" />
                  <p>Select an employee to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for responsive behavior */}
      <style>{`
        @media (min-width: 1120px) {
          .lg\\:ml-64 {
            margin-left: 16rem;
          }
        }
        
        @media (max-width: 1119px) {
          .lg\\:ml-64 {
            margin-left: 0;
          }
        }

        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
      `}</style>
    </div>
  );
}  