import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminRoute } from './components/AdminRoute';
import { AdminDegreesPage } from './pages/AdminDegreesPage';
import { AdminDegreePensumsPage } from './pages/AdminDegreePensumsPage';
import { AdminPensumMateriasPage } from './pages/AdminPensumMateriasPage';
import { ApprovedAccountGate } from './components/ApprovedAccountGate';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { CuentaDenegadaPage } from './pages/CuentaDenegadaPage';
import { OnboardingPage } from './pages/OnboardingPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ApprovedAccountGate>
                  <DashboardPage />
                </ApprovedAccountGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pendiente-aprobacion"
            element={
              <ProtectedRoute>
                <PendingApprovalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cuenta-denegada"
            element={
              <ProtectedRoute>
                <CuentaDenegadaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <ApprovedAccountGate>
                  <OnboardingPage />
                </ApprovedAccountGate>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/carreras"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDegreesPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/carreras/:id/pensums"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDegreePensumsPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pensums/:id/materias"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminPensumMateriasPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
