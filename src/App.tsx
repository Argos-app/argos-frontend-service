import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router";
import { GuestRouteComponent, PrivateRouteComponent } from "./components";

const ForgetPassword = lazy(() => import("./pages/auth/ForgetPassword/forget-password").then((module) => ({ default: module.ForgetPassword })));
const Home = lazy(() => import("./pages/home/home").then((module) => ({ default: module.Home })));
const Login = lazy(() => import("./pages/auth/Login/login").then((module) => ({ default: module.Login })));
const ManageProperties = lazy(() => import("./pages/manageProperties/manage-properties").then((module) => ({ default: module.ManageProperties })));
const ManageUsers = lazy(() => import("./pages/manageUsers/manage-users").then((module) => ({ default: module.ManageUsers })));

function SessionExpiryNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToLogin = () => navigate("/login", { replace: true });
    window.addEventListener("argos:session-expired", redirectToLogin);
    return () => window.removeEventListener("argos:session-expired", redirectToLogin);
  }, [navigate]);

  return null;
}

function RouteLoading() {
  return <main className="grid min-h-screen place-items-center bg-brand-cream" role="status" aria-live="polite">Carregando página...</main>;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <main className="grid min-h-screen place-items-center bg-brand-cream p-6 text-center">
      <section>
        <h1 className="text-4xl font-semibold text-brand-ink">Página não encontrada</h1>
        <p className="mt-3 text-brand-forest">O endereço informado não corresponde a uma página disponível.</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-6 rounded-lg bg-brand-forest px-5 py-3 text-brand-cream focus-visible:outline-2 focus-visible:outline-offset-2">
          Voltar
        </button>
      </section>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <SessionExpiryNavigation />
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
            <Route path="/gestao-propriedades" element={<ManageProperties />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <footer className="sr-only">Argos · Painel administrativo</footer>
    </BrowserRouter>
  );
}
