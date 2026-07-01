/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authentication state when the application loads
  useEffect(() => {
    const storedUser = localStorage.getItem('vt_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user", err);
        localStorage.removeItem('vt_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function - saves user to state and localStorage
  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('vt_user', JSON.stringify(userData));
  }, []);

  // Logout function - clears state and localStorage
  const logout = useCallback(() => {
    setUser(null);
    authService.logout();
  }, []);

  const authValue = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  }), [user, login, logout, loading]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to consume AuthContext cleanly
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
