import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

export function PrivateRouteComponent() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <main role="status" aria-live="polite">Verificando sessão...</main>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
