import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);

    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }

    if (nextToken) {
      localStorage.setItem('token', nextToken);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get('/auth/profile');
    persistAuth(data.user, localStorage.getItem('token'));
    return data.user;
  }, [persistAuth]);

  useEffect(() => {
    async function restore() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch (_error) {
        persistAuth(null, null);
      } finally {
        setLoading(false);
      }
    }

    restore();
  }, [persistAuth, refreshProfile, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login: ({ user: nextUser, token: nextToken }) => {
        persistAuth(nextUser, nextToken);
      },
      logout: () => {
        persistAuth(null, null);
      },
      refreshProfile
    }),
    [loading, persistAuth, refreshProfile, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
