import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./App.css";
import "./index.css";

// pages

import EmployeeLogin from "./pages/auth/EmployeeLogin";
import EmployeesList from "./pages/admin/EmployeesList";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HomePage from "./pages/common/HomePage";
import EmployeeProfile from "./pages/admin/EmployeeProfile";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import SalaryManagement from "./pages/admin/SalaryManagement";
import AddEmployee from "./pages/admin/AddEmployee";
import LeaveRecord from "./pages/admin/LeaveRecord";
import EmployeeEdit from "./pages/admin/EmployeeEdit";
import MyTasks from "./pages/employee/MyTasks";
import ProjectCenter from "./pages/employee/ProjectCenter";
import TaskCenter from "./pages/admin/TaskCenter";
import Support from "./pages/employee/SupportSystem";
import EmployeeLeave from "./pages/employee/ApplyLeave/EmployeeLeave";
import MyProfile from "./pages/employee/MyProfile";
import Register from "./pages/auth/Register";
import Tasks from "./pages/admin/Tasks/Tasks";
import CreatePasswordForm from "./pages/auth/CreatePasswordForm";
import NotFound from "./pages/common/NotFoundPage";
import AdminProfile from "./pages/admin/profile";
import Tickets from "./pages/admin/Ticekts";
// import AdminPaymentHistory from "./pages/admin/AdminPaymentHistory";
// import DepartmentEmployee from "./pages/admin/DepartmentEmployee";
// import PaymentHistory from './pages/admin/PaymentHistory';
// import Settings from "./pages/admin/Settings";
import ChatPage from "./pages/common/ChatPage";


import DepartmentHeadPayroll from "./pages/departmentHead/Payroll";
import HeadApplyLeave from "./pages/departmentHead/ApplyLeave";
import HeadDashboard from "./pages/departmentHead/HeadDashboard";
import DepartmentHeadProjects from "./pages/departmentHead/Projects";
import AdminPaymentHistory from "./pages/admin/AdminPaymentHistory";
import DepartmentEmployee from "./pages/admin/DepartmentEmployee";
import PaymentHistory from './pages/admin/PaymentHistory';
import EmployeePayroll from './pages/employee/Payroll.jsx';
import Settings from "./pages/admin/Settings";
import TermsAndCondition from "./pages/common/Terms&Condition.jsx";
import PrivacyAndPolicy from "./pages/common/PrivacyAndPolicy.jsx";
import CookiePolicy from "./pages/common/CookiePolicy.jsx";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === "Department Head") {
      return <Navigate to="/head/dashboard" replace />;
    } else if (user.role === "Admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route path="/create-password" element={<CreatePasswordForm />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/terms" element={<TermsAndCondition />} />
          <Route path="/privacy" element={<PrivacyAndPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/head/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Department Head"]}>
                <HeadDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <EmployeesList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/Payment"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <AdminPaymentHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/PaymentHistory"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin/departmentEmployee"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <DepartmentEmployee />
              </ProtectedRoute>
            }
          />

          <Route path="/payment" element={<AdminPaymentHistory />} />

          <Route
            path="/admin/employees/:id"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <EmployeeProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees/add"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <AddEmployee />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees/:id/edit"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <EmployeeEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees/leaves"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <LeaveRecord />
              </ProtectedRoute>
            }
          />
       
          <Route
            path="/employee/projects"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <ProjectCenter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees/tasks"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />

          
          <Route 
            path="/admin/task-center" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <TaskCenter />
              </ProtectedRoute>
            } 
          /> 


          <Route
            path="/admin/employees/salary"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <SalaryManagement />
              </ProtectedRoute>
            }
          />
    
          <Route 
            path="/head/payroll" 
            element={
              <ProtectedRoute allowedRoles={['Department Head']}>
                <DepartmentHeadPayroll />
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/head/leaves" 
            element={
              <ProtectedRoute allowedRoles={['Department Head']}>
                <HeadApplyLeave />
              </ProtectedRoute>
            } 
          />       


          <Route 
            path="/head/projects" 
            element={
              <ProtectedRoute allowedRoles={['Department Head']}>
                <DepartmentHeadProjects />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/projects" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DepartmentHeadProjects />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/admin/me"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tickets"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Department Head"]}>
                <Tickets />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default Admin Route - redirect /admin to /admin/dashboard */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* Employee Protected Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/mytasks"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <MyTasks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/support-system"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <Support />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/apply-leave"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeLeave />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <MyProfile />
              </ProtectedRoute>
            }
          />

          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={["Admin", "Department Head", "employee"]}>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route
            path="/employee/payroll"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeePayroll />
              </ProtectedRoute>
            }
          />

          <Route
            path="/head/payroll"
            element={
              <ProtectedRoute allowedRoles={['Department Head']}>
                <DepartmentHeadPayroll />
              </ProtectedRoute>
            }
          />

          {/* Default Employee Route - redirect /employee to /employee/dashboard */}
          {/* <Route 
            path="/employee" 
            element={<Navigate to="/employee/dashboard" replace />} 
          /> */}

          {/* Catch-all route for 404*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
