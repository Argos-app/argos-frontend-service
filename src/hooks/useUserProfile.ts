import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile } from "@/services/userProfileService";
import type { UserProfile } from "@/types/user-profile.type";

function initialState(userId: string | null) {
  return {
    userId,
    profile: null as UserProfile | null,
    loading: userId !== null,
    error: null as string | null,
  };
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? user?.uid ?? null : null;
  const [state, setState] = useState(() => initialState(userId));
  const [attempt, setAttempt] = useState(0);

  if (state.userId !== userId) setState(initialState(userId));

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    getMyProfile(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setState({ userId, profile: result, loading: false, error: null });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ userId, profile: null, loading: false, error: "Não foi possível carregar seu perfil. Tente novamente." });
        }
      });

    return () => controller.abort();
  }, [attempt, userId]);

  function reload() {
    setState(initialState(userId));
    setAttempt((current) => current + 1);
  }

  return { profile: state.profile, loading: state.loading, error: state.error, reload };
}
