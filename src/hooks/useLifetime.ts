import { useEffect, useRef } from "react";

export function useLifetime() {
  const lifetime = useRef<object | null>(null);
  useEffect(() => {
    lifetime.current = {};
    return () => { lifetime.current = null; };
  }, []);
  return lifetime;
}
