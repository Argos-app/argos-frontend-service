import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";

export function PrivateRouteComponent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
