import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { sessionInfo } from "@/lib/auth-fns";
import { clearSession, getToken } from "@/lib/session-client";

// Resuelve la sesión guardada en el navegador y expulsa a quien no tenga el rol correcto.
export function useLabSession(requiredRole) {
  const [state, setState] = useState({ loading: true, user: null, token: "" });
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) {
      navigate({ to: "/" });
      return () => {
        alive = false;
      };
    }
    sessionInfo({ data: { token } })
      .then((res) => {
        if (!alive) return;
        if (!res || !res.ok || res.role !== requiredRole) {
          clearSession();
          navigate({ to: "/" });
          return;
        }
        setState({ loading: false, user: res.user, token });
      })
      .catch(() => {
        if (!alive) return;
        clearSession();
        navigate({ to: "/" });
      });
    return () => {
      alive = false;
    };
  }, [requiredRole, navigate]);

  return state;
}