import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  message?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false, message }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-cream gap-4">
        <Loader2 size={40} className="animate-spin text-brand-gold" />
        <p className="font-serif italic text-brand-grey">Verifying credentials at Maison archives...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location, message: message || 'Please login to access this area' }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
