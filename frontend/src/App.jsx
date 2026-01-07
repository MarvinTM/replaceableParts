import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

function ProtectedRoute({ children, requireAdmin = false, requireApproval = true }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user needs approval and isn't admin, show pending page
  if (requireApproval && !user.isApproved && user.role !== 'ADMIN') {
    return <Navigate to="/pending" replace />;
  }

  // If route requires admin and user isn't admin
  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/pending"
        element={
          <ProtectedRoute requireApproval={false}>
            <PendingApprovalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainMenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game"
        element={
          <ProtectedRoute>
            <Layout>
              <GamePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
