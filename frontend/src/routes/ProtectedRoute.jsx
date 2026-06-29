import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-semibold tracking-wide animate-pulse">Loading Vergil Tempo...</p>
        </div>
      </div>
    );
  }

  // Redirect to base path / if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check role match
  if (role && user.role.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
