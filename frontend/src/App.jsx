import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { areAssetsLoaded } from './services/assetLoaderService';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MainMenuPage from './pages/MainMenuPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import DebugGraphPage from './pages/DebugGraphPage';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Route guard that ensures assets are loaded before allowing access
function RequireAssets({ children }) {
  if (!areAssetsLoaded()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Route that requires authentication (for admin-only features)
function ProtectedRoute({ children, requireAdmin = false, requireApproval = true }) {
  const { user, isLoading, isAuthenticated, sessionExpired } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={sessionExpired ? { reason: 'session_expired' } : undefined} />;
  }

  // If user needs approval and isn't admin, show pending page
  if (requireApproval && !user.isApproved && user.role !== 'ADMIN') {
    return <Navigate to="/pending" replace />;
  }

  // If route requires admin and user isn't admin
  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/menu" replace />;
  }

  return children;
}

// Route that requires either authentication OR guest mode
function GuestOrAuthRoute({ children }) {
  const { isLoading, isAuthenticated, isGuest, sessionExpired } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Allow if authenticated (and approved) or in guest mode
  if (!isAuthenticated && !isGuest) {
    if (sessionExpired) {
      return <Navigate to="/login" replace state={{ reason: 'session_expired' }} />;
    }
    return <Navigate to="/menu" replace />;
  }

  return children;
}

// Route for login page - redirects authenticated users
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // If user is authenticated but not approved, go to pending
    if (user && !user.isApproved && user.role !== 'ADMIN') {
      return <Navigate to="/pending" replace />;
    }
    return <Navigate to="/menu" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Landing page - always accessible */}
      <Route path="/" element={<LandingPage />} />

      {/* Login page - only for non-authenticated users */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Pending approval - only for authenticated but not approved users */}
      <Route
        path="/pending"
        element={
          <ProtectedRoute requireApproval={false}>
            <PendingApprovalPage />
          </ProtectedRoute>
        }
      />

      {/* Main menu - accessible to everyone (shows different UI for guest vs auth) */}
      <Route
        path="/menu"
        element={
          <RequireAssets>
            <MainMenuPage />
          </RequireAssets>
        }
      />

      {/* Game - requires guest mode or authentication */}
      <Route
        path="/game"
        element={
          <RequireAssets>
            <GuestOrAuthRoute>
              <Layout>
                <GamePage />
              </Layout>
            </GuestOrAuthRoute>
          </RequireAssets>
        }
      />

      {/* Settings - requires guest mode or authentication */}
      <Route
        path="/settings"
        element={
          <RequireAssets>
            <GuestOrAuthRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </GuestOrAuthRoute>
          </RequireAssets>
        }
      />

      {/* Admin - requires admin role */}
      <Route
        path="/admin"
        element={
          <RequireAssets>
            <ProtectedRoute requireAdmin>
              <Layout>
                <AdminPage />
              </Layout>
            </ProtectedRoute>
          </RequireAssets>
        }
      />

      {/* Debug route - requires admin role (no asset preloading required) */}
      <Route
        path="/debug/graph"
        element={
          <ProtectedRoute requireAdmin>
            <DebugGraphPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
