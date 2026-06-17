import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Landing from './Landing';
import Residents from './pages/Residents';
import Expenses from './pages/Expenses';
import MonthlyDashboard from './pages/MonthlyDashboard';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import ChangePassword from './pages/ChangePassword';
import MonthlyResponsibles from './pages/MonthlyResponsibles';

// Rota privada: verifica token real + redireciona para troca de senha se necessário
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, mustChangePassword } = useAuth();

  // Compatibilidade legada: aceita token antigo enquanto migramos
  const hasLegacyToken = !!localStorage.getItem('token');

  if (!isAuthenticated && !hasLegacyToken) {
    return <Navigate to="/" replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

// Rota exclusiva para admin
function AdminRoute({ children }: { children: JSX.Element }) {
  const { resident } = useAuth();
  if (resident?.role !== 'admin') {
    return <Navigate to="/monthly" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route path="/*" element={
        <PrivateRoute>
          <DashboardLayout>
            <Routes>
              <Route path="/monthly" element={<MonthlyDashboard />} />
              <Route path="/residents" element={<Residents />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/monthly-responsibles" element={
                <AdminRoute><MonthlyResponsibles /></AdminRoute>
              } />
              <Route path="*" element={<Navigate to="/monthly" replace />} />
            </Routes>
          </DashboardLayout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>

      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>

    </AuthProvider>
  );
}
