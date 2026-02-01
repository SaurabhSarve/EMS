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
import Support from "./pages/employee/SupportSystem";
import EmployeeLeave from "./pages/employee/ApplyLeave/EmployeeLeave";
import MyProfile from "./pages/employee/MyProfile";
import Register from "./pages/auth/Register";
import Tasks from "./pages/admin/Tasks/Tasks";
import CreatePasswordForm from "./pages/auth/CreatePasswordForm";
import NotFound from "./pages/common/NotFoundPage";
import AdminProfile from './pages/admin/profile';
import Tickets from "./pages/admin/Ticekts";
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
    if (user.role === "Admin" || user.role === "Department Head") {
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

          {/* Protected Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/employees" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <EmployeesList />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/employees/:id" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <EmployeeProfile />
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/admin/employees/add" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <AddEmployee />
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/admin/employees/:id/edit" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <EmployeeEdit/>
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/admin/employees/leaves" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <LeaveRecord />
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/admin/employees/tasks" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <Tasks />
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/admin/employees/salary" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <SalaryManagement />
              </ProtectedRoute>
            } 
          /> 

           <Route 
            path="/admin/me" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <AdminProfile />
              </ProtectedRoute>
            } 
          /> 

          <Route 
            path="/admin/tickets" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Department Head']}>
                <Tickets />
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
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee/mytasks" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MyTasks />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee/support-system" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <Support/>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee/apply-leave" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeLeave/>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee/profile" 
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MyProfile/>
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