import { Navigate, Outlet } from "react-router";

export function PrivateRouteComponent() {
  const token = localStorage.getItem("bearerToken");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}