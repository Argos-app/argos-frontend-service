import { useCallback, useEffect, useRef, useState } from "react";
import { getMyProfile } from "@/services/userProfileService";
import type { UserProfile } from "@/types/user-profile.type";

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = { profile: null, loading: true, error: null };

export function useUserProfile() {
  const [state, setState] = useState(initialState);
  const controller = useRef<AbortController | null>(null);

  const loadProfile = useCallback(() => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;

    getMyProfile(request.signal)
      .then((profile) => {
        if (!request.signal.aborted) {
          setState({ profile, loading: false, error: null });
        }
      })
      .catch(() => {
        if (!request.signal.aborted) {
          setState({ profile: null, loading: false, error: "Não foi possível carregar seu perfil. Tente novamente." });
        }
      });
  }, []);

  useEffect(() => {
    loadProfile();
    return () => controller.current?.abort();
  }, [loadProfile]);

  function reload() {
    setState(initialState);
    loadProfile();
  }

  return { profile: state.profile, loading: state.loading, error: state.error, reload };
}
