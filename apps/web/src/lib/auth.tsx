import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api } from './api';

const TOKEN_KEY = 'auto_media_auth_token';

type SessionUser = {
  username: string;
  role: string;
};

type AuthContextValue = {
  token: string | null;
  user: SessionUser | null;
  ready: boolean;
  signIn: (token: string, user: SessionUser) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const existing = getStoredToken();
      if (!existing) {
        if (active) setReady(true);
        return;
      }

      try {
        const session = await api.getSession();
        if (!active) return;
        setToken(existing);
        setUser(session.user);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!active) return;
        setToken(null);
        setUser(null);
      } finally {
        if (active) setReady(true);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      ready,
      signIn(nextToken, nextUser) {
        localStorage.setItem(TOKEN_KEY, nextToken);
        setToken(nextToken);
        setUser(nextUser);
      },
      signOut() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [ready, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
