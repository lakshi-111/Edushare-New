import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return user?.role === 'admin' ? children : <Navigate to="/profile" replace />;
}
