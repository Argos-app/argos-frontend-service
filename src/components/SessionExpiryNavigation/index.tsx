import { useEffect } from "react";
import { useNavigate } from "react-router";

export function SessionExpiryNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToLogin = () => navigate("/login", { replace: true });
    window.addEventListener("argos:session-expired", redirectToLogin);
    return () => window.removeEventListener("argos:session-expired", redirectToLogin);
  }, [navigate]);

  return null;
}

