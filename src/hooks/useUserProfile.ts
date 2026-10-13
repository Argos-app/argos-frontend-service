import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile } from "@/services/userProfileService";
import type { UserProfile } from "@/types/user-profile.type";

type ProfileState = { identity: string | null; attempt: number } & (
  | { status: "loading"; profile: null; error: null }
  | { status: "success"; profile: UserProfile; error: null }
  | { status: "error"; profile: null; error: string }
);

function initialState(identity: string | null, attempt = 0): ProfileState {
  return { identity, attempt, status: "loading", profile: null, error: null };
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const identity = isAuthenticated ? user?.uid ?? null : null;
  const [state, setState] = useState<ProfileState>(() => initialState(identity));

  if (state.identity !== identity) setState(initialState(identity));
  const attempt = state.attempt;

  useEffect(() => {
    if (identity === null) return;
    const controller = new AbortController();
    getMyProfile(controller.signal)
      .then((profile) => {
        if (controller.signal.aborted) return;
        setState((previous) => previous.identity === identity && previous.attempt === attempt
          ? { identity, attempt, status: "success", profile, error: null }
          : previous);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState((previous) => previous.identity === identity && previous.attempt === attempt
          ? { identity, attempt, status: "error", profile: null, error: "Não foi possível carregar seu perfil. Tente novamente." }
          : previous);
      });
    return () => controller.abort();
  }, [identity, attempt]);

  function reload() {
    setState((previous) => initialState(identity, previous.attempt + 1));
  }

  return { profile: state.profile, loading: state.status === "loading", error: state.error, reload };
}
