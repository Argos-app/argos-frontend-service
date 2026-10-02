import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { GuestRouteComponent, PrivateRouteComponent } from "./components";
import { ForgetPassword, Home, Login, ManageUsers } from "./pages";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRouteComponent />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
        </Route>

        <Route element={<PrivateRouteComponent />}>
          <Route path="/home" element={<Home />} />
          <Route path="/gestao-usuarios" element={<ManageUsers />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
