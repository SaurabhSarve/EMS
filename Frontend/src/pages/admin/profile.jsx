import { useEffect, useState, useRef } from "react";
import { Camera, X, Edit, Save, Eye, EyeOff, Lock, AlertCircle, User, Info } from "lucide-react";
import AdminSidebar from "../../Components/AdminSidebar";
import { employeeService } from "../../services/employeeServices";
import { 
  MdPerson, 
  MdEmail, 
  MdBadge, 
  MdCalendarToday,
  MdAccessTime,
  MdKey,
  MdCheckCircle,
  MdClose,
  MdSecurity
} from "react-icons/md";

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Password management
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Security key management
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityKeyForm, setSecurityKeyForm] = useState({
    currentKey: "",
    newKey: "",
    confirmKey: "",
  });
  const [showCurrentKey, setShowCurrentKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showConfirmKey, setShowConfirmKey] = useState(false);
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);

  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    position: "",
    AccessKey: "",
    address: ""
  });

  useEffect(() => {
    fetchMe();
  }, []);

  const fetchMe = async () => {
    try {
      setIsLoading(true);
      const response = await employeeService.getProfile();
      console.log(response);
      
      if (response.success) {
        setProfile(response.data);
        setEditData({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          email: response.data.email || "",
          contactNumber: response.data.contactNumber || "",
          position: response.data.position || "",
          AccessKey: response.data.AccessKey || "",
          address: response.data.address || ""
        });
        
        if (response.data.profilePhoto?.url) {
          setProfilePhotoPreview(response.data.profilePhoto.url);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Failed to load profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "error");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("File size should be less than 5MB", "error");
        return;
      }

      setProfilePhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoPreview(profile?.profilePhoto?.url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset data
      setEditData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        contactNumber: profile.contactNumber || "",
        position: profile.position || "",
        AccessKey: profile.AccessKey || "",
        address: profile.address || ""
      });
      setProfilePhotoFile(null);
      setProfilePhotoPreview(profile?.profilePhoto?.url || null);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare form data
      const formDataToSend = new FormData();
      
      // Add profile photo if changed
      if (profilePhotoFile) {
        formDataToSend.append("profilePhoto", profilePhotoFile);
      }

     
      Object.keys(editData).forEach((key) => {
        formDataToSend.append(key, editData[key]);
      });

      const response = await employeeService.updateProfile(formDataToSend);

      if (response.success) {
        showToast("Profile updated successfully!", "success");
        setIsEditing(false);
        fetchMe(); // Refresh profile data
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // 1️⃣ Basic validation
    if (!passwordForm.currentPassword.trim()) {
      showToast("Current password is required", "error");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("Passwords don't match", "error");
      return;
    }

    try {
      setIsChangingPassword(true);

      // 2️⃣ REAL API CALL
      const response = await employeeService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      // 3️⃣ Handle response
      if (response?.success) {
        showToast("Password changed successfully!", "success");

        // Reset state
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        setShowPasswordModal(false);
      } else {
        showToast(response?.message || "Failed to change password", "error");
      }
    } catch (error) {
      console.error("Change password error:", error);
      showToast(
        error.response?.data?.message || "Failed to change password",
        "error"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateSecurityKey = async (e) => {
    e.preventDefault();

    // 1️⃣ Basic validation
    if (!securityKeyForm.currentKey.trim()) {
      showToast("Current secret key is required", "error");
      return;
    }

    if (securityKeyForm.newKey.length < 8) {
      showToast("Secret key must be at least 8 characters", "error");
      return;
    }

    if (securityKeyForm.newKey !== securityKeyForm.confirmKey) {
      showToast("Secret keys don't match", "error");
      return;
    }

    try {
      setIsUpdatingKey(true);

      // 2️⃣ REAL API CALL
      const response = await employeeService.updateSecurityKey({
        currentKey: securityKeyForm.currentKey,
        newKey: securityKeyForm.newKey,
      });

      // 3️⃣ Handle response
      if (response?.success) {
        showToast("Admin secret key updated successfully", "success");

        // Reset state
        setSecurityKeyForm({
          currentKey: "",
          newKey: "",
          confirmKey: "",
        });

        setShowSecurityModal(false);
      } else {
        showToast(response?.message || "Failed to update secret key", "error");
      }
    } catch (error) {
      console.error("Update security key error:", error);
      showToast(
        error.response?.data?.message || "Failed to update secret key",
        "error"
      );
    } finally {
      setIsUpdatingKey(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg animate-slideIn ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          } text-white max-w-md`}
        >
          <div className="flex-1 font-medium">{toast.message}</div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <AdminSidebar />

        <div className="flex-1 w-full min-w-0 lg:ml-64">
          <div className="p-4 pt-20 md:p-6 md:pt-8 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Header with decorative gradient */}
              <div className="mb-8 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-2xl p-8 text-white shadow-2xl border border-white/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <h1 className="text-4xl font-bold mb-2 drop-shadow-lg flex items-center relative">
                  <User size={22} className="mr-2" />
                  Admin Profile
                </h1>
                <p className="text-blue-100 text-lg font-semibold relative">Manage your account and security settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Profile Card */}
                <div className="lg:col-span-2 bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-blue-100 overflow-hidden">
                  {/* Gradient Header */}
                  <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-8 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Profile Photo */}
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-white flex items-center justify-center ring-4 ring-white/40 shadow-xl">
                          {profilePhotoPreview ? (
                            <img
                              src={profilePhotoPreview}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-5xl text-blue-600 font-bold">
                              {profile?.firstName?.charAt(0)}
                              {profile?.lastName?.charAt(0)}
                            </span>
                          )}
                        </div>

                        {isEditing && (
                          <>
                            {profilePhotoFile && (
                              <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-md"
                              >
                                <X size={16} />
                              </button>
                            )}

                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                              id="profilePhoto"
                            />
                            <label
                              htmlFor="profilePhoto"
                              className="absolute bottom-0 right-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full p-3 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                            >
                              <Camera size={20} />
                            </label>
                          </>
                        )}
                      </div>

                      {/* Profile Info */}
                      <div className="flex-1 text-center sm:text-left text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">
                          {profile?.firstName} {profile?.lastName}
                        </h2>
                        <p className="text-blue-100 mb-4 text-lg font-semibold">
                          {profile?.position || "Administrator"}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/30">
                            {profile?.role || "Super Admin"}
                          </span>
                          {profile?.isActive && (
                            <span className="px-4 py-2 bg-green-500/90 rounded-full text-sm font-semibold flex items-center gap-2">
                              <MdCheckCircle size={16} />
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {!isEditing && (
                        <div className="flex gap-3 mt-4 sm:mt-0 flex-wrap">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center justify-center w-12 h-12 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:scale-105 transform"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details Content */}
                  <div className="p-6">
                  <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 px-5 py-4 shadow-sm">
                    <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                      <Info size={18} className="text-blue-600" />
                      Personal Details
                    </h3>
                    <p className="text-sm text-blue-600">Keep your profile information up to date</p>
                  </div>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <MdPerson className="text-blue-600" size={18} />
                            First Name
                          </label>
                          <input
                            type="text"
                            value={editData.firstName}
                            onChange={(e) =>
                              setEditData({ ...editData, firstName: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/40"
                            placeholder="First name"
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <MdPerson className="text-blue-600" size={18} />
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={editData.lastName}
                            onChange={(e) =>
                              setEditData({ ...editData, lastName: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/40"
                            placeholder="Last name"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <MdEmail className="text-blue-600" size={18} />
                            Email
                          </label>
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) =>
                              setEditData({ ...editData, email: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/40"
                            placeholder="Email address"
                          />
                        </div>

                        {/* Contact Number */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <MdBadge className="text-blue-600" size={18} />
                            Contact Number
                          </label>
                          <input
                            type="tel"
                            value={editData.contactNumber}
                            onChange={(e) =>
                              setEditData({ ...editData, contactNumber: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/40"
                            placeholder="Contact number"
                          />
                        </div>

                        {/* Position */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <MdBadge className="text-blue-600" size={18} />
                            Position
                          </label>
                          <input
                            type="text"
                            value={editData.position}
                            onChange={(e) =>
                              setEditData({ ...editData, position: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/40"
                            placeholder="Position"
                          />
                        </div>

                        {/* Address */}
                        <div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                            <MdBadge className="text-blue-600" size={18} />
                            Address
                          </label>
                          <input
                            type="text"
                            value={editData.address}
                            onChange={(e) =>
                              setEditData({ ...editData, address: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/40"
                            placeholder="Address"
                          />
                        </div>
                      </div>

                      {/* Save/Cancel Buttons */}
                      <div className="flex gap-3 pt-6 border-t-2 border-gray-100">
                        <button
                          onClick={handleEditToggle}
                          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save size={18} />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdPerson className="text-blue-600" size={16} />
                          First Name
                        </label>
                        <p className="text-gray-900 font-semibold text-lg">
                          {profile?.firstName || "—"}
                        </p>
                      </div>

                      {/* Last Name */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdPerson className="text-blue-600" size={16} />
                          Last Name
                        </label>
                        <p className="text-gray-900 font-semibold text-lg">
                          {profile?.lastName || "—"}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdEmail className="text-blue-600" size={16} />
                          Email
                        </label>
                        <p className="text-gray-900 font-semibold break-all">
                          {profile?.email || "—"}
                        </p>
                      </div>

                      {/* Contact Number */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdBadge className="text-blue-600" size={16} />
                          Contact
                        </label>
                        <p className="text-gray-900 font-semibold text-lg">
                          {profile?.contactNumber || "—"}
                        </p>
                      </div>

                      {/* Position */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdBadge className="text-blue-600" size={16} />
                          Position
                        </label>
                        <p className="text-gray-900 font-semibold text-lg">
                          {profile?.position || "—"}
                        </p>
                      </div>

                      {/* Role */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdSecurity className="text-blue-600" size={16} />
                          Role
                        </label>
                        <p className="text-gray-900 font-semibold text-lg">
                          {profile?.role || "—"}
                        </p>
                      </div>

                      {/* Joining Date */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdCalendarToday className="text-blue-600" size={16} />
                          Joining Date
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {formatDate(profile?.joiningDate)}
                        </p>
                      </div>

                      {/* Last Login */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdAccessTime className="text-blue-600" size={16} />
                          Last Login
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {formatDateTime(profile?.lastLogin)}
                        </p>
                      </div>

                      {/* Address */}
                      <div className="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                          <MdBadge className="text-blue-600" size={16} />
                          Address
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {profile?.address || "—"}
                        </p>
                      </div>

                      {/* Access Key */}
                      <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">
                          <MdKey className="text-blue-600" size={16} />
                          Access Key
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-mono text-sm flex-1 bg-white px-4 py-3 rounded-lg border border-blue-200">
                            {showAccessKey
                              ? profile?.AccessKey || "Not set"
                              : "••••••••••••••••"}
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAccessKey(!showAccessKey)}
                            className="p-3 text-blue-600 hover:bg-blue-200 rounded-lg transition-all"
                          >
                            {showAccessKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>

                {/* Right Column: Security & Logout */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Change Password Card */}
                  <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-all">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b-2 border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 text-white rounded-lg">
                          <Lock size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-700">Change Password</h3>
                          <p className="text-blue-600 text-sm">Update your account password</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">
                        Keep your account secure by regularly updating your password.
                      </p>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-105 transform"
                      >
                        <Lock size={18} />
                        Change Password
                      </button>
                    </div>
                  </div>

                  {/* Security Key Card */}
                  <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-all">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b-2 border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 text-white rounded-lg">
                          <MdSecurity size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-700">Security Key</h3>
                          <p className="text-blue-600 text-sm">Backup authentication access</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">
                        Update your admin secret key to keep recovery access secure.
                      </p>
                      <button
                        onClick={() => setShowSecurityModal(true)}
                        className="w-full px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-105 transform"
                      >
                        <MdSecurity size={18} />
                        Update Security Key
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Change Password</h3>
                  <p className="text-blue-100 text-sm">Create a new secure password</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY KEY MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg">
                  <MdSecurity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Update Admin Secret Key</h3>
                  <p className="text-blue-100 text-sm">Change and secure recovery access</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSecurityModal(false);
                  setSecurityKeyForm({
                    currentKey: "",
                    newKey: "",
                    confirmKey: "",
                  });
                }}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateSecurityKey} className="p-6 space-y-5">
              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Update your admin secret key</p>
                  <p className="text-blue-700">Enter your current key and set a new one to keep recovery access secure.</p>
                </div>
              </div>

              {/* Current Secret Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Secret Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentKey ? "text" : "password"}
                    required
                    value={securityKeyForm.currentKey}
                    onChange={(e) =>
                      setSecurityKeyForm({
                        ...securityKeyForm,
                        currentKey: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Enter current secret key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentKey(!showCurrentKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Secret Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Secret Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewKey ? "text" : "password"}
                    required
                    value={securityKeyForm.newKey}
                    onChange={(e) =>
                      setSecurityKeyForm({
                        ...securityKeyForm,
                        newKey: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Enter new secret key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewKey(!showNewKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 16 characters</p>
              </div>

              {/* Confirm Secret Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Secret Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmKey ? "text" : "password"}
                    required
                    value={securityKeyForm.confirmKey}
                    onChange={(e) =>
                      setSecurityKeyForm({
                        ...securityKeyForm,
                        confirmKey: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    placeholder="Confirm new secret key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmKey(!showConfirmKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSecurityModal(false);
                    setSecurityKeyForm({
                      currentKey: "",
                      newKey: "",
                      confirmKey: "",
                    });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingKey}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isUpdatingKey ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Secret Key"
                  )}
                </button>
              </div>
            </form>
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