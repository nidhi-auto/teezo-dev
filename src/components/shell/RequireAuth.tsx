import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/data/types';

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, role, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
