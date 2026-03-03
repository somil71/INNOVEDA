import { Navigate, Route, Routes, useLocation } from "react-router-dom";

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
import RegionalSurveillance from "./pages/RegionalSurveillance";
import PatientDetail from "./pages/PatientDetail";
import DiseaseReporting from "./pages/DiseaseReporting";

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
        path="/patient/:id"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <AppLayout><PatientDetail /></AppLayout>
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
      <Route
        path="/disease-reporting"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout><DiseaseReporting /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/regional-surveillance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AppLayout><RegionalSurveillance /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
