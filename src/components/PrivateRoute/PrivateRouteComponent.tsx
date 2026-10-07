import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

export function PrivateRouteComponent() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <p role="status" aria-live="polite">Verificando sessão...</p>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
