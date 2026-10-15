import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile } from "@/services/userProfileService";
import type { UserProfile } from "@/types/user-profile.type";

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated ? user?.uid : null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getMyProfile(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProfile(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setProfile(null);
          setError("Não foi possível carregar seu perfil. Tente novamente.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt, userId]);

  const reload = () => setAttempt((current) => current + 1);

  return { profile, loading, error, reload };
}
