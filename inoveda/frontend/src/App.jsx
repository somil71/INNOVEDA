import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import Register from "./pages/Register";
import Records from "./pages/Records";
import Messages from "./pages/Messages";

const PageWrapper = ({ children, useLayout }) => (
  <AnimatePresence mode="wait">
    {useLayout ? (
      <AppLayout>{children}</AppLayout>
    ) : (
      children
    )}
  </AnimatePresence>
);

export default function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/patient-dashboard"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <AppLayout><PatientDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-dashboard"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <AppLayout><DoctorDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/records"
        element={
          <ProtectedRoute allowedRoles={["patient", "doctor"]}>
            <AppLayout><Records /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
            <AppLayout><Messages /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
