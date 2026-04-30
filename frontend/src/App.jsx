////////////////////////////////////////////////////////////////////
//
// File Name : App.jsx
// Description : Application routing with role-based access control
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleGuard from "./routes/RoleGuard";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Unauthorized from "./pages/Unauthorized";
import Kidney from "./pages/organs/Kidney";

import Heart from "./pages/organs/Heart";

import Lung from "./pages/organs/Lung";
import Liver from "./pages/organs/Liver";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ================= AUTHENTICATED ROUTES ================= */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN ONLY ================= */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </RoleGuard>
            }
          />

          {/* ================= DOCTOR ONLY ================= */}
          <Route
            path="/organ/lung"
            element={
              <RoleGuard allowedRoles={["DOCTOR"]}>
                <Lung />
              </RoleGuard>
            }
          />
          <Route
            path="/organ/kidney"
            element={
              <RoleGuard allowedRoles={["DOCTOR"]}>
                <Kidney />
              </RoleGuard>
            }
          />

          <Route
            path="/organ/heart"
            element={
              <RoleGuard allowedRoles={["DOCTOR"]}>
                <Heart />
              </RoleGuard>
            }
          />
           <Route
            path="/organ/liver"
            element={
              <RoleGuard allowedRoles={["DOCTOR"]}>
                <Liver />
              </RoleGuard>
            }
          />
          

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
