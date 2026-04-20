import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Safety fallback — never stay stuck loading
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      clearTimeout(timeout);
      if (session?.user) {
        try {
          const profile = await api.getProfile(session.user.id);
          if (!cancelled) setUser({ ...session.user, ...profile });
        } catch {
          if (!cancelled) setUser(session.user);
        }
      }
      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (session?.user) {
        try {
          const profile = await api.getProfile(session.user.id);
          if (!cancelled) setUser({ ...session.user, ...profile });
        } catch {
          if (!cancelled) setUser(session.user);
        }
      } else {
        if (!cancelled) setUser(null);
      }
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      try { subscription.unsubscribe(); } catch { /* lock already released */ }
    };
  }, []);

  const login = async (email, password) => {
    const { user: fullUser } = await api.login(email, password);
    setUser(fullUser);
    return fullUser;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
