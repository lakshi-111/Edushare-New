import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles, fallbackByRole }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={fallbackByRole?.[user?.role] || '/signin'} replace />;
  }

  return children;
}
