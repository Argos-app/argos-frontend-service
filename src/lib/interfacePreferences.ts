import type { InterfacePreferences } from "@/types/interface-preferences.type";

export const INTERFACE_PREFERENCES_KEY = "argos:preferencias-interface";

export function readInterfacePreferences(): InterfacePreferences | null {
  try {
    const stored = localStorage.getItem(INTERFACE_PREFERENCES_KEY);
    if (stored === null) return null;
    let value: unknown;
    try {
      value = JSON.parse(stored);
    } catch {
      value = null;
    }
    if (value && typeof value === "object" && !Array.isArray(value)
      && "_versao" in value && value._versao === 1
      && "sidebarRecolhida" in value && typeof value.sidebarRecolhida === "boolean") {
      return { _versao: 1, sidebarRecolhida: value.sidebarRecolhida };
    }
    localStorage.removeItem(INTERFACE_PREFERENCES_KEY);
  } catch {
    return null;
  }
  return null;
}

export function saveInterfacePreferences(sidebarRecolhida: boolean): void {
  const preferences: InterfacePreferences = { _versao: 1, sidebarRecolhida };
  try {
    localStorage.setItem(INTERFACE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // A navegação continua com a preferência em memória quando o storage falha.
    return;
  }
}
