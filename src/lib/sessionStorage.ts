const SESSION_STORAGE_KEY = "argos.session";
const SESSION_VERSION = 1;

export interface StoredUser {
  userName: string;
  farmName: string | null;
}

interface SessionData {
  _versao: typeof SESSION_VERSION;
  bearerToken: string;
  user: StoredUser | null;
}

const emptySession = (): SessionData => ({
  _versao: SESSION_VERSION,
  bearerToken: "",
  user: null,
});

function isStoredUser(value: unknown): value is StoredUser {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.userName === "string" && (typeof record.farmName === "string" || record.farmName === null);
}

function parseSession(raw: string | null): SessionData {
  if (!raw) return emptySession();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return emptySession();
    const record = value as Record<string, unknown>;
    if (record._versao !== SESSION_VERSION || typeof record.bearerToken !== "string") return emptySession();
    return {
      _versao: SESSION_VERSION,
      bearerToken: record.bearerToken,
      user: isStoredUser(record.user) ? record.user : null,
    };
  } catch {
    return emptySession();
  }
}

function readSession(): SessionData {
  const current = localStorage.getItem(SESSION_STORAGE_KEY);
  if (current !== null) {
    const parsed = parseSession(current);
    if (parsed.bearerToken || parsed.user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  // Migrate the previous unversioned keys once, then remove them.
  const legacyToken = localStorage.getItem("bearerToken");
  let legacyUser: StoredUser | null = null;
  try {
    const value: unknown = JSON.parse(localStorage.getItem("user") ?? "null");
    if (isStoredUser(value)) legacyUser = value;
  } catch {
    legacyUser = null;
  }
  localStorage.removeItem("bearerToken");
  localStorage.removeItem("user");

  if (!legacyToken && !legacyUser) return emptySession();
  const migrated: SessionData = { _versao: SESSION_VERSION, bearerToken: legacyToken ?? "", user: legacyUser };
  writeSession(migrated);
  return migrated;
}

function writeSession(session: SessionData): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function notifySessionChanged(): void {
  window.dispatchEvent(new Event("argos:session-updated"));
}

export const sessionStorage = {
  getToken(): string | null {
    return readSession().bearerToken || null;
  },
  getUser(): StoredUser | null {
    return readSession().user;
  },
  setToken(bearerToken: string): void {
    const session = readSession();
    writeSession({ ...session, bearerToken });
    notifySessionChanged();
  },
  setSession(bearerToken: string, user: StoredUser): void {
    writeSession({ _versao: SESSION_VERSION, bearerToken, user });
    notifySessionChanged();
  },
  clear(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem("bearerToken");
    localStorage.removeItem("user");
    notifySessionChanged();
  },
};
