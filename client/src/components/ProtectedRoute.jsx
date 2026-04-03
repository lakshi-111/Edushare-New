import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
}
