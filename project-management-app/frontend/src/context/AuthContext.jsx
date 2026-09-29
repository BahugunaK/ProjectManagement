import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, token } = res.data.data;
    localStorage.setItem('pm_token', token);
    localStorage.setItem('pm_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { user: u, token } = res.data.data;
    localStorage.setItem('pm_token', token);
    localStorage.setItem('pm_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
