import { Navigate, Outlet } from "react-router";

export function GuestRouteComponent() {
  const token = localStorage.getItem("bearerToken");
  return token ? <Navigate to="/home" replace /> : <Outlet />;
}