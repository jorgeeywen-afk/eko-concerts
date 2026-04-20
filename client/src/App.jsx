import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import ConcertForm from './pages/admin/ConcertForm';
import AdminConcertDetail from './pages/admin/ConcertDetail';
import Members from './pages/admin/Members';
import MemberDashboard from './pages/member/Dashboard';
import MemberConcertDetail from './pages/member/ConcertDetail';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 28, height: 28, border: '2.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="dashboard" element={
              <PrivateRoute>
                <RoleDashboard />
              </PrivateRoute>
            } />
            <Route path="conciertos/nuevo" element={
              <PrivateRoute adminOnly><ConcertForm /></PrivateRoute>
            } />
            <Route path="conciertos/:id/editar" element={
              <PrivateRoute adminOnly><ConcertForm /></PrivateRoute>
            } />
            <Route path="conciertos/:id" element={
              <PrivateRoute>
                <RoleConcertDetail />
              </PrivateRoute>
            } />
            <Route path="miembros" element={
              <PrivateRoute adminOnly><Members /></PrivateRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RoleDashboard() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminDashboard /> : <MemberDashboard />;
}

function RoleConcertDetail() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminConcertDetail /> : <MemberConcertDetail />;
}
