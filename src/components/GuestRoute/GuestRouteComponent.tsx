import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";

export function GuestRouteComponent() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <main role="status" aria-live="polite">Verificando sessão...</main>;
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
}
