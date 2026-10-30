import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";

export function GuestRouteComponent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
}
