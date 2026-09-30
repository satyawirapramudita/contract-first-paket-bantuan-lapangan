// clients/web/src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { configureApiAuth } from '../api/client';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Session disimpan di React in-memory state — tidak ada token di localStorage (A.3 item 5)
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    configureApiAuth(
      () => session?.token ?? null,
      () => {
        // Callback saat 401: bersihkan sesi dan redirect mengingat URL asal
        setSession(null);
        navigate('/login', { state: { from: location.pathname } });
      }
    );
  }, [session, location]);

  const loginAs = (userObj) => {
    setSession(userObj);
    const returnUrl = location.state?.from || (userObj.role === 'petugas-lapangan' ? '/distributions' : '/requests');
    navigate(returnUrl, { replace: true });
  };

  const logout = () => {
    setSession(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ session, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
