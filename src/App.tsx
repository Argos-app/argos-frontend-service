import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { GuestRouteComponent } from "@/components/GuestRoute";
import { PrivateRouteComponent } from "@/components/PrivateRoute";
import { SessionExpiryNavigation } from "@/components/SessionExpiryNavigation";
import { RouteLoading } from "@/components/RouteLoading";
import { NotFound } from "@/pages/notFound";

const ForgetPassword = lazy(() => import("@/pages/auth/ForgetPassword/forget-password").then((module) => ({ default: module.ForgetPassword })));
const Home = lazy(() => import("@/pages/home/home").then((module) => ({ default: module.Home })));
const Login = lazy(() => import("@/pages/auth/Login/login").then((module) => ({ default: module.Login })));
const ManageProperties = lazy(() => import("@/pages/manageProperties/manage-properties").then((module) => ({ default: module.ManageProperties })));
const ManageUsers = lazy(() => import("@/pages/manageUsers/manage-users").then((module) => ({ default: module.ManageUsers })));
const ManageAccess = lazy(() => import("@/pages/manageAccess/manage-access").then((module) => ({ default: module.ManageAccess })));

export function App() {
  return (
    <BrowserRouter>
      <SessionExpiryNavigation />
      <a
        href="#main-content"
        className="argos-skip-link absolute left-2 top-2 z-[10000] -translate-y-20 rounded-md bg-white px-4 py-3 text-brand-ink focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-ink"
      >
        Pular para o conteúdo
      </a>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<GuestRouteComponent />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forget-password" element={<ForgetPassword />} />
          </Route>

          <Route element={<PrivateRouteComponent />}>
            <Route path="/home" element={<Home />} />
            <Route path="/gestao-usuarios" element={<ManageUsers />} />
            <Route path="/gestao-usuarios/pagina/:page" element={<ManageUsers />} />
            <Route path="/gestao-acessos" element={<ManageAccess />} />
            <Route path="/gestao-acessos/pagina/:page" element={<ManageAccess />} />
            <Route path="/gestao-propriedades" element={<ManageProperties />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <footer className="sr-only">Argos · Painel administrativo</footer>
    </BrowserRouter>
  );
}
